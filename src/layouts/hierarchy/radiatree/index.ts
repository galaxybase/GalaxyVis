import { PlainObject } from "../tclass";

let nodes: any = []
let links: any = []
let nodeIds: string[] = [];
let nodeNeighbers: any[][] = [];
let distX = 50;
let distY = 50;
let currentX = 0;
let currentY = 0;

let boolTransition = true;
let intSteps = 50;

let hasCycle = false;
let inited = false;

export const initRadiaTree = () => {
    nodes = []
    links = []
    nodeIds = [];
    nodeNeighbers = [];
    distX = 50;
    distY = 50;
    currentX = 0;
    currentY = 0;

    boolTransition = true;
    intSteps = 50;
    hasCycle = false;
    inited = false;
}
/**
 * 径向布局
 * @param assign 
 * @param nodeList 
 * @param linkList 
 * @param options 
 * @returns 
 */
function genericRadiaTreeLayout(assign: any, nodeList: any, linkList: any, options?: any) {
    nodes = nodeList;
    links = linkList;
    distX = options?.distX || 50;
    distY = options?.distY || 50;
    intSteps = options?.intSteps || 50;
    nodeIds = [];
    nodeNeighbers = [];
    nodes.forEach(function (node: any) {
        if(hasCycle){
            return
        }
        nodeIds.push(node.id);
        var neighbers = initNodeNeighbers(node);
        nodeNeighbers.push(neighbers);
        checkHasCycle(node, []);
    });

    if(hasCycle){
        return {}
    }

    buildTree();
    setRadialLocations();

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

    let layoutNodes: PlainObject<any> = {}
    for (let i = 0; i < length; i++) {
        var n = nodes[i];
        layoutNodes[n.id] = {
            x: n.x * 223,
            y: n.y * 223,
            id: n.id
        }
    }

    return layoutNodes;
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

function checkHasCycle(node: PlainObject<any>, pathNodes: any[]) {
    let newOutLinks: any[] = [];
    (node.outLinks || []).forEach(function (_link: any) {
        var target = _link.target;
        if (node.id == target.id || pathNodes.indexOf(target.id) != -1) {
            // hasCycle = true;
            console.warn("radialTree can't have rings");
            // return;
        }else{
            newOutLinks.push(_link);
            pathNodes.push(target.id);
            checkHasCycle(target, pathNodes);
        }
    });
    node.outLinks = newOutLinks;
};

function initNodeNeighbers(node: PlainObject<any>) {
    var initNeighbers: any[] = [];
    var outLinks = node.outLinks || [];
    outLinks.forEach(function (link: any) {
        var target = link.target;

        if (node.id != target.id && target.visible) {

            var index = nodeIds.indexOf(target.id);
            var childNodes = nodeNeighbers[index] || [];

            var childNodeIds: string[] = [];
            childNodes.forEach(function (n: PlainObject<any>) {
                childNodeIds.push(n.id);
            });

            if (childNodeIds.indexOf(node.id) == -1) {
                initNeighbers.push(target);
            }
        }
    });
    return initNeighbers;
};

function buildTree() {
    var roots = getRoots();
    if (roots.length > 0) {
        calculateRootsX(roots);
        roots.forEach(function (node) {
            calculateNodeX(node);
            currentX += node.sizeT / 2 + distX;
            buildNodeTree(node, currentX);
        });
    }
};

function getRoots() {
    var roots: any[] = [];
    nodes.forEach(function (node: PlainObject<any>) {
        if ((node.inLinks || []).length == 0) {
            roots.push(node);
        }
    });
    return roots;
};

function calculateRootsX(roots: any[]) {
    var size = 0;
    roots.forEach(function (node) {

        var childNodes = getSuccessors(node);
        var childrenNum = childNodes.length;

        if (childrenNum != 0) {
            childNodes.forEach(function (node) {
                size += calculateNodeX(node) + distX;
            });
        }
        size = Math.max(0, size - distX);
        node.sizeT = size;
    });
    return size;
};

function calculateNodeX(node: { [x: string]: any; sizeT?: any; }) {
    var size = 0;
    var childNodes = getSuccessors(node);

    if (childNodes.length != 0) {
        childNodes.forEach(function (_node) {
            size += calculateNodeX(_node) + distX;
        });
    }
    size = Math.max(0, size - distX);
    node.sizeT = size * 2;

    return size;
};

function buildNodeTree(node: PlainObject<any>, x: number) {
    currentY += distY;
    currentX = x;

    setCurrentPositionFor(node);

    var sizeXofCurrent = node.sizeT;

    var lastX = x - sizeXofCurrent / 2;

    var sizeXofChild;
    var startXofChild;

    var childNodes = getSuccessors(node);
    childNodes.forEach(function (n) {
        sizeXofChild = n.sizeT;
        startXofChild = lastX + sizeXofChild / 2;
        buildNodeTree(n, startXofChild);
        lastX = lastX + sizeXofChild + distX;
    });

    currentY -= distY;
};

function setCurrentPositionFor(node: PlainObject<any>) {
    var x = currentX;
    var y = currentY;
    node.tempx = x;
    node.tempy = y;
};

function getSuccessors(node: PlainObject<any>) {
    var index = nodeIds.indexOf(node.id);
    var childNodes = nodeNeighbers[index] || [];
    return childNodes;
};

function setRadialLocations() {
    var maxPoint = getMaxXY();
    var maxx = maxPoint.x;
    var maxy = maxPoint.y;
    var theta = 2 * Math.PI / maxx;
    var deltaRadius = maxx / 2 / maxy;

    nodes.forEach(function (node: PlainObject<any>) {
        var _theta = node.tempx * theta;
        var _radius = (node.tempy - distY) * deltaRadius || distX;
        var x = _radius * Math.cos(_theta);
        var y = _radius * Math.sin(_theta);
        var posData = newLayoutData();
        posData.finishx = x;
        posData.finishy = y;

        posData.xdistance = (1.0 / intSteps) * (x - node.x);
        posData.ydistance = (1.0 / intSteps) * (y - node.y);
        node.layoutData = posData;
    });

};

function getMaxXY() {
    var maxx = 0,
        maxy = 0;
    nodes.forEach(function (node: PlainObject<any>) {
        if (!node.tempx) {
            node.tempx = currentX;
        }
        if (!node.tempy) {
            node.tempy = currentY;
        }
        maxx = Math.max(maxx, node.tempx);
        maxy = Math.max(maxy, node.tempy);
    });
    return {
        x: maxx,
        y: maxy
    };
};

var radiatreeLayout = genericRadiaTreeLayout.bind(null, false)

export default radiatreeLayout