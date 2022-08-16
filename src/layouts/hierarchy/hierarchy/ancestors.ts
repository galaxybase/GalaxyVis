/**
 * 返回祖先节点数组，第一个节点为自身，然后依次为从自身到根节点的所有节点。
 * @param this
 * @returns
 */
export default function ancestors(this: any) {
    var node = this,
        nodes = [node]
    while ((node = node.parent)) {
        nodes.push(node)
    }
    return nodes
}
