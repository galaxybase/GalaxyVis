// 四叉树节点
class Node {
    public _bounds: any //一个节点的大小
    public children: any[] //子节点
    public nodes: any[] //当前节点下点个数
    public _classConstructor: any
    _maxChildren = 4 //最大子节点个数
    _maxDepth = 4 //最大深度
    _depth = 0 //当前升读
    TOP_LEFT = 0 //位置划分
    TOP_RIGHT = 1
    BOTTOM_LEFT = 2
    BOTTOM_RIGHT = 3
    constructor(bounds: any, depth: number, maxDepth: any, maxChildren: any) {
        this._bounds = bounds
        this.children = []
        this.nodes = []

        if (maxChildren) {
            this._maxChildren = maxChildren
        }

        if (maxDepth) {
            this._maxDepth = maxDepth
        }

        if (depth) {
            this._depth = depth
        }
        this._classConstructor = this
    }
    // 插入子节点
    public insert(item: any) {
        if (this.nodes.length) {
            // 决定当前节点的象限
            var index = this._findIndex(item)
            // 插入子节点
            this.nodes[index].insert(item)

            return
        }

        this.children.push(item)

        var len = this.children.length
        if (!(this._depth >= this._maxDepth) && len > this._maxChildren) {
            // 细分象限
            this.subdivide()

            var i
            for (i = 0; i < len; i++) {
                this.insert(this.children[i])
            }

            this.children.length = 0
        }
    }

    public retrieve(item: any) {
        if (this.nodes.length) {
            var index = this._findIndex(item)

            return this.nodes[index].retrieve(item)
        }

        return this.children
    }
    // 查找带节点属于哪个归属
    public _findIndex(item: { x: number; y: number }) {
        var b = this._bounds
        var left = item.x > b.x + b.width / 2 ? false : true
        var top = item.y > b.y + b.height / 2 ? false : true

        //top left
        var index = this.TOP_LEFT
        if (left) {
            //left side
            if (!top) {
                //bottom left
                index = this.BOTTOM_LEFT
            }
        } else {
            //right side
            if (top) {
                //top right
                index = this.TOP_RIGHT
            } else {
                //bottom right
                index = this.BOTTOM_RIGHT
            }
        }

        return index
    }
    // 细分点的位置大小深度
    public subdivide() {
        var depth = this._depth + 1

        var bx = this._bounds.x
        var by = this._bounds.y

        //floor the values
        var b_w_h = this._bounds.width / 2 //todo: Math.floor?
        var b_h_h = this._bounds.height / 2
        var bx_b_w_h = bx + b_w_h
        var by_b_h_h = by + b_h_h

        //top left
        this.nodes[this.TOP_LEFT] = new this._classConstructor(
            {
                x: bx,
                y: by,
                width: b_w_h,
                height: b_h_h,
            },
            depth,
            this._maxDepth,
            this._maxChildren,
        )

        //top right
        this.nodes[this.TOP_RIGHT] = new this._classConstructor(
            {
                x: bx_b_w_h,
                y: by,
                width: b_w_h,
                height: b_h_h,
            },
            depth,
            this._maxDepth,
            this._maxChildren,
        )

        //bottom left
        this.nodes[this.BOTTOM_LEFT] = new this._classConstructor(
            {
                x: bx,
                y: by_b_h_h,
                width: b_w_h,
                height: b_h_h,
            },
            depth,
            this._maxDepth,
            this._maxChildren,
        )

        //bottom right
        this.nodes[this.BOTTOM_RIGHT] = new this._classConstructor(
            {
                x: bx_b_w_h,
                y: by_b_h_h,
                width: b_w_h,
                height: b_h_h,
            },
            depth,
            this._maxDepth,
            this._maxChildren,
        )
    }
    // 清除子节点
    public clear() {
        this.children.length = 0

        var len = this.nodes.length

        var i
        for (i = 0; i < len; i++) {
            this.nodes[i].clear()
        }

        this.nodes.length = 0
    }
}
// 四叉树检点碰撞盒
class BoundsNode extends Node {
    _stuckChildren: any[] = []
    _out: any[] = []
    constructor(bounds: any, depth: number, maxChildren: any, maxDepth: any) {
        super(bounds, depth, maxChildren, maxDepth)
        this._classConstructor = BoundsNode
    }
    public insert(item: any) {
        if (this.nodes.length) {
            var index = this._findIndex(item)
            var node = this.nodes[index]
            // 分裂起源于节点可以插入任何对象，这个对象只要符合子节点都可以被加入。
            if (
                item.x >= node._bounds.x &&
                item.x + item.width <= node._bounds.x + node._bounds.width &&
                item.y >= node._bounds.y &&
                item.y + item.height <= node._bounds.y + node._bounds.height
            ) {
                this.nodes[index].insert(item)
            } else {
                this._stuckChildren.push(item)
            }

            return
        }

        this.children.push(item)

        var len = this.children.length

        if (!(this._depth >= this._maxDepth) && len > this._maxChildren) {
            this.subdivide()

            var i
            for (i = 0; i < len; i++) {
                this.insert(this.children[i])
            }

            this.children.length = 0
        }
    }

    public getChildren() {
        return this.children.concat(this._stuckChildren)
    }

    public retrieve(item: any) {
        var out = this._out
        out.length = 0
        if (this.nodes.length) {
            var index = this._findIndex(item)
            var node = this.nodes[index]

            if (
                item.x >= node._bounds.x &&
                item.x + item.width <= node._bounds.x + node._bounds.width &&
                item.y >= node._bounds.y &&
                item.y + item.height <= node._bounds.y + node._bounds.height
            ) {
                out = out.concat(this.nodes[index].retrieve(item))
            } else {
                //该项的一部分是重叠的多个子节点。对于每个重叠节点，重新搜索所有包含的对象。
                if (item.x <= this.nodes[this.TOP_RIGHT]._bounds.x) {
                    if (item.y <= this.nodes[this.BOTTOM_LEFT]._bounds.y) {
                        out = out.concat(this.nodes[this.TOP_LEFT].getAllContent())
                    }

                    if (item.y + item.height > this.nodes[this.BOTTOM_LEFT]._bounds.y) {
                        out = out.concat(this.nodes[this.BOTTOM_LEFT].getAllContent())
                    }
                }

                if (item.x + item.width > this.nodes[this.TOP_RIGHT]._bounds.x) {
                    if (item.y <= this.nodes[this.BOTTOM_RIGHT]._bounds.y) {
                        out = out.concat(this.nodes[this.TOP_RIGHT].getAllContent())
                    }

                    if (item.y + item.height > this.nodes[this.BOTTOM_RIGHT]._bounds.y) {
                        out = out.concat(this.nodes[this.BOTTOM_RIGHT].getAllContent())
                    }
                }
            }
        }
        out = out.concat(this._stuckChildren)
        out = out.concat(this.children)

        return out
    }

    public getAllContent() {
        var out = this._out
        if (this.nodes.length) {
            var i
            for (i = 0; i < this.nodes.length; i++) {
                this.nodes[i] && this.nodes[i].getAllContent()
            }
        }
        out = out.concat(this._stuckChildren)
        out = out.concat(this.children)
        return out
    }

    public clear() {
        this._stuckChildren.length = 0

        this.children.length = 0

        var len = this.nodes.length

        if (!len) {
            return
        }

        var i
        for (i = 0; i < len; i++) {
            this.nodes[i]?.clear()
        }

        this.nodes.length = 0
    }
}

export class QuadTree {
    public root: any
    /**
     * @class QuadTree
     * @constructor
     * @param {Object} bounds
     * @param {Boolean} pointQuad
     * @param {Number} maxDepth
     * @param {Number} maxChildren
     **/
    constructor(bounds: any, pointQuad: any, maxDepth: any, maxChildren: any) {
        var node
        if (pointQuad) {
            node = new Node(bounds, 0, maxDepth, maxChildren)
        } else {
            node = new BoundsNode(bounds, 0, maxDepth, maxChildren)
        }

        this.root = node
    }
    /**
     * @method insert
     * @param {Object|Array} item
     **/
    public insert(item: string | any[]) {
        if (item instanceof Array) {
            var len = item.length

            var i
            for (i = 0; i < len; i++) {
                this.root.insert(item[i])
            }
        } else {
            this.root.insert(item)
        }
    }
    /**
     * @method clear
     **/
    public clear() {
        this.root.clear()
    }
    /**
     * @method retrieve
     * @param {Object} item
     **/
    retrieve(item: any) {
        var out = this.root.retrieve(item).slice(0)
        return out
    }
}
