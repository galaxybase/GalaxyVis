import { mat4 } from 'gl-matrix'
import { coordTransformation, floatColor, initGlTextureBind } from '..'
import tinySDF from '.'
import { basicData, globalInfo, globalProp, instancesGL } from '../../initial/globalProp'
import throttle from 'lodash/throttle'

const pMatrix = mat4.create()
const mvMatrix = mat4.create()
const mvpMatrix = mat4.create()

const sdfs: any = {}
const sdfCanvas = document.createElement('canvas')
const sdfCtx = sdfCanvas.getContext('2d') as CanvasRenderingContext2D

let flag = true

// let sdfData: any = null
let glWidth = 800
let glHeight = 800
let atlas = 0
let chars: any[] = []
let graphId: string | null = null

let charsMap = new Map()

// 节流函数
const throttled = throttle((graph, gl, texture) => {
    initGlTextureBind(gl, gl.TEXTURE1, texture, sdfCanvas, false)
    graph.render()
}, 100)

const throttledT = throttle((graph, gl, texture) => {
    initGlTextureBind(gl, gl.TEXTURE1, texture, sdfCanvas, false)
    graph.render()
}, 10)

export const clearChars = () => {
    chars = []
    charsMap = new Map()
}

export const clearGraphChars = (id: string) => {
    charsMap.delete(id);
}

export const sdfCreate = (graph: any, textSet: Set<any>, thumbnail: boolean = false) => {
    if (thumbnail) return

    let gl = graph.gl
    if (flag) {
        glWidth = gl.canvas.width || 800
        glHeight = gl.canvas.height || 800
        // 创建透视矩阵
        mat4.ortho(pMatrix, 0, glWidth, glHeight, 0, 0, -1)
        mat4.multiply(mvpMatrix, pMatrix, mvMatrix)

        atlas = graph.fast ? globalProp.fastAtlas : (globalProp.atlas || 8)
        sdfCtx.canvas.width = Math.floor(atlas * 64)
        sdfCtx.canvas.height = Math.floor(atlas * 64)
    }

    const texture = gl.createTexture()
    let beforeNum = chars.length
    let GraphSet = new Set()
    textSet.forEach(item => {
        let arr = item.split("-");
        if (item.substring(0, 1) == "-") {
            arr[0] = "-"
            arr[1] = arr[2]
            arr[2] = arr[3]
        }
        let flag = chars.find(charEle => {
            return charEle.char == arr[0] && charEle.style == arr[1]
        })
        !flag &&
            chars.push({
                char: arr[0],
                style: arr[1],
            })

        !charsMap.has(arr[2]) && charsMap.set(arr[2], new Set())

        let charSet = charsMap.get(arr[2])

        if (!charSet.has(arr[0] + '-' +arr[1])) {
            charSet.add(arr[0] + '-' + arr[1])
            GraphSet.add(arr[2])
        }
    })

    creatTextSDF()
    // 获取文字当前的RGBA的数值区块
    function makeRGBAImageData(alphaChannel: any, width: number, height: number) {
        const imageData = sdfCtx.createImageData(width, height)
        for (let i = 0; i < alphaChannel.length; i++) {
            imageData.data[4 * i + 0] = Math.floor(alphaChannel[i])
            imageData.data[4 * i + 1] = Math.floor(alphaChannel[i])
            imageData.data[4 * i + 2] = Math.floor(alphaChannel[i])
            imageData.data[4 * i + 3] = 255
        }
        return imageData
    }

    function creatTextSDF() {
        // sdfCtx.save()
        globalInfo[graph.id].isSafari &&
            sdfCtx.clearRect(sdfCanvas.width, sdfCanvas.height, sdfCanvas.width, sdfCanvas.height)
        // 字体大小
        const fontSize = 28
        // buffer是控制文字上下浮动的距离
        const buffer = 2
        // radius是控制生成sdf文字周边黑色区块的大小
        const radius = 8
        const sdf = new tinySDF({
            fontSize,
            buffer,
            radius,
        })
        const size = fontSize + buffer * 2

        let cellNumber = Math.floor(sdfCanvas.height / size),
            yNum = Math.floor(beforeNum / cellNumber),
            xNum = beforeNum % cellNumber,
            flags = true

        let i = beforeNum
        // 形成一个个sdf区块
        for (let y = size * yNum; y + size <= sdfCanvas.height && i < chars.length; y += size) {
            for (
                let x = flags ? xNum * size : 0;
                x + size <= sdfCanvas.width && i < chars.length;
                x += size, flags = false
            ) {
                const { data, width, height, glyphWidth } = sdf.draw(chars[i])
                sdfCtx.putImageData(makeRGBAImageData(data, width, height), x, y)
                sdfs[`${chars[i].char}-${chars[i].style}`] = {
                    x,
                    y,
                    glyphWidth,
                    width,
                }
                i++
            }
        }
    }

    try {
        flag = false
        if (graph.id === graphId && Object.keys(instancesGL).length <= 1) {
            throttled(graph, gl, texture);
        }
        else {
            initGlTextureBind(gl, gl.TEXTURE1, texture, sdfCanvas, false)
            if (Object.keys(instancesGL).length > 0) {
                for (let i in instancesGL) {
                    let gl = instancesGL[i].gl
                    if (GraphSet.has(instancesGL[i].id)) {
                        // initGlTextureBind(gl, gl.TEXTURE1, gl.createTexture(), sdfCanvas, false)
                        throttledT(instancesGL[i], gl, gl.createTexture())
                    }
                }
            }

        }
        graphId = graph.id
    } catch (err) {
        console.warn('文字生成失败')
    }
}

export function drawText(size: number, str: string, maxLength: number, style: string = 'normal') {
    if (str === '') return
    str = str + ''
    const vertexElements: number[] = []
    const textureElements: number[] = []

    const fontsize = 32
    const buf = fontsize / 24

    const height = fontsize + buf * 2
    const by = fontsize / 2 + buf
    const scale = (size * 1.2) / fontsize
    let sum = 0
    // 屏幕长款比
    let screenScale = glWidth / glHeight
    let minLength = Math.min(maxLength, str.length)
    for (let i = 0; i < minLength; i++) {
        let key = `${str[i]}-${style}`
        sum += sdfs[key].width * 2.0 * screenScale * scale
    }
    // 文字相对于整个canvas画布居中的坐标
    const pen = {
        x: glWidth / 2 - sum / 2,
        y: glHeight / 2,
    }

    let num = 0
    // 每一个文字放在一个有6个顶点组成的块里
    for (let i = 0; i < str.length; i++) {
        let key = `${str[i]}-${style}`
        const { x: posX, y: posY, width } = sdfs[key] // pos in sprite x
        const advance = width * 2.0

        if (str[i] == '\\' && str[i + 1] == 'n') {
            pen.x = glWidth / 2 - sum / 2
            pen.y = pen.y + height * 2.0 * scale
            i++
            num++
            continue
        }
        if (i % maxLength == 0 && i != 0) {
            pen.x = glWidth / 2 - sum / 2
            pen.y = glHeight / 2 + (i / maxLength) * (height * 2.0 * scale)
            num++
        }

        // 顶点坐标
        vertexElements.push(
            // 偏移
            pen.x + width * screenScale * scale,
            pen.y + (height - by) / 2.0,
            // 缩放
            width * screenScale * scale,
            height * scale,
        )
        //纹理坐标
        textureElements.push(
            // 偏移
            posX + buf,
            posY,
            // 缩放
            width,
            height,
        )
        pen.x = pen.x + advance * screenScale * scale
    }
    return (globalProp.labelStore[`${size}-${str}-${style}`] = {
        textureElements,
        vertexElements,
        sum,
        height: num * (height * 2.0) * scale,
        size,
        maxLength,
        str,
        style,
        Occupy: height * scale / 2,
        nlines: num
    })
}

const ATTRIBUTES = 18;
export const sdfDrawTextNew = (graphId: string, attribute: any, angle: number, type: number) => {
    let { text, x, y, radius, isNode, opacity } = attribute

    let { margin = [0, 0], position, color, background, content, fontSize, minVisibleSize, style } = text
    !style && (style = "normal")
    let result = globalProp.labelStore[`${fontSize}-${content}-${style}`]

    let height = result.height / globalInfo[graphId].canvasBox.height

    let colorFloat = floatColor(color).rgb
    let backgroundFloat = floatColor(background).rgb
    let aphaBackground = background[0] == '#' ? 1.0 : floatColor(background).a

    // 如果是点文字类型的 更具positioin给不同的偏移量
    let offset: number[] = [0, 0, 0]

    if (isNode) {
        let xyOffect = coordTransformation(graphId, x, y)
            ; (x = xyOffect[0]), (y = xyOffect[1])
    }
    const transform = (basicData[graphId]?.transform || 223)

    let postionState: { [key: string]: Function } = {
        bottom: () => {
            return [
                margin[0] + x,
                margin[1] + y - (radius * 2 + result.Occupy - 3) / transform,
                angle]
        },
        right: () => {
            return [
                margin[0] + x + (radius * 2 + 6) / transform + (result.sum * mvpMatrix[0]) / 2,
                margin[1] + y + height,
                angle,
            ]
        },
        left: () => {
            return [
                margin[0] + x - (radius * 2 + 6) / transform - (result.sum * mvpMatrix[0]) / 2,
                margin[1] + y + height,
                angle,
            ]
        },
        top: () => {
            let topGap = result.nlines > 0 ?
                (result.nlines) * (result.Occupy) : 0
            return [
                margin[0] + x,
                margin[1] + y + (radius * 2 + result.Occupy + 3 + 2 * topGap) / transform,
                angle,
            ]
        },
        center: () => {
            return [margin[0] + x, margin[1] + margin[1] + y + height, angle]
        },
        default: () => {
            return [
                x + margin[0] * Math.cos(angle) + margin[1] * Math.cos(angle - Math.PI / 2),
                y + margin[0] * Math.sin(angle) + margin[1] * Math.sin(angle - Math.PI / 2),
                angle,
            ]
        },
    }

    if (type == 1) {
        offset = postionState[position]()
    } else {
        offset = postionState['default']()
    }

    // 缩放的矩阵计算
    let XmvpMatrix = mat4.create()
    mat4.translate(XmvpMatrix, XmvpMatrix, [offset[0], offset[1], 0])
    mat4.rotateZ(XmvpMatrix, XmvpMatrix, offset[2])
    mat4.multiply(XmvpMatrix, XmvpMatrix, mvpMatrix)

    let vEle = result.vertexElements
    let tEle = result.textureElements
    let labelFloat32Array = new Float32Array(ATTRIBUTES * vEle.length / 4)
    // 纹理矩阵和坐标矩阵的计算
    for (let i = 0, j = 0, k = 0; i < vEle.length; i += 4, j += 2, k += ATTRIBUTES) {

        labelFloat32Array[k] = Number(fontSize) || 15
        labelFloat32Array[k + 1] = Number(minVisibleSize) || 6

        // 顶点矩阵
        let Matrix = mat4.create()
        // 平移
        mat4.translate(Matrix, Matrix, [vEle[i], vEle[i + 1], 0])
        // 缩放
        mat4.scale(Matrix, Matrix, [vEle[i + 2], vEle[i + 3], 0])

        mat4.multiply(Matrix, XmvpMatrix, Matrix)

        labelFloat32Array[k + 2] = Matrix[0]
        labelFloat32Array[k + 3] = Matrix[4]
        labelFloat32Array[k + 4] = Matrix[12]

        labelFloat32Array[k + 5] = Matrix[1]
        labelFloat32Array[k + 6] = Matrix[5]
        labelFloat32Array[k + 7] = Matrix[13]

        // 纹理矩阵
        let TexMatrix = mat4.create()
        // 平移
        mat4.translate(TexMatrix, TexMatrix, [tEle[i], tEle[i + 1], 0])
        // 缩放
        mat4.scale(TexMatrix, TexMatrix, [tEle[i + 2], tEle[i + 3], 0])

        labelFloat32Array[k + 8] = TexMatrix[0]
        labelFloat32Array[k + 9] = TexMatrix[4]
        labelFloat32Array[k + 10] = TexMatrix[12]

        labelFloat32Array[k + 11] = TexMatrix[1]
        labelFloat32Array[k + 12] = TexMatrix[5]
        labelFloat32Array[k + 13] = TexMatrix[13]

        labelFloat32Array[k + 14] = colorFloat
        labelFloat32Array[k + 15] = backgroundFloat
        labelFloat32Array[k + 16] = aphaBackground
        labelFloat32Array[k + 17] = opacity
    }

    result = null

    return labelFloat32Array
}
