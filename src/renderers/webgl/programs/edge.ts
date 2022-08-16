import { AbstractEdgeProgram } from './common/edge'
import vertexShaderSource from '../shaders/edge.vert.glsl'
import fragmentShaderSource from '../shaders/edge.frag.glsl'
import { glMatrix, mat4 } from 'gl-matrix'
import { EdgeCollection } from '../../../types'
import { basicData, globalProp } from '../../../initial/globalProp'

let edgeCollection: EdgeCollection = {}
const edgeGroups = globalProp.edgeGroups
const defaultGroup = 2

export default class EdgeProgram extends AbstractEdgeProgram {
    constructor(gl: WebGLRenderingContext) {
        super(gl, vertexShaderSource, fragmentShaderSource)
        // 视图矩阵和透视矩阵
        const projectMatirxLocation = gl.getUniformLocation(this.program, 'projection')
        if (projectMatirxLocation == null) throw new Error('edge: 获取不到projectionMatrix')
        this.projectMatirxLocation = projectMatirxLocation

        const viewMatrixLocation = gl.getUniformLocation(this.program, 'aXformMatrix')
        if (viewMatrixLocation == null) throw new Error('edge: 获取不到viewMatrix')
        this.viewMatrixLocation = viewMatrixLocation
    }

    initCollection(num = 0, plotNum = 0) {
        edgeCollection[this.graph.id] = {
            drawNum: 0,
            spInformation: new Set(),
            informationNewEdge: new Map(),
            color: new Float32Array(num * 2),
            width: new Float32Array(num),
            col14row2: new Float32Array(num * edgeGroups * 5),

            plotTwoDrawNum: 0,
            plotsTwoColor: new Float32Array(plotNum * 2),
            plotsTwoWidth: new Float32Array(plotNum),
            plotsTwoC42: new Float32Array(plotNum * defaultGroup * 5),
            plotsInformation: new Set(),
        }
    }

    initData(graph: any): void {
        this.graph = graph
        this.camera = graph.camera
        this.initCollection()
    }

    async process(Partial: boolean): Promise<void> {
        let { selectedTable: needFresh } = basicData[this.graph.id]
        // 获取线集合
        let {
            lineDrawCount: edgeArray,
            num,
            plotNum,
        } = this.graph.getEdgeWithArrow(Partial, needFresh)
        // 初始化缓存
        this.initCollection(num, plotNum)
        let collection = edgeCollection[this.graph.id]
        if (!edgeArray.length) {
            edgeCollection[this.graph.id] = collection
            return
        }
        let DrawCall41 = 0,
            DrawCall2 = 0
        edgeArray.forEach((item: any[]) => {
            let r1 = item[1].length,
                r2 = item[2].length
            if (item[4] == globalProp.edgeGroups) {
                let rc = 2 * DrawCall41
                for (let i = 0; i < 2; i++) {
                    collection.color[rc + i] = item[0][i]
                }
                let rx = DrawCall41
                for (let i = 0; i < r1; i++) {
                    collection.width[rx + i] = item[1][i]
                }
                let ry = 5 * item[4] * DrawCall41
                for (let i = 0; i < r2; i++) {
                    collection.col14row2[ry + i] = item[2][i]
                }
                collection.spInformation.add(item[3])
                collection.drawNum++
                DrawCall41++
            } else {
                let rc = 2 * DrawCall2
                for (let i = 0; i < 2; i++) {
                    collection.plotsTwoColor[rc + i] = item[0][i]
                }
                let rx = DrawCall2
                for (let i = 0; i < r1; i++) {
                    collection.plotsTwoWidth[rx + i] = item[1][i]
                }
                let ry = 5 * item[4] * DrawCall2
                for (let i = 0; i < r2; i++) {
                    collection.plotsTwoC42[ry + i] = item[2][i]
                }
                collection.plotsInformation.add(item[3])
                collection.plotTwoDrawNum++
                DrawCall2++
            }
        })
        edgeCollection[this.graph.id] = collection
        // 绘制
        if (collection.color.length) {
            this.bind(
                {
                    color: new Float32Array(collection.color),
                    width: new Float32Array(collection.width),
                    col14row2: collection.col14row2,
                },
                edgeGroups,
            )
            this.render(edgeGroups)
        }

        if (collection.plotsTwoColor.length) {
            this.bind(
                {
                    color: new Float32Array(collection.plotsTwoColor),
                    width: new Float32Array(collection.plotsTwoWidth),
                    col14row2: collection.plotsTwoC42,
                },
                defaultGroup,
            )
            this.render(defaultGroup)
        }
    }

    refreshProcess(): void {
        let collection = edgeCollection[this.graph.id]
        let flag = false
        // 如果存在缓存则直接使用缓存
        if (collection?.color.length) {
            this.bind(
                {
                    color: new Float32Array(collection.color),
                    width: new Float32Array(collection.width),
                    col14row2: collection.col14row2,
                },
                edgeGroups,
            )
            this.render(edgeGroups)
            flag = true
        }

        if (collection?.plotsTwoColor.length) {
            this.bind(
                {
                    color: new Float32Array(collection.plotsTwoColor),
                    width: new Float32Array(collection.plotsTwoWidth),
                    col14row2: collection.plotsTwoC42,
                },
                defaultGroup,
            )
            this.render(defaultGroup)
            flag = true
        }

        if (flag) return

        if (!this.graph.thumbnail) {
            this.process(false)
        }
    }

    clear(): void {
        this.initCollection()
        delete edgeCollection[this.graph.id]
    }

    render(edgeGroups: number = globalProp.edgeGroups): void {
        const gl = this.gl
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
        let drawNum =
            edgeGroups == globalProp.edgeGroups
                ? edgeCollection[this.graph.id].drawNum
                : edgeCollection[this.graph.id].plotTwoDrawNum
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, edgeGroups * drawNum)
    }
}
