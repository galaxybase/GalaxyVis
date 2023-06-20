import { basicData, globalInfo } from '../../initial/globalProp'
import { AnimateType, LAYOUT_MESSAGE, PlainObject } from '../../types'
// @ts-ignore
import LayoutWorker from 'worker-loader?inline=fallback!../../utils/layouts/layouts.worker'
import { EventType } from '../../utils/events'
import { localComputation } from '../../utils/layouts/common'
import { animation } from '../animation'
import BaseLayout from '../baseLayout'
import gridLayout from './grid'

class GridsLayout extends BaseLayout {
    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
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
            nodeList.forEach((values: any, key: string) => {
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
            } catch { }
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
                ; (width = localWidth), (height = localHeight), (center = localCenter)
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
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids: nodesList,
                name: 'grid',
                type: LAYOUT_MESSAGE.START,
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

            if(this.galaxyvis.geo.enabled()){
                console.warn("Geo mode does not allow the use of layouts")
                return resolve(void 0)
            }

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
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, nodesList, 'grid').then((data) => {
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
                    this.execute(gridsObj)
                    animation(this, null, gridsObj.nodesList, 'grid').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }
}

export default GridsLayout
