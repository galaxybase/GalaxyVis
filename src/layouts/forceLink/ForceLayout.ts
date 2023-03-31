import { basicData, globalInfo } from '../../initial/globalProp'
import { AnimateType, LAYOUT_MESSAGE, PlainObject } from '../../types'
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
import { animation } from '../animation'
import BaseLayout from '../baseLayout'

class ForceLayout extends BaseLayout {

    private useAnimation: boolean = true

    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
    }

    /**
     * 初始化数据
     * @returns
     */
    init() {
        const id = this.galaxyvis.id
        let nodeList = this.galaxyvis.getFilterNode(),
            edgelist = basicData[id].edgeList,
            center: number[] = [],
            width,
            height
        let { nodes, useAnimation, withoutCenter } = this.options
        let layoutsNodes: any[] = []
        var layoutsEdges = [], nodesData: any[] = [];
        
        if (useAnimation == undefined) this.useAnimation = true
        else this.useAnimation = useAnimation

        if (!nodes || nodes?.length == nodeList?.size || nodes.length == 0) {
            let i = 0;
            let relationTable = this.galaxyvis.getEdgeType().relationTable
            nodeList.forEach((values: any, key: string) => {
                layoutsNodes.push(key)
                let needEdgeFresh = relationTable[layoutsNodes[i]]
                nodesData[i++] = ({ id: key, isSingle: needEdgeFresh ? false : true })
            })
            let j = 0
            edgelist.forEach((values, key) => {
                let { source, target } = values.value
                if (values.getAttribute('isVisible') && (
                    layoutsNodes.indexOf(source) !== -1 &&
                    layoutsNodes.indexOf(target) !== -1)) {
                    layoutsEdges[j] = ({
                        source,
                        target,
                        index: j++
                    })
                }
            })
            width = globalInfo[id].BoxCanvas.getWidth
            height = globalInfo[id].BoxCanvas.getHeight
            center = [width / 2, height / 2]
        } else {
            layoutsNodes = nodes
            // layoutsNodes = nodes.filter((item: any) => {
            //     return nodeList.has(item)
            // })
        
            let {
                width: localWidth,
                height: localHeight,
                center: localCenter,
            } = localComputation(id, nodes);
            width = localWidth, height = localHeight, center = localCenter;
            if(withoutCenter){
                width = 0, height = 0, center = [0, 0]
            }
            let unionInfo = unionEdges(this.galaxyvis, layoutsNodes, false)
            nodesData = unionInfo.nodesData;
            layoutsEdges = unionInfo.layoutsEdges
        }

        this.galaxyvis.events.emit(
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'force',
                type: LAYOUT_MESSAGE.START,
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

        return new Promise((resolve, reject) => {

            if (this.galaxyvis.geo.enabled()) {
                console.warn("Geo mode does not allow the use of layouts");
                return resolve(void 0)
            }

            let initObj = this.init()
            let { nodesData, layoutsEdges, layoutsNodes, width, height, center } = initObj

            // if(layoutsNodes.length <= 1){
            //     return resolve({})
            // }

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                // @ts-ignore
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: nodesData,
                    edges: layoutsEdges,
                    layoutCfg: {
                        type: 'force',
                        options: this.options,
                        width: width,
                        height: height,
                        center: center,
                    },
                })

                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        that.useAnimation && animation(that, event, layoutsNodes, 'force').then((data) => {
                            worker.terminate()
                            resolve(data)
                        })
                        !that.useAnimation && worker.terminate() && resolve(that.data)
                    } else {
                        worker.terminate()
                        reject(LAYOUT_MESSAGE.ERROR)
                    }
                }
            } else {
                try {
                    this.execute(initObj)
                    this.useAnimation && animation(this, null, layoutsNodes, 'force').then((data) => {
                        resolve(data)
                    })
                    !this.useAnimation && resolve(this.data)
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }
}

export default ForceLayout
