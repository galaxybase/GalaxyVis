export function BFSTree(nodes: any, lis: any, edges: any, allNodes?: any) {
    nodes = nodes.constructor === Array ? nodes : [nodes]
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i]

        for (let link of edges) {
            node.children = node.children ? node.children : []
            // 跳过自环边 或已使用的边
            if (link.source.index === link.target.index || link.used) continue
            // 为子集插入有哪些边数据
            if (link.source.index === node.index) {
                let index = link.target.index === node.index ? link.source : link.target
                if (lis.indexOf(link.target.index) === -1) {
                    lis.push(link.target.index)
                    let ans = allNodes.filter((item: any) => {
                        return item.id == index.id
                    })
                    node.children.push(ans[0])
                    link.used = true
                }
            }
        }

        if (lis.indexOf(node.index) != -1) {
            node.used = true
        }
        // 开始下一次BFS
        if (node.children?.length) {
            BFSTree(node.children, lis, edges, allNodes)
        }
    }
}

export const floorBfs = (node: any, edge: any, root: any) => {
    let st = -1,
        nodeIndex = -1
    let q = [],
        dep: any = new Array(node.length).fill(0),
        floor: any = [[]],
        level = []
    for (let i = 0; i < node.length; ++i)
        if (node[i].id == root) {
            st = i
            nodeIndex = node[i].index
            break
        }

    q.push(node[st])
    dep[nodeIndex] = 1
    floor[0] = [node[st].id]

    let u,
        index = 1,
        flag = false
    while (q.length) {
        u = q.pop()
        for (let i = 0, len = edge.length; i < len; i++) {
            // 跳过被使用的和自环边
            if (edge[i].used || edge[i].source.index === edge[i].target.index) continue

            if (edge[i].source.index == u.index || edge[i].target.index == u.index) {
                let floorNode: any =
                    edge[i].target.index === u.index ? edge[i].source : edge[i].target
                edge[i].used = true
                if (!floor[index]) floor[index] = []
                floor[index].push(floorNode.id)
                level.push(floorNode)
                dep[floorNode.index] = 1
                flag = true
            }
        }
        if (flag && !q.length) {
            index++
            q = level
            level = []
        }
    }

    for (let i = 0, len = node.length; i < len; i++) {
        if (dep[i] != 1) {
            if (!floor[index]) floor[index] = []
            let ans = node.filter((item: any) => {
                return item.index == i
            })

            floor[index].push(ans[0]?.id)
        }
    }

    return floor
}
