// @ts-ignore
import { Node } from './hierarchy/index'

function defaultSeparation(a: any, b: any) {
    return a.parent === b.parent ? 1 : 2
}

function radialSeparation(a: any, b: any) {
    return (a.parent === b.parent ? 1 : 2) / a.depth
}

// This function is used to traverse the left contour of a subtree (or
// subforest). It returns the successor of v on this contour. This successor is
// either given by the leftmost child of v or by the thread of v. The function
// returns null if and only if v is on the highest level of its subtree.
function nextLeft(v: any) {
    var children = v.children
    return children ? children[0] : v.t
}

// This function works analogously to nextLeft.
function nextRight(v: any) {
    var children = v.children
    return children ? children[children.length - 1] : v.t
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm: any, wp: any, shift: any) {
    var change = shift / (wp.i - wm.i)
    wp.c -= change
    wp.s += shift
    wm.c += change
    wp.z += shift
    wp.m += shift
}

// All other shifts, applied to the smaller subtrees between w- and w+, are
// performed by this function. To prepare the shifts, we have to adjust
// change(w+), shift(w+), and change(w-).
function executeShifts(v: any) {
    var shift = 0,
        change = 0,
        children = v.children,
        i = children.length,
        w
    while (--i >= 0) {
        w = children[i]
        w.z += shift
        w.m += shift
        shift += w.s + (change += w.c)
    }
}

// If vi-’s ancestor is a sibling of v, returns vi-’s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim: any, v: any, ancestor: any) {
    return vim.a.parent === v.parent ? vim.a : ancestor
}

function TreeNode(this: any, node: any, i: any) {
    this._ = node
    this.parent = null
    this.children = null
    this.A = null // default ancestor
    this.a = this // ancestor
    this.z = 0 // prelim
    this.m = 0 // mod
    this.c = 0 // change
    this.s = 0 // shift
    this.t = null // thread
    this.i = i // number
}

TreeNode.prototype = Object.create(Node.prototype)

function treeRoot(root: any) {
    //@ts-ignore
    var tree = new TreeNode(root, 0),
        node,
        nodes = [tree],
        child,
        children,
        i,
        n

    while ((node = nodes.pop())) {
        if ((children = node._.children)) {
            node.children = new Array((n = children.length))
            for (i = n - 1; i >= 0; --i) {
                // @ts-ignore
                nodes.push((child = node.children[i] = new TreeNode(children[i], i)))
                child.parent = node
            }
        }
    }
    // @ts-ignore
    ;(tree.parent = new TreeNode(null, 0)).children = [tree]
    return tree
}

//
/**
 * Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
 * @returns
 */
export default function tree(): any {
    var separation = defaultSeparation,
        dx = 1,
        dy = 1,
        nodeSize: any = null

    function tree(root: any) {
        var t = treeRoot(root)

        // Compute the layout using Buchheim et al.’s algorithm.
        t.eachAfter(firstWalk), (t.parent.m = -t.z)
        t.eachBefore(secondWalk)

        // If a fixed node size is specified, scale x and y.
        if (nodeSize) root.eachBefore(sizeNode)
        // If a fixed tree size is specified, scale x and y based on the extent.
        // Compute the left-most, right-most, and depth-most nodes for extents.
        else {
            var left = root,
                right = root,
                bottom = root
            root.eachBefore(function (node: any) {
                if (node.x < left.x) left = node
                if (node.x > right.x) right = node
                if (node.depth > bottom.depth) bottom = node
            })

            var s = left === right ? 1 : separation(left, right) / 2,
                tx = s - left.x,
                kx = dx / (right.x + s + tx),
                ky = dy / (bottom.depth || 1)

            root.eachBefore(function (node: any) {
                node.x = (node.x + tx) * kx
                node.y = node.depth * ky
            })
        }

        return root
    }

    // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
    // applied recursively to the children of v, as well as the function
    // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
    // node v is placed to the midpoint of its outermost children.
    function firstWalk(v: any) {
        var children = v.children,
            siblings = v.parent.children,
            w = v.i ? siblings[v.i - 1] : null
        if (children) {
            executeShifts(v)
            var midpoint = (children[0].z + children[children.length - 1].z) / 2
            if (w) {
                v.z = w.z + separation(v._, w._)
                v.m = v.z - midpoint
            } else {
                v.z = midpoint
            }
        } else if (w) {
            v.z = w.z + separation(v._, w._)
        }
        v.parent.A = apportion(v, w, v.parent.A || siblings[0])
    }

    // Computes all real x-coordinates by summing up the modifiers recursively.
    function secondWalk(v: { _: { x: any }; z: any; parent: { m: any }; m: any }) {
        v._.x = v.z + v.parent.m
        v.m += v.parent.m
    }

    // The core of the algorithm. Here, a new subtree is combined with the
    // previous subtrees. Threads are used to traverse the inside and outside
    // contours of the left and right subtree up to the highest common level. The
    // vertices used for the traversals are vi+, vi-, vo-, and vo+, where the
    // superscript o means outside and i means inside, the subscript - means left
    // subtree and + means right subtree. For summing up the modifiers along the
    // contour, we use respective variables si+, si-, so-, and so+. Whenever two
    // nodes of the inside contours conflict, we compute the left one of the
    // greatest uncommon ancestors using the function ANCESTOR and call MOVE
    // SUBTREE to shift the subtree and prepare the shifts of smaller subtrees.
    // Finally, we add a new thread (if necessary).
    function apportion(v: any, w: any, ancestor: any) {
        if (w) {
            var vip = v,
                vop = v,
                vim = w,
                vom = vip.parent.children[0],
                sip = vip.m,
                sop = vop.m,
                sim = vim.m,
                som = vom.m,
                shift
            while (((vim = nextRight(vim)), (vip = nextLeft(vip)), vim && vip)) {
                vom = nextLeft(vom)
                vop = nextRight(vop)
                vop.a = v
                shift = vim.z + sim - vip.z - sip + separation(vim._, vip._)
                if (shift > 0) {
                    moveSubtree(nextAncestor(vim, v, ancestor), v, shift)
                    sip += shift
                    sop += shift
                }
                sim += vim.m
                sip += vip.m
                som += vom.m
                sop += vop.m
            }
            if (vim && !nextRight(vop)) {
                vop.t = vim
                vop.m += sim - sop
            }
            if (vip && !nextLeft(vom)) {
                vom.t = vip
                vom.m += sip - som
                ancestor = v
            }
        }
        return ancestor
    }

    function sizeNode(node: { x: number; y: number; depth: number }) {
        node.x = node.x * dx
        node.y = node.depth * dy
    }
    /**
     * 如果指定了 seperation, 则设置间隔访问器为指定的函数并返回当前树布局。如果没有指定 seperation 则返回当前的间隔访问器，
     * 默认为:a.parent == b.parent ? 1 : 2;
     * @param x
     * @returns
     */
    tree.separation = function (x: any) {
        return arguments.length ? ((separation = x), tree) : separation
    }
    /**
     * 如果指定了 size 则设置当前系统树布局的尺寸为一个指定的二元数值类型数组，表示 [width, height] 并返回当前树布局。
     * 如果 size 没有指定则返回当前系统树布局的尺寸，默认为 [1, 1]。
     * 如果返回的布局尺寸为 null 时则表示实际的尺寸根据 node size 确定。坐标 x 和 y 可以是任意的坐标系统；
     * @param x
     * @returns
     */
    tree.size = function (x: any) {
        return arguments.length
            ? ((nodeSize = false), (dx = +x[0]), (dy = +x[1]), tree)
            : nodeSize
            ? null
            : [dx, dy]
    }
    /**
     * 如果指定了 size 则设置系统树布局的节点尺寸为指定的数值二元数组，表示为 [width, height] 并返回当前树布局。
     * 如果没有指定 size 则返回当前节点尺寸，默认为 null。
     * 如果返回的尺寸为 null 则表示使用 layout size 来自动计算节点大小。当指定了节点尺寸时，根节点的位置总是位于 ⟨0, 0⟩。
     * @param x
     * @returns
     */
    tree.nodeSize = function (x: any) {
        return arguments.length
            ? ((nodeSize = true), (dx = +x[0]), (dy = +x[1]), tree)
            : nodeSize
            ? [dx, dy]
            : null
    }

    return tree
}
