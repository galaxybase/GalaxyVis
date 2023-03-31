import { AnimateType, LAYOUT_MESSAGE } from '../../types'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { unionEdges } from '../../utils/layouts/common'
import { floorBfs } from '../../utils/layouts/bfsTree'
import { EventType } from '../../utils/events'
import concentricLayout from './concentric/concentric'
import { animation } from '../animation'
import BaseLayout from '../baseLayout'

class ConcentricLayout extends BaseLayout {
    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
    }

    /**
     * 初始化数据
     * @returns
     */
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

        if (!this.options.centralNode && nodesBak.length) {
            console.warn('centralNode is empty. will use the first node')
            this.options.centralNode = nodesBak[0].id
        }

        return {
            nodesBak,
            linksBak,
            layoutsNodes,
        }
    }

    initTree(nodesBak: any, linksBak: any) {
        let listConcen: any[] = []
        try {
            listConcen = floorBfs(nodesBak, linksBak, this.options.centralNode)
        } catch (error: any) {
            throw new Error(error)
        }
        return listConcen
    }

    /**
     * 执行布局
     * @param layoutsNodes
     */
    execute(layoutsNodes: any[]) {
        this.data = concentricLayout(layoutsNodes, this.options)
        this.ids = []
        this.positions = []
        if (this.options?.incremental) {
            this.ids = Object.keys(this.data)
            for (let i in this.data) {
                this.positions.push({ ...this.data[i], id: i })
            }
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
                        type: 'concentric',
                        options: this.options,
                    },
                })

                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, layoutsNode, 'concentric').then((data) => {
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
                    let layoutsNodes = this.initTree(nodesBak, linksBak)
                    this.execute(layoutsNodes)
                    animation(this, null, layoutsNode, 'concentric').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }
}

export default ConcentricLayout
