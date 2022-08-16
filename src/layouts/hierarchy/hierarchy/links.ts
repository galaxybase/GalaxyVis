/**
 * 返回当前 node 的 links 数组, 其中每个 link 是一个定义了 source 和 target 属性的对象。每个 link 的 source 为父节点, target 为子节点。
 * @param this
 * @returns
 */
export default function links(this: any) {
    var root = this,
        links: any[] = []
    root.each(function (node: any) {
        if (node !== root) {
            // Don’t include the root’s parent, if any.
            links.push({ source: node.parent, target: node })
        }
    })
    return links
}
