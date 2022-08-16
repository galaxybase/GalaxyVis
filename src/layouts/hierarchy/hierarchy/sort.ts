/**
 * 以 pre-order traversal 的次序对当前 node 以及其所有的后代节点的子节点进行排序，指定的 compare 函数以 a 和 b 两个节点为参数。
 * 返回当前 node。如果 a 在 b 前面则应该返回一个比 0 小的值，如果 b 应该在 a 前面则返回一个比 0 大的值，否则不改变 a 和 b 的相对位置。
 * @param this
 * @param compare
 * @returns
 */
export default function sort(this: any, compare: any) {
    return this.eachBefore(function (node: any) {
        if (node.children) {
            node.children.sort(compare)
        }
    })
}
