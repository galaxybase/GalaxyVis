import { PlainObject } from "../../hierarchy/tclass";
import Vector2 from "./Vector2";
/**
 * 力道i像布局forceDircted
 * https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/force-directed.pdf
 * @param assign 
 * @param _nodes 
 * @param _links 
 * @param options 
 * @returns 
 */
function genericForceDirectedLayout(assign: any, _nodes: any, _links: any, options: any) {
    var nodes = _nodes;
    var links = _links;

    var attraction_multiplier = options?.attraction || 2;  //引力比重
    var repulsion_multiplier = options?.repulsion || 0.5;  //斥力比重
    var EPSILON = 1 / 100000;
    var attraction_constant = 1;
    var repulsion_constant = 1;
    var forceConstant = options?.force || 200; //force力大小
    var layout_iterations = 0;
    var max_iterations = 100000;
    var temperature = 0;
    var scalar = 10;

    var nodes_length = _nodes.length;
    var links_length = _links.length;

    var tickNum = options?.tickNum || 300

    init();

    function init() {
        temperature = 10.0;
        layout_iterations = 0;
        attraction_constant = attraction_multiplier * forceConstant;  //计算引力
        repulsion_constant = repulsion_multiplier * forceConstant; //计算斥力
    }

    while (temperature > (1 / 100000) && layout_iterations < tickNum) {
        var i, j, delta, delta_length, force, change;

        for (i = 0; i < nodes_length; i++) {
            var node_v = nodes[i];
            node_v.layout = node_v.layout || {};
            if (i === 0) {
                node_v.layout.offset = new Vector2();
            }

            node_v.layout.force = 0;
            node_v.layout.tmp_pos = node_v.layout.tmp_pos || new Vector2().setVector(node_v);

            for (j = i + 1; j < nodes_length; j++) {
                var node_u = nodes[j];
                if (i != j) {
                    node_u.layout = node_u.layout || {};

                    node_u.layout.tmp_pos = node_u.layout.tmp_pos || new Vector2().setVector(node_u);

                    delta = node_v.layout.tmp_pos.clone().sub(node_u.layout.tmp_pos);
                    delta_length = Math.max(EPSILON, Math.sqrt(delta.clone().multiply(delta).sum()));
                    // 电荷与电荷之间的斥力
                    force = (repulsion_constant * repulsion_constant) / delta_length;

                    node_v.layout.force += force;
                    node_u.layout.force += force;

                    if (i === 0) {
                        node_u.layout.offset = new Vector2();
                    }

                    change = delta.clone().multiply(new Vector2().setScalar(force / delta_length));
                    node_v.layout.offset.add(change);
                    node_u.layout.offset.sub(change);
                }
            }
        }

        for (i = 0; i < links_length; i++) {
            var link = links[i];
            delta = link.source.layout.tmp_pos.clone().sub(link.target.layout.tmp_pos);
            delta_length = Math.max(EPSILON, Math.sqrt(delta.clone().multiply(delta).sum()));
            // 电荷之间的引力
            force = (delta_length * delta_length) / attraction_constant;

            link.source.layout.force -= force;
            link.target.layout.force += force;

            change = delta.clone().multiply(new Vector2().setScalar(force / delta_length));
            link.target.layout.offset.add(change);
            link.source.layout.offset.sub(change);
        }
        // 防止位移量超出框架范围
        for (i = 0; i < nodes_length; i++) {
            var node = nodes[i];

            delta_length = Math.max(EPSILON, Math.sqrt(node.layout.offset.clone().multiply(node.layout.offset).sum()));
            node.layout.tmp_pos.add(node.layout.offset.clone().multiply(new Vector2().setScalar(Math.min(delta_length,
                temperature) / delta_length)));

            var tmpPosition = new Vector2(node.x, node.y, 0);
            tmpPosition.sub(node.layout.tmp_pos).divide(new Vector2().setScalar(scalar));

            node.x -= tmpPosition.x;
            node.y -= tmpPosition.y;
        }
        temperature *= (1 - (layout_iterations / max_iterations));
        layout_iterations++;
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

var forceDirectedLayout = genericForceDirectedLayout.bind(null, false)

export default forceDirectedLayout
