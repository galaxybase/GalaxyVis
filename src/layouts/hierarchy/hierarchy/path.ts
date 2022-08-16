/**
 * 返回从当前 node 到指定 target 节点的最短路径。路径从当前节点开始，遍历到当前 node 和 target 节点共同最近祖先，然后到 target 节点
 * @param this
 * @param end
 * @returns
 */
export default function path(this: any, end: any) {
    var start = this,
        ancestor = leastCommonAncestor(start, end),
        nodes = [start]
    while (start !== ancestor) {
        start = start.parent
        nodes.push(start)
    }
    var k = nodes.length
    while (end !== ancestor) {
        nodes.splice(k, 0, end)
        end = end.parent
    }
    return nodes
}

function leastCommonAncestor(a: any, b: any) {
    if (a === b) return a
    var aNodes = a.ancestors(),
        bNodes = b.ancestors(),
        c = null
    a = aNodes.pop()
    b = bNodes.pop()
    while (a === b) {
        c = a
        a = aNodes.pop()
        b = bNodes.pop()
    }
    return c
}
