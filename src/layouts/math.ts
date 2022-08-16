export const getAdjMatrix = (data: { nodes: any[]; edges: any[] }, directed: boolean): any[] => {
    const { nodes, edges } = data
    const matrix: any[] = []
    const nodeMap: {
        [key: string]: number
    } = {}

    if (!nodes) {
        throw new Error('invalid nodes data!')
    }
    if (nodes) {
        nodes.forEach((node, i) => {
            nodeMap[node.index] = i
            const row: number[] = []
            matrix.push(row)
        })
    }

    if (edges) {
        edges.forEach(e => {
            const { source, target } = e
            const sIndex = nodeMap[source.index]
            const tIndex = nodeMap[target.index]
            matrix[sIndex][tIndex] = 1
            if (!directed) {
                matrix[tIndex][sIndex] = 1
            }
        })
    }

    return matrix
}

export const floydWarshall = (adjMatrix: any[]): any[] => {
    // initialize
    const dist: any[] = []
    const size = adjMatrix.length
    for (let i = 0; i < size; i += 1) {
        dist[i] = []
        for (let j = 0; j < size; j += 1) {
            if (i === j) {
                dist[i][j] = 0
            } else if (adjMatrix[i][j] === 0 || !adjMatrix[i][j]) {
                dist[i][j] = Infinity
            } else {
                dist[i][j] = adjMatrix[i][j]
            }
        }
    }
    // floyd
    for (let k = 0; k < size; k += 1) {
        for (let i = 0; i < size; i += 1) {
            for (let j = 0; j < size; j += 1) {
                if (dist[i][j] > dist[i][k] + dist[k][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j]
                }
            }
        }
    }
    return dist
}
