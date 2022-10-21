import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { hashNumber, isInSceen } from '../../utils'
import canvasEdgeDef from './edgeCanvas/edgeDef'
import canvasEdgeSelf from './edgeCanvas/edgeSelf'
import canvasNodeHalo from './haloCanvas/nodeHalo'

export default class haloCanvas {
    // 整个graph对象
    private graph
    // node总类型的构造器
    constructor(graph: any) {
        this.graph = graph
    }
    // 绘制点Halo
    drawNodeHalo = () => {
        const graphId = this.graph.id;
        // 获取当前graph对象
        let graph = this.graph
        // 获取当前缩放
        let ratio = graph.camera.ratio
        // 获取相机当前位置
        let position = graph.camera.position
        // 获取当前的点列表
        let nodeList = basicData[graphId].nodeList
        // 获取当前画布
        let context = graph.ctx
        // 获取顺序
        let orderNodes = [...globalInfo[graphId].nodeOrder]
        let thumbnail = graph.thumbnail
        let scale = (globalProp.globalScale / ratio) * 2.0

        // 遍历点顺序
        for (let keys in orderNodes) {
            let key = orderNodes[keys]
            // 该点是否存在
            if (nodeList.has(key)) {
                // 获取点方法
                let item = nodeList.get(key)
                // 获取点属性
                let data = item.getAttribute()
                // 如果被隐藏则跳过
                if (
                    !data.isVisible ||
                    data.halo.width == 0 ||
                    !isInSceen(graphId, 'canvas', scale, position, data, 1)
                )
                    continue
                canvasNodeHalo(graphId, context, data, ratio, position, thumbnail)
            }
        }
        this.drawEdgeHalo()
    }

    drawEdgeHalo = () => {
        const graphId = this.graph.id;
        // 获取当前graph对象
        let graph = this.graph
        // 获取当前相机缩放等级
        let ratio = graph.camera.ratio
        // 获取当前相机位置
        let position = graph.camera.position
        // 获取未被隐藏的点列表
        let nodeList = basicData[graphId].nodeList
        // 获取边列表
        let edgeList = basicData[graphId].edgeList
        // 获取个边的类型
        let edgeType = graph.getEdgeType()
        globalInfo[graphId].edgeType = edgeType
        // 获取当前canvas画布
        let context = graph.ctx
        let thumbnail = graph.thumbnail
        let {
            baseTypeHash, //basic类型的hash表
        } = edgeType

        let forwadHashTable: any = new Map()
        try {
            for (let [key, values] of edgeList) {
                let item = values
                let value = item.value
                let source = value.source
                let target = value.target
                let attribute = item.getAttribute()
                let { isVisible, halo, type, opacity, location } = attribute
                // 如果被隐藏则跳过
                if (!isVisible || opacity == 0.0) continue
                if (source == 'undefined' || target == 'undefined') {
                    continue
                }
                if (typeof source == 'undefined' || typeof target == 'undefined') continue
                if (type == 'basic') {
                    let { attribute: souce_attribute, num: sourceNumber } =
                        nodeList.get(source).value
                    let { attribute: target_attribute, num: targetNumber } =
                        nodeList.get(target).value
                    let hash = hashNumber(sourceNumber, targetNumber), //两点之间的hash值
                        hashSet = baseTypeHash.get(hash), //两点之间hash表
                        size = hashSet?.num
                    if (!size) continue
                    let lineNumber = [...hashSet.total].indexOf(key),
                        forwardSource = forwadHashTable?.get(hash)?.sourceNumber,
                        forward =
                            size % 2 == 0
                                ? lineNumber % 2 == 1 && sourceNumber != forwardSource
                                    ? -1
                                    : 1
                                : lineNumber % 2 == 0 && sourceNumber != forwardSource
                                ? -1
                                : 1,
                        { x: targetX, y: targetY, radius: targetSize } = target_attribute,
                        { x: sourceX, y: sourceY, radius: sourceSize } = souce_attribute
                    forwadHashTable?.set(hash, { sourceNumber, targetNumber })

                    halo.opacity = opacity || 1
                    halo.shape = null
                    halo.location = location
                    // 如果宽度为0则跳过
                    if (halo.width == 0) continue
                    if (source != target) {
                        size > 1 && size % 2 == 0 && lineNumber++
                        canvasEdgeDef(
                            graphId,
                            context,
                            ratio,
                            position,
                            halo,
                            sourceX,
                            sourceY,
                            targetX,
                            targetY,
                            targetSize,
                            lineNumber,
                            forward,
                            thumbnail,
                            size,
                            true,
                        )
                    } else {
                        canvasEdgeSelf(
                            graphId,
                            context,
                            ratio,
                            position,
                            halo,
                            sourceX,
                            sourceY,
                            sourceSize,
                            lineNumber + 1,
                            thumbnail,
                            true,
                        )
                    }
                } else {
                    continue
                }
            }
        } catch {}
    }

    clear = () => {
        
    }
}
