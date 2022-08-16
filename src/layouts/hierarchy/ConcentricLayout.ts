import { AnimateType } from '../../types'
import { animateNodes } from '../../utils/graphAnimate'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { unionEdges } from '../../utils/layouts/common'
import { floorBfs } from '../../utils/layouts/bfsTree'
import { EventType } from '../../utils/events'
import concentricLayout from './concentric/concentric'

class ConcentricLayout {
    private galaxyvis: any
    public options: AnimateType
    public data: any

    constructor(galaxyvis: any, options: AnimateType) {
        this.galaxyvis = galaxyvis
        this.options = options
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
            'layoutStart',
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'concentric',
                type: 'layoutStart',
            }),
        )

        if (!this.options.centralNode && nodesBak.length) {
            console.error('centralNode is empty. will use the first node')
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
    }

    /**
     * 布局
     * @returns
     */
    layout() {
        return new Promise(async (resolve, reject) => {
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
                    if (event.data.type == 'layoutEnd') {
                        that.data = event.data.data
                        animateNodes(
                            that.galaxyvis,
                            that.data,
                            {
                                duration: that.options.duration,
                                easing: that.options.easing,
                            },
                            () => {
                                that.galaxyvis.events.emit(
                                    'layoutEnd',
                                    EventType.layoutEnd({
                                        ids: layoutsNode,
                                        name: 'concentric',
                                        type: 'layoutEnd',
                                        postions: layoutsNode.map((item: string | number) => {
                                            return that.data[item]
                                        }),
                                    }),
                                )
                                worker.terminate()
                                resolve(true)
                            },
                            that.options?.incremental ? false : true,
                        )
                    } else {
                        worker.terminate()
                        reject('fail')
                    }
                }
                // worker.addEventListener('message', function (event: any) {})
            } else {
                try {
                    let layoutsNodes = this.initTree(nodesBak, linksBak)
                    this.execute(layoutsNodes)
                    animateNodes(
                        this.galaxyvis,
                        this.data,
                        {
                            duration: this.options.duration,
                            easing: this.options.easing,
                        },
                        () => {
                            this.galaxyvis.events.emit(
                                'layoutEnd',
                                EventType.layoutEnd({
                                    ids: layoutsNode,
                                    name: 'concentric',
                                    type: 'layoutEnd',
                                    postions: layoutsNode.map((item: any) => {
                                        return this.data[item]
                                    }),
                                }),
                            )
                            resolve(true)
                        },
                        this.options?.incremental ? false : true,
                    )
                } catch (err) {
                    reject(err)
                }
            }
        })
    }
}

export default ConcentricLayout
