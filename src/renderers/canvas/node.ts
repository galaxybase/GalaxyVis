import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { strategiesFace } from '../../types'
import { isInSceen, isSameSet, roundedNum } from '../../utils'
import canvasNodeSquare from './nodeCanvas/nodeSquare'
import canvasNodeDef from './nodeCanvas/nodesDef'
import canvasNodeTriangle from './nodeCanvas/nodeTriangle'
import canvasNodeRhombus from './nodeCanvas/nodeRhombus'
import canvasNodeBadges from './nodeCanvas/nodeBadges'
import { clone } from 'lodash'

export default class nodeCanvas {
    // 整个graph对象
    private graph
    private frameCtx: CanvasRenderingContext2D
    private oldSelectedTable: Set<string | number>
    private frameCanvas: HTMLCanvasElement
    private strategies: { [key: string]: Function }
    private ratio: number
    private position: number[]
    private context: CanvasRenderingContext2D
    private thumbnail: boolean
    private scale: number
    private quad: any

    // node总类型的构造器
    constructor(graph: any) {
        this.graph = graph
        this.frameCanvas = document.createElement('canvas')
        this.frameCtx = this.frameCanvas.getContext('2d') as CanvasRenderingContext2D
        this.oldSelectedTable = new Set()
        // 获取当前缩放
        this.ratio = graph.camera.ratio
        // 获取相机当前位置
        this.position = graph.camera.position
        // 获取当前画布
        this.context = graph.ctx
        // 缩略图是否开启
        this.thumbnail = graph.thumbnail
        // 缩放比例
        this.scale = (globalProp.globalScale / this.ratio) * 2.0
        // 策略模式
        this.strategies = {
            // 绘制圆形
            circle: (strategieInfo: strategiesFace) => {
                return canvasNodeDef(
                    graph.id,
                    this.context,
                    strategieInfo.data,
                    this.ratio,
                    this.position,
                    this.thumbnail,
                )
            },
            // 绘制正方形
            square: (strategieInfo: strategiesFace) => {
                return canvasNodeSquare(
                    graph.id,
                    this.context,
                    strategieInfo.data,
                    this.ratio,
                    this.position,
                    this.thumbnail,
                )
            },
            // 绘制三角形
            triangle: (strategieInfo: strategiesFace) => {
                return canvasNodeTriangle(
                    graph.id,
                    this.context,
                    strategieInfo.data,
                    this.ratio,
                    this.position,
                    this.thumbnail,
                )
            },
            // 绘制菱形
            rhombus: (strategieInfo: strategiesFace) => {
                return canvasNodeRhombus(
                    graph.id,
                    this.context,
                    strategieInfo.data,
                    this.ratio,
                    this.position,
                    this.thumbnail,
                )
            },
        }
        this.quad = {}
    }
    // 绘制点
    drawNode = async (boolean?: boolean, viewChange?: boolean) => {
        const graph = this.graph
        const id = graph.id
        let ratio = this.ratio = graph.camera.ratio
        let orderNodes = [...globalInfo[id].nodeOrder]
        let selectedTable = basicData[id].selectedTable
        this.context = graph.ctx
        this.thumbnail = graph.thumbnail
        this.scale = (globalProp.globalScale / ratio) * 2.0
        this.position = graph.camera.position

        if (graph.mouseCaptor?.draggable|| graph.geo.enabled() || this.thumbnail) {
            viewChange = true;
            graph.geo.enabled() && (boolean = true)
        }

        if (viewChange) {
            selectedTable = new Set();
            this.oldSelectedTable = new Set()
        }

        if (!selectedTable.size || !isSameSet(selectedTable, this.oldSelectedTable) || viewChange) {
            if (selectedTable.size) {
                // @ts-ignore
                this.frameCanvas = globalInfo[id].canvasBox.cloneNode(true)
                this.frameCtx = this.frameCanvas.getContext('2d') as CanvasRenderingContext2D
                this.context = this.frameCtx;
            }
            await this.plottingNodes(orderNodes, this.context, !viewChange, boolean)
            this.oldSelectedTable = clone(selectedTable)
        }
        if (selectedTable.size) {
            let nodeList = basicData[id].nodeList
            for (let key in this.quad) {
                if (nodeList.get(key)?.getAttribute('isVisible'))
                    graph.camera.quad.insert(this.quad[key])
            }
            graph.ctx.drawImage(this.frameCanvas, 0, 0)
            this.context = graph.ctx;
            this.plottingNodes([...selectedTable], this.context, false, boolean)
        }

    }

    plottingNodes = (orderNodes: any[], context: CanvasRenderingContext2D, used: boolean, boolean?: boolean) => {
        const graph = this.graph;
        const id = graph.id
        let nodeList = basicData[id].nodeList
        let selectedTable = basicData[id].selectedTable
        for (let keys in orderNodes) {
            let key = orderNodes[keys]
            // 该点是否存在
            if (nodeList.has(key) && (!selectedTable.has(key) || !used)) {
                // 获取点方法
                let item = nodeList.get(key)
                // 获取点属性
                let data = item.getAttribute()
                // 如果被隐藏、透明度为0、不在屏幕上 则跳过
                if (
                    !data.isVisible ||
                    data.opacity == 0.0 ||
                    !isInSceen(id, 'canvas', this.scale, this.position, data, 1)
                )
                    continue
                // 获取形状类型
                let renderShape = data.shape
                // 执行策略模式
                let that = this;
                let nodeBound = this.strategies[renderShape]({
                    context,
                    data,
                    ratio: that.ratio,
                    position: that.position,
                })
                if (data.badges) {
                    canvasNodeBadges(id, context, data, this.ratio, this.position, this.thumbnail)
                }
                // 判断是否需要向四叉树加入属性
                if (boolean) {
                    this.quad[key] = {
                        x: roundedNum(nodeBound.x),
                        y: roundedNum(nodeBound.y),
                        height: roundedNum(nodeBound.size * 2),
                        width: roundedNum(nodeBound.size * 2),
                        id: key,
                        isNode: true,
                        shape: renderShape,
                    }
                    graph.camera.quad.insert(this.quad[key])
                }
            }
        }
    }

    clear = () => {
        this.quad = null;
        // @ts-ignore
        this.oldSelectedTable = null;
        // @ts-ignore
        this.frameCanvas = null;
        // @ts-ignore
        this.frameCtx = null;
    }
}
