import constant from './constant'
import { jiggle } from './util'

function index(d: any) {
    return d.index
}

function find(nodeById: any, nodeId: any) {
    var node = nodeById.get(nodeId)
    if (!node) throw new Error('node not found: ' + nodeId)
    return node
}

export default function forceLink(links?: any): any {
    var id = index,
        strength = defaultStrength,
        strengths: any,
        distance = constant(200),
        distances: any,
        nodes: any,
        count: any,
        bias: any,
        random: any,
        iterations = 1
    if (links == null) links = []

    function defaultStrength(link: any) {
        return 1 / Math.min(count[link.source.index], count[link.target.index])
    }
    // 先初始化连线，统计每个节点的度，求每一条边的起点 (source) 度的占比，
    // 使 bias = 起点度 / (起点度 + 终点度)。
    // 每条边的默认长度 (distance)
    // 默认弹簧劲度系数 (strength) 为 1 / min(起点度, 终点度)，
    // 这是为了减小对于度较大节点的引力，提高稳定性。
    function force(alpha: number) {
        for (var k = 0, n = links.length; k < iterations; ++k) {
            for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
                ;(link = links[i]), (source = link.source), (target = link.target)
                x = target.x + target.vx - source.x - source.vx || jiggle(random)
                y = target.y + target.vy - source.y - source.vy || jiggle(random)
                l = Math.sqrt(x * x + y * y)
                l = ((l - distances[i]) / l) * alpha * strengths[i]
                ;(x *= l), (y *= l)
                target.vx -= x * (b = bias[i])
                target.vy -= y * b
                source.vx += x * (b = 1 - b)
                source.vy += y * b
            }
        }
    }

    function initialize() {
        if (!nodes) return

        var i,
            n: any = nodes.length,
            m = links.length,
            // @ts-ignore
            nodeById = new Map(
                // @ts-ignore
                nodes.map((d: any, i: any) => [id(d, i, nodes), d]),
            ),
            link

        for (i = 0, count = new Array(n); i < m; ++i) {
            ;(link = links[i]), (link.index = i)
            if (typeof link.source !== 'object') link.source = find(nodeById, link.source)
            if (typeof link.target !== 'object') link.target = find(nodeById, link.target)
            count[link.source.index] = (count[link.source.index] || 0) + 1
            count[link.target.index] = (count[link.target.index] || 0) + 1
        }

        for (i = 0, bias = new Array(m); i < m; ++i) {
            ;(link = links[i]),
                (bias[i] =
                    count[link.source.index] /
                    (count[link.source.index] + count[link.target.index]))
        }

        ;(strengths = new Array(m)), initializeStrength()
        ;(distances = new Array(m)), initializeDistance()
    }

    function initializeStrength() {
        if (!nodes) return

        for (var i = 0, n = links.length; i < n; ++i) {
            // @ts-ignore
            strengths[i] = +strength(links[i], i, links)
        }
    }

    function initializeDistance() {
        if (!nodes) return

        for (var i = 0, n = links.length; i < n; ++i) {
            distances[i] = Math.max(
                Math.floor(
                    1.5 * Math.max(count[links[i].source.index], count[links[i].target.index]),
                ),
                // @ts-ignore
                +distance(links[i], i, links),
            )
        }
    }

    //
    force.initialize = function (_nodes: any, _random: any) {
        nodes = _nodes
        random = _random
        initialize()
    }
    // 设置连接数组
    force.links = function (_: any) {
        return arguments.length ? ((links = _), initialize(), force) : links
    }
    // 链接数组
    force.id = function (_: any) {
        return arguments.length ? ((id = _), force) : id
    }
    // 设置迭代次数
    force.iterations = function (_: any) {
        return arguments.length ? ((iterations = +_), force) : iterations
    }
    // 设置连接强度
    force.strength = function (_: any) {
        return arguments.length
            ? ((strength = typeof _ === 'function' ? _ : constant(+_)), initializeStrength(), force)
            : strength
    }
    // 设置连接距离
    force.distance = function (_: any) {
        return arguments.length
            ? ((distance = typeof _ === 'function' ? _ : constant(+_)), initializeDistance(), force)
            : distance
    }

    return force
}
