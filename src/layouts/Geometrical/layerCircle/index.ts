import { PlainObject } from "../../hierarchy/tclass";

let outCircleNodes = 11;
let layerDistance = 30;
let boolTransition = true;
let intSteps = 50;
let inited = false;

/**
 * 多圆环布局
 * @param assign 
 * @param nodes 
 * @param options 
 */
function genericLayerCircleLayout(assign: any, nodes: any, options: any) {
    outCircleNodes = options?.outCircleNodes || 11; // 外圆点个数
    layerDistance = options?.layerDistance || 30; // 层级之间距离
    var nodeCount = nodes.length;
    var innerCircleradius = 0,
        nextLayerRoundLong = 0,
        currentRoundLong = 0;
    var maxTheta = 0,
        theta = 0;

    nodes = nodes.sort(function (n1: { inLinks: any; outLinks: any; }, n2: { inLinks: any; outLinks: any; }) {
        var x = (n1.inLinks || []).length + (n1.outLinks || []).length;
        var y = (n2.inLinks || []).length + (n2.outLinks || []).length;
        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        } else {
            return 0;
        }
    });
    if (outCircleNodes > nodeCount) {
        outCircleNodes = 0;
    }
    var nextLayerNoderadius = 0, nextCircleradius = 0

    for (var i = 0; i < nodeCount; i++) {
        var node = nodes[i];
        currentRoundLong += node.radius * node.scaleX;

        if (currentRoundLong > nextLayerRoundLong) {
            nextLayerNoderadius = node.radius * node.scaleX;

            nextCircleradius = innerCircleradius + layerDistance + nextLayerNoderadius;
            nextLayerRoundLong = 2 * Math.PI * nextCircleradius;
            innerCircleradius = innerCircleradius + layerDistance + node.radius * node.scaleX;
            theta = 1.0 / nextCircleradius;
            maxTheta = 0;
            currentRoundLong = node.radius * node.scaleX;
        }
        var thisAngle = 0;
        if (i < (nodeCount - outCircleNodes)) {
            thisAngle = theta * node.radius * node.scaleX;
        } else {
            nextCircleradius = innerCircleradius + layerDistance + nextLayerNoderadius;
            thisAngle = 2 * Math.PI / outCircleNodes;
        }
        maxTheta += thisAngle;

        var posData = newLayoutData();
        posData.finishx = nextCircleradius * 2.4 * Math.cos(maxTheta + Math.PI);
        posData.finishy = nextCircleradius * 2.4 * Math.sin(maxTheta + Math.PI);
        posData.xdistance = (1.0 / intSteps) * (posData.finishx - node.x);
        posData.ydistance = (1.0 / intSteps) * (posData.finishy - node.y);
        node.layoutData = posData;
    }
    inited = true;

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
        layoutNodes[n.key] = {
            x: n.x * 223,
            y: n.y * 223,
            id: n.key
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

var layerCircleLayout = genericLayerCircleLayout.bind(null, false)

export default layerCircleLayout
