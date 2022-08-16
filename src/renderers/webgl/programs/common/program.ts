import Graph from '../../../../classes/graph'
import Camera from '../../../../classes/camera'
import { createProgram } from '../../shaders/utils'

export interface IProgram {
    bind(param: any): void
    render(params: any): void
}

export abstract class AbstractProgram implements IProgram {
    public gl: WebGLRenderingContext // webgl的上下文
    public vertexShaderSource: string // 顶点着色器
    public vertexShader!: WebGLShader
    public fragmentShaderSource: string // 片元着色器
    public fragmentShader!: WebGLShader
    public program: WebGLProgram //整个着色器对象
    public ext: any //一个 WebGL 扩展对象
    public graph!: Graph //图
    public camera!: Camera // 相机

    public projectMatirxLocation!: WebGLUniformLocation //透视矩阵
    public viewMatrixLocation!: WebGLUniformLocation //视图矩阵

    // public minVisibleTextSizeLocation?: WebGLUniformLocation
    public zoomLevelLocation?: WebGLUniformLocation

    constructor(
        gl: WebGLRenderingContext,
        vertexShaderSource: string,
        fragmentShaderSource: string,
    ) {
        this.gl = gl
        this.vertexShaderSource = vertexShaderSource
        this.fragmentShaderSource = fragmentShaderSource
        // 创建着色器程序
        this.program = createProgram(
            this.gl,
            this.vertexShaderSource,
            this.fragmentShaderSource,
        ) as WebGLProgram
        // 开启拓展
        this.ext = this.gl.getExtension('ANGLE_instanced_arrays')
    }

    abstract bind(param: any): void
    abstract render(params: any): void
}
