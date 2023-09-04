import { coordTransformation, hashNumber } from '..'
import { basicData, globalInfo, globalProp } from '../../initial/globalProp'
import { createLineMesh, creatParallelLine, loopLineMesh } from '../edge/initEdge'

const edgeGroups = globalProp.edgeGroups

export const getNodeTable = (that: any) => {
    let edgeList = basicData[that.id].edgeList;
    let inRelationTable: { [key: string]: Set<string> } = {},
        outRelationTable: { [key: string]: Set<string> } = {},
        table: { [key: string]: any } = {};
    for (let [key] of edgeList) {
        let attribute = edgeList.get(key)?.getAttribute()
        if (!attribute) continue;
        let { source, target, isVisible } = attribute
        if (isVisible) {
            if (inRelationTable[target]) {
                inRelationTable[target].add(key)
            } else if (!inRelationTable[target]) {
                inRelationTable[target] = new Set([key])
            }

            if (outRelationTable[source]) {
                outRelationTable[source].add(key)
            } else if (!outRelationTable[source]) {
                outRelationTable[source] = new Set([key])
            }
            table[key] = {
                source, target
            }
        }
    }
    return {
        inRelationTable,
        outRelationTable,
        table
    }
}

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
var typeHash:{[key:string]: any} = {}, baseTypeHash:{[key:string]: any} = {}
export const excessGetEdgeType = (that: any) => {
    let GraphId = that.id;
    let { edgeList, nodeList, relationTable } = basicData[GraphId]
    typeHash[GraphId] = new Map()
    baseTypeHash[GraphId] = new Map()
    for (let [key, item] of edgeList) {
        let attribute = item?.value?.attribute
        if (attribute) {
            let { type, source, target, isVisible, usedMerge, isFilter, isGroupEdge } = attribute
            if ((usedMerge && globalInfo[GraphId].mergeEdgesTransformat) ||
                (isFilter && globalInfo[GraphId].filterEdgesTransformat?.size)
            ) {
                isVisible = false
                item.changeAttribute({
                    isVisible: false,
                })
            }

            if (isGroupEdge && isVisible) {
                let children = item.value.children;
                let cnt = 0
                if(children){
                    for (let j = 0; j < children.length; j++) {
                        let edge = edgeList.get(children[j])
                        if (edge && edge.getAttribute('isVisible')) cnt++
                    }
                    if (cnt == children.length) {
                        isVisible = false
                        item.changeAttribute({
                            isVisible: false,
                        })
                    }
                }
            }

            if (isVisible) {
                if (!nodeList.has(source) || !nodeList.has(target)) continue

                let { num: source_n } = nodeList.get(source)?.value
                let { num: target_n } = nodeList.get(target)?.value

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
                // 通过hashtable 计数
                let n = hashNumber(source_n, target_n)
                switch (type) {
                    case 'parallel':
                        if (source == target) {
                            throw Error('该类型不支持起点和终点是同一个')
                        }
                        if (typeHash[GraphId].has(n)) {
                            let total: any = typeHash[GraphId].get(n).total
                            typeHash[GraphId].set(n, {
                                num: typeHash[GraphId].get(n).num + 1,
                                total: total.add(key),
                            })
                        } else {
                            typeHash[GraphId].set(n, {
                                num: 1,
                                total: new Set().add(key),
                            })
                        }
                        break
                    case 'basic':
                        if (baseTypeHash[GraphId].has(n)) {
                            let total: any = baseTypeHash[GraphId].get(n).total
                            baseTypeHash[GraphId].set(n, {
                                num: baseTypeHash[GraphId].get(n).num + 1,
                                total: total.add(key),
                            })
                        } else {
                            baseTypeHash[GraphId].set(n, {
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
        typeHash: typeHash[GraphId],
        baseTypeHash: baseTypeHash[GraphId],
        relationTable: basicData[GraphId].relationTable,
    }
}

export const getTypeHash = (GraphId:string) => {
    return typeHash[GraphId]
}

export const getbashTypeHash = (GraphId:string) => {
    return baseTypeHash[GraphId]
}

export const clearTypeHash = (GraphId:string) => {
    typeHash[GraphId] = null;
    delete typeHash[GraphId]
}

export const clearbashTypeHash = (GraphId:string) => {
    baseTypeHash[GraphId] = null;
    delete baseTypeHash[GraphId]
}

/**
 * 获取要在webgl绘制的值
 * @param that
 * @param arg
 * @returns
 */

export const excessGetEdgeDrawVal = (that: any) => {
    let GraphId = that.id;
    let { edgeList, nodeList, drawEdgeCount, drawEdgeList, informationNewEdge } = basicData[GraphId]

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
                hashSet = type == 'basic' ? baseTypeHash[GraphId].get(hash) : typeHash[GraphId].get(hash), //两点之间hash表
                size = hashSet?.num
            if (!size) continue
            let lineNumber = [...hashSet.total].indexOf(key);

            if (globalInfo[GraphId].enabledNoStraightLine) {
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
                { x: targetX, y: targetY, radius: targetSize, shape } = target_attribute,
                { x: sourceX, y: sourceY, radius: sourceSize } = souce_attribute,
                line;
            if (!(target_attribute.isVisible && souce_attribute.isVisible)) {
                val.changeAttribute({ isVisible: false })
                continue
            } else {
                let xyOffect = coordTransformation(GraphId, sourceX, sourceY)
                    ; (sourceX = xyOffect[0]), (sourceY = xyOffect[1])
                let xyOffect2 = coordTransformation(GraphId, targetX, targetY)
                    ; (targetX = xyOffect2[0]), (targetY = xyOffect2[1])
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
                basicData[GraphId].edgeBoundBox.set(key, {
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
    basicData[GraphId].informationNewEdge = informationNewEdge
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
    union.forEach((value: any, key: string) => {
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

            x1 = xyOffect[0], y1 = xyOffect[1];
            x2 = xyOffect2[0], y2 = xyOffect2[1];

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
    let GraphId = that.id;

    if (!typeHash[GraphId] || !baseTypeHash[GraphId]) {
        excessGetEdgeType(that)
    }
    let count = 0,
        lineDrawCount: any[] = [],
        num = 0,
        plotNum = 0
    if (!basicData[GraphId]) return {
        lineDrawCount,
        num,
        plotNum,
    }
    if (Partial && needFresh?.size && !that.geo.enabled()) {
        basicData[GraphId].drawEdgeList = excessGetEdge(GraphId, needFresh)
    } else {
        basicData[GraphId].drawEdgeList = excessGetEdgeDrawVal(that)
    }
    for (let [key, val] of basicData[GraphId].drawEdgeList) {
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
    basicData[that.id].nodeList.forEach((item: any, key: string) => {
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
    basicData[that.id].edgeList.forEach((item: any, key: string) => {
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
    let GraphId = that.id;
    let nodeList = basicData[GraphId].nodeList
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

    let edgeList = basicData[GraphId].edgeList
    let edges = new Set()
    let filterEdges = new Set()

    try {
        if (globalInfo[GraphId].filterEdgesTransformat?.size) {
            globalInfo[GraphId].filterEdgesTransformat!.forEach(item => {
                let result = item.transformat.subEdges.getId()
                for (let i = 0, len = result.length; i < len; i++) {
                    filterEdges.add(result[i])
                }
            })
        }
    } catch { }

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
