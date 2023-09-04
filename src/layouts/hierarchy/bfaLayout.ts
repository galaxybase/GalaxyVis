import { AnimateType, LAYOUT_MESSAGE, PlainObject } from "../../types"
import { animation } from "../animation";
import BaseLayout from "../baseLayout"
// @ts-ignore
import LayoutWorker from 'worker-loader?inline=fallback!../../utils/layouts/layouts.worker'
import { basicData } from "../../initial/globalProp";
import { cleartNodeList, tNode, tNodeList } from "./tclass";
import isString from 'lodash/isString'
import bfaLayout from "./bfa";
import { getContainerHeight, getContainerWidth } from "../../utils";
import { EventType } from "../../utils/events";

class BFALayout extends BaseLayout {
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
        let layoutsNodes = [];
        let { nodes } = this.options;
        let ids = [];

        this.options.width = getContainerWidth(this.galaxyvis.divContainer);
        this.options.height = getContainerHeight(this.galaxyvis.divContainer);

        this.edgeList = basicData[this.galaxyvis.id].edgeList
        this.nodeTable = this.galaxyvis.getNodeTable();
        if (!nodes || nodes?.length == nodeList?.size || nodes.length == 0) {
            nodeList.forEach((values: any, key: string) => {
                tNodeList[key] = new tNode(key, values.getAttribute())
                tNodeList[key].updatePos()
                layoutsNodes.push(tNodeList[key])
                ids.push(key)
            })
            nodeList.forEach((values: any, key: string) => {
                let { inLinks, outLinks } = this.layoutInit(key)
                tNodeList[key].updateLinks(
                    inLinks,
                    outLinks
                )
            })
        } else {
            for (let i in nodes) {
                let key = nodes[i];
                tNodeList[key] = new tNode(key, nodeList.get(key).getAttribute())
                tNodeList[key].updatePos()
                layoutsNodes.push(tNodeList[key])
                ids.push(key)
            }
            for (let i in nodes) {
                let key = nodes[i];
                let { inLinks, outLinks } = this.layoutInit(key)
                tNodeList[key].updateLinks(
                    inLinks,
                    outLinks
                )
            }
        }

        this.galaxyvis.events.emit(
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids,
                name: 'bfa',
                type: LAYOUT_MESSAGE.START,
            }),
        )

        return { layoutsNodes, ids }
    }

    layoutInit(key: string) {
        let {
            inRelationTable,
            outRelationTable
        } = this.nodeTable
        let edgeList = this.edgeList
        let inLinks: Array<PlainObject<any>> = [],
            outLinks: Array<PlainObject<any>> = [];
        let originIn: string[] = [], originOut: string[] = [];
        if (inRelationTable[key])
            originIn = [...inRelationTable[key]]
        if (outRelationTable[key])
            originOut = [...outRelationTable[key]]

        for (let i = 0, len = originIn.length; i < len; i++) {
            let node = edgeList.get(originIn[i]).getSource()
            if(!node) continue;
            let nodeId = isString(node) ? node : node.getId()
            tNodeList[nodeId] && (inLinks[i] = {
                source: tNodeList[nodeId]
            })
        }

        for (let i = 0, len = originOut.length; i < len; i++) {
            let node = edgeList.get(originOut[i]).getTarget()
            if(!node) continue;
            let nodeId = isString(node) ? node : node.getId()
            tNodeList[nodeId] && (outLinks[i] = {
                target: tNodeList[nodeId]
            })
        }
        return { inLinks, outLinks }
    }

    /**
     * 执行
     */
    execute(nodes: any[]) {
        try {
            this.data = bfaLayout(nodes, [], this.options)
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

            let { layoutsNodes, ids } = this.init()

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                // @ts-ignore
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: layoutsNodes,
                    layoutCfg: {
                        type: 'bfa',
                        options: this.options,
                    },
                })
                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, ids, 'bfa').then((data) => {
                            worker.terminate()
                            cleartNodeList()
                            resolve(data)
                        })
                    } else {
                        worker.terminate()
                        cleartNodeList()
                        reject(LAYOUT_MESSAGE.ERROR)
                    }
                }
            } else {
                try {
                    this.data = this.execute(layoutsNodes)
                    animation(this, null, ids, 'bfa').then((data) => {
                        cleartNodeList()
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }

}

export default BFALayout