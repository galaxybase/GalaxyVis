import { AbstractSDFProgram } from './common/sdfText'
import vertexShaderSource from '../shaders/text.vert.glsl'
import fragmentShaderSource from '../shaders/text.frag.glsl'
import { sdfDrawTextNew } from '../../../utils/tinySdf/sdfDrawText'
import { glMatrix, mat4 } from 'gl-matrix'
import { EdgeLabelCollection, NodeLabelCollection } from '../../../types'
import { globalProp, basicData } from '../../../initial/globalProp'
import { isInSceen } from '../../../utils'

let drawNum: number = 0

let nodeLabelCollection: NodeLabelCollection = {}

let edgeLabelCollection: EdgeLabelCollection = {}

const ATTRIBUTES = 18

export default class SdfTextProgram extends AbstractSDFProgram {
    constructor(gl: WebGLRenderingContext) {
        super(gl, vertexShaderSource, fragmentShaderSource)
        // 透视矩阵和视图矩阵
        const projectMatirxLocation = gl.getUniformLocation(this.program, 'projection')
        if (projectMatirxLocation == null) throw new Error('Text: 获取不到projectionMatrix')
        this.projectMatirxLocation = projectMatirxLocation

        const viewMatrixLocation = gl.getUniformLocation(this.program, 'aXformMatrix')
        if (viewMatrixLocation == null) throw new Error('Text: 获取不到viewMatrix')
        this.viewMatrixLocation = viewMatrixLocation

        const zoomLevelLocation = gl.getUniformLocation(this.program, 'zoomLevel')
        if (zoomLevelLocation == null) throw new Error('Text: 获取不到zoomLevel')
        this.zoomLevelLocation = zoomLevelLocation
    }

    initNodeCollection(size = 0) {
        nodeLabelCollection[this.graph.id] = {
            labelFloat32Array: new Float32Array(size),
        }
    }

    initEdgeCollection() {
        edgeLabelCollection[this.graph.id] = {
            labelFloat32Array: new Float32Array(),
        }
    }

    initData(graph: any): void {
        this.graph = graph
        this.camera = graph.camera
        this.initNodeCollection()
        this.initEdgeCollection()
    }

    processNode() {
        if (this.graph.thumbnail) {
            return
        }
        this.initNodeCollection()
        // 获取点列表
        const graphId = this.graph.id
        const nodeList: Map<string, any> = basicData[graphId].nodeList
        const drawNodeList = basicData[graphId].drawNodeList
        let collection = nodeLabelCollection[graphId]
        let drawNodeLableList = new Map()
        let float32Labels: any = new Map()
        const scale = globalProp.globalScale / this.camera.ratio
        let labelLength = 0
        for (let [key, val] of drawNodeList) {
            let value = nodeList.get(key)?.value
            let attribute = value?.attribute
            if (attribute?.isVisible) {
                let text = attribute.text
                let content = text.content
                if (
                    !(content == '' || content == null || content == undefined) &&
                    text.minVisibleSize < Math.ceil(text.fontSize * scale * 1e2) / 1e2 &&
                    isInSceen(
                        graphId,
                        'webgl',
                        this.camera.ratio,
                        this.camera.position,
                        attribute,
                        1,
                    )
                ) {
                    float32Labels.set(key, value)
                    labelLength += content.length
                }
            }
        }
        // 初始化缓存
        if (!labelLength || !collection) return
        drawNodeLableList = float32Labels
        this.initNodeCollection(ATTRIBUTES * labelLength)
        collection.labelFloat32Array = new Float32Array(ATTRIBUTES * labelLength)
        let floatArrayLength = 0
        for (let [key, val] of float32Labels) {
            const value = val
            const attribute = value.attribute
            let p = sdfDrawTextNew(graphId, attribute, 0, 1)
            collection.labelFloat32Array.set(p, floatArrayLength)
            floatArrayLength += p.length
        }

        basicData[graphId].drawNodeLableList = drawNodeLableList
        // 绘制
        nodeLabelCollection[graphId] = collection
        drawNum = labelLength
        this.bind(collection.labelFloat32Array)
        this.render()
    }

    refreshProcess(): void {
        this.processNode()
        return
    }

    moveProcessNode() {
        const graphId = this.graph.id
        const drawNodeLableList = basicData[graphId].drawNodeLableList
        if (this.graph.thumbnail || !drawNodeLableList.size) {
            return
        }
        let collection = nodeLabelCollection[graphId]
        let floatArrayLength = 0
        for (let [key, val] of drawNodeLableList) {
            const value = val
            const attribute = value.attribute
            let p = sdfDrawTextNew(graphId, attribute, 0, 1)
            collection.labelFloat32Array.set(p, floatArrayLength)
            floatArrayLength += p.length
        }
        nodeLabelCollection[graphId] = collection
        drawNum = collection.labelFloat32Array.length / ATTRIBUTES
        this.bind(collection.labelFloat32Array)
        this.render()
    }

    processEdge() {
        if (this.graph.thumbnail) {
            return
        }
        this.initEdgeCollection()
        // 获取绘制边
        const graphId = this.graph.id
        const drawEdgeList = basicData[graphId].informationNewEdge
        let float32Labels: any = new Map()
        let collection = edgeLabelCollection[graphId]
        let drawEdgeLableList = new Map()
        let eSize = drawEdgeList.size
        if (!eSize) {
            edgeLabelCollection[graphId] = collection
            return
        }
        const scale = globalProp.globalScale / this.camera.ratio
        let labelLength = 0
        for (let [key, val] of drawEdgeList) {
            let text = val.text
            if (
                val.hasContent &&
                val.opacity > 0.0 &&
                text.minVisibleSize < Math.ceil(text.fontSize * scale * 1e2) / 1e2
            ) {
                float32Labels.set(key, val)
                labelLength += val.text.content.length
            }
        }
        if (!labelLength) return
        drawEdgeLableList = float32Labels
        basicData[graphId].drawEdgeLableList = drawEdgeLableList
        this.initNodeCollection(ATTRIBUTES * labelLength)
        collection.labelFloat32Array = new Float32Array(ATTRIBUTES * labelLength)
        let floatArrayLength = 0
        for (let [key, val] of float32Labels) {
            let p = sdfDrawTextNew(graphId, val, val.ANGLE, 2)
            collection.labelFloat32Array.set(p, floatArrayLength)
            floatArrayLength += p.length
        }

        // 绘制
        edgeLabelCollection[graphId] = collection
        drawNum = labelLength
        this.bind(collection.labelFloat32Array)
        this.render()
    }

    refreshProcessEdge(): void {
        this.processEdge()
        return
    }

    moveProcessEdge() {
        const graphId = this.graph.id
        const drawEdgeLableList = basicData[graphId].drawEdgeLableList
        const drawEdgeList = basicData[graphId].informationNewEdge
        if (this.graph.thumbnail || !drawEdgeLableList.size) {
            return
        }
        let collection = edgeLabelCollection[graphId]
        let floatArrayLength = 0
        for (let [key, val] of drawEdgeList) {
            let p = sdfDrawTextNew(graphId, val, val.ANGLE, 2)
            collection.labelFloat32Array.set(p, floatArrayLength)
            floatArrayLength += p.length
        }

        edgeLabelCollection[graphId] = collection
        drawNum = collection.labelFloat32Array.length / ATTRIBUTES
        this.bind(collection.labelFloat32Array)
        this.render()
    }

    // 清除缓存
    clear(): void {
        drawNum = 0
        this.initNodeCollection()
        delete nodeLabelCollection[this.graph.id]
        this.initEdgeCollection()
        delete edgeLabelCollection[this.graph.id]
    }

    render(): void {
        if (this.graph.thumbnail === true) return
        const gl = this.gl
        const ext = this.ext
        const program = this.program
        const projection = mat4.perspective(
            mat4.create(),
            glMatrix.toRadian(this.camera.zoom),
            gl.canvas.width / gl.canvas.height,
            0.1,
            100,
        )
        const view = this.camera.getViewMatrix()
        const scale = (globalProp.globalScale / this.camera.ratio) * 2.0
        // 视图矩阵 * 透视矩阵
        gl.useProgram(program)
        gl.uniform1f(this.zoomLevelLocation as WebGLUniformLocation, scale)
        gl.uniformMatrix4fv(this.projectMatirxLocation, false, projection)
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, view)
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, drawNum)
    }
}
