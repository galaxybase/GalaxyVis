import { PlainObject, tNode } from "../../hierarchy/tclass";

/**
 * 圆形树状布局
 * @param assign 
 * @param _nodes 
 * @param _links 
 * @param options 
 * @returns 
 */
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

        let layoutNodes: PlainObject<any> = {}
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
            var neighbers = initNodeNeighbers(node); // 计算该点的邻点
            nodeNeighbers.push(neighbers);
            checkHasCycle(node, [])  // 判断环
        });
        buildTree() // 建树
        setRootPolars() // 设置根节点
    }

    function initNodeNeighbers(node: tNode) {
        var nodeNeighbers: any[] = [];
        var outLinks = node.outLinks || [];

        outLinks.forEach(function (link) {
            var target = link.target;
            var source = link.source;

            if (source && target && source.id != target.id && source.visible && target.visible) {

                var index = nodeIds.indexOf(target.id);
                var childNodes = nodeNeighbers[index] || [];

                var childNodeIds: string[] = [];
                childNodes.length && childNodes.forEach(function (n: tNode) {
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
    // 建树
    function buildTree() {
        var roots = getRoots();
        if (roots.length > 0) {
            // 计算
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
    // 设置根节点
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
    // 获取根节点
    function getRoots() {
        var roots: any = [];
        nodes.forEach(function (node: tNode) {
            if ((node.inLinks || []).length == 0) {
                roots.push(node);
            }
        });
        return roots;
    }
    // 获取中心
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
    // 获取父节点
    function getParent(node: tNode) {
        var inLinks = node.inLinks || [];
        if (inLinks.length > 0) {
            return inLinks[0].source;
        }
        return null;
    }
    // 计算根节点坐标
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
    // 计算节点坐标
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
        let newOutLinks: PlainObject<tNode>[] = [];
        (node.outLinks || []).forEach(function (_link: any) {
            var target = _link.target;
            if (node.id == target.id || pathNodes.indexOf(target.id) != -1) {
                // hasCycle = true;
                console.warn("balloon can't have rings");
                // return;
            } else {
                newOutLinks.push(_link);
                pathNodes.push(target.id);
                checkHasCycle(target, pathNodes);
            }
        });
        node.outLinks = newOutLinks;
    }
}

var balloonLayout = genericBalloonLayout.bind(null, false)

export default balloonLayout
