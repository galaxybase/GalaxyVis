import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { hashNumber, isInSceen } from '../../utils'
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

    constructor(graph: any) {
        this.graph = graph
    }
    // 绘制边
    drawEdge = (boolean?: boolean) => {
        // 获取当前graph对象
        let graph = this.graph
        // 获取当前相机缩放等级
        let ratio = graph.camera.ratio
        // 获取当前相机位置
        let position = graph.camera.position
        // 获取未被隐藏的点列表
        let nodeList = basicData[this.graph.id].nodeList
        // 获取边列表
        let edgeList = basicData[this.graph.id].edgeList
        // 获取当前canvas画布
        let context = graph.ctx
        let thumbnail = graph.thumbnail
        let scale = (globalProp.globalScale / ratio) * 2.0
        let {
            typeHash, //parallel类型的hash表
            baseTypeHash, //basic类型的hash表
        } = globalInfo[graph.id].edgeType
        // 策略模式
        var strategies: { [key: string]: Function } = {
            // 绘制基础边
            basic: (T: drawEdgeType) => {
                if (T.source !== T.target) {
                    // 非自环边
                    return canvasEdgeDef(
                        graph.id,
                        context,
                        ratio,
                        position,
                        T.data,
                        T.sourceX,
                        T.sourceY,
                        T.targetX,
                        T.targetY,
                        T.targetSize,
                        T.num,
                        T.forward,
                        thumbnail,
                        T.size,
                    )
                } else {
                    // 自环边
                    return canvasEdgeSelf(
                        graph.id,
                        context,
                        ratio,
                        position,
                        T.data,
                        T.sourceX,
                        T.sourceY,
                        T.sourceSize,
                        T.num,
                        thumbnail,
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
                    context,
                    ratio,
                    position,
                    T.data,
                    T.sourceX,
                    T.sourceY,
                    T.targetX,
                    T.targetY,
                    T.num,
                    T.forward,
                    T.sourceSize,
                    T.targetSize,
                    thumbnail,
                    T.size,
                )
            },
        }
        let forwadHashTable: any = new Map()
        for (let [key, values] of edgeList) {
            let item = values,
                value = item.value,
                source = value.source,
                target = value.target,
                attribute = item.getAttribute()
            // 如果被隐藏则跳过
            if (!attribute.isVisible || attribute.opacity == 0.0) continue
            if (!nodeList.has(source) || !nodeList.has(target)) continue

            let { type } = attribute,
                { attribute: souce_attribute, num: sourceNumber } = nodeList.get(source).value,
                { attribute: target_attribute, num: targetNumber } = nodeList.get(target).value,
                hash = hashNumber(sourceNumber, targetNumber), //两点之间的hash值
                forwardSource = forwadHashTable?.get(hash)?.sourceNumber,
                hashSet = type == 'basic' ? baseTypeHash.get(hash) : typeHash.get(hash), //两点之间hash表
                size = hashSet?.num

            if (!size) continue

            let lineNumber = [...hashSet.total].indexOf(key),
                forward =
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
                // item.changeAttribute({ isVisible: false })
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
                    this.graph.id,
                    'canvas',
                    scale,
                    position,
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
                        graphId: graph.id,
                    },
                    2,
                )
            ) {
                continue
            }
            let textPromise = strategies[type]({
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

            let nodeBound = textPromise.boundMod
            if (graph.thumbnail) {
                basicData[this.graph.id].thumbnailEdgeBoundBox.set(key, { point: nodeBound.point })
            } else {
                basicData[this.graph.id].edgeCanvasBoundBox.set(key, { point: nodeBound.point })
            }
            if (boolean) {
                graph.camera.quad.insert({
                    x: nodeBound.x,
                    y: nodeBound.y,
                    height: nodeBound.height,
                    width: nodeBound.width,
                    id: key,
                    isNode: false,
                    shape: type,
                })
            }
            nodeBound = null
        }
        forwadHashTable = null
    }
}
