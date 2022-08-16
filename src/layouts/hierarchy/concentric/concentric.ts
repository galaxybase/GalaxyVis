import { PlainObject } from '../../../types'

const center = [0, 0],
    nodeSize = 60,
    tau = Math.PI * 2,
    startAngle = (3 / 2) * Math.PI,
    nodeSpace = 20

function genericConcentricLayout(assign: any, nodes: any, options: any) {
    let { circleHopRatio, repulsion } = options,
        positions: PlainObject<any> = {},
        centerX,
        centerY
    circleHopRatio = (circleHopRatio || 5) * 25
    positions[nodes[0][0]] = {
        x: 0,
        y: 0,
    }

    let minDist = (repulsion || nodeSize) + nodeSpace

    let r = 0
    nodes.forEach((level: any, i: number) => {
        const sweep = 2 * Math.PI - tau / level.length,
            dTheta = (level.dTheta = sweep / Math.max(1, level.length - 1))
        if (level.length > 1) {
            const dcos = Math.cos(dTheta) - 1
            const dsin = Math.sin(dTheta)
            const rMin = Math.sqrt((minDist * minDist) / (dcos * dcos + dsin * dsin))
            r = Math.max(rMin, r)
        }
        level.r = r
        r += minDist + circleHopRatio
    })

    nodes.forEach((level: any) => {
        const dTheta = level.dTheta
        const r = level.r

        level.forEach((node: any, i: number) => {
            const theta = startAngle + dTheta * i
            centerX = center[0] + r * Math.cos(theta)
            centerY = center[1] + r * Math.sin(theta)
            positions[node] = {
                x: centerX,
                y: centerY,
            }
        })
    })

    return positions
}

var concentricLayout = genericConcentricLayout.bind(null, false)

export default concentricLayout
