import { globalInfo, globalProp } from '../../../../initial/globalProp'
import { initAttributeVariable } from '../../shaders/utils'
import { AbstractProgram, IProgram } from './program'

export interface ISDFProgram extends IProgram {
    render(params: any): void
}

const vertexTemplate = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]
const textureTemplates = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]
const ATTRIBUTES = 17

export abstract class AbstractSDFProgram extends AbstractProgram implements ISDFProgram {
    public posLocation: GLint //坐标
    public textureLocation: GLint //纹理坐标
    public otherLocation: GLint //额外属性

    public vertMatLocation: GLint //坐标矩阵
    public vertMat2Location: GLint

    public fragMatLocation: GLint //纹理矩阵
    public fragMat2Location: GLint

    public backgroundLocation: GLint //文字背景颜色

    public texSizeLocation: WebGLUniformLocation //纹理缩放比
    public uTexture: WebGLUniformLocation //纹理集
    public gammerLocation: WebGLUniformLocation

    public background: WebGLUniformLocation //背景颜色

    constructor(
        gl: WebGLRenderingContext,
        vertexShaderSource: string,
        fragmentShaderSource: string,
    ) {
        super(gl, vertexShaderSource, fragmentShaderSource)

        //Attribute
        // 获取着色位置的下标
        this.posLocation = gl.getAttribLocation(this.program, 'a_pos')
        // 获取着色器纹理下标
        this.textureLocation = gl.getAttribLocation(this.program, 'a_texcoord')
        // 获取着色器往外数据的下标
        this.otherLocation = gl.getAttribLocation(this.program, 'a_other')
        // 获取矩阵下标
        this.vertMatLocation = gl.getAttribLocation(this.program, 'a_vertMat')
        this.vertMat2Location = gl.getAttribLocation(this.program, 'a_vertMat2')
        // 获取矩阵下标
        this.fragMatLocation = gl.getAttribLocation(this.program, 'a_fragMat')
        this.fragMat2Location = gl.getAttribLocation(this.program, 'a_fragMat2')
        // 获取文字背景颜色下标
        this.backgroundLocation = gl.getAttribLocation(this.program, 'a_background')
        // 获取纹理大小下标
        const texSizeLocation = gl.getUniformLocation(this.program, 'u_texsize')
        if (texSizeLocation == null) throw new Error('TEXT:  获取不到uTexsize属性')
        this.texSizeLocation = texSizeLocation
        // 获取纹理下标
        const uTexture = gl.getUniformLocation(this.program, 'u_texture')
        if (uTexture == null) throw new Error('TEXT:  获取不到uTexture属性')
        this.uTexture = uTexture
        // 获取模糊度的下标
        const gammerLocation = gl.getUniformLocation(this.program, 'u_gamma')
        if (gammerLocation == null) throw new Error('TEXT:  获取不到uGammer属性')
        this.gammerLocation = gammerLocation
        //Uniform
        const background = gl.getUniformLocation(this.program, 'background')
        if (background == null) console.log('Text:  获取不到background属性')
        this.background = background as WebGLUniformLocation
    }

    bind(param: any): void {
        if (this.graph.thumbnail === true) return

        const gl = this.gl
        const ext = this.ext

        gl.useProgram(this.program)
        // 背景颜色
        gl.uniform1f(this.background, globalInfo[this.graph.id].backgroundColor.floatColor)
        // 向缓冲绑定点坐标
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
        // 向缓冲绑定纹理坐标
        initAttributeVariable(
            gl,
            new Float32Array(textureTemplates),
            this.textureLocation,
            2,
            gl.FLOAT,
            2 * 4,
            0,
            false,
        )
        ext.vertexAttribDivisorANGLE(this.textureLocation, 0)
        var Buffer = gl.createBuffer()
        // 绑定缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, Buffer)
        // 冲缓冲区获取值
        gl.bufferData(gl.ARRAY_BUFFER, param, gl.STATIC_DRAW)

        gl.vertexAttribPointer(this.vertMatLocation, 3, gl.FLOAT, false, ATTRIBUTES * 4, 0)
        gl.enableVertexAttribArray(this.vertMatLocation)
        ext.vertexAttribDivisorANGLE(this.vertMatLocation, 1) 

        gl.vertexAttribPointer(this.vertMat2Location, 3, gl.FLOAT, false, ATTRIBUTES * 4,3 * 4)
        gl.enableVertexAttribArray(this.vertMat2Location)
        ext.vertexAttribDivisorANGLE(this.vertMat2Location, 1)
        
        gl.vertexAttribPointer(this.fragMatLocation, 3, gl.FLOAT, false, ATTRIBUTES * 4, 6 * 4)
        gl.enableVertexAttribArray(this.fragMatLocation)
        ext.vertexAttribDivisorANGLE(this.fragMatLocation, 1) 

        gl.vertexAttribPointer(this.fragMat2Location, 3, gl.FLOAT, false, ATTRIBUTES * 4, 9 * 4)
        gl.enableVertexAttribArray(this.fragMat2Location)
        ext.vertexAttribDivisorANGLE(this.fragMat2Location, 1) 

        gl.vertexAttribPointer(this.otherLocation, 4, gl.FLOAT, false, ATTRIBUTES * 4, 12 * 4)
        gl.enableVertexAttribArray(this.otherLocation)
        ext.vertexAttribDivisorANGLE(this.otherLocation, 1) 

        gl.vertexAttribPointer(this.backgroundLocation, 4, gl.UNSIGNED_BYTE, true, ATTRIBUTES * 4, 16 * 4)
        gl.enableVertexAttribArray(this.backgroundLocation)
        ext.vertexAttribDivisorANGLE(this.backgroundLocation, 1) 

        const atlas = this.graph.fast ? 8 : globalProp.atlas
        // 向缓冲区绑定纹理缩放
        gl.uniform2f(this.texSizeLocation, atlas * 64, atlas * 64)
        // 选择纹理区块1
        gl.uniform1i(this.uTexture, 1)

        let gammer = this.camera.zoom / 75
        gl.uniform1f(this.gammerLocation, gammer)
    }
}
