import vertexShaderSource from '../shaders/node.fast.vert.glsl'
import fragmentShaderSource from '../shaders/node.fast.frag.glsl'
import { glMatrix, mat4 } from 'gl-matrix'
import { AbstractHaloProgram } from './common/halo'
import { coordTransformation, floatColor } from '../../../utils'
import { basicData, globalProp } from '../../../initial/globalProp'
import edgeHaloProgram from './edgeHalo'
import { NodeHaloCollection } from '../../../types'

let nodeHaloCollection: NodeHaloCollection = {}

export default class HaloProgram extends AbstractHaloProgram {
    private edgeHaloProgram!: edgeHaloProgram

    constructor(gl: WebGLRenderingContext) {
        super(gl, vertexShaderSource, fragmentShaderSource)
        // 视图矩阵和透视矩阵
        const projectMatirxLocation = gl.getUniformLocation(this.program, 'projection')
        if (projectMatirxLocation == null) throw new Error('Halo: 获取不到projectionMatrix')
        this.projectMatirxLocation = projectMatirxLocation

        const viewMatrixLocation = gl.getUniformLocation(this.program, 'aXformMatrix')
        if (viewMatrixLocation == null) throw new Error('Halo: 获取不到viewMatrix')
        this.viewMatrixLocation = viewMatrixLocation

        this.edgeHaloProgram = new edgeHaloProgram(gl)
    }

    initCollection() {
        nodeHaloCollection[this.graph.id] = {
            aOffsetData: [],
            floatColorData: [],
            resultsData: [],
        }
    }

    initData(graph: any): void {
        this.graph = graph
        this.camera = graph.camera
        this.initCollection()
        this.edgeHaloProgram.initData(graph)
    }

    process(): void {
        // 获取点列表
        const graphId = this.graph.id
        let nodeList = basicData[graphId].nodeList
        this.initCollection()
        let collection = nodeHaloCollection[graphId]

        for (let [key, value] of nodeList) {
            // 获取点属性
            let data = value.getAttribute()
            // 如果被隐藏则跳过
            if (!data || !data.isVisible) continue
            // 获取点Halo
            let renderHalo = data.halo
            // 如果宽度为0则跳过
            if (renderHalo?.width == 0 || !renderHalo) continue
            let item = getHaloAttribute(graphId, data)

            collection.aOffsetData.push(...item.offset)
            collection.resultsData.push(item.zoomResults)
            collection.floatColorData.push(...item.color)
        }

        if (collection?.aOffsetData?.length) {
            nodeHaloCollection[graphId] = collection
            this.bind({
                aOffsetData: collection.aOffsetData, //vec2
                resultsData: collection.resultsData, //float
                floatColorData: collection.floatColorData, //vec2
            })
            this.render()
        }

        this.edgeHaloProgram.process()
    }

    refreshProcess(): void {
        // 如果有缓存则使用缓存更新
        let collection = nodeHaloCollection[this.graph.id]
        if (collection?.aOffsetData?.length) {
            this.bind({
                aOffsetData: collection.aOffsetData, //vec2
                resultsData: collection.resultsData, //float
                floatColorData: collection.floatColorData, //vec2
            })
            this.render()
        }
        this.edgeHaloProgram.refreshProcess()
    }

    moveProcess(): void {
        let { selectedTable: needFresh, drawNodeList, nodeList } = basicData[this.graph.id]

        let count = 0,
            needCounts: any = []
        let NowMap = new Map()
        if (!needFresh.size) {
            this.refreshProcess()
            this.edgeHaloProgram.moveRefresh()
            return
        }

        // 根据需要跟新的表找到相应的位置
        needFresh.forEach((val: any, key: any) => {
            count = 0
            for (let [keys, val] of drawNodeList) {
                if (keys == key) {
                    let node = nodeList.get(key)
                    let renderHalo = node?.getAttribute('halo')
                    if (node?.getAttribute('isVisible') && renderHalo && renderHalo.width != 0) {
                        needCounts.push(count)
                    }
                    return
                } else {
                    count++
                }
            }
        })
        if (!needCounts.length) {
            this.refreshProcess()
            this.edgeHaloProgram.moveRefresh()
            return
        }

        this.process()
        this.edgeHaloProgram.moveRefresh()
        return
        // 有bug
        // needCounts = needCounts.sort((a: any, b: any) => {
        //     return a - b
        // })
        // needFresh.forEach((value: any, key: any) => {
        //     let renderHalo = nodeList.get(key)?.getAttribute("halo")
        //     if (nodeList.get(key)?.getAttribute("isVisible")
        //         && renderHalo && renderHalo.width != 0
        //     ) {
        //         let node = nodeList.get(value),
        //             data = node.getAttribute()
        //         let item = getHaloAttribute(data)
        //         NowMap.set(key, {
        //             offset: item.offset,  //vec3
        //             zoomResults: item.zoomResults, //float
        //             color: item.color //vec2
        //         })
        //     }
        // })

        // for (let i = needCounts.length - 1; i >= 0; i--) {
        //     aOffsetData.splice(needCounts[i] * 3, 3)
        //     resultsData.splice(needCounts[i] * 1, 1)
        //     floatColorData.splice(needCounts[i] * 2, 2)
        // }

        // for (let [key, val] of NowMap) {
        //     aOffsetData.push(...val.offset)
        //     resultsData.push(val.zoomResults)
        //     floatColorData.push(...val.color)
        // }

        // nodeHaloInfo = {
        //     aOffsetData,
        //     resultsData,
        //     floatColorData
        // }
        // if (nodeHaloInfo?.aOffsetData?.length) {
        //     this.bind(nodeHaloInfo)
        //     this.render()
        // }
        // this.edgeHaloProgram.moveRefresh()
    }

    clear(): void {
        this.initCollection()
        this.edgeHaloProgram.clear()
    }

    render(): void {
        const gl = this.gl
        const program = this.program
        const ext = this.ext
        const projection = mat4.perspective(
            mat4.create(),
            glMatrix.toRadian(this.camera.zoom),
            gl.canvas.width / gl.canvas.height,
            0.1,
            100,
        )
        const view = this.camera.getViewMatrix()
        // 视图矩阵 * 透视矩阵
        gl.uniformMatrix4fv(this.projectMatirxLocation, false, projection)
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, view)
        gl.useProgram(program)

        let drawNum = nodeHaloCollection[this.graph.id].floatColorData.length / 2

        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, drawNum)
    }
}

const getHaloAttribute = (graphId: string, data: any) => {
    let { x, y, radius, halo, opacity } = data

    let { color, width } = halo

    let haloRadius = Number(radius) + width / 2

    // 真实的r比例
    let zoomResults: number = parseFloat((haloRadius / globalProp.standardRadius).toFixed(1))
    // 偏移量
    let offsets: number[] = coordTransformation(graphId, x, y)
    // 颜色
    color = [floatColor(color).rgb, opacity]

    return {
        offset: offsets,
        color,
        zoomResults,
    }
}
