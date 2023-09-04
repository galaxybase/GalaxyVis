import clone from 'lodash/clone'
import EdgeList from '../../classes/edgeList'
import NodeList from '../../classes/nodeList'
import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { hashNumber, isInSceen, isSameSet, roundedNum } from '../../utils'
import canvasEdgeDef from './edgeCanvas/edgeDef'
import canvasEdgeParallel from './edgeCanvas/edgeParallel'
import canvasEdgeSelf from './edgeCanvas/edgeSelf'

interface drawEdgeType {
    context: CanvasRenderingContext2D
    source: string
    target: string
    data: any
    sourceX: number
    sourceY: number
    targetX: number
    targetY: number
    num: number
    forward: number
    sourceSize: number
    targetSize: number
    size: number
}

export default class edgeCanvas {
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
    private typeHash: any
    private baseTypeHash: any
    private adjacentMaps: Map<string, any>

    constructor(graph: any) {
        this.graph = graph
        this.frameCanvas = document.createElement('canvas')
        this.frameCtx = this.frameCanvas.getContext('2d') as CanvasRenderingContext2D
        this.oldSelectedTable = new Set()
        // 获取当前相机缩放等级
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
            // 绘制基础边
            basic: (T: drawEdgeType) => {
                if (T.source !== T.target) {
                    // 非自环边
                    return canvasEdgeDef(
                        graph.id,
                        this.context,
                        this.ratio,
                        this.position,
                        T.data,
                        T.sourceX,
                        T.sourceY,
                        T.targetX,
                        T.targetY,
                        T.targetSize,
                        T.num,
                        T.forward,
                        this.thumbnail,
                        T.size,
                    )
                } else {
                    // 自环边
                    return canvasEdgeSelf(
                        graph.id,
                        this.context,
                        this.ratio,
                        this.position,
                        T.data,
                        T.sourceX,
                        T.sourceY,
                        T.sourceSize,
                        T.num,
                        this.thumbnail,
                    )
                }
            },
            // 绘制进阶的边
            parallel: (T: drawEdgeType) => {
                if (T.source === T.target) {
                    throw new Error('parallel类型的线不支持自环边')
                }
                return canvasEdgeParallel(
                    graph.id,
                    this.context,
                    this.ratio,
                    this.position,
                    T.data,
                    T.sourceX,
                    T.sourceY,
                    T.targetX,
                    T.targetY,
                    T.num,
                    T.forward,
                    T.sourceSize,
                    T.targetSize,
                    this.thumbnail,
                    T.size,
                )
            },
        }
        this.quad = {}
        this.adjacentMaps = new Map()
    }
    // 绘制边
    drawEdge = async (boolean?: boolean, viewChange?: boolean) => {
        const graph = this.graph
        const graphId = graph.id
        if(!globalInfo[graphId].edgeType){
            let edgeType = graph.getEdgeType()
            globalInfo[graphId].edgeType = edgeType
        }
        let ratio = this.ratio = graph.camera.ratio
        let edgeList = basicData[graphId].edgeList
        let selectedTable = basicData[graphId].selectedTable
        let {
            typeHash, //parallel类型的hash表
            baseTypeHash, //basic类型的hash表
        } = globalInfo[graphId].edgeType
        this.typeHash = typeHash
        this.baseTypeHash = baseTypeHash
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

        let adjacentEdges = basicData[graphId].selectedEdgeTable

        let adjacentMaps = this.adjacentMaps = new Map()

        if (adjacentEdges.size) {
            adjacentEdges.forEach(async key => {
                let edges = edgeList.get(key)?.getParallelEdges()
                if(edges){
                    edges.forEach((edge: any) => {
                        const id = edge.getId()
                        adjacentMaps.set(id, edge)
                    });
                }
            })
        }

        if (!selectedTable.size || !isSameSet(selectedTable, this.oldSelectedTable) || viewChange) {
            if (selectedTable.size) {
                // @ts-ignore
                this.frameCanvas = globalInfo[graphId].canvasBox.cloneNode(true)
                this.frameCtx = this.frameCanvas.getContext('2d') as CanvasRenderingContext2D
                this.context = this.frameCtx;
            }
            await this.plottingEdges(edgeList, this.context, !viewChange, boolean)
            this.oldSelectedTable = clone(selectedTable)
        }

        if (selectedTable.size) {
            for (let key in this.quad) {
                if(edgeList.get(key)?.getAttribute('isVisible'))
                    graph.camera.quad.add(this.quad[key])
            }
            graph.ctx.drawImage(this.frameCanvas, 0, 0)
            this.context = graph.ctx;
            this.plottingEdges(this.adjacentMaps, this.context, false, boolean)
        }
    }

    plottingEdges = (orderEdges: Map<string, any>, context: CanvasRenderingContext2D, used: boolean, boolean?: boolean) => {
        const graph = this.graph
        const graphId = graph.id
        let nodeList = basicData[graphId].nodeList

        let forwadHashTable: any = new Map()
        for (let [key, values] of orderEdges) {
            let item = values,
                value = item?.value,
                source = value?.source,
                target = value?.target,
                attribute = item?.getAttribute()
            // 如果被隐藏则跳过
            if (!attribute.isVisible || attribute.opacity == 0.0) continue
            if (!nodeList.has(source) || !nodeList.has(target)) continue
            if (this.adjacentMaps.has(key) && used) continue
            let { type } = attribute,
                { attribute: souce_attribute, num: sourceNumber } = nodeList.get(source).value,
                { attribute: target_attribute, num: targetNumber } = nodeList.get(target).value,
                hash = hashNumber(sourceNumber, targetNumber), //两点之间的hash值
                forwardSource = forwadHashTable?.get(hash)?.sourceNumber,
                hashSet = type == 'basic' ? this.baseTypeHash.get(hash) : this.typeHash.get(hash), //两点之间hash表
                size = hashSet?.num

            if (!size) continue

            let lineNumber = [...hashSet.total].indexOf(key);

            if (globalInfo[graphId].enabledNoStraightLine) {
                size == 1 && size++
                size % 2 !== 0 && lineNumber++
            }

            let forward =
                    lineNumber == 0
                        ? 1
                        : size % 2 == 0
                            ? lineNumber % 2 == 1 && sourceNumber != forwardSource
                                ? -1
                                : 1
                            : lineNumber % 2 == 0 && sourceNumber != forwardSource
                                ? -1
                                : 1,
                { x: targetX, y: targetY, radius: targetSize } = target_attribute,
                { x: sourceX, y: sourceY, radius: sourceSize } = souce_attribute
            // 这条边 如果起始点和终止点有一个不存在则直接跳过
            if (!(target_attribute.isVisible && souce_attribute.isVisible)) {
                item.value.attribute.isVisible = false
                continue
            }
            if (type == 'basic') {
                if (source != target) {
                    size > 1 && size % 2 == 0 && lineNumber++
                } else lineNumber++
            } else {
                size > 1 && size % 2 == 0 && lineNumber++
            }
            forwadHashTable?.set(hash, { sourceNumber, targetNumber })
            if (
                !isInSceen(
                    graphId,
                    'canvas',
                    this.scale,
                    this.position,
                    {
                        source,
                        target,
                        edge: item,
                        initAttributes: {
                            size,
                            lineNumber,
                            sourceX,
                            sourceY,
                            targetX,
                            targetY,
                            forward,
                        },
                        graphId,
                    },
                    2,
                )
            ) {
                continue
            }
            let textPromise = this.strategies[type]({
                context,
                source,
                target,
                data: attribute,
                sourceX,
                sourceY,
                targetX,
                targetY,
                num: lineNumber,
                forward,
                sourceSize,
                targetSize,
                size,
            })

            item.value.attribute.text = {
                ...attribute?.text,
                textPos: textPromise.textMod,
            }

            let edgeBound = textPromise.boundMod
            if (!graph.thumbnail)
                basicData[graphId].edgeCanvasBoundBox.set(key, { point: edgeBound.point })
            if (boolean) {
                this.quad[key] = {
                    x: roundedNum(edgeBound.x),
                    y: roundedNum(edgeBound.y),
                    height: roundedNum(edgeBound.height),
                    width: roundedNum(edgeBound.width),
                    id: key,
                    isNode: false,
                    shape: type,
                }
                graph.camera.quad.add(this.quad[key])
            }
            edgeBound = null;
        }
        forwadHashTable = null
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
