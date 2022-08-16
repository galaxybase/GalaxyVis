import node_count from './count'
import node_each from './each'
import node_eachBefore from './eachBefore'
import node_eachAfter from './eachAfter'
import node_find from './find'
import node_sum from './sum'
import node_sort from './sort'
import node_path from './path'
import node_ancestors from './ancestors'
import node_descendants from './descendants'
import node_leaves from './leaves'
import node_links from './links'
import node_iterator from './iterator'

export default function hierarchy(data: any, children?: any) {
    if (data instanceof Map) {
        data = [undefined, data]
        if (children === undefined) children = mapChildren
    } else if (children === undefined) {
        children = objectChildren
    }
    // @ts-ignore
    var root = new Node(data),
        node,
        nodes = [root],
        child,
        childs,
        i,
        n

    while ((node = nodes.pop())) {
        if ((childs = children(node.data)) && (n = (childs = Array.from(childs)).length)) {
            node.children = childs
            for (i = n - 1; i >= 0; --i) {
                // @ts-ignore
                nodes.push((child = childs[i] = new Node(childs[i])))
                child.parent = node
                child.depth = node.depth + 1
            }
        }
    }

    return root.eachBefore(computeHeight)
}

function node_copy() {
    // @ts-ignore
    return hierarchy(this).eachBefore(copyData)
}

function objectChildren(d: { children: any }) {
    return d.children
}

function mapChildren(d: any[]) {
    return Array.isArray(d) ? d[1] : null
}

function copyData(node: any) {
    if (node.data.value !== undefined) node.value = node.data.value
    node.data = node.data.data
}

export function computeHeight(node: any) {
    var height = 0
    do node.height = height
    while ((node = node.parent) && node.height < ++height)
}

export function Node(this: any, data: any) {
    this.data = data
    this.depth = this.height = 0
    this.parent = null
}

Node.prototype = hierarchy.prototype = {
    constructor: Node,
    count: node_count,
    each: node_each,
    eachAfter: node_eachAfter,
    eachBefore: node_eachBefore,
    find: node_find,
    sum: node_sum,
    sort: node_sort,
    path: node_path,
    ancestors: node_ancestors,
    descendants: node_descendants,
    leaves: node_leaves,
    links: node_links,
    copy: node_copy,
    [Symbol.iterator]: node_iterator,
}
