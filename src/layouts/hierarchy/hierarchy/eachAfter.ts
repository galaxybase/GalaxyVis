/**
 * 以 post-order traversal (opens new window)(后序遍历) 的次序为每个 node 调用执行的 function，当每个节点被访问前，其所有的后代节点都已经被访问过。指定的函数会将当前 node 作为参数。
 * @param this
 * @param callback
 * @param that
 * @returns
 */
export default function (this: any, callback: any, that: any) {
    var node = this,
        nodes = [node],
        next = [],
        children,
        i,
        n,
        index = -1
    while ((node = nodes.pop())) {
        next.push(node)
        if ((children = node.children)) {
            for (i = 0, n = children.length; i < n; ++i) {
                nodes.push(children[i])
            }
        }
    }
    while ((node = next.pop())) {
        callback.call(that, node, ++index, this)
    }
    return this
}
