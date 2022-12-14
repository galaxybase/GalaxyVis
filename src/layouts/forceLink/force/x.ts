import constant from './constant'

export default function forceX(x?: any) {
    var strength = constant(0.1),
        nodes: any[],
        strengths: any,
        xz: any

    if (typeof x !== 'function') x = constant(x == null ? 0 : +x)

    function force(alpha: any) {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
            ;(node = nodes[i]), (node.vx += (xz[i] - node.x) * strengths[i] * alpha)
        }
    }

    function initialize() {
        if (!nodes) return
        var i,
            n = nodes.length
        strengths = new Array(n)
        xz = new Array(n)
        for (i = 0; i < n; ++i) {
            strengths[i] = isNaN((xz[i] = +x(nodes[i], i, nodes)))
                ? 0
                : // @ts-ignore
                  +strength(nodes[i], i, nodes)
        }
    }

    force.initialize = function (_: any) {
        nodes = _
        initialize()
    }

    force.strength = function (_: any) {
        return arguments.length
            ? ((strength = typeof _ === 'function' ? _ : constant(+_)), initialize(), force)
            : strength
    }

    force.x = function (_: any) {
        return arguments.length
            ? ((x = typeof _ === 'function' ? _ : constant(+_)), initialize(), force)
            : x
    }

    return force
}
