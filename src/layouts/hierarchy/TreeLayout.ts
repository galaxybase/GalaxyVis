import { AnimateType } from '../../types'
import { animateNodes } from '../../utils/graphAnimate'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { EventType } from '../../utils/events'
import { unionEdges } from '../../utils/layouts/common'
import { BFSTree } from '../../utils/layouts/bfsTree'
import { incrementalLayout } from '../incremental'
import tree from './tree'
import hierarchy from './hierarchy'
import NodeList from '../../classes/nodeList'

class TreeLayout {
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
            'layoutStart',
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'tree',
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
                                        name: 'tree',
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
                                    name: 'tree',
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

export default TreeLayout
