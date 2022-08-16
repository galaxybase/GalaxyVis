import { AbstractProgram, IProgram } from './program'
import { initAttributeVariable } from '../../shaders/utils'
import { DEFAULT_SETTINGS } from '../../../../initial/settings'
import { globalInfo, globalProp } from '../../../../initial/globalProp'
import { initGlTextureBind } from '../../../../utils'

const ATTRIBUTES = 11

export interface INodeProgram extends IProgram {
    render(params: any): void
}

export abstract class AbstractNodeProgram extends AbstractProgram implements INodeProgram {
    public positionLocation: GLint //正方形的坐标
    public textureCoordLocation: GLint //纹理坐标
    public typeLocation: GLint //打包的颜色和类型
    public offsetLocation: GLint //偏移量
    public dataLocation: GLint //一些额外的数据
    public uvDataLocation: GLint //纹理相关的一些数据
    public spriteAtlas: WebGLUniformLocation //纹理集
    public background: WebGLUniformLocation //背景颜色
    public ColorLocation: number
    public atlas: WebGLUniformLocation

    constructor(
        gl: WebGLRenderingContext,
        vertexShaderSource: string,
        fragmentShaderSource: string,
    ) {
        super(gl, vertexShaderSource, fragmentShaderSource)
        //Attribute
        // 获取点位置的下标
        this.positionLocation = gl.getAttribLocation(this.program, 'a_pos')
        // 获取纹理下标
        this.textureCoordLocation = gl.getAttribLocation(this.program, 'a_uv')

        this.typeLocation = gl.getAttribLocation(this.program, 'a_type')
        // 获取颜色下标
        this.ColorLocation = gl.getAttribLocation(this.program, 'v_color')

        // 获取偏移量下标
        this.offsetLocation = gl.getAttribLocation(this.program, 'a_offset')
        // 获取点相关数据的下标
        this.dataLocation = gl.getAttribLocation(this.program, 'a_data')
        // 获取纹理相关数据的下标
        this.uvDataLocation = gl.getAttribLocation(this.program, 'a_uvdata')

        //Uniform
        const background = gl.getUniformLocation(this.program, 'background')
        if (background == null) console.log('Node:  获取不到background')
        this.background = background as WebGLUniformLocation

        // 获取纹理集的下标
        const spriteAtlas = gl.getUniformLocation(this.program, 'spriteAtlas')
        if (spriteAtlas == null) console.log('Node:  获取不到spriteAtlas')
        this.spriteAtlas = spriteAtlas as WebGLUniformLocation

        const atlas = gl.getUniformLocation(this.program, 'atlas')
        if (atlas == null) console.log('Node:  获取不到atlas')
        this.atlas = atlas as WebGLUniformLocation
    }

    bind(param: any): void {
        const gl = this.gl
        const ext = this.ext
        if (globalProp.useIniticon === 0 || this.graph.thumbnail) {
            let tex = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D
            tex.canvas.width = 128.0
            tex.canvas.height = 128.0
            initGlTextureBind(gl, gl.TEXTURE0, gl.createTexture(), tex)
            if (!this.graph.thumbnail) globalProp.useIniticon++
            // @ts-ignore
            tex = null
        }

        gl.useProgram(this.program)
        gl.uniform1i(this.spriteAtlas, 0)
        // 背景颜色
        gl.uniform1f(this.background, globalInfo[this.graph.id].backgroundColor.floatColor)
        gl.uniform1f(this.atlas, 1 / globalProp.atlas)

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

        gl.vertexAttribPointer(this.dataLocation, 4, gl.FLOAT, false, ATTRIBUTES * 4, 0)
        gl.enableVertexAttribArray(this.dataLocation)
        ext.vertexAttribDivisorANGLE(this.dataLocation, 1) //4

        gl.vertexAttribPointer(this.uvDataLocation, 3, gl.FLOAT, false, ATTRIBUTES * 4, 4 * 4)
        gl.enableVertexAttribArray(this.uvDataLocation)
        ext.vertexAttribDivisorANGLE(this.uvDataLocation, 1) //4

        gl.vertexAttribPointer(this.offsetLocation, 2, gl.FLOAT, false, ATTRIBUTES * 4, 4 * 7)
        gl.enableVertexAttribArray(this.offsetLocation)
        ext.vertexAttribDivisorANGLE(this.offsetLocation, 1) //2

        gl.vertexAttribPointer(this.typeLocation, 1, gl.FLOAT, false, ATTRIBUTES * 4, 4 * 9)
        gl.enableVertexAttribArray(this.typeLocation)
        ext.vertexAttribDivisorANGLE(this.typeLocation, 1) //1

        gl.vertexAttribPointer(
            this.ColorLocation,
            4,
            gl.UNSIGNED_BYTE,
            true,
            ATTRIBUTES * 4,
            4 * 10,
        )
        gl.enableVertexAttribArray(this.ColorLocation)
        ext.vertexAttribDivisorANGLE(this.ColorLocation, 1) //1
    }
}

export interface NodeProgramConstructor {
    new (gl: WebGLRenderingContext): INodeProgram
}
