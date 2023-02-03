import { tNode } from "../../hierarchy/tclass";

function genericSpring2Layout(assign: any, _nodes: any, _links: any, options: any) {
    var nodes = _nodes;
    var links = _links;
    var stretch = options?.stretch || 0.01;
    var repulsion_range_sq = options?.repulsion || 1000000;
    var force_multiplier = options?.force || 150;
    var tickNum = options?.tickNum || 600;

    nodes.forEach(function (n: tNode) {
        n.layoutData = newLayoutData();
    });

    for (let i = 0; i < tickNum; i++) {
        nodes.forEach(function (n: tNode) {
            var svd = n.layoutData;
            svd.dx /= 4;
            svd.dy /= 4;
            svd.edgedx = svd.edgedy = 0;
            svd.repulsiondx = svd.repulsiondy = 0;
        });

        links.forEach(function (link: any) {

            var node1 = link.source;
            var node2 = link.target;

            var vx = node1.x - node2.x;
            var vy = node1.y - node2.y;

            var len = Math.sqrt(vx * vx + vy * vy);
            len = (len == 0) ? 0.0001 : len;

            var f = force_multiplier * (1 - len) / len;
            f = f * Math.pow(stretch, 2);

            var dx = f * vx;
            var dy = f * vy;

            var v1D = node1.layoutData;
            var v2D = node2.layoutData;
            v1D.edgedx += dx;
            v1D.edgedy += dy;
            v2D.edgedx += -dx;
            v2D.edgedy += -dy;
        });

        nodes.forEach(function (node: tNode) {
            var dx = 0,
                dy = 0;
            nodes.forEach(function (n: tNode) {
                if (node.id != n.id) {
                    var vx = node.x - n.x;
                    var vy = node.y - n.y;

                    var distanceSq = vx * vx + vy * vy;
                    if (distanceSq == 0) {
                        dx += Math.random();
                        dy += Math.random();
                    } else if (distanceSq < repulsion_range_sq) {
                        var factor = 1;
                        dx += factor * vx / distanceSq;
                        dy += factor * vy / distanceSq;
                    }
                }
            });

            var dlen = dx * dx + dy * dy;
            if (dlen > 0) {
                dlen = Math.sqrt(dlen) / Math.log(nodes.length + 1);
                var layoutData = node.layoutData;
                layoutData.repulsiondx += dx / dlen;
                layoutData.repulsiondy += dy / dlen;
            }
        });

        nodes.forEach(function(node: tNode) {
            var vd = node.layoutData;
    
            vd.dx += vd.repulsiondx + vd.edgedx;
            vd.dy += vd.repulsiondy + vd.edgedy;
    
            node.x += Math.max(-10, Math.min(10, vd.dx));
            node.y += Math.max(-10, Math.min(10, vd.dy));
        });
    }

    let layoutNodes: { [key: string]: any } = {}
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
        edgedx: 0.0,
        edgedy: 0.0,
        repulsiondx: 0.0,
        repulsiondy: 0.0,
        dx: 0.0,
        dy: 0.0
    };
};

var spring2Layout = genericSpring2Layout.bind(null, false)

export default spring2Layout
