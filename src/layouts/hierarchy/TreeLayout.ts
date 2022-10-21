import { AnimateType, LAYOUT_MESSAGE } from '../../types'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { EventType } from '../../utils/events'
import { unionEdges } from '../../utils/layouts/common'
import { BFSTree } from '../../utils/layouts/bfsTree'
import tree from './tree'
import hierarchy from './hierarchy'
import { animation } from '../animation'
import BaseLayout from '../baseLayout'

class TreeLayout extends BaseLayout {
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
            nodeList.forEach((values: any, key: any) => {
                layoutsNodes.push(key)
            })
        } else {
            layoutsNodes = nodes
        }

        // 那些边是需要传入计算引力的
        let { layoutsEdges } = unionEdges(this.galaxyvis, layoutsNodes)

        let linksBak: any = layoutsEdges.concat()
        let nodesBak: any = layoutsNodes
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
                name: 'tree',
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
     * 处理数据
     * @param nodesBak
     * @param linksBak
     * @returns
     */
    initTree(nodesBak: any, linksBak: any) {
        let lis: any = []
        let allNodes = nodesBak
        try {
            BFSTree(nodesBak, lis, linksBak, allNodes)
            nodesBak = nodesBak.filter((item: any) => {
                return !item.used
            })
        } catch (error: any) {
            throw new Error(error)
        }
        let result: any = []
        result = {
            id: 'hierarchy_used_readOnly_by_cl',
            children: nodesBak,
        }
        return result
    }

    /**
     * 执行布局
     * @param result
     */
    execute(result: any) {
        let treeSimulation = tree()
        let { treeWidth, treeHeight } = this.options
        let width = treeWidth || 100
        let height = treeHeight || 300
        treeSimulation.nodeSize([width, height])
        let hierarchyData = hierarchy(result)
        // @ts-ignore
        let treeData = treeSimulation(hierarchyData)
        let nodeDescendants: any = treeData.descendants()
        let trees: { [key: string]: { x: number; y: number } } = {}

        this.ids = []
        this.positions = []

        for (let i = 1, len = nodeDescendants.length; i < len; i++) {
            let { data, x, y } = nodeDescendants[i]
            let id: string | number = data?.id
            trees[id] = {
                x: x - width,
                y: y - height,
            }
            this.options?.incremental && this.ids.push(id)
            this.options?.incremental && this.positions.push({ ...trees[id], id })
        }
        this.data = trees
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
                let allNodes = nodesBak
                // @ts-ignore
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: nodesBak,
                    edges: linksBak,
                    layoutCfg: {
                        type: 'tree',
                        options: this.options,
                        width: this.options.treeWidth || 100,
                        height: this.options.treeHeight || 300,
                        allNodes,
                    },
                })

                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, layoutsNode, 'tree').then((data) => {
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
                    animation(this, null, layoutsNode, 'tree').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }
}

export default TreeLayout
