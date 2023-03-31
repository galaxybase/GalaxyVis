import { AnimateType, LAYOUT_MESSAGE, PlainObject } from '../../types'
// @ts-ignore
import LayoutWorker from 'worker-loader!../../utils/layouts/layouts.worker'
import BaseLayout from '../baseLayout'
import { animation } from '../animation'
import neuralLayout from './neural'

class NeuralLayout extends BaseLayout {
    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
    }

    /**
     * 初始化数据
     * @returns
     */
    init() {
        let nodeList = this.galaxyvis.getFilterNode();
        let edgeList = this.galaxyvis.getFilterEdges();

        let {
            tagName, nodes
        } = this.options

        let layoutNodes: any[] = []
        let tagList: PlainObject<any> = {};
        let maxTagLen = 0;
        let newNodes = new Map(), newEdges = new Map();

        if (nodes && nodes?.length != nodeList?.size) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodeList.has(nodes[i]))
                    newNodes.set(nodes[i], nodeList.get(nodes[i]))
            }
            edgeList.forEach((edge: any, key: string) => {
                let source = edge.getSource();
                let target = edge.getTarget();
                let flag = true;
                if (source == "undefined" || target == "undefined") flag = false
                if (
                    source && target && flag &&
                    newNodes.has(source.getId()) &&
                    newNodes.has(target.getId())
                )
                    newEdges.set(key, edge)
            })
        } else {
            newNodes = nodeList;
            newEdges = edgeList;
        }


        newNodes.forEach((node: any, key: string) => {
            let tag = node.getData(tagName) || "galaxyVis_unknow_tag"
            tagList[tag] || (tagList[tag] = {
                degree: 0,
                arr: []
            });
            tagList[tag].arr.push({
                id: key,
                radius: node.getAttribute("radius")
            });
            maxTagLen = Math.max(maxTagLen, tagList[tag].arr.length);
            layoutNodes.push(key)
        })

        newEdges.forEach((edge: any, key: string) => {
            let source = edge.getSource();
            let target = edge.getTarget();
            let n = source.getData(tagName) || "galaxyVis_unknow_tag";
            tagList[n].degree++;
            n = target.getData(tagName) || "galaxyVis_unknow_tag";
            tagList[n].degree++
        })

        const rDegree = Object.keys(tagList);
        rDegree.sort(((e, a) => tagList[a].degree - tagList[e].degree));

        return {
            rDegree,
            layoutNodes,
            tagList,
            maxTagLen
        }
    }

    /**
     * 执行布局
     * @param 
     */
    execute(rDegree: string[], tagList: PlainObject<any>, maxTagLen: number) {
        this.data = neuralLayout(rDegree, tagList, maxTagLen)
        this.ids = []
        this.positions = []
        if (this.options?.incremental) {
            this.ids = Object.keys(this.data)
            for (let i in this.data) {
                this.positions.push({ ...this.data[i], id: i })
            }
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

            let { rDegree, layoutNodes, tagList, maxTagLen } = this.init()

            if (this.options.useWebWorker != false && typeof Worker !== 'undefined') {
                let worker = new LayoutWorker()
                let that = this

                worker.postMessage({
                    nodes: layoutNodes,
                    layoutCfg: {
                        type: 'neural',
                        options: {
                            rDegree,
                            maxTagLen,
                            tagList,
                            ...this.options
                        },
                    },
                })

                worker.onmessage = function (event: any) {
                    if (event.data.type == LAYOUT_MESSAGE.END) {
                        that.data = event.data.data
                        animation(that, event, layoutNodes, 'neural').then((data) => {
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
                    this.execute(rDegree, tagList, maxTagLen)
                    animation(this, null, layoutNodes, 'neural').then((data) => {
                        resolve(data)
                    })
                } catch (err) {
                    reject(LAYOUT_MESSAGE.ERROR)
                }
            }
        })
    }
}

export default NeuralLayout
