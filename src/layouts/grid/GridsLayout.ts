import { basicData, globalInfo } from '../../initial/globalProp'
import { AnimateType, PlainObject } from '../../types'
import { animateNodes } from '../../utils/graphAnimate'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { EventType } from '../../utils/events'
import { localComputation } from '../../utils/layouts/common'
import { incrementalLayout } from '../incremental'
import NodeList from '../../classes/nodeList'
import gridLayout from './grid/gridLayout'

class GridsLayout {
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
            center: number[] = []
        let layoutsNodes = []
        let { nodes, sortBy, width: GridWidth, height: GridHeight } = this.options,
            width,
            height

        if (!nodes || nodes?.length == nodeList?.size || nodes.length == 0) {
            nodeList.forEach((values: any, key: any) => {
                layoutsNodes.push({ key, value: values.value })
            })
            width = globalInfo[this.galaxyvis.id].BoxCanvas.getWidth
            height = globalInfo[this.galaxyvis.id].BoxCanvas.getHeight
            center = [width / 2, height / 2]
            try {
                if (nodes?.length == 1 || nodeList?.size == 1) {
                    let value = nodes ? nodeList.get(nodes[0]) : nodeList.values().next().value,
                        x = value.getAttribute('x'),
                        y = value.getAttribute('y')
                    center = [x, y]
                }
            } catch {}
        } else {
            for (let i in nodes) {
                layoutsNodes.push({
                    key: nodes[i],
                    value: nodeList.get(nodes[i]).value,
                })
            }
            let {
                width: localWidth,
                height: localHeight,
                center: localCenter,
            } = localComputation(this.galaxyvis.id, nodes, 'grid')
            ;(width = localWidth), (height = localHeight), (center = localCenter)
            if (nodes.length == 1) {
                let value = nodeList.get(nodes[0]),
                    x = value.getAttribute('x'),
                    y = value.getAttribute('y')
                center = [x, y]
            }
        }

        if (sortBy) {
            layoutsNodes = layoutsNodes.sort(sortBy)
        }

        GridWidth && (width = GridWidth)
        GridHeight && (height = GridHeight)

        let nodesList: any[] = []

        layoutsNodes.forEach(item => {
            nodesList.push(item.key)
        })

        this.galaxyvis.events.emit(
            'layoutStart',
            EventType.layoutStart({
                ids: nodesList,
                name: 'grid',
                type: 'layoutStart',
            }),
        )

        return {
            width,
            height,
            center,
            nodesList,
        }
    }

    /**
     * 执行布局
     * @param gridObj
     */
    execute(gridObj: any) {
        let grid: PlainObject<any> = {}
        let { width, height, center, nodesList } = gridObj
        let { cols, rows, columns } = this.options
        this.ids = []
        this.positions = []
        if (nodesList.length != 1) {
            grid = gridLayout(nodesList, {
                cols,
                rows,
                columns,
                box: {
                    width,
                    height,
                },
            })

            for (let i in grid) {
                grid[i].x = grid[i].x - center[0]
                grid[i].y = grid[i].y - center[1]
                this.options?.incremental && this.ids.push(i)
                this.options?.incremental && this.positions.push({ ...grid[i], id: i })
            }
        } else {
            grid[nodesList[0]] = {
                x: basicData[this.galaxyvis.id].nodeList.get(nodesList[0]).getAttribute('x'),
                y: basicData[this.galaxyvis.id].nodeList.get(nodesList[0]).getAttribute('y'),
            }
            this.options?.incremental && this.ids.push(nodesList[0])
            this.options?.incremental &&
                this.positions.push({ ...grid[nodesList[0]], id: nodesList[0] })
        }
        this.data = grid
    }

    /**
     * 布局
     * @returns
     */
    layout() {
        return new Promise(async (resolve, reject) => {
            let gridsObj = await this.init()

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                // @ts-ignore
                let worker = new LayoutWorker()
                let that = this
                let { width, height, center, nodesList } = gridsObj

                worker.postMessage({
                    nodes: nodesList,
                    layoutCfg: {
                        type: 'grid',
                        options: this.options,
                        width: width,
                        height: height,
                        center,
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
                                        ids: nodesList,
                                        name: 'grid',
                                        type: 'layoutEnd',
                                        postions: nodesList.map((item: string | number) => {
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
                    this.execute(gridsObj)

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
                                    ids: gridsObj.nodesList,
                                    name: 'grid',
                                    type: 'layoutEnd',
                                    postions: gridsObj.nodesList.map((item: string | number) => {
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

export default GridsLayout
