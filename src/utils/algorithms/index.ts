import { basicData } from '../../initial/globalProp'
import { createNeighborArrayForNode } from './shortest-path'
/**
 * 计算最短路径
 * @param galaxyvis
 * @param param1 起始点，终止点
 * @returns
 */
export const algorithmsShortestPath = (
    galaxyvis: any,
    { source, target }: { source: string; target: string },
) => {
    var sourceId = galaxyvis.getNode(source).getId(),
        targetId = galaxyvis.getNode(target).getId()
    if (sourceId === targetId) {
        return { nodes: [sourceId] }
    }

    var predecessor: any = {},
        successor: any = {}

    predecessor[sourceId] = null
    successor[targetId] = null

    var forwardFringe = [source],
        reverseFringe = [target],
        currentFringe,
        node,
        neighbors,
        neighbor,
        i,
        j,
        l,
        m

    var found = false
    outer: while (forwardFringe.length && reverseFringe.length) {
        if (forwardFringe.length <= reverseFringe.length) {
            currentFringe = forwardFringe
            forwardFringe = []
            for (i = 0, l = currentFringe.length; i < l; i++) {
                node = currentFringe[i]
                // 创建临近表
                neighbors = createNeighborArrayForNode(galaxyvis.getNode(node).getAdjacentNodes())
                for (j = 0, m = neighbors.length; j < m; j++) {
                    neighbor = neighbors[j]

                    if (!(neighbor in predecessor)) {
                        forwardFringe.push(neighbor)
                        predecessor[neighbor] = node
                    }

                    if (neighbor in successor) {
                        found = true
                        break outer
                    }
                }
            }
        } else {
            currentFringe = reverseFringe
            reverseFringe = []
            for (i = 0, l = currentFringe.length; i < l; i++) {
                node = currentFringe[i]
                neighbors = createNeighborArrayForNode(galaxyvis.getNode(node).getAdjacentNodes())

                for (j = 0, m = neighbors.length; j < m; j++) {
                    neighbor = neighbors[j]

                    if (!(neighbor in successor)) {
                        reverseFringe.push(neighbor)
                        successor[neighbor] = node
                    }

                    if (neighbor in predecessor) {
                        found = true
                        break outer
                    }
                }
            }
        }
    }

    if (!found) return null

    var path = []

    while (neighbor) {
        path.unshift(neighbor)
        neighbor = predecessor[neighbor]
    }

    neighbor = successor[path[path.length - 1]]

    while (neighbor) {
        path.push(neighbor)
        neighbor = successor[neighbor]
    }

    let targetPath: { nodes: any[]; edges: any[] } = {
        nodes: [],
        edges: [],
    }
    // 有向边和无向边
    if (path.length) {
        let relationTable = basicData[galaxyvis.id].relationTable
        let allEdges = basicData[galaxyvis.id].edgeList
        for (let index = 0; index < path.length - 1; index++) {
            let node = path[index]
            let edgeList = [...relationTable[node]]
            let nextId = path[index + 1]

            targetPath.nodes.push(node)
            for (let j = 0; j < edgeList.length; j++) {
                let edge = allEdges.get(edgeList[j])
                let source = edge.value.source
                let target = edge.value.target

                if ((node == source && nextId == target) || (node == target && nextId == source)) {
                    targetPath.edges.push(edgeList[j])
                    break
                }
            }
        }
        targetPath.nodes.push(path[path.length - 1])
    }

    return targetPath
}
