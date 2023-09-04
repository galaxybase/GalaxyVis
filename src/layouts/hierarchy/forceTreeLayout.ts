import { AnimateType, LAYOUT_MESSAGE } from "../../types";
import { EventType } from "../../utils/events";
import { unionEdges } from "../../utils/layouts/common";
import BaseLayout from "../baseLayout";
import dagre from 'dagre'
import { animation } from "../animation";
import forceTreeLayout from "./forceTree/index";
// @ts-ignore
import LayoutWorker from 'worker-loader?inline=fallback!../../utils/layouts/layouts.worker'
import { initTree } from "../../utils/layouts/bfsTree";

class ForceTreeLayout extends BaseLayout {
    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
    }

    init() {
        let nodeList = this.galaxyvis.getFilterNode()
        let layoutsNodes: any[] = []
        let { nodes } = this.options

        if (!nodes) {
            nodeList.forEach((values: any, key: string) => {
                layoutsNodes.push(key)
            })
        } else {
            layoutsNodes = nodes
        }

        // 那些边是需要传入计算引力的
        var { layoutsEdges } = unionEdges(this.galaxyvis, layoutsNodes)

        var linksBak: any = layoutsEdges.concat()
        var nodesBak: any = layoutsNodes
            .map((id, index) => {
                return {
                    id,
                    index,
                }
            })
            .concat()

        this.galaxyvis.events.emit(
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'concentric',
                type: LAYOUT_MESSAGE.START,
            }),
        )

        if (!this.options.clusterCenter && nodesBak.length) {
            console.warn('clusterCenter is empty. will use the first node')
            this.options.clusterCenter = nodesBak[0].id
        }

        return {
            nodesBak,
            linksBak,
            layoutsNodes,
        }
    }

    initTree(nodesBak: any, linksBak: any) {

        const g = new dagre.graphlib.Graph()

        nodesBak.forEach((node: any) => {
            g.setNode(node.id)
        })
        linksBak.forEach((edge: any) => {
            g.setEdge(edge.source.id, edge.target.id)
        })

        let listConcen: any[] = []
        try {
            listConcen = initTree(g, nodesBak, this.options.clusterCenter)
        } catch (error: any) {
            throw new Error(error)
        }
        return listConcen
    }

    execute(nodesBak: any[] | Map<string, any>, linksBak: any[] | undefined) {
        let treeNodes = this.initTree(nodesBak, linksBak)
        this.data = forceTreeLayout(treeNodes, this.options)
        this.ids = []
        this.positions = []
        if (this.options?.incremental) {
            this.ids = Object.keys(this.data)
            for (let i in this.data) {
                this.positions.push({ ...this.data[i], id: i })
            }
        }
    }

    layout() {
        return new Promise(async (resolve, reject) => {
            
            if (this.galaxyvis.geo.enabled()) {
                console.warn("Geo mode does not allow the use of layouts")
                return resolve(void 0)
            }

            let { linksBak, nodesBak, layoutsNodes } = await this.init()

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                let worker = new LayoutWorker()
                let that = this
                
                worker.postMessage({
                    nodes: layoutsNodes,
                    layoutCfg: {
                        type: 'forceTree',
                        nodesBak,
                        linksBak,
                        options: {
                            ...this.options
                        },
                    },
                })

                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, layoutsNodes, 'forceTree').then((data) => {
                            worker.terminate()
                            resolve(data)
                        })
                    } else {
                        worker.terminate()
                        reject(LAYOUT_MESSAGE.ERROR)
                    }
                }
            } else {
                try {
                    this.execute(nodesBak, linksBak)
                    animation(this, null, layoutsNodes, 'forceTree').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
            

        })

    }
}

export default ForceTreeLayout