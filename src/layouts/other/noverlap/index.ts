
// @ts-nocheck
var noverlapLayout: any = function(nodes, options) {
    this.nodes = nodes;
    this.maxMove = options?.maxMove || 10;
    this.maxIterations = options?.tickNum || 10;
    this.runFlag = false;
};

noverlapLayout.prototype.runLayout = function() {
    this.goAlgo();
    let nodes = this.nodes
    let layoutNodes: { [key: string]: any } = {}
    for (let i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        layoutNodes[n.id] = {
            x: n.x,
            y: n.y,
            id: n.id
        }
    }
    return layoutNodes;
};

noverlapLayout.prototype.initAlgo = function() {
    this.maxMove = 5;
    this.runFlag = true;
};

noverlapLayout.prototype.goAlgo = function() {
    if (this.runFlag) {
        var totalMove = this.removeOverlaps();
        if (totalMove < 1) {
            this.runFlag = false;
        }
    }
};

noverlapLayout.prototype.removeOverlaps = function() {
    var self = this;
    var positions = self.nodes;
    var tree = self.createTree();
    tree.init(positions.reduce(toFlatArray, []));
    var currentNode, totalMovement = 0;
    for (var i = 0; i < self.maxIterations; ++i) {
        totalMovement = 0;
        for (var index = 0; index < positions.length; index++) {
            currentNode = positions[index];
            tree.visit(visitTreeNode);
        }
        if (totalMovement < self.maxMove) break;
    }
    return totalMovement;

    function visitTreeNode(node) {
        var bounds = node.bounds;
        var nodePoints = node.items;
        if (nodePoints) {
            nodePoints.forEach(moveIfNeeded);
        } else {
            var closestX = clamp(currentNode.x, bounds.left(), bounds.x + bounds.half);
            var closestY = clamp(currentNode.y, bounds.top(), bounds.y + bounds.half);
            var distanceX = currentNode.x - closestX;
            var distanceY = currentNode.y - closestY;
            var distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
            return distanceSquared < (currentNode.radius * currentNode.radius * currentNode.scaleX);
        }
    };

    function clamp(v, min, max) {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    };

    function moveIfNeeded(nodeIndex) {
        var otherNode = positions[nodeIndex / 2];
        if (otherNode == currentNode) return;

        var dx = currentNode.x - otherNode.x;
        var dy = currentNode.y - otherNode.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var totalRadius = (otherNode.radius * otherNode.scaleX) + (currentNode.radius * currentNode.scaleX);

        if (totalRadius <= distance) return;
        if (distance <= 0) {
            return;
        }

        var offset = (distance - totalRadius) / distance * 0.1;
        var mx = dx * offset;
        var my = dy * offset;

        currentNode.x -= mx;
        currentNode.y -= my;

        otherNode.x += mx;
        otherNode.y += my;

        totalMovement += Math.abs(mx) + Math.abs(my);
    };

    function toFlatArray(prevValue, currentValue) {
        prevValue.push(currentValue.x, currentValue.y);
        return prevValue;
    };
};

noverlapLayout.prototype.createTree = function() {
    var queryBounds = new Bounds();
    var root;
    var originalArray;
    var api = {
        init: init,
        bounds: getBounds,
        pointsAround: getPointsAround,
        visit: visit
    };
    return api;

    function visit(cb) {
        return root.visit(cb);
    };

    function getPointsAround(x, y, half, intersectCheck) {
        if (typeof intersectCheck !== 'function') {
            intersectCheck = rectangularCheck;
        }
        var indices = [];
        queryBounds.x = x;
        queryBounds.y = y;
        queryBounds.half = half;
        root.query(queryBounds, indices, originalArray, intersectCheck);
        return indices;
    };

    function init(points) {
        if (!points) throw new Error('Points array is required for quadtree to work');
        if (typeof points.length !== 'number') throw new Error('Points should be array-like object');
        if (points.length % 2 !== 0) throw new Error(
            'Points array should consist of series of x,y coordinates and be multiple of 2');
        originalArray = points;
        root = createRootNode(points);
        for (var i = 0; i < points.length; i += 2) {
            root.insert(i, originalArray);
        }
    };

    function getBounds() {
        if (!root) return EmptyRegion;
        return root.bounds;
    };

    function createRootNode(points) {
        if (points.length === 0) {
            var empty = new Bounds();
            return new TreeNode(empty);
        }
        var minX = Number.POSITIVE_INFINITY;
        var minY = Number.POSITIVE_INFINITY;
        var maxX = Number.NEGATIVE_INFINITY;
        var maxY = Number.NEGATIVE_INFINITY;
        for (var i = 0; i < points.length; i += 2) {
            var x = points[i],
                y = points[i + 1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        var side = Math.max(maxX - minX, maxY - minY);
        side += 2;
        minX -= 1;
        minY -= 1;
        var half = side / 2;

        var bounds = new Bounds(minX + half, minY + half, half);
        return new TreeNode(bounds);
    };

    function Bounds(x, y, half) {
        this.x = typeof x === 'number' ? x : 0;
        this.y = typeof y === 'number' ? y : 0;
        this.half = typeof half === 'number' ? half : 0;
        this.left = function() {
            return this.x - this.half;
        };
        this.top = function() {
            return this.y - this.half;
        };
        this.width = function() {
            return this.half * 2;
        };
        this.height = function() {
            return this.half * 2;
        };
        this.centerX = function() {
            return this.x;
        };
        this.centerY = function() {
            return this.y;
        };
        this.contains = function(x, y) {
            var half = this.half;
            return this.x - half <= x && x < this.x + half &&
                this.y - half <= y && y < this.y + half;
        };
    };

    function TreeNode(bounds) {
        this.bounds = bounds;
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
        this.items = null;

        this.subdivide = function() {
            var bounds = this.bounds;
            var quarter = bounds.half / 2;
            this.nw = new TreeNode(new Bounds(bounds.x - quarter, bounds.y - quarter, quarter));
            this.ne = new TreeNode(new Bounds(bounds.x + quarter, bounds.y - quarter, quarter));
            this.sw = new TreeNode(new Bounds(bounds.x - quarter, bounds.y + quarter, quarter));
            this.se = new TreeNode(new Bounds(bounds.x + quarter, bounds.y + quarter, quarter));
        };

        this.insert = function(idx, array) {
            var isLeaf = this.nw === null;
            if (isLeaf) {
                if (this.items === null) {
                    this.items = [idx];
                } else {
                    this.items.push(idx);
                }
                if (this.items.length >= 4) {
                    this.subdivide();
                    for (var i = 0; i < this.items.length; ++i) {
                        this.insert(this.items[i], array);
                    }
                    this.items = null;
                }
            } else {
                var x = array[idx],
                    y = array[idx + 1];
                var bounds = this.bounds;
                var quadIdx = 0;
                if (x > bounds.x) {
                    quadIdx += 1;
                }
                if (y > bounds.y) {
                    quadIdx += 2;
                }
                var child = getChild(this, quadIdx);
                child.insert(idx, array);
            }
        };

        this.visit = function(cb) {
            if (cb(this) && this.nw) {
                this.nw.visit(cb);
                this.ne.visit(cb);
                this.sw.visit(cb);
                this.se.visit(cb);
            }
        };

        this.query = function(bounds, results, sourceArray, intersects) {
            if (!intersects(this.bounds, bounds)) return;
            var items = this.items;
            if (items) {
                for (var i = 0; i < items.length; ++i) {
                    var idx = items[i];
                    var x = sourceArray[idx];
                    var y = sourceArray[idx + 1];
                    if (bounds.contains(x, y)) {
                        results.push(idx);
                    }
                }
            }
            if (!this.nw) return;
            this.nw.query(bounds, results, sourceArray, intersects);
            this.ne.query(bounds, results, sourceArray, intersects);
            this.sw.query(bounds, results, sourceArray, intersects);
            this.se.query(bounds, results, sourceArray, intersects);
        };

        function getChild(node, idx) {
            if (idx === 0) return node.nw;
            if (idx === 1) return node.ne;
            if (idx === 2) return node.sw;
            if (idx === 3) return node.se;
        };

        function intersects(a, b) {
            return a.x - a.half < b.x + b.half &&
                a.x + a.half > b.x - b.half &&
                a.y - a.half < b.y + b.half &&
                a.y + a.half > b.y - b.half;
        };
    };
};

export default noverlapLayout