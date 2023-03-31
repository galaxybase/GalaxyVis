import { AnimateType, LAYOUT_MESSAGE } from "../../types"
import { animation } from "../animation";
import BaseLayout from "../baseLayout"
import hiveLayout from "./hive";
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { EventType } from "../../utils/events";

class HiveLayout extends BaseLayout {
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
        if (!nodes || nodes?.length == nodeList?.size || nodes.length == 0) {
            nodeList.forEach((values: any, key: string) => {
                layoutsNodes.push({ key, x: 0, y: 0 });
                ids.push(key)
            })
        } else {
            for (let i in nodes) {
                layoutsNodes.push({
                    key: nodes[i],
                    x: 0,
                    y: 0
                })
                ids.push(nodes[i])
            }

        }

        this.galaxyvis.events.emit(
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids,
                name: 'hive',
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
            this.data = hiveLayout(nodes, this.options)
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
                        type: 'hive',
                        options: this.options,
                    },
                })
                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, ids, 'hive').then((data) => {
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

                    animation(this, null, ids, 'hive').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }

}

export default HiveLayout