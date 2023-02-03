import { tNode } from "../tclass";

function genericTopoCircleLayout(assign: any, _nodes: any, options?: any) {
    var nodes = _nodes;
    var radius = options?.radius || 50
    var boolTransition = true;
    var intSteps = 50;
    var hasCycle = false;

    var roots = getRoot()
    if(hasCycle) return {}
    roots[0].tempX = roots[0].x = 0;
    roots[0].tempY = roots[0].y = 0;
    countRadius(roots[0], radius);

    layout(roots[0], radius * 3);
    if (!hasCycle) {
        var position = null;
        var length = nodes.length;
        for (var i = 0; i < length; i++) {
            var n = nodes[i];
            position = n.layoutData;
            if (position == null) {
                continue;
            }
            if (boolTransition) {
                var currentDistance = Math.abs(n.x - position.finishx);
                var nextDistance = Math.abs((n.x + position.xdistance) - position.finishx);
                if (nextDistance < currentDistance) {
                    n.x += position.xdistance;
                } else {
                    n.x = position.finishx;
                }

                currentDistance = Math.abs(n.y - position.finishy);
                nextDistance = Math.abs((n.y + position.ydistance) - position.finishy);
                if (nextDistance < currentDistance) {
                    n.y += position.ydistance;
                } else {
                    n.y = position.finishy;
                }

                if (n.x == position.finishx && n.y == position.finishy) {
                    n.layoutData = null;
                }
            } else {
                n.x = position.finishx;
                n.y = position.finishy;
                n.layoutData = null;
            }
        }

        let layoutNodes: { [key: string]: any } = {}
        for (let i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n.id != roots[0].id)
                layoutNodes[n.id] = {
                    x: n.x * 223,
                    y: n.y * 223,
                    id: n.id
                }
            else
                layoutNodes[n.id] = {
                    x: 0,
                    y: 0,
                    id: n.id
                }
        }
        return layoutNodes;
    } else {
        return {};
    }

    function countRadius(root: any, minR: number) {
        minR = (minR == null ? radius : minR);
        var children = getSuccessors(root);
        var size = children.length;
        if (size <= 1) {
            root.rdegree = 0;
            root.mradius = minR;
            root.totalRadius = minR;
        }

        children.forEach(function (child: any) {
            countRadius(child, minR);
        });

        if (size > 1) {
            var child0 = children[0];
            var totalRadius = child0.totalRadius;
            if (size == 2) {
                size = 3;
            }
            var degree = Math.PI / size;
            var pRadius = totalRadius / Math.sin(degree);
            root.mradius = pRadius;
            root.totalRadius = pRadius + totalRadius;
            root.rdegree = degree * 2;
        }
    };

    function layout(root: any, minR: number) {
        var children = getSuccessors(root);
        var degree = root.rdegree;
        var r = root.mradius;
        var rootPosition = {
            x: root.tempX,
            y: root.tempY
        };

        children.forEach(function (node, index) {
            var s = Math.sin(degree * index),
                c = Math.cos(degree * index),
                x = s * r,
                y = c * r;

            x = Math.round(x + rootPosition.x);
            y = Math.round(y + rootPosition.y);

            node.tempX = x;
            node.tempY = y;

            var posData = newLayoutData();
            posData.finishx = x;
            posData.finishy = y;
            posData.xdistance = (1.0 / intSteps) * (x - node.x);
            posData.ydistance = (1.0 / intSteps) * (y - node.y);
            node.layoutData = posData;

            layout(node, minR);
        });
    };

    function getRoot() {
        var roots: any[] = [];
        nodes.forEach(function (node: tNode) {
            if ((node.inLinks || []).length == 0) {
                roots.push(node);
            }
            checkHasCycle(node, []);
        });
        return roots;
    }

    function checkHasCycle(node: { [key: string]: any }, pathNodes: any[]) {
        (node.outLinks || []).forEach(function (_link: any) {
            var target = _link.target;
            if (node.id == target.id || pathNodes.indexOf(target.id) != -1) {
                hasCycle = true;
                console.warn("topo can't have rings")
                return;
            }
            pathNodes.push(target.id);
            checkHasCycle(target, pathNodes);
        });
    };

    function getSuccessors(node: tNode) {
        var children: any[] = [];
        if (!node) {
            return children;
        }
        (node.outLinks || []).forEach(function (l) {
            children.push(l.target);
        });
        return children;
    };
}

function newLayoutData() {
    var layoutData = {
        finishx: 0.0,
        finishy: 0.0,
        xdistance: 0.0,
        ydistance: 0.0
    };
    return layoutData;
}

var topoLayout = genericTopoCircleLayout.bind(null, false)

export default topoLayout