import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { strategiesFace } from '../../types'
import { isInSceen } from '../../utils'
import canvasNodeSquare from './nodeCanvas/nodeSquare'
import canvasNodeDef from './nodeCanvas/nodesDef'
import canvasNodeTriangle from './nodeCanvas/nodeTriangle'
import canvasNodeRhombus from './nodeCanvas/nodeRhombus'
import canvasNodeBadges from './nodeCanvas/nodeBadges'

export default class nodeCanvas {
    // 整个graph对象
    private graph
    // node总类型的构造器
    constructor(graph: any) {
        this.graph = graph
    }
    // 绘制点
    drawNode = (boolean?: boolean) => {
        // 获取当前graph对象
        let graph = this.graph
        // 获取当前缩放
        let ratio = graph.camera.ratio
        // 获取相机当前位置
        let position = graph.camera.position
        // 获取当前的点列表
        let nodeList = basicData[this.graph.id].nodeList
        // 获取当前画布
        let context = graph.ctx
        let thumbnail = graph.thumbnail
        let scale = (globalProp.globalScale / ratio) * 2.0
        // 策略模式
        var strategies: { [key: string]: Function } = {
            // 绘制圆形
            circle: (strategieInfo: strategiesFace) => {
                return canvasNodeDef(
                    graph.id,
                    context,
                    strategieInfo.data,
                    ratio,
                    position,
                    thumbnail,
                )
            },
            // 绘制正方形
            square: (strategieInfo: strategiesFace) => {
                return canvasNodeSquare(
                    graph.id,
                    context,
                    strategieInfo.data,
                    ratio,
                    position,
                    thumbnail,
                )
            },
            // 绘制三角形
            triangle: (strategieInfo: strategiesFace) => {
                return canvasNodeTriangle(
                    graph.id,
                    context,
                    strategieInfo.data,
                    ratio,
                    position,
                    thumbnail,
                )
            },
            // 绘制菱形
            rhombus: (strategieInfo: strategiesFace) => {
                return canvasNodeRhombus(
                    graph.id,
                    context,
                    strategieInfo.data,
                    ratio,
                    position,
                    thumbnail,
                )
            },
        }
        let orderNodes = [...globalInfo[graph.id].nodeOrder]
        // 遍历点顺序
        for (let keys in orderNodes) {
            let key = orderNodes[keys]
            // 该点是否存在
            if (nodeList.has(key)) {
                // 获取点方法
                let item = nodeList.get(key)
                // 获取点属性
                let data = item.getAttribute()
                // 如果被隐藏、透明度为0、不在屏幕上 则跳过
                if (
                    !data.isVisible ||
                    data.opacity == 0.0 ||
                    !isInSceen(this.graph.id, 'canvas', scale, position, data, 1)
                )
                    continue
                // 获取形状类型
                let renderShape = data.shape
                // 执行策略模式
                let nodeBound = strategies[renderShape]({
                    context,
                    data,
                    ratio,
                    position,
                })
                if (data.badges) {
                    canvasNodeBadges(graph.id, context, data, ratio, position, thumbnail)
                }
                // 判断是否需要向四叉树加入属性
                if (boolean) {
                    graph.camera.quad.insert({
                        x: nodeBound.x,
                        y: nodeBound.y,
                        height: nodeBound.size * 2,
                        width: nodeBound.size * 2,
                        id: key,
                        isNode: true,
                        shape: renderShape,
                    })
                }
            }
        }
    }
}
