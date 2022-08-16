import dagre from 'dagre'

function genericDagrelLayout(assign: any, nodes: any, edges: any, options: any) {
    let {
        nodeSize,
        nodesep,
        ranksep,
        rankdir, //TB, BT, LR, RL
    } = options

    const g = new dagre.graphlib.Graph()

    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({
        rankdir: rankdir || 'TB',
        nodesep: nodesep || 50,
        ranksep: ranksep || 50,
    })

    nodes.forEach((node: any) => {
        const size = nodeSize || 40
        const verti = nodesep || 50
        const hori = ranksep || 50
        const width = size + 2 * hori
        const height = size + 2 * verti
        g.setNode(node.id, { width, height })
    })
    edges.forEach((edge: any) => {
        g.setEdge(edge.source.id, edge.target.id, {
            weight: 1,
        })
    })
    dagre.layout(g)

    let coord
    g.nodes().forEach((node: any) => {
        coord = g.node(node)
        const i = nodes.findIndex((it: any) => it.id === node)
        nodes[i].x = coord.x
        nodes[i].y = coord.y
    })

    return nodes
}

var dagrelLayout = genericDagrelLayout.bind(null, false)

export default dagrelLayout
