let radius = 50;
let margin = 0;
let boolTransition = true;
let intSteps = 50;
let inited = false
let nlines = 5

function genericHiveLayout(assign: any, nodes: any, options: any) {
    nlines = options?.nlines || 5;
    margin = options?.margin || 0;
    radius = options?.radius || 50;

    var nodeCount = 
        nodes.length > 25 ?
        Math.max(nodes.length * 6, 1200) * radius : 300 * radius;
    const nodes_segment = nodes.length / nlines;
    const segment = nodeCount - (margin + radius);
    const step = segment / nodes_segment;
    const angle = 2 * Math.PI / nlines;
    let j = 0;

    for (let i = 0; i < nodes.length; ++i) {
        var node = nodes[i];

        var x = nodeCount + (radius + step * (i - j * nodes_segment)) * Math.cos(angle * j + Math.PI / 2);
        var y = nodeCount + (radius + step * (i - j * nodes_segment)) * Math.sin(angle * j + Math.PI / 2);
        j = Math.floor(i / nodes_segment);

        var posData = newLayoutData();
        posData.finishx = x;
        posData.finishy = y;
        posData.xdistance = (1.0 / intSteps) * (x - node.x);
        posData.ydistance = (1.0 / intSteps) * (y - node.y);
        node.layoutData = posData;
    }
    inited = true;

    var layoutNodes:any = {}

    if (inited) {
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
                layoutNodes[n.key] = {
                    x: n.x,
                    y: n.y,
                    id: n.key
                }
			} else {
				n.x = position.finishx;
				n.y = position.finishy;
				n.layoutData = null;
                layoutNodes[n.key] = {
                    x: n.x,
                    y: n.y,
                    id: n.key
                }
			}
		}
        return layoutNodes
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

var hiveLayout = genericHiveLayout.bind(null, false)

export default hiveLayout
