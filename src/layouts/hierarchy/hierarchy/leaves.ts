/**
 * 返回叶节点数组，叶节点是没有孩子节点的节点。
 * @param this
 * @returns
 */
export default function leaves(this: any) {
    var leaves: any[] = []
    this.eachBefore(function (node: any) {
        if (!node.children) {
            leaves.push(node)
        }
    })
    return leaves
}
