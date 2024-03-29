import clone from 'lodash/clone'
import { basicData } from "../../initial/globalProp"

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
    // 防止出现空层
    let floors:any = []
    for (let i = 0; i < floor.length; i++) {
        if (floor[i]) {
            floors.push(floor[i])
        }
    }

    return floors
}


export const comboBfs = (
    graphId: string,
    nodesBak: any[],
    listConcen: any[],
    relationTable: { [key: string]: Set<any> }
) => {

    let branches = new Set(nodesBak.map((item) => {
        return item.id
    }))

    let usedEdge = new Set()

    let finsh = 0, len = listConcen.length;

    for (let i = 0; i < len; i++) {
        for (let j = 0, arrLen = listConcen[i].length; j < arrLen; j++) {
            let item = listConcen[i][j]
            listConcen[i][j] = {
                id: item,
                parent: item
            }
        }
    }

    let combos = clone(listConcen)

    while (finsh != len) {
        finsh = 0;
        for (let i = 0; i < len; i++) {
            // 该层的点
            let level = listConcen[i]
            let newConcen: any[] = []
            // 扩展该点的一度关系，并把它职位同一个combo中
            for (let j = 0, arrLen = level.length; j < arrLen; j++) {
                let Edges = relationTable[level[j].id]
                Edges && Edges.forEach((item: any) => {
                    if (!usedEdge.has(item)) {

                        let edge = basicData[graphId].edgeList.get(item)
                        let edgeValue = edge.value
                        let source = edgeValue.source
                        let target = edgeValue.target

                        if (source == level[j].id && !branches.has(target)) {
                            usedEdge.add(item)
                            newConcen.push({ id: target, parent: level[j].parent })
                            branches.add(target)
                        }

                        if (target == level[j].id && !branches.has(source)) {
                            usedEdge.add(item)
                            newConcen.push({ id: source, parent: level[j].parent })
                            branches.add(source)
                        }
                    }
                })

            }
            if (newConcen.length == 0) finsh += 1;
            combos[i] = [...combos[i], ...newConcen]
            listConcen[i] = newConcen
        }
    }

    let combosMap = new Map()
    // 整合数据
    for (let i = 0; i < len; i++) {
        for (let j = 0, arrLen = combos[i].length; j < arrLen; j++) {
            let item = combos[i][j]
            let id = item.id
            let parent = item.parent
            if (combosMap.has(parent)) {
                let value = combosMap.get(parent)
                value.push(id)
                combosMap.set(parent, value)
            } else {
                combosMap.set(parent, [id])
            }
        }
    }

    return combosMap
}


let tindex = 0;

export function initTree(g: any, node: any, root: any) {
    let st = -1,
        nodeIndex = -1
    let q = [],
        dep: any = new Array(node.length).fill(0)
    tindex = 0;
    for (let i = 0; i < node.length; ++i)
        if (node[i].id == root) {
            st = i
            nodeIndex = node[i].index
            break
        }

    q.push(node[st].id)
    dep[nodeIndex] = 1

    let u;

    let usedObj: { [key: string]: boolean } = {}

    let tree = [];

    let tNodeList: { [key: string]: tNode } = {}

    while (q.length) {
        u = q.shift()

        let neighbors: any = g.neighbors(u)

        for (let i = 0; i < neighbors.length; i++) {
            let id = neighbors[i]
            !usedObj[id] && q.push(id);

            !tNodeList[id] && (tNodeList[id] = new tNode(id))
        }

        usedObj[u] = true
        !tNodeList[u] && (tNodeList[u] = new tNode(u))

        tNodeList[u].neighbors = neighbors.map((id: string) => {
            return tNodeList[id]
        });
        tree.push(
            tNodeList[u]
        )
    }

    return tree
}
var initialRadius = 50,
    initialAngle = Math.PI * (3 - Math.sqrt(5));

class tNode {
    [key: string]: any
    id: string
    x: number = 0
    y: number = 0
    neighbors: any

    constructor(id: string) {
        this.id = id;
        var radius = initialRadius * Math.sqrt(0.5 + tindex),
            angle = tindex * initialAngle;
        this.x = radius * Math.cos(angle) * 2
        this.y = radius * Math.sin(angle) * 2
        // this.x = Math.random() * 1000;
        // this.y = Math.random() * 1000;
        tindex++;
    }

    hasNeighbor(node: tNode) {
        for (let i = 0; i < this.neighbors.length; i++) {
            if (this.neighbors[i].id === node.id)
                return true
        }
        return false;
    }
}
