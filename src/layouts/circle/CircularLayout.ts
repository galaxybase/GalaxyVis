import { globalInfo } from '../../initial/globalProp'
import { AnimateType } from '../../types'
import { animateNodes } from '../../utils/graphAnimate'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { EventType } from '../../utils/events'
import { incrementalLayout } from '../incremental'
import NodeList from '../../classes/nodeList'
import circularLayout from './circular/circular'

class CircularLayout {
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
        let layoutsNodes = []
        let { nodes } = this.options
        if (!nodes) {
            nodeList.forEach((values: any, key: any) => {
                layoutsNodes.push(key)
            })
        } else {
            layoutsNodes = nodes
        }

        this.galaxyvis.events.emit(
            'layoutStart',
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'circle',
                type: 'layoutStart',
            }),
        )

        return layoutsNodes
    }

    /**
     * 执行布局
     * @param layoutsNodes
     */
    execute(layoutsNodes: any[]) {
        this.data = circularLayout(layoutsNodes, this.options)
        this.ids = []
        this.positions = []
        if (this.options?.incremental)
            for (let i in this.data) {
                this.ids.push(i)
                this.positions.push({ ...this.data[i], id: i })
            }
    }

    /**
     * 布局
     * @returns
     */
    layout() {
        return new Promise(async (resolve, reject) => {
            let layoutsNodes = await this.init()
            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: layoutsNodes,
                    layoutCfg: {
                        type: 'circular',
                        options: this.options,
                        width: globalInfo[this.galaxyvis.id].canvasBox.width,
                        height: globalInfo[this.galaxyvis.id].canvasBox.height,
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
                                        ids: layoutsNodes,
                                        name: 'circle',
                                        type: 'layoutEnd',
                                        postions: layoutsNodes.map((item: string | number) => {
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
                    this.execute(layoutsNodes)

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
                                    ids: layoutsNodes,
                                    name: 'circle',
                                    type: 'layoutEnd',
                                    postions: layoutsNodes.map((item: string | number) => {
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

export default CircularLayout
