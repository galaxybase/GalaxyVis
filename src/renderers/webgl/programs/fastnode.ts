import vertexShaderSource from '../shaders/node.fast.vert.glsl'
import fragmentShaderSource from '../shaders/node.fast.frag.glsl'
import { glMatrix, mat4 } from 'gl-matrix'
import { coordTransformation, floatColor, isSameSet } from '../../../utils'
import { basicData, globalProp } from '../../../initial/globalProp'
import { NodeFastCollection } from '../../../types'
import clone from 'lodash/clone'
import { AbstractFastProgram } from './common/fast'

let fastnodeCollection: NodeFastCollection = {}
const ATTRIBUTES = 5;
export default class fastnodeProgram extends AbstractFastProgram {
    private oldUpdateNodes: Set<any>
    private len: number
    private plotting32Nodes: any
    private quad: any
    private boundBox: any

    constructor(gl: WebGLRenderingContext) {
        super(gl, vertexShaderSource, fragmentShaderSource)

        this.oldUpdateNodes = new Set()
        this.len = 0
        this.quad = {}
        // 视图矩阵和透视矩阵
        const projectMatirxLocation = gl.getUniformLocation(this.program, 'projection')
        if (projectMatirxLocation == null) throw new Error('Fast: 获取不到projectionMatrix')
        this.projectMatirxLocation = projectMatirxLocation

        const viewMatrixLocation = gl.getUniformLocation(this.program, 'aXformMatrix')
        if (viewMatrixLocation == null) throw new Error('Fast: 获取不到viewMatrix')
        this.viewMatrixLocation = viewMatrixLocation
        // 开启拓展
        this.ext = this.gl.getExtension('ANGLE_instanced_arrays')
    }

    initCollection(size = 0) {
        fastnodeCollection[this.graph.id] = {
            floatData: new Float32Array(size), //打包的数据
        }
    }

    initData(graph: any): void {
        this.graph = graph
        this.camera = graph.camera
        this.initCollection()
    }

    process(): void {
        // 获取当前点列表
        const graphId = this.graph.id
        const nodeList: Map<any, any> = basicData[graphId].nodeList
        let needFresh = basicData[graphId].selectedTable

        let boundBox: any = new Map()
        let drawNodeList: any = new Map()
        let float32Nodes: any = new Map()
        let updateNodes: any = new Map()

        for (let [key, val] of nodeList) {
            let value = val.value
            let attributes = value.attribute
            // 对部分数据过滤及处理
            if (attributes?.isVisible) {
                drawNodeList.set(key, { badges: false, })
                if (!needFresh.size || !needFresh.has(key)) float32Nodes.set(key, value)
            }
        }

        for (let item of needFresh) {
            let node = nodeList.get(item)
            if (!node) continue
            let value = node.value
            let attributes = value.attribute
            if (attributes?.isVisible) {
                updateNodes.set(item, value)
            }
        }

        this.initCollection(drawNodeList.size * ATTRIBUTES)
        let collection = fastnodeCollection[graphId]
        let len = 0
        let flag = true;
        if (!this.graph.mouseCaptor?.draggable || !this.graph.textStatus) {
            if (updateNodes.size) {
                for (let [key, value] of updateNodes) float32Nodes.set(key, value)
            }
            needFresh = new Set();
            flag = false
        }

        if (!needFresh.size || !isSameSet(needFresh, this.oldUpdateNodes)) {
            if (needFresh.size) {
                this.oldUpdateNodes = clone(needFresh)
            } else {
                this.oldUpdateNodes = new Set()
            }
            this.quad = {};
            this.boundBox = null;
            this.plotting32Nodes = null;
            let plottingInfo = this.plottingNodes(float32Nodes, len)
            boundBox = plottingInfo.boundBox;
            if (flag) {
                this.boundBox = boundBox
                this.len = len = plottingInfo.len;
                this.plotting32Nodes = collection.floatData
            }
        }

        if (needFresh.size) {
            (collection.floatData as Float32Array).set(this.plotting32Nodes, 0)
            for (let key in this.quad) {
                if (nodeList.get(key)?.getAttribute('isVisible'))
                    this.camera.quad.add(this.quad[key])
            }
            boundBox = this.boundBox
            let plottingInfo = this.plottingNodes(updateNodes, this.len)
            let plottingBoundBox = plottingInfo.boundBox;
            for (let [key, item] of plottingBoundBox) {
                boundBox.set(key, item)
            }
        }

        if (!collection.floatData.length) {
            fastnodeCollection[graphId] = collection
            return
        }

        // 更新数据
        !this.graph.thumbnail && (basicData[graphId].drawNodeList = drawNodeList)
        !this.graph.thumbnail && (basicData[graphId].boundBox = boundBox)

        boundBox = null
        drawNodeList = null
        float32Nodes = null
        updateNodes = null
        fastnodeCollection[graphId] = collection

        if (collection?.floatData?.length) {
            this.bind(collection.floatData)
            this.render()
        }
    }

    plottingNodes(float32Nodes: Map<string, any>, len: number) {
        const graphId = this.graph.id
        const transform = basicData[graphId].transform
        let collection = fastnodeCollection[graphId]
        let boundBox: any = new Map()

        for (let [key, val] of float32Nodes) {
            const value = val
            const attributes = value.attribute
            let p: any = getFastAttribute(graphId, attributes, transform)
            boundBox.set(key, {
                xmax: 0.1 * p.zoomResults + p.offsets[0],
                xmin: -0.1 * p.zoomResults + p.offsets[0],
                ymax: 0.1 * p.zoomResults + p.offsets[1],
                ymin: -0.1 * p.zoomResults + p.offsets[1],
                // 确定包围盒后 用来判断是否在图形里面
                radius: p.zoomResults * 0.1,
                num: value.num,
                shape: attributes.shape,
            })
            if (this.graph.textStatus && !this.graph.thumbnail) {
                this.quad[key] = {
                    x: p.offsets[0],
                    y: p.offsets[1],
                    height: p.zoomResults * 0.2,
                    width: p.zoomResults * 0.2,
                    id: key,
                    isNode: true,
                    shape: attributes.shape,
                }
                this.camera.quad.add(this.quad[key])
            }
            // 打包数据 => 变成vec4这类的
            const Buffer = packCircleVertex(p)
            for (let i = 0; i < 5; i++) {
                collection.floatData[len + i] = Buffer[i]
            }
            len += ATTRIBUTES
            p = null
        }

        return {
            len, boundBox
        }
    }

    refreshProcess(): void {
        // 如果有缓存则使用缓存更新
        let collection = fastnodeCollection[this.graph.id]
        let flag = false
        if (collection?.floatData?.length) {
            this.bind(collection?.floatData)
            this.render()
            flag = true
        }
        if (flag) return

        if (!this.graph.thumbnail) {
            this.process()
        }
    }

    clear(): void {
        this.initCollection()
        delete fastnodeCollection[this.graph.id]
        this.quad = {};
        this.boundBox = null;
        this.plotting32Nodes = null;
        // @ts-ignore
        this.oldUpdateNodes = null;
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

        let drawNum = fastnodeCollection[this.graph.id].floatData.length / ATTRIBUTES

        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, drawNum)
    }
}

const getFastAttribute = (graphId: string, data: any, transform: number) => {
    let { x, y, radius, color, opacity } = data

    // 真实的r比例
    let zoomResults: number = Math.ceil((radius / globalProp.standardRadius) * 1e2) / 1e2
    // 偏移量
    let offsets: number[] = coordTransformation(graphId, x, y, transform)
    // 颜色
    color = [floatColor(color).rgb, opacity]

    return {
        offsets,
        color,
        zoomResults,
    }
}

const packCircleVertex = (p: any) => {
    return [
        ...p.offsets,
        p.zoomResults,
        ...p.color
    ]
}