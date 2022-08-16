/**
 * 计算当前 node 下所有叶节点的数量，并将其分配到 node.value 属性, 同时该节点的所有后代节点也会被自动计算其所属下的所有叶节点数量。
 * @param node
 */
function count(node: any) {
    var sum = 0,
        children = node.children,
        i = children && children.length
    if (!i) sum = 1
    else while (--i >= 0) sum += children[i].value
    node.value = sum
}

export default function (this: any) {
    return this.eachAfter(count)
}
