/**
 * 初始化shader
 * @param gl webgl的上下文
 * @param vshader 顶点着色器
 * @param fshader 片元着色器
 * @returns
 */
export function initShaders(gl: WebGLRenderingContext, vshader: string, fshader: string) {
    var program = createProgram(gl, vshader, fshader)
    if (!program) {
        throw new Error('Failed to create program')
    }

    gl.useProgram(program)
    // gl.program = program;
    return true
}

/**
 * 创建程序
 * @param gl webgl的上下文
 * @param vshader 顶点着色器
 * @param fshader 片元着色器
 * @returns
 */
export function createProgram(gl: WebGLRenderingContext, vshader: string, fshader: string) {
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader)
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader)
    if (!vertexShader || !fragmentShader) {
        return null
    }
    var program = gl.createProgram()
    if (!program) {
        return null
    }
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!linked) {
        var error = gl.getProgramInfoLog(program)
        gl.deleteProgram(program)
        gl.deleteShader(fragmentShader)
        gl.deleteShader(vertexShader)
        throw new Error(`createProgram: error while linking the shader:\n${error}`)
    }
    return program
}

/**
 * 加载shader
 * @param gl webgl的上下文
 * @param type 着色器类型
 * @param source 来源
 * @returns
 */
function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
    // Create shader object
    var shader = gl.createShader(type)
    if (shader == null) {
        throw new Error(`loadShader: error while creating the shader`)
    }
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!compiled) {
        var error = gl.getShaderInfoLog(shader)

        gl.deleteShader(shader)
        throw new Error(`loadShader: error while compiling the shader:\n${error}\n${source}`)
    }

    return shader
}

/**
 * 缓冲区载入attribute的值
 * @param {*} gl
 * @param {*} data
 * @param {*} attribute 指定要修改的顶点属性的索引。
 * @param {*} size 指定每个顶点属性的组成数量，必须是1，2，3或4。
 * @param {*} type 类型
 * @param {*} stride 占位
 * @param {*} offset 指定顶点属性数组中第一部分的字节偏移量。必须是类型的字节长度的倍数
 * @param {*} isnormal 是否归一化
 */
export function initAttributeVariable(
    gl: WebGLRenderingContext,
    data: any,
    attribute: GLuint,
    size: GLint,
    type: GLenum,
    stride: GLsizei,
    offset: GLintptr,
    isnormal: boolean = false,
) {
    var buffer = gl.createBuffer()
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    // 冲缓冲区获取值
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    // 将值传输给attribute变量
    gl.vertexAttribPointer(attribute, size, type, isnormal, stride, offset)
    gl.enableVertexAttribArray(attribute)
}
