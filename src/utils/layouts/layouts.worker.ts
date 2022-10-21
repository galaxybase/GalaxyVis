import circularLayout from '../../layouts/circle/circular/circular'
import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceY,
    forceX,
    forceCollide,
} from '../../layouts/forceLink/force'
import gridLayout from '../../layouts/grid/grid/gridLayout'
import concentricLayout from '../../layouts/hierarchy/concentric/concentric'
import dagrelLayout from '../../layouts/hierarchy/dagreTree/dagre'
import hierarchy from '../../layouts/hierarchy/hierarchy'
import radialLayout from '../../layouts/hierarchy/radial/radial'
import tree from '../../layouts/hierarchy/tree'
import { BFSTree, floorBfs } from './bfsTree'

const LAYOUT_MESSAGE = {
    // run layout
    START: 'layoutStart',
    // layout ended with success
    END: 'layoutEnd',
    // layout error
    ERROR: 'layoutError',
}

function handleLayoutMessage(event: any) {
    const { nodes, edges, layoutCfg = {} } = event.data
    const { type: layoutType, options, width, height, center, allNodes } = layoutCfg
    let data: any,
        ids: any[] = [],
        positions: any[] = []
    try{
        switch (layoutType) {
            case 'circular': {
                data = circularLayout(nodes, options)
                if (options?.incremental)
                    for (let i in data) {
                        ids.push(i)
                        positions.push({ ...data[i], id: i })
                    }
                break
            }
            case 'concentric': {
                let listConcen: any[] = []
                try {
                    listConcen = floorBfs(nodes, edges, options.centralNode)
                } catch (error: any) {
                    throw new Error(error)
                }
    
                data = concentricLayout(listConcen, options)
                if (options?.incremental) {
                    ids = Object.keys(data)
                    for (let i in data) {
                        positions.push({ ...data[i], id: i })
                    }
                }
                break
            }
            case 'force': {
                let {
                    tickNum, //迭代次数
                    strength, //点力强度（斥力）
                    edgeStrength, //边力强度（拉力）
                    repulsion, //碰撞力
                    distance, //两点的距离
                    forceY: strengthY,
                    forceX: strengthX,
                } = options
    
                const simulation = forceSimulation(nodes)
                    // 设置或获取link中节点的查找方式
                    .force(
                        'link',
                        forceLink(edges).id((d: any) => d.id),
                    )
                    .force('charge', forceManyBody())
                    // 整个实例中心
                    .force('center', forceCenter(width / 2, height / 2))
                    .force('forceY', forceY().strength(strengthY || 0.04))
                    .force('forceX', forceX().strength(strengthX || 0.03))
                    // 碰撞力 防止节点重叠
                    .force('collide', forceCollide(repulsion || 40).iterations(1))
    
                //作用力应用在所用的节点之间，当strength为正的时候可以模拟重力，当为负的时候可以模拟电荷力。
                simulation.force('charge').strength((d: any) => {
                    if (d.isSingle == true) {
                        return -150
                    }
                    return strength && typeof strength === 'function'
                        ? strength
                        : strength
                        ? Math.abs(strength) * -1
                        : -1200
                })
    
                if (edgeStrength) {
                    simulation.force('link').strength(edgeStrength)
                }
    
                simulation.force('link').distance(distance || 250)
    
                simulation.tick(tickNum || 150)
                let force: { [key: string]: any } = {}
                for (let i = 0, len = nodes.length; i < len; i++) {
                    // @ts-ignore
                    let { id, x, y } = nodes[i]
                    force[id] = {
                        x: x - center[0],
                        y: y - center[1],
                    }
                    options?.incremental && ids.push(id)
                    options?.incremental && positions.push({ ...force[id], id })
                }
                data = force
                break
            }
            case 'tree': {
                let lis: any = []
                let nodesBak = nodes,
                    linksBak = edges
                try {
                    BFSTree(nodesBak, lis, linksBak, allNodes)
                    nodesBak = nodesBak.filter((item: any) => {
                        return !item.used
                    })
                } catch (error: any) {
                    console.error(LAYOUT_MESSAGE.ERROR);
                }
    
                let result: any = []
                result = {
                    id: 'hierarchy_used_readOnly_by_cl',
                    children: nodesBak,
                }
                let treeSimulation = tree()
    
                treeSimulation.nodeSize([width, height])
    
                let hierarchyData = hierarchy(result)
                // @ts-ignore
                let treeData = treeSimulation(hierarchyData)
                let nodeDescendants: any = treeData.descendants()
    
                let trees: { [key: string]: { x: number; y: number } } = {}
                for (let i = 1, len = nodeDescendants.length; i < len; i++) {
                    let { data, x, y } = nodeDescendants[i]
                    let id: string | number = data?.id
                    trees[id] = {
                        x: x - width,
                        y: y - height,
                    }
                    options?.incremental && ids.push(id)
                    options?.incremental && positions.push({ ...trees[id], id })
                }
                data = trees
                break
            }
            case 'grid': {
                let grid: any = {}
    
                let { cols, rows, columns } = options
                if (nodes.length != 1) {
                    grid = gridLayout(nodes, {
                        cols,
                        rows,
                        columns,
                        box: {
                            width,
                            height,
                        },
                    })
    
                    for (let i in grid) {
                        grid[i].x = grid[i].x - center[0]
                        grid[i].y = grid[i].y - center[1]
                        options?.incremental && ids.push(i)
                        options?.incremental && positions.push({ ...grid[i], id: i })
                    }
                } else {
                    grid[nodes[0]] = {
                        x: center[0],
                        y: center[1],
                    }
                    options?.incremental && ids.push(nodes[0])
                    options?.incremental && positions.push({ ...grid[nodes[0]], id: nodes[0] })
                }
                data = grid
                break
            }
            case 'radial': {
                data = radialLayout(nodes, edges, options)
                if (options?.incremental)
                    for (let i in data) {
                        ids.push(data[i].id)
                        positions.push({ ...data[i] })
                    }
                break
            }
            case 'dagre': {
                data = dagrelLayout(nodes, edges, options)
                if (options?.incremental)
                    for (let i in data) {
                        ids.push(data[i].id)
                        positions.push({ ...data[i] })
                    }
            }
            default:
                break
        }
    } catch (err) {
        console.error(LAYOUT_MESSAGE.ERROR);
        // @ts-ignore
        postMessage({ type: LAYOUT_MESSAGE.ERROR })
    }
    // @ts-ignore
    postMessage({ type: LAYOUT_MESSAGE.END, data, ids, positions })
}
// @ts-ignore
onmessage = function (event: Event) {
    handleLayoutMessage(event)
}
