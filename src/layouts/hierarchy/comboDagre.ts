import { AnimateType, LAYOUT_MESSAGE } from '../../types'
import BaseLayout from '../baseLayout'
import { unionEdges } from '../../utils/layouts/common'
import { comboBfs, floorBfs } from '../../utils/layouts/bfsTree'
import dagrelLayout from './dagreTree/dagre'
import { animation } from '../animation'
import { clone, remove, reverse } from 'lodash'
import dagre from 'dagre'
import NodeList from '../../classes/nodeList'
import { basicData } from '../../initial/globalProp'
import { EventType } from '../../utils/events'

class ComboDagrelLayout extends BaseLayout {
    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
    }

    /**
     * 初始化数据
     * @returns
     */
    async init() {
        let { nodes: layoutsNodes, comboDagre, owner } = this.options
        let { layoutsEdges, relationTable } = unionEdges(this.galaxyvis, layoutsNodes)
        let combos = new Map()
        let _nodeList = basicData[this.galaxyvis.id].nodeList
        let linksBak: any = layoutsEdges.concat()
        let nodesBak: any = layoutsNodes
            .map((id: any, index: any) => {
                return {
                    id,
                    index,
                }
            })
            .concat()

        try {
            // 获取当前的根节点
            const g = new dagre.graphlib.Graph()

            nodesBak.forEach((node: any) => {
                g.setNode(node.id)
            })
            linksBak.forEach((edge: any) => {
                g.setEdge(edge.source.id, edge.target.id)
            })

            let hierarchicalShip = []

            hierarchicalShip.push(g.sinks())

            let bakNodes = clone(nodesBak)

            let used = new Set([...g.sinks()])

            let level = 0;

            while (used.size < bakNodes.length) {
                let ship: any = hierarchicalShip[level];
                let levelNeghbor = []
                for (let i = 0; i < ship.length; i++) {
                    let neighbors = g.neighbors(ship[i])
                    for (let j = 0; j < neighbors.length; j++) {
                        if (!used.has(neighbors[j])) {
                            levelNeghbor.push(neighbors[j])
                            used.add(neighbors[j])
                        }
                    }
                }
                if (levelNeghbor.length) {
                    level++;
                    hierarchicalShip.push(levelNeghbor);
                }
                else {
                    return
                }
            }
            hierarchicalShip = reverse(hierarchicalShip)
            combos = comboBfs(this.galaxyvis.id, nodesBak, hierarchicalShip, relationTable)
        } catch (error: any) {
            throw new Error(error)
        }
        let ComboMove: any = {}

        for (let i = 0, len = nodesBak.length; i < len; i++) {
            let nodeBak = nodesBak[i]
            let nodes = combos.get(nodeBak.id)
            if (nodes.length > 1) {
                // 子分支布局
                await this.galaxyvis.layouts.dagre({
                    nodes,
                    useWebWorker: false,
                    useAnimation: false,
                    rankdir: comboDagre?.rankdir || "BT",
                    ranksep: comboDagre?.ranksep || 10,
                    nodesep: comboDagre?.nodesep || 100
                }).then((data: any) => {
                    let newData: any = {}
                    for (let i = 0; i < data.length; i++) {
                        newData[data[i].id] = {
                            x: data[i].x,
                            y: data[i].y
                        }
                    }
                    let { width, height, forcePostion } = this.execute(newData, nodes[0])
                    width && (nodesBak[i].comboWidth = width * 1.5)
                    height && (nodesBak[i].comboHeight = height * 2)
                    ComboMove[nodeBak.id] = forcePostion
                })
            }
        }

        if (owner) {
            remove(linksBak, (item: any) => {
                let source = _nodeList.get(item.source.id).getData(owner)
                let target = _nodeList.get(item.target.id).getData(owner)
                return source != target
            })
        }

        // 主分支布局
        this.data = await dagrelLayout(nodesBak, linksBak, this.options)

        let combosData = clone(this.data);
        // 移动分支上的节点位置
        for (const item in ComboMove) {
            let combo = combosData.find((data: any) => {
                return item === data.id
            })
            let instance = ComboMove[item]

            for (const key in instance) {
                layoutsNodes.push(key)
                this.data.push({
                    id: key,
                    x: combo.x + instance[key].x,
                    y: combo.y + instance[key].y
                })
            }
        }

        let nodeList = new NodeList(this.galaxyvis, layoutsNodes)

        let inverseList = nodeList.inverse().getId()

        let { maxX, minY } = this.getBoundingBox(this.data)
        // 主干之外的点也执行层次布局
        if (inverseList.length)
            await this.galaxyvis.layouts.dagre({
                nodes: inverseList,
                useWebWorker: false,
                useAnimation: false,
            }).then((data: any) => {
                for (let i = 0; i < data.length; i++) {
                    let instance = data[i]
                    layoutsNodes.push(instance.id)
                    this.data.push({
                        id: instance.id,
                        x: instance.x + maxX + 500,
                        y: instance.y + minY
                    })
                }
            })
            
        this.galaxyvis.events.emit(
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'comboDagre',
                type: LAYOUT_MESSAGE.START,
            }),
        )

        return layoutsNodes
    }

    /**
     * 
     * @param nodes 
     * @param centerNode 
     * @returns 
     */
    execute(nodes: { [key: string]: any }, centerNode: string) {
        let maxX = -Infinity,
            minX = Infinity,
            maxY = -Infinity,
            minY = Infinity;
        let centerPosition = nodes[centerNode];
        let forcePostion: any = {}
        // let distance = 0;
        for (const item in nodes) {
            let { x, y } = nodes[item];
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            if (item != centerNode) {
                let forceX = (centerPosition.x - x),
                    forceY = (centerPosition.y - y);
                forcePostion[item] = {
                    x: forceX,
                    y: forceY
                }
                // let r = Math.hypot(
                //     forceX, forceY
                // )
            }
        };

        return {
            width: maxX - minX,
            height: maxY - minY,
            forcePostion
        }
    }

    getBoundingBox(data: any) {
        let maxX = -Infinity,
            minX = Infinity,
            maxY = -Infinity,
            minY = Infinity;
        for (let i = 0, len = data.length; i < len; i++) {
            let { x, y } = data[i]
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
        }
        return {
            maxX,
            minX,
            maxY,
            minY,
            width: maxX - minX,
            height: maxY - minY,
            cx: minX + (maxX - minX) / 2,
            cy: minY + (maxY - minY) / 2,
        }
    }

    /**
     * 布局
     * @returns
     */
    layout() {
        let _nodes = this.options.nodes
        let newNodes: any = [];
        let _nodeList = basicData[this.galaxyvis.id].nodeList
        for (let i = 0, len = _nodes?.length || 0; i < len; i++) {
            if (_nodeList.get(_nodes[i])?.getAttribute('isVisible')) {
                newNodes.push(_nodes[i])
            }
        }
        this.options.nodes = newNodes;
        if (!this.options.nodes || this.options.nodes.length == 0) {
            console.warn('Lack of main tree branches');
            return this.galaxyvis.layouts.dagre({})
        }
        return new Promise(async (resolve, reject) => {
            if (this.galaxyvis.geo.enabled()) {
                console.warn("Geo mode does not allow the use of layouts")
                return resolve(void 0)
            }
            try {
                let layoutsNode = await this.init()
                animation(this, null, layoutsNode, 'comboDagre').then((data) => {
                    resolve(data)
                })
            } catch (err) {
                console.log(err)
                reject(LAYOUT_MESSAGE.ERROR)
            }
        })
    }
}

export default ComboDagrelLayout
