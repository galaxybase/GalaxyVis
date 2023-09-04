import { PlainObject, tNode } from "../../hierarchy/tclass";
/**
 * 力导向布局 Fruchterman Reingold (FR)
 * https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/force-directed.pdf
 * @param assign 
 * @param _nodes 
 * @param _links 
 * @param options 
 */
function genericFruchtermanReingoldLayoutLayout(assign: any, _nodes: any, _links: any, options: any) {
    var nodes = _nodes;
    var links = _links;
    var area = 1000;
    var gravity = options?.gravity || 0.5; // 重力
    var speed = options?.speed || 0.028; // 迭代速度
    var iterations = options?.tickNum || 300; // 迭代次数
    var maxDisplace = 10; //最大距离
    var mink = options?.k || 240; //最小库伦常数
    var currentIter = 0;
    var k = 120; //默认库伦常数
    var nodesCount = nodes.length;

    nodes.forEach(function (node: tNode) {
        node.fr_x = node.x;
        node.fr_y = node.y;
        node.fr = {
            dx: 0,
            dy: 0
        };
    });

    area = nodesCount * nodesCount;
    maxDisplace = area / 8;
    // 计算库伦常数
    k = Math.sqrt(area / (1 + nodesCount));

    if (maxDisplace < 300) {
        maxDisplace = 300
    }

    if (k < mink) {
        k = mink
    }

    while (currentIter++ < iterations) {
        var nodesCount = nodes.length;

        nodes.forEach((N1: tNode, i: number) => {
            nodes.forEach((N2: tNode, j: number) => {
                if (i != j) {
                    var xDist = N1.fr_x - N2.fr_x;
					var yDist = N1.fr_y - N2.fr_y;
					var dist = Math.sqrt(xDist * xDist + yDist * yDist) + 0.01;

					if (dist > 0) {
                        // 计算电荷与电荷之间的斥力
						var repulsiveF = k * k / dist;
						N1.fr.dx += xDist / dist * repulsiveF;
						N1.fr.dy += yDist / dist * repulsiveF;
					}
                }
            });
        });

        var edgesCount = links.length;

		for (var i = 0; i < edgesCount; i++) {
			var link = links[i];
			var nSource = link.source;
			var nTarget = link.target;

			var xDist = nSource.fr_x - nTarget.fr_x;
			var yDist = nSource.fr_y - nTarget.fr_y;
			var dist = Math.sqrt(xDist * xDist + yDist * yDist) + 0.01;
            // 计算电荷之间的引力
			var attractiveF = dist * dist / k;
			if (dist > 0) {
				nSource.fr.dx -= xDist / dist * attractiveF;
				nSource.fr.dy -= yDist / dist * attractiveF;
				nTarget.fr.dx += xDist / dist * attractiveF;
				nTarget.fr.dy += yDist / dist * attractiveF;
			}
		};
        // 防止越界
        for (var i = 0; i < nodesCount; i++) {
			var n = nodes[i];

			var d = Math.sqrt(n.fr_x * n.fr_x + n.fr_y * n.fr_y);
			var gf = 0.01 * k * gravity * d;
			n.fr.dx -= gf * n.fr_x / d;
			n.fr.dy -= gf * n.fr_y / d;

			n.fr.dx *= speed;
			n.fr.dy *= speed;

			if (!n.fixed) {
				var xDist: number = n.fr.dx;
				var yDist: number = n.fr.dy;
				dist = Math.sqrt(xDist * xDist + yDist * yDist);

				if (dist > 0) {
					var limitedDist = Math.min(maxDisplace * speed, dist);
					n.fr_x += xDist / dist * limitedDist;
					n.fr_y += yDist / dist * limitedDist;
				}
			}
		}

		for (var i = 0; i < nodesCount; i++) {
			nodes[i].x = nodes[i].fr_x;
			nodes[i].y = nodes[i].fr_y;
		}
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

var fruchtermanReingoldLayout = genericFruchtermanReingoldLayoutLayout.bind(null, false)

export default fruchtermanReingoldLayout
