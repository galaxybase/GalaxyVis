import { globalInfo } from '../../../../initial/globalProp'
import { PlainObject } from '../../../../types'
import { initAttributeVariable } from '../../shaders/utils'
import { AbstractProgram, IProgram } from './program'

export interface IEdgeProgram extends IProgram {
    render(params: any): void
}

const vertexTemplate = [1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0]
const textureTemplates = [1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]
const ATTRIBUTES = 5

export abstract class AbstractEdgeProgram extends AbstractProgram implements IEdgeProgram {
    public posLocation: GLint //位置

    public colorLocation: GLint //颜色
    public scaleYLocation: GLint //矩阵 0 4 12
    public rotateLocation: GLint //矩阵 1 5 13
    public uvLocation: GLint //纹理
    public arrowLocation: GLint //箭头

    public background: WebGLUniformLocation //背景颜色

    constructor(
        gl: WebGLRenderingContext,
        vertexShaderSource: string,
        fragmentShaderSource: string,
    ) {
        super(gl, vertexShaderSource, fragmentShaderSource)
        // Attribute
        // 获取位置的下标
        this.posLocation = gl.getAttribLocation(this.program, 'a_position')
        // 获取颜色的下标
        this.colorLocation = gl.getAttribLocation(this.program, 'a_color')
        // 获取矩阵的下标
        this.scaleYLocation = gl.getAttribLocation(this.program, 'a_sy')
        this.rotateLocation = gl.getAttribLocation(this.program, 'a_rotate')
        // 获取纹理的下标
        this.uvLocation = gl.getAttribLocation(this.program, 'a_Uv')
        // 获取箭头的下标
        this.arrowLocation = gl.getAttribLocation(this.program, 'a_arrow')

        //Uniform
        const background = gl.getUniformLocation(this.program, 'background')
        if (background == null) console.log('Edge:  获取不到background')
        this.background = background as WebGLUniformLocation
    }

    bind(param: PlainObject<any>, edgeGroups?: number): void {
        const gl = this.gl
        const ext = this.ext
        const { color, width, col14row2 } = param
        gl.useProgram(this.program)

        // 背景颜色
        gl.uniform1f(this.background, globalInfo[this.graph.id].backgroundColor.floatColor)
        // 向缓冲绑定坐标
        initAttributeVariable(
            gl,
            new Float32Array(vertexTemplate),
            this.posLocation,
            2,
            gl.FLOAT,
            2 * 4,
            0,
            false,
        )
        ext.vertexAttribDivisorANGLE(this.posLocation, 0)
        // 向缓冲绑纹理
        initAttributeVariable(
            gl,
            new Float32Array(textureTemplates),
            this.uvLocation,
            2,
            gl.FLOAT,
            2 * 4,
            0,
            false,
        )
        ext.vertexAttribDivisorANGLE(this.uvLocation, 0)

        // 向缓冲绑定颜色
        var colorBuffer = gl.createBuffer()
        // 绑定缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        // 冲缓冲区获取值
        gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW)
        // 将值传输给attribute变量
        gl.vertexAttribPointer(this.colorLocation, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(this.colorLocation)
        ext.vertexAttribDivisorANGLE(this.colorLocation, edgeGroups)
        // 向缓冲绑定矩阵
        var widthBuffer = gl.createBuffer()
        // 绑定缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, widthBuffer)
        // 冲缓冲区获取值
        gl.bufferData(gl.ARRAY_BUFFER, width, gl.STATIC_DRAW)
        // 将值传输给attribute变量
        gl.vertexAttribPointer(this.scaleYLocation, 1, gl.FLOAT, false, 1 * 4, 0)
        gl.enableVertexAttribArray(this.scaleYLocation)
        ext.vertexAttribDivisorANGLE(this.scaleYLocation, edgeGroups)
        // 向缓冲绑定矩阵
        var rotateBuffer = gl.createBuffer()
        // 绑定缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, rotateBuffer)
        // 冲缓冲区获取值
        gl.bufferData(gl.ARRAY_BUFFER, col14row2, gl.STATIC_DRAW)
        // 将值传输给attribute变量
        gl.vertexAttribPointer(this.rotateLocation, 4, gl.FLOAT, false, 4 * ATTRIBUTES, 0)
        gl.enableVertexAttribArray(this.rotateLocation)
        ext.vertexAttribDivisorANGLE(this.rotateLocation, 1)
        // 向缓冲绑定是否是箭头 0是线1是箭头
        gl.vertexAttribPointer(this.arrowLocation, 1, gl.FLOAT, false, 4 * ATTRIBUTES, 4 * 4)
        gl.enableVertexAttribArray(this.arrowLocation)
        ext.vertexAttribDivisorANGLE(this.arrowLocation, 1)
    }
}
