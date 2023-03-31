/**
 * 将邻居合并到给定的集合中的函数
 * @param {BasicSet} neighbors
 * @param {object}   object
 */
function merge(neighbors: Set<string>, object: any) {
    if (typeof object === 'undefined') return
    object.forEach((element: string) => {
        neighbors.add(element)
    })
}

/**
 * Take
 * @param  {Iterator} iterator
 * @param  {number}   [n]
 * @return {array}
 */

function take(iterator: any, n: any) {
    var l = arguments.length > 1 ? n : Infinity,
        array = l !== Infinity ? new Array(l) : [],
        step,
        i = 0

    while (true) {
        if (i === l) return array

        step = iterator.next()

        if (step.done) {
            if (i !== n) return array.slice(0, i)

            return array
        }

        array[i++] = step.value
    }
}

/**
 * 创建邻居表
 * @param  {string}       type
 * @param  {string}       direction
 * @param  {any}          nodeData
 * @return {Array}
 */
export function createNeighborArrayForNode(nodeData: any) {
    const neighbors: Set<string> = new Set()
    merge(neighbors, nodeData)
    return take(neighbors.values(), neighbors.size)
}
