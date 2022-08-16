import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { isInSceen } from '../../utils'
import canvasLabelEdge from './labelCanvas/edgeLael'
import canvasLabelNode from './labelCanvas/nodeLabel'

export default class lableCanvas {
    private graph

    constructor(graph: any) {
        this.graph = graph
    }
    // 绘制点文字
    drawNodeLabel = () => {
        // 获取当前graph对象
        let graph = this.graph
        // 获取当前相机缩放
        let ratio = graph.camera.ratio
        // 获取当前相机位置
        let position = graph.camera.position
        // 获取点列表
        let nodeList = basicData[this.graph.id].nodeList
        // 获取当前canvas画布
        let context = graph.ctx
        let thumbnail = graph.thumbnail
        // 获取点绘制顺序
        let nodeOrder = [...globalInfo[graph.id].nodeOrder]
        let scale = (globalProp.globalScale / ratio) * 2.0

        if (thumbnail) return

        for (let keys in nodeOrder) {
            let key = nodeOrder[keys]
            if (nodeList.has(key)) {
                let item = nodeList.get(key)
                let data = item.getAttribute()
                // 如果被隐藏则跳过
                if (
                    !data.isVisible ||
                    data.opacity == 0.0 ||
                    !isInSceen(this.graph.id, 'canvas', scale, position, data, 1)
                )
                    continue
                let text = data?.text
                // 判断该点是否存在文字
                if (text && text.content && text.content != '') {
                    canvasLabelNode(graph.id, context, data, position, ratio, thumbnail)
                }
            }
        }
    }
    // 绘制边文字
    drawEdgeLabel = () => {
        // 获取当前graph对象
        let graph = this.graph
        // 获取当前相机缩放
        let ratio = graph.camera.ratio
        // 获取没有被隐藏的边列表
        let edgeList = basicData[this.graph.id].edgeList
        // 获取当前canvas画布
        let context = graph.ctx
        let orderEdges = [...globalInfo[graph.id].edgeOrder]
        let thumbnail = graph.thumbnail

        if (thumbnail) return

        for (let keys in orderEdges) {
            let key = orderEdges[keys]
            if (edgeList.has(key)) {
                let item = edgeList.get(key)
                let data = item.getAttribute()
                // 如果被隐藏则跳过
                if (!data.isVisible || data.opacity == 0.0 || !data.labelInSceen) continue
                let text = data?.text
                // 判断该边是否存在文字
                if (text && text.content && text.content != '') {
                    canvasLabelEdge(graph.id, context, data, ratio)
                }
            }
        }
    }
}
