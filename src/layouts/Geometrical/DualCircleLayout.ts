import { AnimateType, LAYOUT_MESSAGE } from "../../types"
import { animation } from "../animation";
import BaseLayout from "../baseLayout"
// @ts-ignore
import LayoutWorker from 'worker-loader?inline=fallback!../../utils/layouts/layouts.worker'
import duailCircleLayout from "./dualCircle";
import { EventType } from "../../utils/events";

class DualCirlceLayout extends BaseLayout {
    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
    }
    /**
     * 初始化
     */
    init() {
        let nodeList = this.galaxyvis.getFilterNode();
        let layoutsNodes = [];
        let { nodes } = this.options;
        let ids = [];
        let {
            inRelationTable,
            outRelationTable
        } = this.galaxyvis.getNodeTable();

        if (!nodes || nodes?.length == nodeList?.size || nodes.length == 0) {
            nodeList.forEach((values: any, key: string) => {
                let inLinks: string[] = [], outLinks: string[] = [];
                if (inRelationTable[key])
                    inLinks = [...inRelationTable[key]]
                if (outRelationTable[key])
                    outLinks = [...outRelationTable[key]]
                layoutsNodes.push({
                    key,
                    x: 0,
                    y: 0,
                    inLinks,
                    outLinks,
                    scaleX: 1,
                    radius: values.getAttribute('radius') || 25
                });
                ids.push(key)
            })
        } else {
            for (let i in nodes) {
                let key = nodes[i];
                let inLinks: string[] = [], outLinks: string[] = [];
                if (inRelationTable[key])
                    inLinks = [...inRelationTable[key]]
                if (outRelationTable[key])
                    outLinks = [...outRelationTable[key]]
                layoutsNodes.push({
                    key,
                    x: 0,
                    y: 0,
                    inLinks,
                    outLinks,
                    scaleX: 1,
                    radius: nodeList.get(key).getAttribute('radius') || 25
                })
                ids.push(key)
            }
        }

        this.galaxyvis.events.emit(
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids,
                name: 'dualCircle',
                type: LAYOUT_MESSAGE.START,
            }),
        )
        
        return { layoutsNodes, ids }
    }
    /**
     * 执行
     */
    execute(nodes: any[]) {
        try {
            this.data = duailCircleLayout(nodes, this.options)
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
            let { layoutsNodes, ids } = this.init();

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                 // @ts-ignore
                 let worker = new LayoutWorker()
                 let that = this
                 worker.postMessage({
                     nodes: layoutsNodes,
                     layoutCfg: {
                         type: 'dualCircle',
                         options: this.options,
                     },
                 })
                 worker.onmessage = function (event: any) {
                     if (event.data.type == LAYOUT_MESSAGE.END) {
                         that.data = event.data.data
                         animation(that, event, ids, 'dualCircle').then((data) => {
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
                    this.data = this.execute(layoutsNodes)
    
                    animation(this, null, ids, 'dualCircle').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }
}

export default DualCirlceLayout