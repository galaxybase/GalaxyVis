import { clone } from 'lodash'
import EdgeList from '../../classes/edgeList'
import NodeList from '../../classes/nodeList'
import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { isInSceen, isSameSet } from '../../utils'
import canvasLabelEdge from './labelCanvas/edgeLael'
import canvasLabelNode from './labelCanvas/nodeLabel'

export default class lableCanvas {
    private graph
    private frameCtx: CanvasRenderingContext2D
    private frameCanvas: HTMLCanvasElement
    private edgeFrameCtx: CanvasRenderingContext2D
    private edgeFrameCanvas: HTMLCanvasElement
    private oldSelectedTable: Set<string | number>
    private edgeOldSelectedTable: Set<string | number>
    private ratio: number
    private position: number[]
    private context: CanvasRenderingContext2D
    private thumbnail: boolean
    private scale: number
    private adjacentArray: Array<any>

    constructor(graph: any) {
        this.graph = graph
        this.frameCanvas = document.createElement('canvas')
        this.frameCtx = this.frameCanvas.getContext('2d') as CanvasRenderingContext2D
        this.edgeFrameCanvas = document.createElement('canvas')
        this.edgeFrameCtx = this.edgeFrameCanvas.getContext('2d') as CanvasRenderingContext2D
        this.oldSelectedTable = new Set()
        this.edgeOldSelectedTable =new Set()
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
        this.adjacentArray = []
    }
    // 绘制点文字
    drawNodeLabel = async (viewChange?: boolean) => {
        const graph = this.graph
        const graphId = graph.id
        let ratio = this.ratio = graph.camera.ratio
        let orderNodes = [...globalInfo[graphId].nodeOrder]
        let selectedTable = basicData[graphId].selectedTable
        this.context = graph.ctx
        this.thumbnail = graph.thumbnail
        this.scale = (globalProp.globalScale / ratio) * 2.0
        this.position = graph.camera.position

        if (this.thumbnail) return

        if (graph.mouseCaptor?.draggable|| graph.geo.enabled()) {
            viewChange = true;
        }

        if (viewChange) {
            selectedTable = new Set();
        }

        if (!selectedTable.size || !isSameSet(selectedTable, this.oldSelectedTable) || viewChange) {
            if (selectedTable.size) {
                // @ts-ignore
                this.frameCanvas = globalInfo[graphId].canvasBox.cloneNode(true)
                this.frameCtx = this.frameCanvas.getContext('2d') as CanvasRenderingContext2D
                this.context = this.frameCtx;
            }
            await this.plottingNodeLabel(orderNodes, this.context, !viewChange)
            this.oldSelectedTable = clone(selectedTable)
        }
        if (selectedTable.size) {
            graph.ctx.drawImage(this.frameCanvas, 0, 0)
            this.context = graph.ctx;
            await this.plottingNodeLabel([...selectedTable], this.context, false)
        }
    }

    plottingNodeLabel = async (orderNodes: any[], context: CanvasRenderingContext2D, used: boolean) => {
        const graph = this.graph;
        const graphId = graph.id
        let nodeList = basicData[graphId].nodeList
        let selectedTable = basicData[graphId].selectedTable

        for (let keys in orderNodes) {
            let key = orderNodes[keys]
            if (nodeList.has(key) && (!selectedTable.has(key) || !used)) {
                let item = nodeList.get(key)
                let data = item.getAttribute()
                // 如果被隐藏则跳过
                if (
                    !data.isVisible ||
                    data.opacity == 0.0 ||
                    !isInSceen(graphId, 'canvas', this.scale, this.position, data, 1)
                )
                    continue
                let text = data?.text
                // 判断该点是否存在文字
                if (text && text.content && text.content != '') {
                    await canvasLabelNode(graphId, context, data, this.position, this.ratio, this.thumbnail)
                }
            }
        }
    }

    // 绘制边文字
    drawEdgeLabel = (viewChange?: boolean) => {
        const graph = this.graph
        const graphId = graph.id
        let ratio = this.ratio = graph.camera.ratio
        let selectedTable = basicData[graphId].selectedTable
        this.context = graph.ctx
        this.thumbnail = graph.thumbnail
        this.scale = (globalProp.globalScale / ratio) * 2.0
        this.position = graph.camera.position
        let orderEdges = [...globalInfo[graphId].edgeOrder]

        if (this.thumbnail) return

        if (graph.mouseCaptor?.draggable|| graph.geo.enabled()) {
            viewChange = true;
        }

        if (viewChange) {
            selectedTable = new Set();
        }
        let ids = basicData[graphId].adjacentEdges
        let adjacentArray: any[] = this.adjacentArray = []
        if (ids.length > 0) {
            for (let i = 0, len = ids.length; i < len; i++) {
                adjacentArray.push(ids[i])
            }
        }

        if (!selectedTable.size || !isSameSet(selectedTable, this.edgeOldSelectedTable) || viewChange) {
            if (selectedTable.size) {
                // @ts-ignore
                this.edgeFrameCanvas = globalInfo[graphId].canvasBox.cloneNode(true)
                this.edgeFrameCtx = this.edgeFrameCanvas.getContext('2d') as CanvasRenderingContext2D
                this.context = this.edgeFrameCtx;
            }
            this.plottingEdgeLabel(orderEdges, this.context, !viewChange)
            this.edgeOldSelectedTable = clone(selectedTable)
        }

        if (selectedTable.size) {
            graph.ctx.drawImage(this.edgeFrameCanvas, 0, 0)
            this.context = graph.ctx;
            this.plottingEdgeLabel(adjacentArray, this.context, false)
        }
    }

    plottingEdgeLabel = (orderEdges: any[], context: CanvasRenderingContext2D, used: boolean,) => {
        const graph = this.graph
        const graphId = graph.id
        let edgeList = basicData[graphId].edgeList

        for (let keys in orderEdges) {
            let key = orderEdges[keys]
            if (this.adjacentArray.indexOf(key) != -1 && used) continue
            if (edgeList.has(key)) {
                let item = edgeList.get(key)
                let data = item.getAttribute()
                // 如果被隐藏则跳过
                if (!data.isVisible || data.opacity == 0.0 || !data.labelInSceen) continue
                let text = data?.text
                // 判断该边是否存在文字
                if (text && text.content && text.content != '') {
                    canvasLabelEdge(graphId, context, data, this.ratio)
                }
            }
        }
    }

    clear = () => {
        // @ts-ignore
        this.oldSelectedTable = null;
        // @ts-ignore
        this.frameCanvas = null;
        // @ts-ignore
        this.frameCtx = null;
        // @ts-ignore
        this.edgeOldSelectedTable = null;
        // @ts-ignore
        this.edgeFrameCanvas = null
        // @ts-ignore
        this.edgeFrameCtx = null
    }
}
