import { hashNumber } from '..'
import { basicData } from '../../initial/globalProp'

// 整合边
export const unionEdges = (galaxyvis: any, layoutsNodes: any[], oneLine = true) => {
    let nodeList = galaxyvis.getFilterNode()
    let layoutsEdges: any[] = []
    let relationTable = galaxyvis.getEdgeType().relationTable
    let union = new Set()
    let nodesData: any = []
    let j = 0
    for (let i = 0, len = layoutsNodes.length; i < len; i++) {
        let needEdgeFresh = relationTable[layoutsNodes[i]]
        if (needEdgeFresh) {
            union = new Set([...union, ...needEdgeFresh])
            nodesData[j++] = ({
                isSingle: false,
                id: layoutsNodes[i],
            })
        } else {
            nodesData[j++] = ({
                isSingle: true,
                id: layoutsNodes[i],
            })
        }
    }

    let nodeById = new Map(layoutsNodes.map((item, i) => [item, { id: item, index: i }]))
    let i = 0
    let ins = new Map()
    if (oneLine) {
        union.forEach((val, key) => {
            let edge = galaxyvis.getEdge(key)
            if (edge) {
                let { source, target } = edge.value
                let sourceInfo: any = nodeById.get(source)
                let targetInfo: any = nodeById.get(target)
                let n
                if (sourceInfo && targetInfo) {
                    n = hashNumber(sourceInfo.index, targetInfo.index)
                    let sourceVisible = nodeList.has(source)
                    let targetVisible = nodeList.has(target)
                    if (
                        !ins.has(n) &&
                        sourceVisible &&
                        targetVisible &&
                        layoutsNodes.indexOf(source) !== -1 &&
                        layoutsNodes.indexOf(target) !== -1
                    ) {
                        layoutsEdges[i] = ({
                            index: i++,
                            source: sourceInfo,
                            target: targetInfo,
                        })
                        ins.set(n, true)
                    }
                }
            }
        })
    } else {
        union.forEach((val, key) => {
            let edge = galaxyvis.getEdge(key)
            if (edge) {
                let { source, target } = edge.value
                let sourceVisible = nodeList.has(source)
                let targetVisible = nodeList.has(target)
                if (
                    sourceVisible &&
                    targetVisible &&
                    layoutsNodes.indexOf(source) !== -1 &&
                    layoutsNodes.indexOf(target) !== -1
                )
                    layoutsEdges.push({ source, target })
            }
        })
    }

    return {
        nodesData,
        layoutsEdges,
        relationTable
    }
}
//局部布局
export const localComputation = (galaxyvisId: any, nodes: any, type: string = 'force') => {
    let nodeList = basicData[galaxyvisId].nodeList

    let coordx_max: number = -Infinity,
        coordx_min: number = Infinity,
        coordy_max: number = -Infinity,
        coordy_min: number = Infinity

    let sumx = 0,
        sumy = 0,
        len = nodes.length
    for (let keys in nodes) {
        let key = nodes[keys]
        let value = nodeList.get(key)
        let x = value.getAttribute('x')
        let y = value.getAttribute('y')
        coordx_max = Math.max(coordx_max, x)
        coordy_max = Math.max(coordy_max, y)
        coordx_min = Math.min(coordx_min, x)
        coordy_min = Math.min(coordy_min, y)
        sumx += x
        sumy += y
    }

    let width = Math.max(coordx_max - coordx_min, 200),
        height = Math.max(coordy_max - coordy_min, 200),
        center =
            type == 'grid'
                ? [
                      -(coordx_max + coordx_min) / 2 + width / 2,
                      -(coordy_max + coordy_min) / 2 + height / 2,
                  ]
                : [
                      -Math.ceil(sumx * 1e3) / len / 1e3 + width / 2,
                      -Math.ceil(sumy * 1e3) / len / 1e3 + height / 2,
                  ]

    return {
        width,
        height,
        center,
    }
}
