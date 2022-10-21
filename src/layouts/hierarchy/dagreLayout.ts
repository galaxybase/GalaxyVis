import { AnimateType, LAYOUT_MESSAGE } from '../../types'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { unionEdges } from '../../utils/layouts/common'
import { EventType } from '../../utils/events'
import { globalInfo } from '../../initial/globalProp'
import dagrelLayout from './dagreTree/dagre'
import { animation } from '../animation'
import BaseLayout from '../baseLayout'

class DagrelLayout extends BaseLayout {
    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
    }

    /**
     * 初始化数据
     * @returns
     */
    init() {
        const id = this.galaxyvis.id
        let nodeList = this.galaxyvis.getFilterNode()
        let layoutsNodes: any[] = []
        let { nodes } = this.options
        let width = globalInfo[id].BoxCanvas.getWidth,
            height = globalInfo[id].BoxCanvas.getHeight

        this.options.width = width

        this.options.height = height

        if (!nodes) {
            nodeList.forEach((values: any, key: any) => {
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
                name: 'dagre',
                type: LAYOUT_MESSAGE.START,
            }),
        )
        return {
            nodesBak,
            linksBak,
            layoutsNodes,
        }
    }

    /**
     * 执行布局
     * @param nodesBak
     * @param linksBak
     */
    execute(nodesBak: any, linksBak: any) {
        this.data = dagrelLayout(nodesBak, linksBak, this.options)
        this.ids = []
        this.positions = []
        if (this.options?.incremental)
            for (let i in this.data) {
                this.ids.push(this.data[i].id)
                this.positions.push({ ...this.data[i] })
            }
    }

    /**
     * 布局
     * @returns
     */
    layout() {
        return new Promise(async (resolve, reject) => {

            if(this.galaxyvis.geo.enabled()){
                console.warn("Geo mode does not allow the use of layouts")
                return resolve(void 0)
            }

            let { linksBak, nodesBak, layoutsNodes: layoutsNode } = await this.init()

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                // @ts-ignore
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: nodesBak,
                    edges: linksBak,
                    layoutCfg: {
                        type: 'dagre',
                        options: this.options,
                    },
                })

                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, layoutsNode, 'dagre').then((data) => {
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
                    animation(this, null, layoutsNode, 'dagre').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }
}

export default DagrelLayout
