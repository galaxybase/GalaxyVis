// @ts-ignore
import { quadtree } from '../../quadtree'

import constant from './constant'
import { jiggle } from './util'

function x(d: any) {
    return d.x + d.vx
}

function y(d: any) {
    return d.y + d.vy
}

export default function forceCollide(radius?: any) {
    var nodes: string | any[],
        radii: any[],
        random: any,
        strength = 1,
        iterations = 1

    if (typeof radius !== 'function') radius = constant(radius == null ? 1 : +radius)

    function force() {
        var i,
            n: number = nodes.length,
            tree,
            node: { index: number; x: any; vx: any; y: any; vy: number },
            xi: number,
            yi: number,
            ri: number,
            ri2: number

        for (var k = 0; k < iterations; ++k) {
            tree = quadtree(nodes, x, y).visitAfter(prepare)
            for (i = 0; i < n; ++i) {
                node = nodes[i]
                ;(ri = radii[node.index]), (ri2 = ri * ri)
                xi = node.x + node.vx
                yi = node.y + node.vy
                tree.visit(apply)
            }
        }

        function apply(quad: any, x0: number, y0: number, x1: number, y1: number) {
            var data = quad.data,
                rj = quad.r,
                r = ri + rj
            if (data) {
                if (data.index > node.index) {
                    var x = xi - data.x - data.vx,
                        y = yi - data.y - data.vy,
                        l = x * x + y * y
                    if (l < r * r) {
                        if (x === 0) (x = jiggle(random)), (l += x * x)
                        if (y === 0) (y = jiggle(random)), (l += y * y)
                        l = ((r - (l = Math.sqrt(l))) / l) * strength
                        node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj))
                        node.vy += (y *= l) * r
                        data.vx -= x * (r = 1 - r)
                        data.vy -= y * r
                    }
                }
                return
            }
            return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r
        }
    }

    function prepare(quad: any) {
        if (quad.data) return (quad.r = radii[quad.data.index])
        for (var i = (quad.r = 0); i < 4; ++i) {
            if (quad[i] && quad[i].r > quad.r) {
                quad.r = quad[i].r
            }
        }
    }

    function initialize() {
        if (!nodes) return
        var i,
            n: number = nodes.length,
            node
        radii = new Array(n)
        for (i = 0; i < n; ++i) (node = nodes[i]), (radii[node.index] = +radius(node, i, nodes))
    }

    force.initialize = function (_nodes: any, _random: any) {
        nodes = _nodes
        random = _random
        initialize()
    }

    force.iterations = function (_: string | number) {
        return arguments.length ? ((iterations = +_), force) : iterations
    }

    force.strength = function (_: string | number) {
        return arguments.length ? ((strength = +_), force) : strength
    }

    force.radius = function (_: string | number) {
        return arguments.length
            ? ((radius = typeof _ === 'function' ? _ : constant(+_)), initialize(), force)
            : radius
    }

    return force
}
