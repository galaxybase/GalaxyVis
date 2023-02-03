import { tNode } from "../../hierarchy/tclass";

function genericGatherLayout(assign: any, _nodes: any, _links: any, options: any) {
    var nodes = _nodes;
    var links = _links;

    var SPEED_DIVISOR = 800;
    var AREA_MULTIPLICATOR = 100000;
    var area = options?.area || 3;
    var speed = options?.speed || 5;
    var tickNum = options?.tickNum || 150;

    nodes.forEach(function (n: tNode) {
        n.layoutData = newLayoutData();
    });

    var maxDisplace = (Math.sqrt(AREA_MULTIPLICATOR * area) / 10);
    var k = Math.sqrt((AREA_MULTIPLICATOR * area) / (1 + nodes.length));

    for (let i = 0; i < tickNum; i++) {
        nodes.forEach(function (N1: tNode, i: number) {
            nodes.forEach(function (N2: tNode, j: number) {
                if (i != j) {
                    var xDist = N1.x - N2.x;
                    var yDist = N1.y - N2.y;
                    var dist = Math.sqrt(xDist * xDist + yDist * yDist);

                    if (dist > 0) {
                        var repulsiveF = k * k / dist;
                        var layoutData = N1.layoutData;

                        layoutData.dx += (xDist / dist * repulsiveF * 0.01);
                        layoutData.dy += (yDist / dist * repulsiveF * 0.01);
                    }
                }
            });
        });

        links.forEach(function(E: any) {
            var Nf = E.source;
            var Nt = E.target;
    
            var xDist = Nf.x - Nt.x;
            var yDist = Nf.y - Nt.y;
    
            var dist = Math.sqrt(xDist * xDist + yDist * yDist);
            var attractiveF = dist * dist / k;
    
            if (dist > 0) {
                var sourceLayoutData = Nf.layoutData;
                var targetLayoutData = Nt.layoutData;
    
                sourceLayoutData.dx -= (xDist / dist * attractiveF);
                sourceLayoutData.dy -= (yDist / dist * attractiveF);
                targetLayoutData.dx += (xDist / dist * attractiveF);
                targetLayoutData.dy += (yDist / dist * attractiveF);
            }
        });

        nodes.forEach(function (N1: tNode, i: number) {
            nodes.forEach(function (N2: tNode, j: number) {
                if (i != j && N1.cluster == N2.cluster) {
    
                    var xDist = N1.x - N2.x;
                    var yDist = N1.y - N2.y;
                    var dist = Math.sqrt(xDist * xDist + yDist * yDist);
    
                    if (dist > 0) {
                        var attractiveF = dist * dist / k;
                        var sourceLayoutData = N1.layoutData;
                        var targetLayoutData = N2.layoutData;
    
                        sourceLayoutData.dx -= xDist / dist * attractiveF;
                        sourceLayoutData.dy -= yDist / dist * attractiveF;
                        targetLayoutData.dx += xDist / dist * attractiveF;
                        targetLayoutData.dy += yDist / dist * attractiveF;
                    }
                }
            });
        });

        nodes.forEach(function(node: tNode) {
            node.layoutData.dx *= speed / SPEED_DIVISOR;
            node.layoutData.dy *= speed / SPEED_DIVISOR;
    
            var layoutData = node.layoutData;
            var xDist = layoutData.dx;
            var yDist = layoutData.dy;
            var dist = Math.sqrt(layoutData.dx * layoutData.dx + layoutData.dy * layoutData.dy);
            if (dist > 0) {
                var limitedDist = Math.min(maxDisplace * (speed / SPEED_DIVISOR), dist);
                node.x = (node.x + xDist / dist * limitedDist);
                node.y = (node.y + yDist / dist * limitedDist);
            }
        });
    }

    let layoutNodes: { [key: string]: any } = {}
    for (let i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        layoutNodes[n.id] = {
            x: n.x * 10,
            y: n.y * 10,
            id: n.id
        }
    }
    return layoutNodes;
}


function newLayoutData() {
    return {
        dx: 0.0,
        dy: 0.0
    };
};

var gatherTypeLayout = genericGatherLayout.bind(null, false)

export default gatherTypeLayout
