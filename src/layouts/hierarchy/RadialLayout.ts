import { AnimateType } from '../../types'
import { animateNodes } from '../../utils/graphAnimate'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { unionEdges } from '../../utils/layouts/common'
import { EventType } from '../../utils/events'
import { globalInfo } from '../../initial/globalProp'
import { incrementalLayout } from '../incremental'
import NodeList from '../../classes/nodeList'
import radialLayout from './radial/radial'

class RadialLayout {
    private galaxyvis: any
    public options: AnimateType
    public data: any
    private ids: any
    private positions: any

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
        let width = globalInfo[this.galaxyvis.id].BoxCanvas.getWidth,
            height = globalInfo[this.galaxyvis.id].BoxCanvas.getHeight

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
            'layoutStart',
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'radial',
                type: 'layoutStart',
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
        this.data = radialLayout(nodesBak, linksBak, this.options)
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
            let { linksBak, nodesBak, layoutsNodes: layoutsNode } = await this.init()

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                // @ts-ignore
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: nodesBak,
                    edges: linksBak,
                    layoutCfg: {
                        type: 'radial',
                        options: this.options,
                    },
                })

                worker.onmessage = function (event: any) {
                    if (event.data.type == 'layoutEnd') {
                        that.data = event.data.data

                        if (that.options?.incremental)
                            that.data = incrementalLayout(
                                that.galaxyvis.id,
                                event.data.positions,
                                new NodeList(that.galaxyvis, event.data.ids),
                                that.options,
                            )

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
                                        type: 'radial',
                                        postions: that.options?.incremental
                                            ? that.data
                                            : that.data.map((item: any) => {
                                                  return {
                                                      x: item.x,
                                                      y: item.y,
                                                  }
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
                    this.execute(nodesBak, linksBak)

                    if (this.options?.incremental)
                        this.data = incrementalLayout(
                            this.galaxyvis.id,
                            this.positions,
                            new NodeList(this.galaxyvis, this.ids),
                            this.options,
                        )

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
                                    name: 'radial',
                                    type: 'layoutEnd',
                                    postions: this.options?.incremental
                                        ? this.data
                                        : this.data.map((item: any) => {
                                              return {
                                                  x: item.x,
                                                  y: item.y,
                                              }
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

export default RadialLayout
