/**
 * 从当前 node 开始以 post-order traversal 的次序为当前节点以及每个后代节点调用指定的 value 函数，并返回当前 node。
 * 这个过程会为每个节点附加 node.value 数值属性，
 * 属性值是当前节点的 value 值和所有后代的 value 的合计，
 * 函数的返回值必须为非负数值类型。value 访问器会为当前节点和每个后代节点进行评估，包括内部结点；
 * 如果你仅仅想让叶节点拥有内部值，则可以在遍历到叶节点时返回 0。
 * @param this
 * @param value
 * @returns
 */
export default function sum(this: any, value: (arg0: any) => string | number) {
    return this.eachAfter(function (node: any) {
        var sum = +value(node.data) || 0,
            children = node.children,
            i = children && children.length
        while (--i >= 0) sum += children[i].value
        node.value = sum
    })
}
