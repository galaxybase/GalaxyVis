import { quadtree } from 'd3-quadtree'

import constant from './constant'
import { jiggle } from './util'
import { x, y } from './simulation'

export default function forceManyBody() {
    var nodes: any,
        node: any,
        random: any,
        alpha: number,
        strength = constant(-80),
        strengths: any,
        distanceMin2 = 600, //最小连接距离
        distanceMax2 = Infinity, //最远连接距离
        theta2 = 0.81

    function force(_: any) {
        var i,
            n = nodes.length,
            tree = quadtree(nodes, x, y).visitAfter(accumulate)
        for (alpha = _, i = 0; i < n; ++i) (node = nodes[i]), tree.visit(apply as any)
    }

    function initialize() {
        if (!nodes) return
        var i,
            n = nodes.length,
            node
        strengths = new Array(n)

        for (i = 0; i < n; ++i) {
            //@ts-ignore
            ;(node = nodes[i]), (strengths[node.index] = +strength(node, i, nodes))
        }
    }

    function accumulate(quad: any) {
        var strength = 0,
            q,
            c,
            weight = 0,
            x,
            y,
            i
        // For internal nodes, accumulate forces from child quadrants.
        if (quad.length) {
            for (x = y = i = 0; i < 4; ++i) {
                if ((q = quad[i]) && (c = Math.abs(q.value))) {
                    ;(strength += q.value), (weight += c), (x += c * q.x), (y += c * q.y)
                }
            }
            quad.x = x / weight
            quad.y = y / weight
        }

        // For leaf nodes, accumulate forces from coincident quadrants.
        else {
            q = quad
            q.x = q.data.x
            q.y = q.data.y
            do strength += strengths[q.data.index]
            while ((q = q.next))
        }
        quad.value = strength
    }
    // apply 函数第一个参数 quad 为四叉树索引节点，
    // 内有索引下属子节点的合坐标 (quad.x,quad.y) 和合电荷量。
    // 其返回 true 意味着，当前节点及其子节点已完成计算，否则需要继续向下遍历节点。
    function apply(
        quad: {
            value: number
            x: number
            y: number
            length: any
            data: { index: string | number }
            next: any
        },
        x1: number,
        _: any,
        x2: number,
    ) {
        if (!quad.value) return true

        var x = quad.x - node.x,
            y = quad.y - node.y,
            w = x2 - x1,
            l = x * x + y * y
        // 是否可采用 Barnes-Hut 近似
        // Apply the Barnes-Hut approximation if possible.
        // Limit forces for very close nodes; randomize direction if coincident.
        if ((w * w) / theta2 < l) {
            if (l < distanceMax2) {
                if (x === 0) (x = jiggle(random)), (l += x * x)
                if (y === 0) (y = jiggle(random)), (l += y * y)
                if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l)
                node.vx += (x * quad.value * alpha) / l
                node.vy += (y * quad.value * alpha) / l
            }
            return true
        }
        // 无法采用 Barnes-Hut 近似且 quad 有节点，或 l 大于距离上限，需要继续向下遍历
        // Otherwise, process points directly.
        else if (quad.length || l >= distanceMax2) return
        // 排除自身对自身影响
        // Limit forces for very close nodes; randomize direction if coincident.
        if (quad.data !== node || quad.next) {
            if (x === 0) (x = jiggle(random)), (l += x * x)
            if (y === 0) (y = jiggle(random)), (l += y * y)
            if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l)
        }

        do
            if (quad.data !== node) {
                w = (strengths[quad.data.index] * alpha) / l
                node.vx += x * w
                node.vy += y * w
            }
        while ((quad = quad.next))
    }

    force.initialize = function (_nodes: any, _random: any) {
        nodes = _nodes
        random = _random
        initialize()
    }
    // 设置力强度
    force.strength = function (_: string | number) {
        return arguments.length
            ? ((strength = typeof _ === 'function' ? _ : constant(+_)), initialize(), force)
            : strength
    }
    // 设置近处限制力
    force.distanceMin = function (_: number) {
        return arguments.length ? ((distanceMin2 = _ * _), force) : Math.sqrt(distanceMin2)
    }
    // 设置远处限制力
    force.distanceMax = function (_: number) {
        return arguments.length ? ((distanceMax2 = _ * _), force) : Math.sqrt(distanceMax2)
    }
    // 设置Barnes-hut近似精度
    force.theta = function (_: number) {
        return arguments.length ? ((theta2 = _ * _), force) : Math.sqrt(theta2)
    }

    return force
}
