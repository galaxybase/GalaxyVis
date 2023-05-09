import { globalInfo } from '../../../../initial/globalProp'
import { DEFAULT_SETTINGS } from '../../../../initial/settings'
import { initAttributeVariable } from '../../shaders/utils'
import { AbstractProgram, IProgram } from './program'

export interface IHaloProgram extends IProgram {
    render(params: any): void
}

const ATTRIBUTES = 6;
export abstract class AbstractHaloProgram extends AbstractProgram implements IHaloProgram {
    public positionLocation: GLint //正方形的坐标
    public offesetLocation: GLint //纹理坐标
    public colorLocation: GLint //打包的颜色和类型
    public scaleLocation: GLint //缩放
    public textureCoordLocation: GLint //纹理
    // public haloWidthLocation: GLint //halo宽度
    public progressLocation: GLint //进度
    public background: WebGLUniformLocation //背景颜色

    constructor(
        gl: WebGLRenderingContext,
        vertexShaderSource: string,
        fragmentShaderSource: string,
    ) {
        super(gl, vertexShaderSource, fragmentShaderSource)
        //Attribute
        // 获取点位置的下标  vec3 xyz
        this.positionLocation = gl.getAttribLocation(this.program, 'a_pos')
        // 获取偏移量下标  vec3 xyz
        this.offesetLocation = gl.getAttribLocation(this.program, 'a_offset')
        // 获取颜色下标  float color
        this.colorLocation = gl.getAttribLocation(this.program, 'a_color')
        // 获取缩放比例下标 float zoom
        this.scaleLocation = gl.getAttribLocation(this.program, 'a_scale')
        // 获取纹理下标
        this.textureCoordLocation = gl.getAttribLocation(this.program, 'a_uv')
        // 获取Halo宽度
        // this.haloWidthLocation = gl.getAttribLocation(this.program, 'a_width')
        // 获取progress宽度
        this.progressLocation = gl.getAttribLocation(this.program, 'a_progress')

        //Uniform
        const background = gl.getUniformLocation(this.program, 'background')
        if (background == null) console.warn('Halo:  获取不到background')
        this.background = background as WebGLUniformLocation
    }

    bind(param: any): void {
        const gl = this.gl
        const ext = this.ext
        gl.useProgram(this.program)

        // 背景颜色
        gl.uniform1f(this.background, globalInfo[this.graph.id].backgroundColor.floatColor)

        // 向缓冲区绑定坐标
        initAttributeVariable(
            gl,
            new Float32Array(DEFAULT_SETTINGS.vertex),
            this.positionLocation,
            2,
            gl.FLOAT,
            2 * 4,
            0,
            false,
        )
        ext.vertexAttribDivisorANGLE(this.positionLocation, 0)
        // 向缓冲区绑定纹理坐标
        initAttributeVariable(
            gl,
            new Float32Array(DEFAULT_SETTINGS.uvtex),
            this.textureCoordLocation,
            2,
            gl.FLOAT,
            2 * 4,
            0,
            false,
        )
        ext.vertexAttribDivisorANGLE(this.textureCoordLocation, 0)

        var Buffer = gl.createBuffer()
        // 绑定缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, Buffer)
        // 冲缓冲区获取值
        gl.bufferData(gl.ARRAY_BUFFER, param, gl.STATIC_DRAW)

        gl.vertexAttribPointer(this.offesetLocation, 2, gl.FLOAT, false, ATTRIBUTES * 4, 0)
        gl.enableVertexAttribArray(this.offesetLocation)
        ext.vertexAttribDivisorANGLE(this.offesetLocation, 1) //2

        gl.vertexAttribPointer(this.scaleLocation, 1, gl.FLOAT, false, ATTRIBUTES * 4, 4 * 2)
        gl.enableVertexAttribArray(this.scaleLocation)
        ext.vertexAttribDivisorANGLE(this.scaleLocation, 1) //1

        gl.vertexAttribPointer(this.colorLocation, 2, gl.FLOAT, false, ATTRIBUTES * 4, 4 * 3)
        gl.enableVertexAttribArray(this.colorLocation)
        ext.vertexAttribDivisorANGLE(this.colorLocation, 1) //2

        // gl.vertexAttribPointer(this.haloWidthLocation, 1, gl.FLOAT, false, ATTRIBUTES * 4, 4 * 5)
        // gl.enableVertexAttribArray(this.colorLocation)
        // ext.vertexAttribDivisorANGLE(this.colorLocation, 1) //1

        gl.vertexAttribPointer(this.progressLocation, 1, gl.FLOAT, false, ATTRIBUTES * 4, 4 * 5)
        gl.enableVertexAttribArray(this.progressLocation)
        ext.vertexAttribDivisorANGLE(this.progressLocation, 1) //1
    }
}

export interface NodeProgramConstructor {
    new(gl: WebGLRenderingContext): IHaloProgram
}
