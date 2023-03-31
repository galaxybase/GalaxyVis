import { PlainObject, tNode } from "../../hierarchy/tclass";

function genericFRLayout(assign: any, _nodes: any, _links: any, options: any) {
    var nodes = _nodes;
    var links = _links;

    var AREA_MULTIPLICATOR = 100000;
    var area = options?.area || 1500;
    var gravity = options?.gravity || 0.5;
    var SPEED_DIVISOR = 800.0;
    var speed = 100;
    var tickNum = options?.tickNum || 150
    area = nodes.length / 2;

    nodes.forEach(function (n: tNode) {
        n.layoutData = newLayoutData();
    });

    for (let i = 0; i < tickNum; i++) {
        var nodeCount = nodes.length;

        var maxDisplace = Math.sqrt(AREA_MULTIPLICATOR * area) / 10;

        var k = Math.sqrt((AREA_MULTIPLICATOR * area) / (1.0 + nodeCount));

        nodes.forEach((N1: tNode, i: number) => {
            N1.layoutData.dx = 0;
            N1.layoutData.dy = 0;
            nodes.forEach((N2: tNode, j: number) => {
                if (i != j) {
                    var xDist = N1.x - N2.x;
                    var yDist = N1.y - N2.y;
                    var dist = Math.sqrt(xDist * xDist + yDist * yDist);

                    if (dist > 0) {
                        var repulsiveF = k * k / dist;
                        var layoutData = N1.layoutData;

                        layoutData.dx += (xDist / dist * repulsiveF);
                        layoutData.dy += (yDist / dist * repulsiveF);
                    }
                }
            });
        });

        var links = links;
        links.forEach(function (E: any) {
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

        nodes.forEach(function (n: tNode) {

            var layoutData = n.layoutData;

            var d = Math.sqrt(n.x * n.x + n.y * n.y);
            var gf = 0.01 * k * gravity * d;

            layoutData.dx -= gf * n.x / d;
            layoutData.dy -= gf * n.y / d;

            layoutData.dx *= speed / SPEED_DIVISOR;
            layoutData.dy *= speed / SPEED_DIVISOR;

            var dist = Math.sqrt(layoutData.dx * layoutData.dx + layoutData.dy * layoutData.dy);

            if (dist > 0) {
                var limitedDist = Math.min(maxDisplace * (speed / SPEED_DIVISOR), dist);

                n.x += (layoutData.dx / dist * limitedDist);
                n.y += (layoutData.dy / dist * limitedDist);
            }
        });
    }

    let layoutNodes: PlainObject<any> = {}
    for (let i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        layoutNodes[n.id] = {
            x: n.x,
            y: n.y,
            id: n.id
        }
    }
    return layoutNodes;
}

function newLayoutData() {
    return {
        dx: 0.0,
        dy: 0.0,
        old_dx: 0.0,
        old_dy: 0.0,
        freeze: 0.0
    };
};

var FRLayout = genericFRLayout.bind(null, false)

export default FRLayout
