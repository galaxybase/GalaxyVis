import tree_add, { addAll as tree_addAll } from './add'
import tree_cover from './cover'
import tree_data from './data'
import tree_extent from './extent'
import tree_find from './find'
import tree_remove, { removeAll as tree_removeAll } from './remove'
import tree_root from './root'
import tree_size from './size'
import tree_visit from './visit'
import tree_visitAfter from './visitAfter'
import tree_x, { defaultX } from './x'
import tree_y, { defaultY } from './y'

export default function quadtree(nodes: any, x: any, y: any) {
    // @ts-ignore
    var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN)
    return nodes == null ? tree : tree.addAll(nodes)
}

function Quadtree(this: any, x: any, y: any, x0: any, y0: any, x1: any, y1: any) {
    this._x = x
    this._y = y
    this._x0 = x0
    this._y0 = y0
    this._x1 = x1
    this._y1 = y1
    this._root = undefined
}

function leaf_copy(leaf: any) {
    var copy = { data: leaf.data },
        next = copy
    // @ts-ignore
    while ((leaf = leaf.next)) next = next.next = { data: leaf.data }
    return copy
}

var treeProto = (quadtree.prototype = Quadtree.prototype)

treeProto.copy = function () {
    // @ts-ignore
    var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
        node = this._root,
        nodes,
        child

    if (!node) return copy

    if (!node.length) return (copy._root = leaf_copy(node)), copy

    nodes = [{ source: node, target: (copy._root = new Array(4)) }]
    while ((node = nodes.pop())) {
        for (var i = 0; i < 4; ++i) {
            if ((child = node.source[i])) {
                if (child.length)
                    nodes.push({
                        source: child,
                        target: (node.target[i] = new Array(4)),
                    })
                else node.target[i] = leaf_copy(child)
            }
        }
    }

    return copy
}

treeProto.add = tree_add
treeProto.addAll = tree_addAll
treeProto.cover = tree_cover
treeProto.data = tree_data
treeProto.extent = tree_extent
treeProto.find = tree_find
treeProto.remove = tree_remove
treeProto.removeAll = tree_removeAll
treeProto.root = tree_root
treeProto.size = tree_size
treeProto.visit = tree_visit
treeProto.visitAfter = tree_visitAfter
treeProto.x = tree_x
treeProto.y = tree_y
