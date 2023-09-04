import { PlainObject, tNode } from "../tclass";

let neighborAttraction = 3.0;
let attraction = 0.12;
let forceScale = 0.0;
let deltaT = 5.0;
let forceCutoff = 10.0;
let neighbers = {};
let tickNum = 100;
let nodes: any[] = [], links: any[] = []
/**
 * 球面布局
 * @param assign 
 * @param nodeList 
 * @param linkList 
 * @param options 
 */
function genericBFALayout(assign: any, nodeList: any, linkList: any, options: any) {

    nodes = nodeList, links = linkList;

    neighborAttraction = options?.neighborAttraction || 8.0; // 邻点引力
    attraction = options?.attraction || 0.12;   // 引力
    forceScale = options?.forceScale || 5.0;  // 力缩放系数
    tickNum = options?.tickNum || 100

    neighbers = {};
    nodes.forEach(function (n: tNode) {
        n.degree = (n.inLinks || []).length + (n.outLinks || []).length;
    });

    deltaT = 5.0;
    forceCutoff = 10.0;

    nodes.forEach(function (n: tNode) {
        var inLinks = n.inLinks || [];
        var outLinks = n.outLinks || [];
        n.degree = inLinks.length + outLinks.length;
    });

    for (let tick = 0; tick < tickNum; tick++) {
        var minX = Infinity,
            minY = Infinity;

        nodes.forEach(function (node: tNode) {
            var f = getForceforNode(node);
            var degree = node.degree;
            var deltaIndividual = degree <= 1 ? deltaT : deltaT / Math.pow(degree, 0.4);

            f = {
                x: f.x * deltaIndividual,
                y: f.y * deltaIndividual
            };

            node.x += f.x;
            node.y += f.y;

            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
        });

        nodes.forEach(function (node: tNode) {
            node.x += (100 - minX);
            node.y += (100 - minY);
        });
    }
    let width = options?.width || 800, height = options?.height || 800
    let layoutNodes: PlainObject<any> = {}
    for (let i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        layoutNodes[n.id] = {
            x: n.x * deltaT - width / 2,
            y: n.y * deltaT - height,
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

function getForceforNode(node: tNode) {
    var numNodes = nodes.length;
    var mDot = {
        x: 0,
        y: 0
    };

    if (node.x == 0 && node.y == 0) {
        return mDot;
    }

    nodes.forEach(function (n) {
        if (node.id != n.id && (n.x != 0 || n.y != 0)) {
            var tempX = n.x - node.x;
            var tempY = n.y - node.y;

            if (tempX == 0 && tempY == 0) {
                tempX = 50;
                tempY = 50;
            }
            var multiplier = 1.0;
            if (isAdjacent(node, n)) {
                multiplier = neighborAttraction;
            }
            multiplier = multiplier * (attraction / Math.sqrt(numNodes));

            mDot = {
                x: mDot.x + tempX * multiplier,
                y: mDot.y + tempY * multiplier
            };

            multiplier = 1.0 / Math.sqrt(tempX * tempX + tempY * tempY);
            mDot = {
                x: mDot.x - tempX * multiplier * forceScale,
                y: mDot.y - tempY * multiplier * forceScale
            };
        }
    });
    var dis = distance(0.0, 0.0, mDot.x, mDot.y);
    if (dis > forceCutoff) {
        var mult = forceCutoff / dis;
        mDot = {
            x: mDot.x * mult,
            y: mDot.y * mult
        }
    }
    return mDot;
};

function getDegree(node: tNode) {
    return (node.inLinks || []).length + (node.outLinks || []).length;
};

function isAdjacent(node: tNode, otherNode: any) {
    var neighbers: any[] = [];
    (node.inLinks || []).forEach(function (l) {
        neighbers.push(l.source);
    });
    (node.outLinks || []).forEach(function (l) {
        neighbers.push(l.target);
    });
    var flag = false;
    neighbers.forEach(function (n) {
        if (n.id == otherNode.id) {
            flag = true;
        }
    });
    return flag
};

function distance(px: number, py: number, x: number, y: number) {
    px -= x;
    py -= y;
    return Math.sqrt(px * px + py * py);
};


var bfaLayout = genericBFALayout.bind(null, false)

export default bfaLayout
