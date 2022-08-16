/**
 * 以 pre-order traversal (opens new window)(前序遍历) 的次序为每个 node 调用执行的 function，当每个节点被访问前，其所有的祖先节点都已经被访问过。指定的函数会将当前 node 作为参数。
 * @param this
 * @param callback
 * @param that
 * @returns
 */
export default function (this: any, callback: any, that: any) {
    var node = this,
        nodes = [node],
        children,
        i,
        index = -1
    while ((node = nodes.pop())) {
        callback.call(that, node, ++index, this)
        if ((children = node.children)) {
            for (i = children.length - 1; i >= 0; --i) {
                nodes.push(children[i])
            }
        }
    }
    return this
}
