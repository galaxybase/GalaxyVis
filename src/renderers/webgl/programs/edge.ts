import { AbstractEdgeProgram } from './common/edge'
import vertexShaderSource from '../shaders/edge.vert.glsl'
import fragmentShaderSource from '../shaders/edge.frag.glsl'
import { glMatrix, mat4 } from 'gl-matrix'
import { EdgeCollection } from '../../../types'
import { basicData, globalProp } from '../../../initial/globalProp'
import { isSameSet } from '../../../utils'
import { clone } from 'lodash'

let edgeCollection: EdgeCollection = {}
const edgeGroups = globalProp.edgeGroups
const defaultGroup = 2

export default class EdgeProgram extends AbstractEdgeProgram {
    private oldUpdateEdges: Set<any>
    private DrawCall41: number
    private DrawCall2: number
    private color: any
    private width: any
    private col14row2: any
    private plotsTwoColor: any
    private plotsTwoWidth: any
    private plotsTwoC42: any
    private quad: any

    constructor(gl: WebGLRenderingContext) {
        super(gl, vertexShaderSource, fragmentShaderSource)

        this.oldUpdateEdges = new Set();
        this.DrawCall41 = 0
        this.DrawCall2 = 0
        this.quad = {}
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
            color: new Float32Array(num * 2),
            width: new Float32Array(num),
            col14row2: new Float32Array(num * edgeGroups * 5),

            plotsTwoColor: new Float32Array(plotNum * 2),
            plotsTwoWidth: new Float32Array(plotNum),
            plotsTwoC42: new Float32Array(plotNum * defaultGroup * 5),
        }
    }

    initData(graph: any): void {
        this.graph = graph
        this.camera = graph.camera
        this.initCollection()
    }

    process(Partial: boolean) {
        const graphId = this.graph.id;
        let { selectedTable: needFresh, edgeList } = basicData[graphId]
        // 获取线集合
        let {
            lineDrawCount: edgeArray,
            num,
            plotNum,
            union
        } = this.graph.getEdgeWithArrow(Partial, needFresh)
        // 初始化缓存
        this.initCollection(num, plotNum)
        let collection = edgeCollection[graphId]
        if (!edgeArray.length) {
            edgeCollection[graphId] = collection
            return
        }

        let DrawCall41 = 0,
            DrawCall2 = 0,
            start = 0,
            end = edgeArray.length,
            flag = true;
        if (!this.graph.mouseCaptor?.draggable) {
            union = new Set()
            flag = false
        }   
        if (!union.size || !isSameSet(union as Set<any>, this.oldUpdateEdges)) {
            if (union.size) {
                start = 0
                end = edgeArray.length - union.size
                this.oldUpdateEdges = clone(union)
            } else {
                start = 0
                end = edgeArray.length
                this.oldUpdateEdges = new Set()
            }
            this.quad = {};
            this.color = null
            this.width = null
            this.col14row2 = null
            this.plotsTwoColor = null
            this.plotsTwoWidth = null
            this.plotsTwoC42 = null

            let plootingInfo = this.plottingEdges(edgeArray, start, end, DrawCall41, DrawCall2)
            if(flag){
                this.DrawCall41 = DrawCall41 = plootingInfo.DrawCall41
                this.DrawCall2 = DrawCall2 = plootingInfo.DrawCall2
    
                this.color = collection.color
                this.width = collection.width
                this.col14row2 = collection.col14row2
    
                this.plotsTwoColor = collection.plotsTwoColor
                this.plotsTwoWidth = collection.plotsTwoWidth
                this.plotsTwoC42 = collection.plotsTwoC42
            }
        }

        if (union.size) {
            collection.color.set(this.color, 0)
            collection.width.set(this.width, 0)
            collection.col14row2.set(this.col14row2, 0)

            collection.plotsTwoColor.set(this.plotsTwoColor, 0)
            collection.plotsTwoWidth.set(this.plotsTwoWidth, 0)
            collection.plotsTwoC42.set(this.plotsTwoC42, 0)

            start = edgeArray.length - union.size;
            end = edgeArray.length

            for (let key in this.quad) {
                if (edgeList.get(key)?.getAttribute('isVisible'))
                    this.camera.quad.insert(this.quad[key])
            }

            this.plottingEdges(edgeArray, start, end, this.DrawCall41, this.DrawCall2)
        }

        edgeCollection[graphId] = collection
        // 绘制
        if (collection.color.length) {
            this.bind(
                {
                    color: collection.color,
                    width: collection.width,
                    col14row2: collection.col14row2,
                },
                edgeGroups,
            )
            this.render(edgeGroups)
        }

        if (collection.plotsTwoColor.length) {
            this.bind(
                {
                    color: collection.plotsTwoColor,
                    width: collection.plotsTwoWidth,
                    col14row2: collection.plotsTwoC42,
                },
                defaultGroup,
            )
            this.render(defaultGroup)
        }
    }

    plottingEdges(edgeArray: any, start: number, end: number, DrawCall41: number, DrawCall2: number) {
        const graphId = this.graph.id;
        let collection = edgeCollection[graphId]

        for (let i = start; i < end; i++) {
            let item = edgeArray[i]
            let r1 = item[1].length,
                r2 = item[2].length;
            let id = item[3]
            let edgeBound = basicData[graphId].edgeBoundBox.get(id)
            if (this.graph.textStatus && !this.graph.thumbnail) {
                this.quad[id] = {
                    x: (edgeBound.xmax + edgeBound.xmin) / 2,
                    y: (edgeBound.ymax + edgeBound.ymin) / 2,
                    width: edgeBound.xmax - edgeBound.xmin,
                    height: edgeBound.ymax - edgeBound.ymin,
                    id,
                    isNode: false,
                }
                this.camera.quad.insert(this.quad[id])
            }
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
                DrawCall2++
            }
        }

        return {
            DrawCall41,
            DrawCall2
        }
    }

    refreshProcess(): void {
        let collection = edgeCollection[this.graph.id]
        let flag = false
        // 如果存在缓存则直接使用缓存
        if (collection?.color.length) {
            this.bind(
                {
                    color: collection.color,
                    width: collection.width,
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
                    color: collection.plotsTwoColor,
                    width: collection.plotsTwoWidth,
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
        this.color = null
        this.width = null
        this.col14row2 = null
        this.plotsTwoColor = null
        this.plotsTwoWidth = null
        this.plotsTwoC42 = null
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
        const graphId = this.graph.id;
        // 视图矩阵 * 透视矩阵
        gl.uniformMatrix4fv(this.projectMatirxLocation, false, projection)
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, view)
        let drawNum =
            edgeGroups == globalProp.edgeGroups
                ? (edgeCollection[graphId].color?.length / 2 || 0)
                : (edgeCollection[graphId].plotsTwoColor?.length / 2 || 0)
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, edgeGroups * drawNum)
    }
}
