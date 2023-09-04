import { floydWarshall, getAdjMatrix } from '../../math'
import RadialNonoverlapForce from './radialNonoverlapForce'
/**
 * 辐射布局
 * @param assign 
 * @param nodes 
 * @param edges 
 * @param options 
 * @returns 
 */
function genericRadialLayout(assign: any, nodes: any, edges: any, options: any) {
    let {
        centralNode: focusNode,
        width,
        height,
        center,
        unitRadius,
        distance: linkDistance,
        tickNum: maxIteration,
        strictRadial,
        nodeSize,
    } = options
    if (focusNode) {
        let found = false
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === focusNode) {
                focusNode = nodes[i]
                found = true
                break
            }
        }
        if (!found) {
            focusNode = null
        }
    }

    if (!focusNode) {
        focusNode = nodes[0]
    }

    const focusIndex = focusNode.index

    const adjMatrix = getAdjMatrix({ nodes, edges }, false)
    const D = floydWarshall(adjMatrix)
    const maxDistance = maxToFocus(D, focusIndex)
    handleInfinity(D, focusIndex, maxDistance + 1)

    const focusNodeD = D[focusIndex]

    width = width || 400
    height = height || 400

    !center && (center = [0, 0])
    let semiWidth = width - center[0] > center[0] ? center[0] : width - center[0]
    let semiHeight = height - center[1] > center[1] ? center[1] : height - center[1]
    if (semiWidth === 0) {
        semiWidth = width / 2
    }
    if (semiHeight === 0) {
        semiHeight = height / 2
    }
    const maxRadius = semiHeight > semiWidth ? semiWidth : semiHeight
    const maxD = Math.max(...focusNodeD)
    const radii: number[] = []
    focusNodeD.forEach((value: number, i: number) => {
        if (!unitRadius) {
            unitRadius = maxRadius / maxD + 200
        }
        radii[i] = value * unitRadius
    })

    !linkDistance && (linkDistance = maxRadius)
    const eIdealD = eIdealDisMatrix(nodes, D, linkDistance, radii, unitRadius)
    const W = getWeightMatrix(eIdealD)

    let positions = nodes.map((item: any) => {
        return [item.x, item.y]
    })

    positions.forEach((p: any) => {
        if (isNaN(p[0])) {
            p[0] = Math.random() * linkDistance
        }
        if (isNaN(p[1])) {
            p[1] = Math.random() * linkDistance
        }
    })

    positions.forEach((p: any, i: number) => {
        nodes[i].x = p[0] + center[0]
        nodes[i].y = p[1] + center[1]
    })

    positions.forEach((p: any) => {
        p[0] -= positions[focusIndex][0]
        p[1] -= positions[focusIndex][1]
    })

    !maxIteration && (maxIteration = 1000)
    for (let i = 0; i <= maxIteration; i++) {
        const param = i / maxIteration
        oneIteration(param, positions, radii, eIdealD, W, focusIndex)
    }
    
    if (strictRadial == undefined) strictRadial = true

    const nonoverlapForceParams: any = {
        nodeSizeFunc: (item:any) => item.radius * 5,
        adjMatrix,
        positions,
        radii,
        height,
        width,
        strictRadial,
        focusID: focusIndex,
        iterations: maxIteration,
        k: positions.length,
        nodes,
    }
    const nonoverlapForce = new RadialNonoverlapForce(nonoverlapForceParams)
    positions = nonoverlapForce.layout()

    positions.forEach((p: any, i: number) => {
        nodes[i].x = p[0] + center[0]
        nodes[i].y = p[1] + center[1]
    })

    return nodes
}

const oneIteration = (
    param: number,
    positions: any[],
    radii: number[],
    D: any[],
    W: any[],
    focusIndex: any,
) => {
    const vparam = 1 - param
    positions.forEach((v: any, i: number) => {
        const originDis = getEDistance(v, [0, 0])
        const reciODis = originDis === 0 ? 0 : 1 / originDis
        if (i === focusIndex) {
            return
        }
        let xMolecule = 0
        let yMolecule = 0
        let denominator = 0
        positions.forEach((u, j) => {
            if (i === j) {
                return
            }
            const edis = getEDistance(v, u)
            const reciEdis = edis === 0 ? 0 : 1 / edis
            const idealDis = D[j][i]

            denominator += W[i][j]

            xMolecule += W[i][j] * (u[0] + idealDis * (v[0] - u[0]) * reciEdis)

            yMolecule += W[i][j] * (u[1] + idealDis * (v[1] - u[1]) * reciEdis)
        })
        const reciR = radii[i] === 0 ? 0 : 1 / radii[i]
        denominator *= vparam
        denominator += param * reciR * reciR

        xMolecule *= vparam
        xMolecule += param * reciR * v[0] * reciODis
        v[0] = xMolecule / denominator

        yMolecule *= vparam
        yMolecule += param * reciR * v[1] * reciODis
        v[1] = yMolecule / denominator
    })
}

const getWeightMatrix = (M: any[]) => {
    const rows = M.length
    const cols = M[0].length
    const result = []
    for (let i = 0; i < rows; i++) {
        const row = []
        for (let j = 0; j < cols; j++) {
            if (M[i][j] !== 0) {
                row.push(1 / (M[i][j] * M[i][j]))
            } else {
                row.push(0)
            }
        }
        result.push(row)
    }
    return result
}

const eIdealDisMatrix = (
    nodes: any,
    D: any,
    linkDis: number,
    radii: number[],
    unitRadius: number,
): any[] => {
    if (!nodes) return []
    const result: any[] = []
    if (D) {
        D.forEach((row: any[], i: number) => {
            const newRow: any = []
            row.forEach((v, j) => {
                if (i === j) {
                    newRow.push(0)
                } else if (radii[i] === radii[j]) {
                    newRow.push((v * linkDis) / (radii[i] / unitRadius))
                } else {
                    const link = (linkDis + unitRadius) / 2
                    newRow.push(v * link)
                }
            })
            result.push(newRow)
        })
    }
    return result
}

const handleInfinity = (matrix: any[], focusIndex: number, step: number) => {
    const length = matrix.length
    for (let i = 0; i < length; i++) {
        if (matrix[focusIndex][i] === Infinity) {
            matrix[focusIndex][i] = step
            matrix[i][focusIndex] = step
            for (let j = 0; j < length; j++) {
                if (matrix[i][j] !== Infinity && matrix[focusIndex][j] === Infinity) {
                    matrix[focusIndex][j] = step + matrix[i][j]
                    matrix[j][focusIndex] = step + matrix[i][j]
                }
            }
        }
    }
    for (let i = 0; i < length; i++) {
        if (i === focusIndex) {
            continue
        }
        for (let j = 0; j < length; j++) {
            if (matrix[i][j] === Infinity) {
                let minus = Math.abs(matrix[focusIndex][i] - matrix[focusIndex][j])
                minus = minus === 0 ? 1 : minus
                matrix[i][j] = minus
            }
        }
    }
}

const maxToFocus = (matrix: any[], focusIndex: number): number => {
    let max = 0
    for (let i = 0; i < matrix[focusIndex].length; i++) {
        if (matrix[focusIndex][i] === Infinity) {
            continue
        }
        max = matrix[focusIndex][i] > max ? matrix[focusIndex][i] : max
    }
    return max
}

const getEDistance = (p1: any, p2: any) => {
    return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]))
}

var radialLayout = genericRadialLayout.bind(null, false)

export default radialLayout
