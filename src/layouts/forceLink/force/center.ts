/**
 * 设置力中心
 * @param x  {number}  -中心x坐标
 * @param y  {number}  -中心y坐标
 * @returns
 */
export default function forceCenter(x: any, y: any) {
    var nodes: any,
        strength = 1

    if (x == null) x = 0
    if (y == null) y = 0

    function force() {
        var i,
            n: number = nodes.length,
            node,
            sx = 0,
            sy = 0

        for (i = 0; i < n; ++i) {
            ;(node = nodes[i]), (sx += node.x), (sy += node.y)
        }

        for (sx = (sx / n - x) * strength, sy = (sy / n - y) * strength, i = 0; i < n; ++i) {
            ;(node = nodes[i]), (node.x -= sx), (node.y -= sy)
        }
    }

    force.initialize = function (_: any) {
        nodes = _
    }

    force.x = function (_: string | number) {
        return arguments.length ? ((x = +_), force) : x
    }

    force.y = function (_: string | number) {
        return arguments.length ? ((y = +_), force) : y
    }

    force.strength = function (_: string | number) {
        return arguments.length ? ((strength = +_), force) : strength
    }

    return force
}
