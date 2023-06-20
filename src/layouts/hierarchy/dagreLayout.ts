import { AnimateType, LAYOUT_MESSAGE } from '../../types'
// @ts-ignore
import LayoutWorker from 'worker-loader?inline=fallback!../../utils/layouts/layouts.worker'
import { unionEdges } from '../../utils/layouts/common'
import { EventType } from '../../utils/events'
import { globalInfo } from '../../initial/globalProp'
import dagrelLayout from './dagreTree/dagre'
import { animation } from '../animation'
import BaseLayout from '../baseLayout'
import { remove } from 'lodash'

class DagrelLayout extends BaseLayout {

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
        let nodeList = this.galaxyvis.getFilterNode()
        let layoutsNodes: any[] = []
        let { nodes, useAnimation, layer, owner } = this.options
        let width = globalInfo[id].BoxCanvas.getWidth,
            height = globalInfo[id].BoxCanvas.getHeight
        let _nodeList = this.galaxyvis.getFilterNode()

        this.options.width = width

        this.options.height = height

        if (useAnimation == undefined) this.useAnimation = true
        else this.useAnimation = useAnimation

        if (!nodes) {
            nodeList.forEach((values: any, key: string) => {
                layoutsNodes.push(key)
            })
        } else {
            layoutsNodes = nodes
        }

        let linksBak = [], nodesBak = [];

        if (!layer) {
            // 那些边是需要传入计算引力的
            var { layoutsEdges } = unionEdges(this.galaxyvis, layoutsNodes)
            if (owner) {
                remove(layoutsEdges, (item) => {
                    let source = _nodeList.get(item.source.id).getData(owner)
                    let target = _nodeList.get(item.target.id).getData(owner)
                    return source != target
                })
            }
            linksBak = layoutsEdges
        } else {
            // 指定layer
            let layerNodes: { [k: string]: any } = {}
            for (let i = 0, len = layoutsNodes.length; i < len; i++) {
                let _id = layoutsNodes[i]
                if (!_nodeList.has(_id)) continue;
                let node = _nodeList.get(_id)
                let layers = node.getData(layer)
                if (layers == undefined) layers = "noLayer"
                if (layerNodes[layers]) layerNodes[layers].push(_id)
                else layerNodes[layers] = [_id]
            }
            let layerKeys = Object.keys(layerNodes)

            for (let i = 1; i < layerKeys.length; i++) {
                let upperLayer = layerNodes[layerKeys[i - 1]];
                let currentLayer = layerNodes[layerKeys[i]];
                for (let j = 0; j < currentLayer.length; j++) {
                    for (let k = 0; k < upperLayer.length; k++)
                        linksBak.push({
                            target: { id: currentLayer[j] },
                            source: { id: upperLayer[k] }
                        })
                }
            }
            if (owner) {
                remove(linksBak, (item) => {
                    let source = _nodeList.get(item.source.id).getData(owner)
                    let target = _nodeList.get(item.target.id).getData(owner)
                    return source != target
                })
            }
        }

        nodesBak = layoutsNodes
            .map((id, index) => {
                return {
                    id,
                    index,
                    // size: nodesizeFunc ? nodesizeFunc(
                    //     _nodeList.get(id)
                    // ) : 0
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

            if (this.galaxyvis.geo.enabled()) {
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
                        that.useAnimation && animation(that, event, layoutsNode, 'dagre').then((data) => {
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
                    this.execute(nodesBak, linksBak)
                    this.useAnimation && animation(this, null, layoutsNode, 'dagre').then((data) => {
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

export default DagrelLayout
