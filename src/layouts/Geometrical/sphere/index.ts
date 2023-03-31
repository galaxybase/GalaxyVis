import { PlainObject, tNode } from "../../hierarchy/tclass";

function genericSphereLayout(assign: any, _nodes: any, options: any) {
    var nodes = _nodes;
    var radius = options?.radius || 500;
    var boolTransition = true;
    var intSteps = 30;
    var tickNum = options?.tickNum || 1;

    var nodeCount = nodes.length;
    var area = 0;
    nodes.forEach(function (n: tNode, i: number) {
        var phi = Math.acos(-1 + (2 * i) / nodeCount);
        var theta = Math.sqrt(nodeCount * Math.PI) * phi;

        var sinPhiRadius = Math.sin(phi) * radius;

        var tempX = sinPhiRadius * Math.sin(theta);
        var tempY = Math.cos(phi) * radius;

        var posData = newLayoutData();
        posData.finishx = tempX;
        posData.finishy = tempY;
        posData.xdistance = (1.0 / intSteps) * (tempX - n.x);
        posData.ydistance = (1.0 / intSteps) * (tempY - n.y);
        n.layoutData = posData;
    });

    for (let tick = 0; tick < tickNum; tick++) {

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
    }


    let layoutNodes: PlainObject<any> = {}
    for (let i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        layoutNodes[n.key] = {
            x: n.x * 50,
            y: n.y * 50,
            id: n.key
        }
    }

    return layoutNodes;
}

function newLayoutData() {
    return {
        finishx: 0.0,
        finishy: 0.0,
        xdistance: 0.0,
        ydistance: 0.0
    };
}

var sphereLayout = genericSphereLayout.bind(null, false)

export default sphereLayout
