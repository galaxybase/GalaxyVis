import constant from './constant'

export default function forceY(y?: any) {
    var strength = constant(0.1),
        nodes: string | any[],
        strengths: any[],
        yz: any[]

    if (typeof y !== 'function') y = constant(y == null ? 0 : +y)

    function force(alpha: number) {
        for (var i = 0, n: number = nodes.length, node; i < n; ++i) {
            ;(node = nodes[i]), (node.vy += (yz[i] - node.y) * strengths[i] * alpha)
        }
    }

    function initialize() {
        if (!nodes) return
        var i,
            n: number = nodes.length
        strengths = new Array(n)
        yz = new Array(n)
        for (i = 0; i < n; ++i) {
            strengths[i] = isNaN((yz[i] = +y(nodes[i], i, nodes)))
                ? 0
                : // @ts-ignore
                  +strength(nodes[i], i, nodes)
        }
    }

    force.initialize = function (_: any) {
        nodes = _
        initialize()
    }

    force.strength = function (_: string | number) {
        return arguments.length
            ? ((strength = typeof _ === 'function' ? _ : constant(+_)), initialize(), force)
            : strength
    }

    force.y = function (_: string | number) {
        return arguments.length
            ? ((y = typeof _ === 'function' ? _ : constant(+_)), initialize(), force)
            : y
    }

    return force
}
