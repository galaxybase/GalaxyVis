import { PlainObject } from "../../hierarchy/tclass";

let highdegreeoutside = false;
let secondarynodecount = 15;  // 核心数
let boolNoOverlap = true;
let boolTransition = true;
let TWO_PI = Math.PI * 2;
let intSteps = 50;
let positionSide = "inside";

function genericduailCircleLayout(assign: any, nodes: any, options: any) {
    positionSide = options.position || 'inside';
    secondarynodecount = options.secondarynodecount || 15;
    if (positionSide == 'inside') {
        highdegreeoutside = false;
    } else {
        highdegreeoutside = true;
    }

    var nodeCounts = nodes.length;
    var nodeCoords = [];
    var tmpsecondarycirc = 0,
        tmpprimarycirc = 0;
    var lasttheta = 0,
        secondary_theta = 0,
        correct_theta = 0;
    var primary_scale = 1,
        secondry_scale = 1;
    var primary_theta;

    if (secondarynodecount > nodeCounts) {
        secondarynodecount = 1;
    }

    nodes = nodes.sort(function (n1: { inLinks: any; outLinks: any; }, n2: { inLinks: any; outLinks: any; }) {
        var x = (n1.inLinks || []).length + (n1.outLinks || []).length;
        var y = (n2.inLinks || []).length + (n2.outLinks || []).length;
        if (x > y) {
            return -1;
        } else if (x < y) {
            return 1;
        } else {
            return 0;
        }
    });

    for (var i = 0; i < nodeCounts; i++) {
        var n = nodes[i];
        var noderadius = n.scaleX * n.radius;
        if (i < secondarynodecount) {
            tmpsecondarycirc += noderadius * 2.0;
        } else {
            tmpprimarycirc += noderadius * 2.0;
        }
    }

    var circum_ratio = tmpprimarycirc / tmpsecondarycirc;
    if (circum_ratio < 2) {
        primary_scale = 2 / circum_ratio;
        tmpprimarycirc = 2 * tmpsecondarycirc;
    }

    if (highdegreeoutside) {
        secondry_scale = (2 * tmpprimarycirc) / tmpsecondarycirc;
        tmpsecondarycirc = tmpprimarycirc * 2;
    } else {
        secondry_scale = tmpprimarycirc / (2 * tmpsecondarycirc);
        tmpsecondarycirc = tmpprimarycirc / 2;
    }

    tmpprimarycirc *= 1.2;
    primary_theta = TWO_PI / tmpprimarycirc;
    var primaryradius = tmpprimarycirc / Math.PI / 2;
    tmpsecondarycirc *= 1.2;
    secondary_theta = TWO_PI / tmpsecondarycirc;
    var secondaryradius = tmpsecondarycirc / Math.PI / 2;

    for (var i = 0; i < nodeCounts; i++) {
        var n = nodes[i];
        var noderadius = n.scaleX * n.radius;

        if (i < secondarynodecount) {
            if (secondry_scale > 2) {
                noderadius = tmpsecondarycirc / ((2 * secondarynodecount) * secondry_scale * 1.2);
            }
            var noderadian = secondary_theta * noderadius * 1.2 * secondry_scale;

            if (i == 0) {
                correct_theta = noderadian;
            }
            nodeCoords = cartCoors(secondaryradius, 1, (lasttheta + noderadian) - correct_theta);
            lasttheta += noderadius * 2 * secondary_theta * 1.2 * secondry_scale;
        } else {
            var noderadian = primary_theta * noderadius * 1.2 * primary_scale;
            if (i == secondarynodecount) {
                lasttheta = 0;
                correct_theta = noderadian;
            }
            nodeCoords = cartCoors(primaryradius, 1, (lasttheta + noderadian) - correct_theta);
            lasttheta += noderadius * 2 * primary_theta * 1.2 * primary_scale;
        }

        var posData = newLayoutData();
        posData.finishx = nodeCoords[0];
        posData.finishy = nodeCoords[1];
        posData.xdistance = (1.0 / intSteps) * (nodeCoords[0] - n.x);
        posData.ydistance = (1.0 / intSteps) * (nodeCoords[1] - n.y);

        n.layoutData = posData;
    }

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

function cartCoors(radius: number, whichInt: number, theta: number) {
    var coOrds = [];
    coOrds[0] = (radius * Math.cos(theta * whichInt + Math.PI / 2));
    coOrds[1] = (radius * Math.sin(theta * whichInt + Math.PI / 2));
    return coOrds;
};

var duailCircleLayout = genericduailCircleLayout.bind(null, false)

export default duailCircleLayout
