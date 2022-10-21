import { globalInfo } from '../../initial/globalProp'
import { AnimateType, LAYOUT_MESSAGE } from '../../types'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import { EventType } from '../../utils/events'
import circularLayout from './circular/circular'
import { animation } from '../animation'
import BaseLayout from '../baseLayout'

class CircularLayout extends BaseLayout {
    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
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
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids: layoutsNodes,
                name: 'circle',
                type: LAYOUT_MESSAGE.START,
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

            if(this.galaxyvis.geo.enabled()){
                console.warn("Geo mode does not allow the use of layouts")
                return resolve(void 0)
            }

            let layoutsNodes = await this.init()
            const id = this.galaxyvis.id
            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                let worker = new LayoutWorker()
                let that = this
                worker.postMessage({
                    nodes: layoutsNodes,
                    layoutCfg: {
                        type: 'circular',
                        options: this.options,
                        width: globalInfo[id].canvasBox.width,
                        height: globalInfo[id].canvasBox.height,
                    },
                })
                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, layoutsNodes, 'circle').then((data) => {
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
                    this.execute(layoutsNodes)
                    animation(this, null, layoutsNodes, 'circle').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }
}

export default CircularLayout
