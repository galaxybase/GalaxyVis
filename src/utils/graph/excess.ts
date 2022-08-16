import { coordTransformation, hashNumber } from '..'
import { basicData, globalInfo, globalProp } from '../../initial/globalProp'
import { createLineMesh, creatParallelLine, loopLineMesh } from '../edge/initEdge'

const edgeGroups = globalProp.edgeGroups

export const getRelationTable = (that: any) => {
    let edgeList = basicData[that.id].edgeList
    let relationTable: any = {}
    for (let [key] of edgeList) {
        let attribute = edgeList.get(key)?.getAttribute()
        if (attribute) {
            let { source, target } = attribute
            if (relationTable[source]) {
                relationTable[source].add(key)
            } else if (!relationTable[source]) {
                relationTable[source] = new Set([key])
            }
            if (relationTable[target]) {
                relationTable[target].add(key)
            } else if (!relationTable[target]) {
                relationTable[target] = new Set([key])
            }
        }
    }
    return relationTable
}

/**
 * 获取每种类型边是第几条和获取关系表
 * @param that
 * @returns
 */
var typeHash: any, baseTypeHash: any
export const excessGetEdgeType = (that: any) => {
    let edgeList = basicData[that.id].edgeList
    let nodeList = basicData[that.id].nodeList
    typeHash = new Map()
    baseTypeHash = new Map()
    for (let [key, item] of edgeList) {
        let attribute = item?.value?.attribute
        if (attribute) {
            let { type, source, target, isVisible, usedMerge, isFilter } = attribute
            if (
                (usedMerge && globalInfo[that.id].mergeEdgesTransformat) ||
                (isFilter && globalInfo[that.id].filterEdgesTransformat?.size)
            ) {
                isVisible = false
                item.changeAttribute({
                    isVisible: false,
                })
            }
            if (isVisible) {
                if (!nodeList.has(source) || !nodeList.has(target)) continue

                let { num: source_n } = nodeList.get(source)?.value
                let { num: target_n } = nodeList.get(target)?.value

                if (basicData[that.id].relationTable[source]) {
                    basicData[that.id].relationTable[source].add(key)
                } else if (!basicData[that.id].relationTable[source]) {
                    basicData[that.id].relationTable[source] = new Set([key])
                }
                if (basicData[that.id].relationTable[target]) {
                    basicData[that.id].relationTable[target].add(key)
                } else if (!basicData[that.id].relationTable[target]) {
                    basicData[that.id].relationTable[target] = new Set([key])
                }
                // 通过hashtable 计数
                let n = hashNumber(source_n, target_n)
                switch (type) {
                    case 'parallel':
                        if (source == target) {
                            throw Error('该类型不支持起点和终点是同一个')
                        }
                        if (typeHash.has(n)) {
                            let total: any = typeHash.get(n).total
                            typeHash.set(n, {
                                num: typeHash.get(n).num + 1,
                                total: total.add(key),
                            })
                        } else {
                            typeHash.set(n, {
                                num: 1,
                                total: new Set().add(key),
                            })
                        }
                        break
                    case 'basic':
                        if (baseTypeHash.has(n)) {
                            let total: any = baseTypeHash.get(n).total
                            baseTypeHash.set(n, {
                                num: baseTypeHash.get(n).num + 1,
                                total: total.add(key),
                            })
                        } else {
                            baseTypeHash.set(n, {
                                num: 1,
                                total: new Set().add(key),
                            })
                        }
                        break
                    default:
                        break
                }
            }
        }
    }
    return {
        typeHash,
        baseTypeHash,
        relationTable: basicData[that.id].relationTable,
    }
}
/**
 * 获取要在webgl绘制的值
 * @param that
 * @param arg
 * @returns
 */

export const excessGetEdgeDrawVal = (that: any) => {
    let { edgeList, nodeList, drawEdgeCount, drawEdgeList, informationNewEdge } = basicData[that.id]

    drawEdgeList = new Map()
    informationNewEdge = new Map()

    let forwadHashTable: Map<string | number, any> | null = new Map()
    for (let [key, val] of edgeList) {
        let attribute = val?.value?.attribute
        if (!attribute) continue
        let { type, source, target, isVisible, opacity } = attribute
        if (isVisible) {
            if (!nodeList.has(source) || !nodeList.has(target)) continue

            let { attribute: souce_attribute, num: sourceNumber } = nodeList.get(source)?.value
            let { attribute: target_attribute, num: targetNumber } = nodeList.get(target)?.value

            if (sourceNumber === undefined || targetNumber === undefined) continue
            // 通过hashtable 计数
            let hash = hashNumber(sourceNumber, targetNumber), //两点之间的hash值
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
                { x: targetX, y: targetY, radius: targetSize, shape } = target_attribute,
                { x: sourceX, y: sourceY, radius: sourceSize } = souce_attribute,
                line
            if (!(target_attribute.isVisible && souce_attribute.isVisible)) {
                val.changeAttribute({ isVisible: false })
                continue
            } else {
                let xyOffect = coordTransformation(that.id, sourceX, sourceY)
                ;(sourceX = xyOffect[0]), (sourceY = xyOffect[1])
                let xyOffect2 = coordTransformation(that.id, targetX, targetY)
                ;(targetX = xyOffect2[0]), (targetY = xyOffect2[1])
                if (type == 'basic') {
                    if (source != target) {
                        size > 1 && size % 2 == 0 && lineNumber++
                        line = createLineMesh(
                            size,
                            sourceX,
                            sourceY,
                            targetX,
                            targetY,
                            lineNumber,
                            attribute,
                            targetSize,
                            shape,
                            forward,
                        )
                    } else {
                        lineNumber++
                        line = loopLineMesh(
                            'webgl',
                            sourceX,
                            sourceY,
                            lineNumber,
                            100,
                            attribute,
                            sourceSize,
                        )
                    }
                } else {
                    size > 1 && size % 2 == 0 && lineNumber++
                    line = creatParallelLine(
                        size,
                        sourceX,
                        sourceY,
                        sourceSize,
                        targetX,
                        targetY,
                        targetSize,
                        lineNumber,
                        attribute,
                        forward,
                    )
                }
                forwadHashTable?.set(hash, { sourceNumber, targetNumber })
                drawEdgeCount.set(key, {
                    m: lineNumber,
                    forward,
                    num: lineNumber,
                    size: line.bezierNumber == edgeGroups ? 2 : 1,
                })
                line.opacity = opacity
                drawEdgeList.set(key, line)
                basicData[that.id].edgeBoundBox.set(key, {
                    xmax: line.boundBox[0],
                    xmin: line.boundBox[1],
                    ymax: line.boundBox[2],
                    ymin: line.boundBox[3],
                    points: line.points,
                })
                if (line.hasContent) (informationNewEdge as Map<string, any>).set(key, line)
                line = null
            }
        }
    }
    basicData[that.id].informationNewEdge = informationNewEdge
    forwadHashTable = null
    return drawEdgeList
}

const excessGetEdge = (id: string, needFresh: any) => {
    let { relationTable, drawEdgeList, edgeList, nodeList, drawEdgeCount, informationNewEdge } =
        basicData[id]
    let union: Set<any> | null = new Set()
    needFresh.forEach((value: any) => {
        let needEdgeFresh = relationTable[value]
        if (needEdgeFresh) {
            needEdgeFresh.forEach((item: string) => {
                if (!edgeList.get(item)?.getAttribute('isVisible')) {
                    needEdgeFresh.delete(item)
                }
            })
            union = new Set([...(union as Set<any>), ...needEdgeFresh])
        }
    })

    union.forEach((value: any, key: any) => {
        drawEdgeList.delete(key)
        let edge = edgeList.get(value)
        let attribute = edge?.getAttribute()
        let { type, source, target, opacity, isVisible } = attribute
        if (isVisible && drawEdgeCount.has(key)) {
            let { attribute: souce_attribute } = nodeList.get(source)!.value
            let { attribute: target_attribute } = nodeList.get(target)!.value
            let { x: x1, y: y1, radius: radius1 } = souce_attribute
            let { x: x2, y: y2, radius: radius2, shape } = target_attribute
            let xyOffect = coordTransformation(id, x1, y1)
            let xyOffect2 = coordTransformation(id, x2, y2)
            let { m, forward, num, size } = drawEdgeCount.get(key)
            let line = null

            ;(x1 = xyOffect[0]), (y1 = xyOffect[1])
            ;(x2 = xyOffect2[0]), (y2 = xyOffect2[1])

            // 判断边类型的不同操作
            switch (type) {
                case 'parallel':
                    line = creatParallelLine(
                        size,
                        x1,
                        y1,
                        radius1,
                        x2,
                        y2,
                        radius2,
                        num,
                        attribute,
                        forward,
                    )
                    break
                case 'basic':
                    if (source !== target) {
                        line = createLineMesh(
                            size,
                            x1,
                            y1,
                            x2,
                            y2,
                            m,
                            attribute,
                            radius2,
                            shape,
                            forward,
                        )
                    } else {
                        line = loopLineMesh('webgl', x1, y1, m, 100, attribute, radius2)
                    }
                    break
                default:
                    break
            }
            line.opacity = opacity
            drawEdgeList.set(key, line)
            basicData[id].edgeBoundBox.set(key, {
                xmax: line.boundBox[0],
                xmin: line.boundBox[1],
                ymax: line.boundBox[2],
                ymin: line.boundBox[3],
                points: line.points,
            })
            if (line.hasContent) (informationNewEdge as Map<string, any>).set(key, line)
        }
    })
    basicData[id].informationNewEdge = informationNewEdge
    return drawEdgeList
}

/**
 * 获取要在webgl绘制的值
 * @param that
 * @returns
 */
export const excessGetEdgeWithArrow = (that: any, Partial?: boolean, needFresh?: any) => {
    let count = 0,
        lineDrawCount: any[] = [],
        num = 0,
        plotNum = 0
    if (Partial && needFresh?.size) {
        basicData[that.id].drawEdgeList = excessGetEdge(that.id, needFresh)
    } else {
        basicData[that.id].drawEdgeList = excessGetEdgeDrawVal(that)
    }
    for (let [key, val] of basicData[that.id].drawEdgeList) {
        const bezierNumber = val.bezierNumber
        if (bezierNumber == globalProp.edgeGroups) {
            num++
        } else {
            plotNum++
        }
        lineDrawCount[count++] = [
            [val.color, val.opacity],
            val.MatArray,
            val.MatArray2,
            key,
            bezierNumber,
        ]
    }
    return {
        lineDrawCount,
        num,
        plotNum,
    }
}
/**
 * 获取可见点
 * @returns
 */
export const graphFilterNodes = (that: any) => {
    let visibleNodeList = new Map()
    basicData[that.id].nodeList.forEach((item: any, key: any) => {
        if (item.getAttribute('isVisible')) {
            visibleNodeList.set(key, item)
        }
    })
    return visibleNodeList
}
/**
 * 获取可见边
 * @returns
 */
export const graphFilterEdges = (that: any) => {
    let visibleEdgeList = new Map()
    basicData[that.id].edgeList.forEach((item: any, key: any) => {
        if (item.getAttribute('isVisible')) {
            visibleEdgeList.set(key, item)
        }
    })
    return visibleEdgeList
}

/**
 * 获取当前页面下的点边id包括合并点边下的
 * @returns
 */
export const graphGetOriginData = (that: any) => {
    let nodeList = basicData[that.id].nodeList
    let nodes = new Set()
    nodeList.forEach((item, key) => {
        if (item.getAttribute('isVisible')) {
            if (item.getAttribute('isGroupNode')) {
                //递归  后续加
                // while(){
                // }
                let children = item.value?.children
                for (let i = 0, len = children.length; i < len; i++) {
                    nodes.add(children[i].key)
                }
            } else {
                nodes.add(key)
            }
        }
    })

    let edgeList = basicData[that.id].edgeList
    let edges = new Set()
    let filterEdges = new Set()

    try {
        if (globalInfo[that.id].filterEdgesTransformat?.size) {
            globalInfo[that.id].filterEdgesTransformat!.forEach(item => {
                let result = item.transformat.subEdges.getId()
                for (let i = 0, len = result.length; i < len; i++) {
                    filterEdges.add(result[i])
                }
            })
        }
    } catch {}

    edgeList.forEach((item, key) => {
        let source = item.value.source,
            target = item.value.target
        if (
            nodes.has(source) &&
            nodes.has(target) &&
            !item.getAttribute('isGroupEdge') &&
            !item.getAttribute('isGroup') &&
            !filterEdges.has(key)
        ) {
            edges.add(key)
        }
    })

    return {
        nodes: [...nodes],
        edges: [...edges],
    }
}
