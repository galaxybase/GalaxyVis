import { EdgeHaloCollection } from '../../../types'
import { AbstractEdgeProgram } from './common/edge'
import vertexShaderSource from '../shaders/edge.vert.glsl'
import fragmentShaderSource from '../shaders/edge.frag.glsl'
import { glMatrix, mat4 } from 'gl-matrix'
import { coordTransformation, floatColor, hashNumber } from '../../../utils'
import { createLineMesh, loopLineMesh } from '../../../utils/edge/initEdge'
import { basicData, globalProp } from '../../../initial/globalProp'

let edgeHaloCollection: EdgeHaloCollection = {}
const edgeGroups = globalProp.edgeGroups
export default class edgeHaloProgram extends AbstractEdgeProgram {
    constructor(gl: WebGLRenderingContext) {
        super(gl, vertexShaderSource, fragmentShaderSource)
        // 视图矩阵和透视矩阵
        const projectMatirxLocation = gl.getUniformLocation(this.program, 'projection')
        if (projectMatirxLocation == null) throw new Error('EdgeHalo: 获取不到projectionMatrix')
        this.projectMatirxLocation = projectMatirxLocation

        const viewMatrixLocation = gl.getUniformLocation(this.program, 'aXformMatrix')
        if (viewMatrixLocation == null) throw new Error('EdgeHalo: 获取不到viewMatrix')
        this.viewMatrixLocation = viewMatrixLocation
    }

    initCollection() {
        edgeHaloCollection[this.graph.id] = {
            drawNum: 0,
            color: [],
            width: [],
            col14row2: [],
            isArrow: [],
            haloInfo: new Map(),
            spInformation: new Set(),
        }
    }

    initData(graph: any): void {
        this.graph = graph
        this.camera = graph.camera
        this.initCollection()
    }

    process(): void {
        // 获取点列表
        const graphId = this.graph.id
        let edgeList = basicData[graphId].edgeList
        let baseTypeHash = this.graph.getEdgeType().baseTypeHash
        this.initCollection()
        let collection = edgeHaloCollection[graphId]
        let forwadHashTable: any = new Map()
        try {
            for (let [key, value] of edgeList) {
                // 获取点属性
                let attribute = value.getAttribute()
                if (!attribute) continue
                let { isVisible, halo, type, opacity, location } = attribute,
                    source = value.getSource(),
                    target = value.getTarget()

                // 如果被隐藏则跳过
                if (!isVisible || typeof source == 'string' || typeof target == 'string') continue
                if (typeof source == 'undefined' || typeof target == 'undefined') continue
                let { attribute: souce_attribute, num: sourceNumber } = source.value,
                    { attribute: target_attribute, num: targetNumber } = target.value
                if (type == 'basic') {
                    let hash = hashNumber(sourceNumber, targetNumber), //两点之间的hash值
                        hashSet = baseTypeHash?.get(hash), //两点之间hash表
                        size = hashSet?.num
                    if (!size) continue
                    let lineNumber = [...hashSet.total].indexOf(key),
                        forwardSource = forwadHashTable?.get(hash)?.sourceNumber,
                        forward =
                            lineNumber == 0
                                ? 1
                                : size % 2 == 0
                                ? lineNumber % 2 == 1 && sourceNumber != forwardSource
                                    ? -1
                                    : 1
                                : lineNumber % 2 == 0 && sourceNumber != forwardSource
                                ? -1
                                : 1,
                        { x: targetX, y: targetY, radius: targetSize } = target_attribute,
                        { x: sourceX, y: sourceY, radius: sourceSize } = souce_attribute
                    let xyOffect = coordTransformation(graphId, sourceX, sourceY),
                        xyOffect2 = coordTransformation(graphId, targetX, targetY),
                        line
                    ;(sourceX = xyOffect[0]),
                        (sourceY = xyOffect[1]),
                        (targetX = xyOffect2[0]),
                        (targetY = xyOffect2[1])
                    halo.location = location
                    forwadHashTable?.set(hash, { sourceNumber, targetNumber })
                    // 如果宽度为0则跳过
                    if (halo?.width == 0 || !halo) continue
                    if (source != target) {
                        size > 1 && size % 2 == 0 && lineNumber++
                        line = createLineMesh(
                            2,
                            sourceX,
                            sourceY,
                            targetX,
                            targetY,
                            lineNumber,
                            halo,
                            targetSize,
                            'circle',
                            forward,
                        )
                    } else {
                        line = loopLineMesh(
                            'webgl',
                            sourceX,
                            sourceY,
                            lineNumber,
                            100,
                            halo,
                            sourceSize,
                        )
                    }
                    collection.haloInfo.set(key, {
                        lineNumber,
                        forward,
                        halo,
                    })
                    collection.spInformation.add(key)

                    line.opacity = opacity * (floatColor(halo.color).a || 1)
                    let val = getHaloAttribute(line)
                    collection.color.push(...val[0])
                    let r1 = val[1].length
                    let rx = collection.width.length
                    for (let i = 0; i < r1; i++) {
                        collection.width[rx + i] = val[1][i]
                    }
                    let r2 = val[2].length
                    let ry = collection.col14row2.length
                    for (let i = 0; i < r2; i++) {
                        collection.col14row2[ry + i] = val[2][i]
                    }
                }
            }
        } catch {}

        forwadHashTable = null
        if (collection?.color.length) {
            edgeHaloCollection[graphId] = collection
            this.bind(
                {
                    color: new Float32Array(collection.color),
                    width: new Float32Array(collection.width),
                    col14row2: new Float32Array(collection.col14row2),
                },
                edgeGroups,
            )
            this.render()
        }
    }

    refreshProcess(): void {
        // 如果有缓存则使用缓存更新
        let collection = edgeHaloCollection[this.graph.id]
        if (collection?.color.length) {
            this.bind(
                {
                    color: new Float32Array(collection.color),
                    width: new Float32Array(collection.width),
                    col14row2: new Float32Array(collection.col14row2),
                },
                edgeGroups,
            )
            this.render()
        }
    }

    moveRefresh(): void {
        let { relationTable, edgeList, selectedTable: needFresh } = basicData[this.graph.id]
        let union: Set<any> | null = new Set()
        // 获取需要更新的集合
        needFresh.forEach((value: any) => {
            let needEdgeFresh: any = new Set(relationTable[value])
            if (needEdgeFresh) {
                needEdgeFresh.forEach((item: string) => {
                    let edge = edgeList.get(item)
                    let renderHalo = edge?.getAttribute('halo')
                    if (
                        !edge?.getAttribute('isVisible') ||
                        !renderHalo ||
                        (renderHalo && renderHalo.width == 0)
                    ) {
                        needEdgeFresh.delete(item)
                    }
                })
                union = new Set([...(union as Set<any>), ...needEdgeFresh])
            }
        })

        if (!union.size) {
            this.refreshProcess()
            return
        }
        union = null
        this.process()
        return
    }

    clear(): void {
        this.initCollection()
        delete edgeHaloCollection[this.graph.id]
    }

    render(): void {
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
        let drawNum = edgeHaloCollection[this.graph.id]?.color.length / 2 || 0
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, edgeGroups * drawNum)
    }
}

const getHaloAttribute = (val: any) => {
    return [[val.color, val.opacity], val.MatArray, val.MatArray2]
}
