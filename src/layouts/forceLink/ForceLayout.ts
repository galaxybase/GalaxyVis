import { globalInfo } from '../../initial/globalProp'
import { AnimateType, PlainObject } from '../../types'
import { animateNodes } from '../../utils/graphAnimate'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { localComputation, unionEdges } from '../../utils/layouts/common'
import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceY,
    forceX,
    forceCollide,
} from './force'
import { EventType } from '../../utils/events'
import { incrementalLayout } from '../incremental'
import NodeList from '../../classes/nodeList'

class ForceLayout {
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
        let nodeList = this.galaxyvis.getFilterNode(),
            center: number[] = [],
            width,
            height
        let { nodes } = this.options
        let layoutsNodes: any[] = []

        if (!nodes || nodes?.length == nodeList?.size || nodes.length == 0) {
            nodeList.forEach((values: any, key: any) => {
                layoutsNodes.push(key)
            })

            width = globalInfo[this.galaxyvis.id].BoxCanvas.getWidth
            height = globalInfo[this.galaxyvis.id].BoxCanvas.getHeight
            center = [width / 2, height / 2]
        } else {
            layoutsNodes = nodes
            let {
                width: localWidth,
                height: localHeight,
                center: localCenter,
            } = localComputation(this.galaxyvis.id, nodes)
            ;(width = localWidth), (height = localHeight), (center = localCenter)
        }

        var { layoutsEdges, nodesData } = unionEdges(this.galaxyvis, layoutsNodes, false)

        this.galaxyvis.events.emit(
            'layoutStart',
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'force',
                type: 'layoutStart',
            }),
        )

        return {
            width,
            height,
            center,
            nodesData,
            layoutsEdges,
            layoutsNodes,
        }
    }

    /**
     * 执行布局
     * @param initObj
     */
    execute(initObj: any) {
        let { width, height, center, nodesData, layoutsEdges } = initObj

        let {
            tickNum, //迭代次数
            strength, //点力强度（斥力）
            edgeStrength, //边力强度（拉力）
            repulsion, //碰撞力
            distance, //两点的距离
            forceY: strengthY,
            forceX: strengthX,
        } = this.options as AnimateType

        const simulation = forceSimulation(nodesData)
            // 设置或获取link中节点的查找方式
            .force(
                'link',
                forceLink(layoutsEdges).id((d: any) => d.id),
            )
            .force('charge', forceManyBody())
            // 整个实例中心
            .force('center', forceCenter(width / 2, height / 2))
            .force('forceY', forceY().strength(strengthY || 0.04))
            .force('forceX', forceX().strength(strengthX || 0.03))
            // 碰撞力 防止节点重叠
            .force('collide', forceCollide(repulsion || 40).iterations(1))

        //作用力应用在所用的节点之间，当strength为正的时候可以模拟重力，当为负的时候可以模拟电荷力。
        simulation.force('charge').strength((d: any) => {
            if (d.isSingle == true) {
                return -150
            }

            return strength && typeof strength === 'function'
                ? strength
                : strength
                ? Math.abs(strength) * -1
                : -1200
        })

        if (edgeStrength) {
            simulation.force('link').strength(edgeStrength)
        }

        simulation.force('link').distance(distance || 250)

        simulation.tick(tickNum || 150)

        let force: PlainObject<any> = {}
        this.ids = []
        this.positions = []

        for (let i = 0, len = nodesData.length; i < len; i++) {
            // @ts-ignore
            let { id, x, y } = nodesData[i]
            force[id] = {
                x: x - center[0],
                y: y - center[1],
            }
            this.options?.incremental && this.ids.push(id)
            this.options?.incremental && this.positions.push({ ...force[id], id })
        }
        this.data = force
    }

    /**
     * 布局
     * @returns
     */
    layout() {
        if (this.galaxyvis.thumbnail) {
            return new Promise(resolve => {
                resolve(void 0)
            })
        }

        return new Promise(async (resolve, reject) => {
            let initObj = await this.init()
            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                // @ts-ignore
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: initObj.nodesData,
                    edges: initObj.layoutsEdges,
                    layoutCfg: {
                        type: 'force',
                        options: this.options,
                        width: initObj.width,
                        height: initObj.height,
                        center: initObj.center,
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
                                        ids: initObj.layoutsNodes,
                                        name: 'force',
                                        type: 'layoutEnd',
                                        postions: initObj.layoutsNodes.map(
                                            (item: string | number) => {
                                                return that.data[item]
                                            },
                                        ),
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
            } else {
                try {
                    this.execute(initObj)

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
                                    ids: initObj.layoutsNodes,
                                    name: 'force',
                                    type: 'layoutEnd',
                                    postions: initObj.layoutsNodes.map((item: string | number) => {
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

export default ForceLayout
