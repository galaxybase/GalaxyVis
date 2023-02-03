import { tNode } from "../../hierarchy/tclass";

function genericBalloonLayout(assign: any, _nodes: any, _links: any, options: any) {

    let nodes = _nodes;
    let links = _links;

    let nodeIds: string[] = [];
    let nodeNeighbers: any[][] = [];

    let distX = 50;
    let distY = 50;
    let currentX = 0;
    let currentY = 0;

    let radius = options?.radius || 1000;

    let boolTransition = true;
    let intSteps = 50;

    let hasCycle = false;

    init()

    if (hasCycle) {
        console.warn('Layout must not contain rings')
        return {}
    } else {
        var position = null;
        var length = nodes.length;

        for (let i = 0; i < length; i++) {
            var n = nodes[i];
            position = n.layoutData;

            if (position == null) continue;

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
            layoutNodes[n.id] = {
                x: n.x * 223,
                y: n.y * 223,
                id: n.id
            }
        }

        return layoutNodes;
    }


    function init() {
        nodeIds = []
        nodeNeighbers = []
        nodes.forEach((node: tNode) => {
            nodeIds.push(node.id)
            var neighbers = initNodeNeighbers(node);
            nodeNeighbers.push(neighbers);
            checkHasCycle(node, [])
        });
        buildTree()
        setRootPolars()
    }

    function initNodeNeighbers(node: tNode) {
        var nodeNeighbers: any[] = [];
        var outLinks = node.outLinks || [];

        outLinks.forEach(function (link) {
            var target = link.target;
            var source = link.source;

            if (source.id != target.id && source.visible && target.visible) {

                var index = nodeIds.indexOf(target.id);
                var childNodes = nodeNeighbers[index] || [];

                var childNodeIds: string[] = [];
                childNodes.forEach(function (n: tNode) {
                    childNodeIds.push(n.id);
                });

                if (childNodeIds.indexOf(node.id) == -1) {
                    nodeNeighbers.push(target);
                }
            }
        });
        return nodeNeighbers;
    }

    function newLayoutData() {
        return {
            finishx: 0,
            finishy: 0,
            xdistance: 0,
            ydistance: 0
        }
    }

    function buildTree() {
        var roots = getRoots();
        if (roots.length > 0) {
            calculateRootsX(roots);
            roots.forEach(function (node: tNode) {
                calculateNodeX(node);
                currentX += node.sizeT / 2 + distX;
                buildNodeTree(node, currentX);
            });
        }
    }

    function setRootPolars() {
        var roots = getRoots();
        var center = getBaseCenter();
        setPolars(roots, center, radius);
    }

    function setRootPolar(root: tNode) {
        root.x = 10;
        root.y = 10;
    }

    function setPolars(kids: any[], parentLocation: { x: number, y: number }, parentRadius: number) {
        var childCount = kids.length;
        if (childCount == 0) {
            return;
        }

        var angle = Math.max(0, Math.PI / 2 * (1 - 2.0 / childCount));
        var childRadius = parentRadius * Math.cos(angle) / (1 + Math.cos(angle));
        var radius = parentRadius - childRadius;

        var rand = Math.random();

        for (var i = 0; i < childCount; i++) {
            var node = kids[i];

            var theta = i * 2 * Math.PI / childCount + rand;

            var x = radius * Math.cos(theta);
            var y = radius * Math.sin(theta);

            x = x + parentLocation.x;
            y = y + parentLocation.y;

            var posData = newLayoutData();
            posData.finishx = x;
            posData.finishy = y;
            posData.xdistance = (1.0 / intSteps) * (x - node.x);
            posData.ydistance = (1.0 / intSteps) * (y - node.y);
            node.layoutData = posData;

            var p = {
                x: x,
                y: y
            };

            var childNodes = getSuccessors(node);
            setPolars(childNodes, p, childRadius);
        }
    }

    function getRoots() {
        var roots: any = [];
        nodes.forEach(function (node: tNode) {
            if ((node.inLinks || []).length == 0) {
                roots.push(node);
            }
        });
        return roots;
    }

    function getCenter(node: tNode) {
        var parent = getParent(node);
        if (parent == null) {
            return getBaseCenter();
        }
        return {
            x: parent.x,
            y: parent.y
        };
    }

    function getBaseCenter() {
        return {
            x: 0,
            y: 0
        };
    }

    function getParent(node: tNode) {
        var inLinks = node.inLinks || [];
        if (inLinks.length > 0) {
            return inLinks[0].source;
        }
        return null;
    }

    function calculateRootsX(roots: any[]) {
        var size = 0;
        roots.forEach(function (node) {
            var childNodes = getSuccessors(node);
            var childrenNum = childNodes.length;

            if (childrenNum != 0) {
                childNodes.forEach(function (node: tNode) {
                    size += calculateNodeX(node) + distX;
                });
            }
            size = Math.max(0, size - distX);
            node.sizeT = size;
        });
        return size;
    }

    function calculateNodeX(node: tNode) {
        var size = 0;
        var childNodes = getSuccessors(node);
        var childrenNum = childNodes.length;

        if (childrenNum != 0) {
            childNodes.forEach(function (node: tNode) {
                size += calculateNodeX(node) + distX;
            });
        }
        size = Math.max(0, size - distX);
        node.sizeT = size;
        return size;
    }

    function buildNodeTree(node: tNode, x: number) {
        currentY += distY;
        currentX = x;

        setCurrentPositionFor(node);

        var sizeXofCurrent = node.sizeT;
        var lastX = x - sizeXofCurrent / 2;
        var sizeXofChild;
        var startXofChild;

        var childNodes = getSuccessors(node);

        childNodes.forEach(function (n: tNode) {
            sizeXofChild = n.sizeT;
            startXofChild = lastX + sizeXofChild / 2;
            buildNodeTree(n, startXofChild);
            lastX = lastX + sizeXofChild + distX;
        });

        currentY -= distY;
    }

    function setCurrentPositionFor(node: tNode) {
        node.tempx = currentX;
        node.tempy = currentY;
    }

    function getSuccessors(node: tNode) {
        var index = nodeIds.indexOf(node.id);
        var childNodes = nodeNeighbers[index] || [];
        return childNodes;
    }

    function checkHasCycle(node: tNode, pathNodes: any) {
        (node.outLinks || []).forEach(function (_link) {
            var target = _link.target;
            if (node.id == target.id || pathNodes.indexOf(target.id) != -1) {
                hasCycle = true;
                console.warn("balloon can't have rings")
                return;
            }
            pathNodes.push(target.id);
            checkHasCycle(target, pathNodes);
        });
    }
}

var balloonLayout = genericBalloonLayout.bind(null, false)

export default balloonLayout
