const nodeSize = 60,
    tau = Math.PI * 2,
    startAngle = 0,
    nodeSpace = 20,
    endAngle = 2 * Math.PI

/**
 * 圆形布局
 * @param  {Array}    [nodes]        - 点id
 * @param  {object}   [options]      - Options
 * @returns
 */
function genericCircularLayout(assign: any, nodes: any, options: any) {
    var positions = {},
        { startRadius, endRadius, center, divisions, radius, repulsion, angleRatio } = options

    var n = nodes.length,
        r = 0

    !center && (center = [0, 0])
    !radius && (radius = 0)

    const angleStep = (endAngle - startAngle) / n
    const divN = Math.ceil(n / (divisions || 1))
    const astep = angleStep * (angleRatio || 1)

    if (n == 1) {
        // @ts-ignore
        positions[nodes[0]] = {
            x: center[0],
            y: center[1],
        }
        return positions
    }

    if (!radius && !startRadius && !endRadius) {
        let minDist = (repulsion || nodeSize) + nodeSpace

        const sweep = 2 * Math.PI - tau / n,
            dTheta = sweep / Math.max(1, n - 1),
            dcos = Math.cos(dTheta) - 1,
            dsin = Math.sin(dTheta),
            rMin = Math.sqrt((minDist * minDist) / (dcos * dcos + dsin * dsin))

        r = Math.max(rMin, r) + minDist * 2

        radius = r
    }
    for (let i = 0; i < n; i++) {
        r = radius
        // 螺旋状
        if (!r && startRadius !== null && endRadius !== null) {
            r = startRadius + (i * (endRadius - startRadius)) / (n - 1)
        }
        if (!r && n >= 2) {
            r = 10 + (i * 100) / (n - 1)
        }

        let angle =
            startAngle +
            (i % divN) * astep +
            ((2 * Math.PI) / (divisions || 1)) * Math.floor(i / divN)
        // @ts-ignore
        positions[nodes[i]] = {
            x: Math.cos(angle) * r + center[0],
            y: Math.sin(angle) * r + center[1],
        }
    }

    return positions
}

var circularLayout = genericCircularLayout.bind(null, false)

export default circularLayout
