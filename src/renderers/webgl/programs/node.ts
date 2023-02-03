import vertexShaderSource from '../shaders/node.vert.glsl'
import fragmentShaderSource from '../shaders/node.frag.glsl'
import { AbstractNodeProgram } from './common/node'
import { packCircleVertex } from '../../../utils/node/floatPack'
import { glMatrix, mat4 } from 'gl-matrix'
import { getPoint } from '../../../utils/node/getPoint'
import { globalProp, basicData, thumbnailInfo } from '../../../initial/globalProp'
import { NodeCollection } from '../../../types'

let nodeCollection: NodeCollection = {}
const ATTRIBUTES = 11
export default class NodeProgram extends AbstractNodeProgram {
    constructor(gl: WebGLRenderingContext) {
        super(gl, vertexShaderSource, fragmentShaderSource)
        // 视图矩阵和透视矩阵
        const projectMatirxLocation = gl.getUniformLocation(this.program, 'projection')
        if (projectMatirxLocation == null) throw new Error('Node: 获取不到projectionMatrix')
        this.projectMatirxLocation = projectMatirxLocation

        const viewMatrixLocation = gl.getUniformLocation(this.program, 'aXformMatrix')
        if (viewMatrixLocation == null) throw new Error('Node: 获取不到viewMatrix')
        this.viewMatrixLocation = viewMatrixLocation
    }

    initCollection(size = 0) {
        nodeCollection[this.graph.id] = {
            packedData: new Float32Array(size), //打包的数据
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
        const transform = basicData[graphId]?.transform || 223
        const nodeList: Map<any, any> = basicData[graphId]?.nodeList || new Map()
        const needFresh = basicData[graphId]?.selectedTable || new Set()
        // 获取icon的列表
        const iconMap = globalProp.iconMap
        let boundBox: any = new Map()
        let drawNodeList: any = new Map()
        let float32Nodes: any = new Map()
        let updateNodes: any = new Map()

        for (let [key, val] of nodeList) {
            let value = val.value
            let attributes = value.attribute
            // 对部分数据过滤及处理
            if (attributes?.isVisible) {
                const isBadges = attributes.badges ? true : false
                drawNodeList.set(key, {
                    badges: isBadges,
                })
                if (isBadges) {
                    let badgesArray = Object.keys(attributes.badges)
                    for (let i = 0; i < badgesArray.length; i++) {
                        drawNodeList.set(`badges_${badgesArray[i]}` + key, {
                            badges: true,
                        })
                    }
                }
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

        if (updateNodes.size) {
            for (let [key, value] of updateNodes) float32Nodes.set(key, value)
        }

        this.initCollection(drawNodeList.size * ATTRIBUTES)
        let collection = nodeCollection[graphId]
        let len = 0
        for (let [key, val] of float32Nodes) {
            const value = val
            const attributes = value.attribute
            const isBadges = attributes.badges ? true : false
            let p: any = getPoint(graphId, attributes, iconMap, transform)
            if (this.graph.textStatus && !this.graph.thumbnail) {
                this.camera.quad.insert({
                    x: p.offsets[0],
                    y: p.offsets[1],
                    height: p.zoomResults * 0.2,
                    width: p.zoomResults * 0.2,
                    id: key,
                    isNode: true,
                    shape: attributes.shape,
                })
            }
            // 生成一个AABB的包围盒
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
            // 打包数据 => 变成vec4这类的
            const { packedBuffer, typesBuffer, offsetsBuffer, uvBuffer, colorBuffer } =
                packCircleVertex(p, this.camera)

            if (!isBadges) {
                for (let i = 0; i < 4; i++) {
                    collection.packedData[len + i] = packedBuffer[i]
                }
                for (let i = 0; i < 3; i++) {
                    collection.packedData[len + i + 4] = uvBuffer[i]
                }
                for (let i = 0; i < 2; i++) {
                    collection.packedData[len + i + 7] = offsetsBuffer[i]
                }
                collection.packedData[len + 9] = typesBuffer[0]
                collection.packedData[len + 10] = colorBuffer[0]
                len += 11
            } else {
                let badgesLength = 1 + Object.keys(attributes.badges).length
                for (let j = 0; j < badgesLength; j++) {
                    for (let i = 0 + j * 4, k = 0; i < 4 + j * 4; i++, k++) {
                        collection.packedData[len + k] = packedBuffer[i]
                    }
                    for (let i = 0 + j * 3, k = 0; i < 3 + j * 3; i++, k++) {
                        collection.packedData[len + k + 4] = uvBuffer[i]
                    }
                    for (let i = 0 + j * 2, k = 0; i < 2 + j * 2; i++, k++) {
                        collection.packedData[len + k + 7] = offsetsBuffer[i]
                    }
                    collection.packedData[len + 9] = typesBuffer[j]
                    collection.packedData[len + 10] = colorBuffer[j]
                    len += 11
                }
            }
            p = null
        }

        if (!collection.packedData.length) {
            nodeCollection[graphId] = collection
            return
        }

        // 更新数据
        !this.graph.thumbnail && (basicData[graphId].drawNodeList = drawNodeList)
        !this.graph.thumbnail && (basicData[graphId].boundBox = boundBox)
        nodeCollection[graphId] = collection
        // 绘制
        if (collection?.packedData?.length) {
            this.bind(collection.packedData)
            this.render()
        }
    }

    refreshProcess(): void {
        // 如果有缓存则使用缓存更新
        let collection = nodeCollection[this.graph.id]
        let flag = false
        if (collection?.packedData?.length) {
            this.bind(collection?.packedData)
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
        delete nodeCollection[this.graph.id]
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

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)    

        // 视图矩阵 * 透视矩阵
        gl.uniformMatrix4fv(this.projectMatirxLocation, false, projection)
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, view)
        gl.useProgram(program)
        let drawNum = nodeCollection[this.graph.id].packedData.length / ATTRIBUTES
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, drawNum)

        gl.blendFuncSeparate(
            gl.SRC_ALPHA,
            gl.ONE_MINUS_SRC_ALPHA,
            gl.ONE,
            gl.ONE_MINUS_SRC_ALPHA,
        )

    }
}
