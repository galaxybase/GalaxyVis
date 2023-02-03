import { AnimateType, LAYOUT_MESSAGE } from "../../types"
import { animation } from "../animation";
import BaseLayout from "../baseLayout"
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { basicData } from "../../initial/globalProp";
import { isString } from "lodash";
import { cleartNodeList, tNode, tNodeList } from "../hierarchy/tclass";
import forceDirectedLayout from "./forceDirected";

class frDirectLayout extends BaseLayout {
    nodeList: any;
    nodeTable: any;
    edgeList: any;

    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
    }
    /**
     * 初始化
     */
    init() {
        let nodeList = this.nodeList = this.galaxyvis.getFilterNode();
        let layoutsNodes = [], layoutEdges: { source: tNode; target: tNode; }[] = [];
        let { nodes } = this.options;
        let ids = [];
        let used = new Set(), index = 0
        this.edgeList = basicData[this.galaxyvis.id].edgeList
        this.nodeTable = this.galaxyvis.getNodeTable();
        if (!nodes || nodes?.length == nodeList?.size || nodes.length == 0) {
            nodeList.forEach((values: any, key: any) => {
                tNodeList[key] = new tNode(key, values.getAttribute())
                tNodeList[key].updatePos(index++)
                layoutsNodes.push(tNodeList[key])
                ids.push(key)
            })
            nodeList.forEach((values: any, key: any) => {
                let { inLinks, outLinks, edgeLinks } = this.layoutInit(key)
                tNodeList[key].updateLinks(
                    inLinks,
                    outLinks
                )
                for (let i = 0, len = edgeLinks.length; i < len; i++) {
                    let edgeId = edgeLinks[i]
                    if (used.has(edgeId)) continue;
                    let edge = this.nodeTable.table[edgeId];
                    let { source, target } = edge
                    if (!tNodeList[source] || !tNodeList[target]) continue
                    layoutEdges.push({
                        source: tNodeList[source],
                        target: tNodeList[target]
                    })
                    used.add(edgeId)
                }
            })
        } else {
            for (let i in nodes) {
                let key = nodes[i];
                tNodeList[key] = new tNode(key, nodeList.get(key).getAttribute())
                tNodeList[key].updatePos(index++)
                layoutsNodes.push(tNodeList[key])
                ids.push(key)
            }
            for (let i in nodes) {
                let key = nodes[i];
                let { inLinks, outLinks, edgeLinks } = this.layoutInit(key)
                tNodeList[key].updateLinks(
                    inLinks,
                    outLinks
                )
                for (let i = 0, len = edgeLinks.length; i < len; i++) {
                    let edgeId = edgeLinks[i]
                    if (used.has(edgeId)) continue;
                    let edge = this.nodeTable.table[edgeId];
                    let { source, target } = edge
                    if (!tNodeList[source] || !tNodeList[target]) continue
                    layoutEdges.push({
                        source: tNodeList[source],
                        target: tNodeList[target]
                    })
                    used.add(edgeId)
                }
            }
        }
        return { layoutsNodes, layoutEdges, ids }
    }

    layoutInit(key: string) {
        let {
            inRelationTable,
            outRelationTable
        } = this.nodeTable
        let edgeList = this.edgeList
        let inLinks: Array<{ [key: string]: any }> = [],
            outLinks: Array<{ [key: string]: any }> = [],
            edgeLinks: Array<any> = [];
        let originIn: string[] = [], originOut: string[] = [];
        if (inRelationTable[key])
            originIn = [...inRelationTable[key]]
        if (outRelationTable[key])
            originOut = [...outRelationTable[key]]

        for (let i = 0, len = originIn.length; i < len; i++) {
            let edge = edgeList.get(originIn[i])
            let node = edge.getSource()
            if(!node) continue;
            let nodeId = isString(node) ? node : node.getId()
            tNodeList[nodeId] && (inLinks[i] = {
                source: tNodeList[nodeId]
            })
            edgeLinks.push(edge.getId())
        }

        for (let i = 0, len = originOut.length; i < len; i++) {
            let edge = edgeList.get(originOut[i]);
            let node = edge.getTarget()
            if(!node) continue;
            let nodeId = isString(node) ? node : node.getId()
            tNodeList[nodeId] && (outLinks[i] = {
                target: tNodeList[nodeId]
            })
            edgeLinks.push(edge.getId())
        }
        return { inLinks, outLinks, edgeLinks }
    }

    /**
     * 执行
     */
    execute(nodes: any[], edges: any[]) {
        try {
            this.data = forceDirectedLayout(nodes, edges,this.options)
            this.ids = []
            this.positions = []
            if (this.options?.incremental)
                for (let i in this.data) {
                    this.ids.push(this.data[i].id)
                    this.positions.push({ ...this.data[i] })
                }
            return this.data
        } catch (e) {
            console.error(e)
        }
    }
    /**
     * 布局
     */
    layout() {
        return new Promise(async (resolve, reject) => {

            if (this.galaxyvis.geo.enabled()) {
                console.warn("Geo mode does not allow the use of layouts")
                return resolve(void 0)
            }

            let { layoutsNodes, layoutEdges, ids } = this.init()

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: layoutsNodes,
                    edges: layoutEdges,
                    layoutCfg: {
                        type: 'frDirected',
                        options: this.options,
                    },
                })
                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, layoutsNodes, 'frDirected').then((data) => {
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
                    this.data = this.execute(layoutsNodes, layoutEdges)
    
                    animation(this, null, ids, 'frDirected').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }

}

export default frDirectLayout