/**
 * 以 breadth-first order (opens new window)(广度优先) 的次序为每个 node 调用执行的 function, 一个给定的节点只有在比其深度更小或者在此节点之前的相同深度的节点都被访问过之后才会被访问。
 * @param this
 * @param callback
 * @param that
 * @returns
 */
export default function (this: any, callback: any, that: any) {
    let index = -1
    for (const node of this) {
        callback.call(that, node, ++index, this)
    }
    return this
}
