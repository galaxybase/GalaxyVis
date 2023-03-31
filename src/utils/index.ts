import { vec3 } from 'gl-matrix'
import { basicData, globalInfo, globalProp, instancesGL, thumbnailInfo } from '../initial/globalProp'
import { originInitial } from '../initial/originInitial'
import { IBound, loopLineType } from '../types'
import { getTextPixels } from './piexelsCreat'
import { sdfCreate } from './tinySdf/sdfDrawText'

/**
 * 颜色打包
 * @param val rgba 或者 #
 * @returns
 */
const FLOAT_COLOR_CACHE: { [key: string]: { rgb: number; a: number } } = {}
const RGBA_TEST_REGEX2 = /^\s*rgba?\s*\(/
const RGBA_EXTRACT_REGEX2 =
    /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)(?:\s*,\s*(.*)?)?\)\s*$/

export const floatColor = function (val: string) {
    // 缓存不必重复计算
    if (typeof FLOAT_COLOR_CACHE[val] !== 'undefined') {
        return FLOAT_COLOR_CACHE[val]
    }

    let r = 0,
        g = 0,
        b = 0,
        a = 1
    if (val[0] === '#') {
        if (val.length === 4) {
            r = parseInt(val.charAt(1) + val.charAt(1), 16)
            g = parseInt(val.charAt(2) + val.charAt(2), 16)
            b = parseInt(val.charAt(3) + val.charAt(3), 16)
        } else {
            r = parseInt(val.charAt(1) + val.charAt(2), 16)
            g = parseInt(val.charAt(3) + val.charAt(4), 16)
            b = parseInt(val.charAt(5) + val.charAt(6), 16)
        }
        a = 0
    } else if (RGBA_TEST_REGEX2.test(val)) {
        let match = val.match(RGBA_EXTRACT_REGEX2)

        if (match) {
            r = +match[1]
            g = +match[2]
            b = +match[3]

            if (match[4]) a = +match[4]
        }

        match = null
    }

    let color = {
        rgb: (r << 16) | (g << 8) | (b & 0xfeffffff),
        a,
    }

    FLOAT_COLOR_CACHE[val] = color

    return color
}

const NEW_FLOAT_COLOR_CACHE: { [key: string]: number } = {}
const INT8 = new Int8Array(4)
const INT32 = new Int32Array(INT8.buffer, 0, 1)
const FLOAT32 = new Float32Array(INT8.buffer, 0, 1)

export function newfloatColor(val: string): number {
    if (typeof NEW_FLOAT_COLOR_CACHE[val] !== 'undefined') return NEW_FLOAT_COLOR_CACHE[val]

    let r = 0,
        g = 0,
        b = 0,
        a = 1

    if (val[0] === '#') {
        if (val.length === 4) {
            r = parseInt(val.charAt(1) + val.charAt(1), 16)
            g = parseInt(val.charAt(2) + val.charAt(2), 16)
            b = parseInt(val.charAt(3) + val.charAt(3), 16)
        } else {
            r = parseInt(val.charAt(1) + val.charAt(2), 16)
            g = parseInt(val.charAt(3) + val.charAt(4), 16)
            b = parseInt(val.charAt(5) + val.charAt(6), 16)
        }
    } else if (RGBA_TEST_REGEX2.test(val)) {
        const match = val.match(RGBA_EXTRACT_REGEX2)
        if (match) {
            r = +match[1]
            g = +match[2]
            b = +match[3]

            if (match[4]) a = +match[4]
        }
    }

    a = (a * 255) | 0

    INT32[0] = ((a << 24) | (b << 16) | (g << 8) | r) & 0xfeffffff

    const color = FLOAT32[0]
    NEW_FLOAT_COLOR_CACHE[val] = color

    return color
}

/**
 * 引入时间戳获取一个唯一id
 * 时间戳 + 随机数前置36进制
 * @param {*} length 长度
 * @returns
 */
export const genID = (length: number) => {
    return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36)
}

// 文字集
export const initText = (that: any) => {
    if (that.renderer !== 'webgl') return
    const textSet = globalProp.textSet
    if (textSet.size) {
        sdfCreate(that, textSet, that.thumbnail)
    }
}
// icon和image
export const initIconOrImage = async (that: any, data: any) => {
    if (that.renderer !== 'webgl' || that.fast) return
    globalProp.useIniticon++
    const atlas = globalProp.atlas,
        textureCtx = globalProp.textureCtx as CanvasRenderingContext2D
    const thumbnailGL = thumbnailInfo[that.id]
    // icon类型
    if (data.type == 'icon') {
        // 等待字体加载
        let pix = await getTextPixels(3, data.key, data.font, data.style, 128, data.scale)
        let newPix = {
            pixels: pix.pixels,
            x: 128 * (data.num % atlas),
            y: 128 * Math.floor(data.num / atlas),
        }
        textureCtx.putImageData(newPix.pixels, newPix.x, newPix.y)
    }
    // image类型
    else if (data.type == 'image') {
        const url = data.key,
            count = data.num,
            imageCanvas = document.createElement('canvas'),
            imageCanvasContext = imageCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
        imageCanvas.height = 128
        imageCanvas.width = 128
        imageCanvasContext.fillStyle = data.color || 'rgba(255,255,255,0)'
        imageCanvasContext.fillRect(0, 0, 128, 128)
        // 图片信息
        var textureInfo = {
            x: 128 * (count % atlas),
            y: 128 * Math.floor(count / atlas),
            pixels: imageCanvasContext.getImageData(0, 0, 128, 128),
        }
        var img = new Image()
        img.crossOrigin = 'anonymous'
        // 当加载完图片再重新render
        img.addEventListener('load', function () {
            try {
                let scaleNum = 128 * (data?.scale || 1) * 0.9;
                imageCanvasContext.drawImage(img, (128 - scaleNum) / 2, (128 - scaleNum) / 2, scaleNum, scaleNum)
                textureInfo.pixels = imageCanvasContext.getImageData(0, 0, 128, 128)
                textureCtx?.putImageData(textureInfo.pixels, textureInfo.x, textureInfo.y)
                if (Object.keys(instancesGL).length > 0) {
                    for (let i in instancesGL) {
                        let gl = instancesGL[i].gl
                        initGlTextureBind(gl, gl.TEXTURE0, gl.createTexture(), textureCtx)
                    }
                    if (thumbnailGL && thumbnailGL.thumbnail) {
                        let gl = thumbnailGL.gl
                        initGlTextureBind(gl, gl.TEXTURE0, gl.createTexture(), textureCtx)
                    }
                }
                that.render()
            } catch (err) {
                console.warn(err, 'err')
            }
        })
        img.src = url
    }
    if (Object.keys(instancesGL).length > 0) {
        for (let i in instancesGL) {
            let gl = instancesGL[i].gl
            initGlTextureBind(gl, gl.TEXTURE0, gl.createTexture(), textureCtx)
        }
        if (thumbnailGL && thumbnailGL.thumbnail) {
            let gl = thumbnailGL.gl
            initGlTextureBind(gl, gl.TEXTURE0, gl.createTexture(), textureCtx)
        }
    }
    if (that.thumbnail === false) that.render()
}

/**
 * 获取 canvas的X坐标
 * @param  {event} 鼠标事件
 * @return {number}
 */
export const getX = function (e: MouseEvent | WheelEvent): number {
    //@ts-ignore
    return (e.offsetX !== undefined && e.offsetX) || (e.clientX !== undefined && e.clientX)
}

/**
 * 获取canvas的Y坐标
 * @param  {event} 鼠标事件
 * @return {number}
 */
export const getY = function (e: MouseEvent | WheelEvent): number {
    // @ts-ignore
    return (e.offsetY !== undefined && e.offsetY) || (e.clientY !== undefined && e.clientY)
}

/**
 * 求两个向量之间的夹角
 * @param x 
 * @param y 
 * @returns 
 */
export const vectorAngle = (x: number[], y: number[], z: number[]) => {
    let mX = Math.sqrt(x.reduce((acc: number, n: number) => acc + Math.pow(n, 2), 0));
    let mY = Math.sqrt(y.reduce((acc: number, n: number) => acc + Math.pow(n, 2), 0));
    let ans = Math.acos(x.reduce((acc: number, n: number, i: number) => acc + n * y[i], 0) / (mX * mY));
    // 叉乘计算方向
    let direction = ((x[0] - z[0]) * (y[1] - z[1])) - ((x[1] - z[1]) * (y[0] - z[0])) < 0 ? 1 : -1
    return isNaN(ans) ? 0 : ans * direction
};

/**
 * hashNumber 计算两点的唯一hash值
 * @param {*} e 点A的下标num
 * @param {*} t 点B的下标num
 * @returns
 */
export const hashNumber = (e: number, t: number) => {
    var r = e < t ? e : t
    var i = e + t - r
    return r * 67108864 + i
}

/**
 * 计算两点之间的距离
 * @param {*} x1 pointA(x1,y1)
 * @param {*} y1
 * @param {*} x2 pointB(x2,y2)
 * @param {*} y2
 * @returns
 */
export const disPoint = (x1: number, y1: number, x2: number, y2: number) => {
    var a = x1 - x2
    var b = y1 - y2
    return Math.sqrt(a * a + b * b)
}
/**
 * 计算两点之间的距离1
 * @param {*} a {x:number,y:number}
 * @param {*} b {x:number,y:number}
 */
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
}
/**
 * 最小二乘法
 * 同一平面上 已知两点坐标求m，n => y = nx + m
 * @param {*} a {x:number,y:number}
 * @param {*} b {x:number,y:number}
 */
export const minMulti = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    let n,
        m,
        f = false
    if (a.x == b.x) {
        n = 0
        m = 0
        f = true
    } else {
        n = (a.y - b.y) / (a.x - b.x)
        m = (a.x * b.y - a.y * b.x) / (a.x - b.x)
        f = false
        // 防止精度问题导致n变得无限
        if (Math.abs(n) <= 0.0001) {
            n = 0
        }
    }
    return {
        n,
        m,
        f,
    }
}

/**
 * 返回平行计算的直线
 * @param n 斜率 number
 * @param x x坐标 number
 * @param y y坐标 number
 * @returns
 */
export const getClem = (n: number, x: number, y: number) => {
    let k, m
    if (n != 0) {
        k = -1 / n
        m = y - k * x
    } else {
        k = 0
        m = 0
    }
    return {
        k,
        m,
    }
}

/**
 * 计算平行边的起始点坐标 及在圆外的点
 * @param {*} a {x:number,y:number,r:number}
 * @param {*} b {x:number,y:number,r:number}
 */
export const disParallel = (
    a: { x: number; y: number; r: number },
    b: { x: number; y: number; r: number },
) => {
    let d = distance(a, b)
    let x = a.x + ((a.r * 1.1) / d) * (b.x - a.x)
    let y = a.y + ((a.r * 1.1) / d) * (b.y - a.y)
    return {
        x,
        y,
    }
}

/**
 * 求圆和直线之间的交点
 * 直线方程：y = kx + b
 * 圆的方程：(x - m)² + (x - n)² = r²
 * x1, y1 = 线坐标1, x2, y2 = 线坐标2, m, n = 圆坐标, r = 半径
 * @param x1 点A（x1,y1）
 * @param y1
 * @param x2 点B（x2,y2）
 * @param y2
 * @param m  圆心（m,n）
 * @param n
 * @param r  圆半径
 * @returns
 */
export const getInsertPointBetweenCircleAndLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    m: number,
    n: number,
    r: number,
) => {
    let kbArr = binaryEquationGetKB(x1, y1, x2, y2)
    let k = kbArr[0]
    let b = kbArr[1]

    let aX = 1 + k * k
    let bX = 2 * k * (b - n) - 2 * m
    let cX = m * m + (b - n) * (b - n) - r * r

    let insertPoints: any = []
    let xArr = quadEquationGetX(aX, bX, cX)
    xArr.forEach(x => {
        let y = k * x + b
        insertPoints.push({
            x: x,
            y: y,
        })
    })
    if (x1 > x2 && insertPoints) {
        return insertPoints[1]
    } else if (insertPoints) {
        return insertPoints[0]
    } else {
        return []
    }
}
/**
 * 求正方形和线的交点
 * @param x 正方形中心（x0,y)
 * @param y
 * @param ox source点的中心(ox,oy)
 * @param oy
 * @param r 正方形大小
 */
export const getInsertPointBetweenSquareAndLine = (
    x: number,
    y: number,
    ox: number,
    oy: number,
    r: number,
) => {
    let squareleftX = x - r,
        squareRightX = x + r,
        squareBottomY = y - r,
        squareTopY = y + r
    let distanceX = ox - x,
        distanceY = oy - y,
        ansX,
        ansY

    ansX = distanceX > 0 ? squareRightX : squareleftX

    ansY = distanceY > 0 ? squareTopY : squareBottomY

    if (distanceX == 0) {
        return {
            x: x,
            y: ansY,
        }
    }

    if (distanceY == 0) {
        return {
            x: ansX,
            y,
        }
    }

    let tx = (ansX - x) / distanceX,
        ty = (ansY - y) / distanceY

    if (tx <= ty) {
        return {
            x: ansX,
            y: y + tx * distanceY,
        }
    } else {
        return {
            x: x + ty * distanceX,
            y: ansY,
        }
    }
}

/**
 * 求二元一次方程的系数
 * y1 = k * x1 + b => k = (y1 - b) / x1
 * y2 = k * x2 + b => y2 = ((y1 - b) / x1) * x2 + b
 * @param x1 点A（x1,y1）
 * @param y1
 * @param x2 点B（x2,y2）
 * @param y2
 * @returns
 */
const binaryEquationGetKB = (x1: number, y1: number, x2: number, y2: number) => {
    let k = (y1 - y2) / (x1 - x2)
    let b = (x1 * y2 - x2 * y1) / (x1 - x2)
    return [k, b]
}

/**
 * 一元二次方程求根
 * ax² + bx + c = 0
 * @param a x²的系数A
 * @param b x的系数B
 * @param c 常数
 * @returns
 */
const quadEquationGetX = (a: number, b: number, c: number) => {
    let xArr = []
    let result = Math.pow(b, 2) - 4 * a * c
    if (result > 0) {
        xArr.push((-b + Math.sqrt(result)) / (2 * a))
        xArr.push((-b - Math.sqrt(result)) / (2 * a))
    } else if (result == 0) {
        xArr.push(-b / (2 * a))
    }
    return xArr
}

/**
 * 同向法
 * 假设有三角形ABC与任意点P, 则如果点P在三角形ABC内时, 满足点P在向量AB,BC,CA的相同侧,即在三个向量的左侧或者右侧。
 * 对于向量AB,C点永远在AB的左侧或右侧,所以只要P点与C点同侧,P点就在向量AB的左侧或右侧。
 * 对向量AB,AP和向量AB,AC做叉乘运行,可以得到两条垂直向量,若这两条向量同向,则可以证明P,C相对AB同侧
 * 对三条边分别计算即可证明P在ABC内。
 * @param {*} x1 点A (x1,y1)
 * @param {*} y1
 * @param {*} x2 点B（x2,y2）
 * @param {*} y2
 * @param {*} x3 点C（x3,y3）
 * @param {*} y3
 * @param {*} x 点P（x,y）
 * @param {*} y
 * @returns
 */
export const isInside = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x: number,
    y: number,
) => {
    //注意输入点的顺序不一定是逆时针，需要判断一下
    if (crossProduct(x3 - x1, y3 - y1, x2 - x1, y2 - y1) >= 0) {
        let tmpx = x2
        let tmpy = y2
        x2 = x3
        y2 = y3
        x3 = tmpx
        y3 = tmpy
    }
    if (x1 == x2 && x1 == x3 && y1 == y2 && y1 == y3) return false
    if ((!x1 && !y1) || (!x2 && !y2) || (!x3 && !y3)) return false
    if (
        isInfinity(x1) ||
        isInfinity(x2) ||
        isInfinity(x3) ||
        isInfinity(y1) ||
        isInfinity(y2) ||
        isInfinity(y3)
    )
        return false
    if (crossProduct(x2 - x1, y2 - y1, x - x1, y - y1) < 0) return false
    if (crossProduct(x3 - x2, y3 - y2, x - x2, y - y2) < 0) return false
    if (crossProduct(x1 - x3, y1 - y3, x - x3, y - y3) < 0) return false
    return true
}
const isInfinity = (data: number) => {
    return data === Infinity || data === -Infinity
}
/**
 * 平面的积
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @returns
 */
export const crossProduct = (x1: number, y1: number, x2: number, y2: number) => {
    return x1 * y2 - x2 * y1
}

/**
 * 动画回调处理
 */
export const requestFrame =
    typeof requestAnimationFrame !== 'undefined'
        ? (callback: FrameRequestCallback) => requestAnimationFrame(callback)
        : (callback: FrameRequestCallback) => setTimeout(callback, 0)
export const cancelFrame =
    typeof cancelAnimationFrame !== 'undefined'
        ? (requestID: number) => cancelAnimationFrame(requestID)
        : (requestID: number) => clearTimeout(requestID)

export const getNow = function () {
    return Date.now()
}

/**
 * 创建webWorker
 * @param  {function}  fn
 * @return {DOMString}
 */
export const createWorker = (fn: any) => {
    var xURL = window.URL || window.webkitURL
    var code = fn.toString()
    var objectUrl = xURL.createObjectURL(
        new Blob(['(' + code + ').call(this);'], { type: 'text/javascript' }),
    )
    var worker = new Worker(objectUrl)
    xURL.revokeObjectURL(objectUrl)

    return worker
}
/**
 * webgl坐标转换
 * @param x
 * @param y
 * @returns
 */
export const coordTransformation = (graphId: string, x: number, y: number, transforms?: number) => {
    const transform = transforms ? transforms : basicData[graphId].transform
    x = x / transform
    y = -y / transform
    return [x, y]
}
/**
 * 颜色转换
 * @param val
 * @returns
 */
export const translateColor = function (val: string): any {
    let r = 0,
        g = 0,
        b = 0,
        a = 1
    if (val[0] === '#') {
        if (val.length === 4) {
            r = parseInt(val.charAt(1) + val.charAt(1), 16)
            g = parseInt(val.charAt(2) + val.charAt(2), 16)
            b = parseInt(val.charAt(3) + val.charAt(3), 16)
        } else {
            r = parseInt(val.charAt(1) + val.charAt(2), 16)
            g = parseInt(val.charAt(3) + val.charAt(4), 16)
            b = parseInt(val.charAt(5) + val.charAt(6), 16)
        }
        a = 1
    } else if (RGBA_TEST_REGEX2.test(val)) {
        let match: any = val.match(RGBA_EXTRACT_REGEX2)
        if (match) {
            r = +match[1]
            g = +match[2]
            b = +match[3]

            if (match[4]) a = +match[4]
        }
        match = null
    }

    let color = {
        r: r / 255,
        g: g / 255,
        b: b / 255,
        a,
    }
    return color
}
/**
 * 更新sdf文字集数据
 * @param attributeText
 */
export const updateSDFTextData = (attributeText: any, id: string) => {
    try {
        let flag = false
        let str = (attributeText.content + '').split('') || [],
            style = attributeText.style || 'normal'
        str.forEach((x: string) => {
            let value = `${x}-${style}-${id}`
            if (!globalProp.textSet.has(value)) {
                globalProp.textSet.add(value)
                flag = true
            }
            // if(Object.keys(instancesGL).length > 1){
            //     flag = true
            // }
        })
        return flag
    } catch (err) {
        throw new Error(err + '文字初始化失败')
    }
}

/**
 * 碰撞面积检测
 * @param x1 left1
 * @param y1 bottom1
 * @param x2 right1
 * @param y2 top1
 * @param x3 left2
 * @param y3 bottom2
 * @param x4 right2
 * @param y4 top2
 * @returns
 */
export function computeArea(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
) {
    let x = [],
        y = []
    x[0] = x1
    x[1] = x2
    x[2] = x3
    x[3] = x4
    y[0] = y1
    y[1] = y2
    y[2] = y3
    y[3] = y4
    x.sort((a, b) => a - b)
    y.sort((a, b) => a - b)
    // 重合部分的长等于两个矩形长的和减去四个横坐标中最大与最小的差
    let length = Math.abs(x1 - x2) + Math.abs(x3 - x4) - (x[3] - x[0])
    // 重合部分的宽与长的求法相同
    let width = Math.abs(y1 - y2) + Math.abs(y3 - y4) - (y[3] - y[0])
    if (length < 0 || width < 0) {
        return -1
    } else {
        return length * width
    }
}
/**
 * 碰撞检测
 * @param bodyA
 * @param bodyB
 * @returns
 */
export const intersects = function (bodyA: IBound, bodyB: IBound) {
    return !(
        bodyA.x + bodyA.width < bodyB.x ||
        bodyB.x + bodyB.width < bodyA.x ||
        bodyA.y + bodyA.height < bodyB.y ||
        bodyB.y + bodyB.height < bodyA.y
    )
}
/**
 * 判断是否为dom节点
 * @param obj
 * @returns
 */
export const isDom = (obj: any) => {
    var isDOM =
        typeof HTMLElement === 'object'
            ? obj instanceof HTMLElement
            : obj &&
            typeof obj === 'object' &&
            obj.nodeType === 1 &&
            typeof obj.nodeName === 'string'
    return isDOM
}

/**
 * 判断浏览器是否为ie
 * @returns 
 */
export const isIE = () => {
    // @ts-ignore
    if (!!window.ActiveXObject || "ActiveXObject" in window) {
        return true;
    } else {
        return false;
    }
}

/**
 * 判断是否支持webgl并开启硬件加速
 * @returns
 */
export const isWebGLSupported = function () {
    var canvas,
        webgl = !!window.WebGLRenderingContext
    // @ts-ignore
    // Ie不允许开启webgl
    if (isIE()) {
        return false
    }
    if (webgl) {
        canvas = document.createElement('canvas')
        try {
            const gl: any = (
                canvas.getContext('webgl', originInitial.options) ||
                canvas.getContext('experimental-webgl', originInitial.options)
            )
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    return !/SwiftShader/gi.test(renderer);
                }
            }
            return false
        } catch (e) {
            console.error(e)
            return false
        }
    }
    return false
}
/**
 * 颜色混合
 * @param color
 * @param opacity
 * @returns
 */
export const mixColor = (graphId: string, color: string, opacity: number) => {
    if (opacity === 1) return color
    if (!color) return `rgba(0,0,0,0)`
    // opacity *= opacity
    let transColor = translateColor(color)

    let { r: r1, g: g1, b: b1, a: a1 } = translateColor(globalInfo[graphId].backgroundColor.color),
        { r: r2, g: g2, b: b2, a: a2 } = transColor

    let a = a1 * (1 - opacity) + a2 * opacity,
        r = Math.round((r1 * (1 - opacity) + r2 * opacity) * 255),
        g = Math.round((g1 * (1 - opacity) + g2 * opacity) * 255),
        b = Math.round((b1 * (1 - opacity) + b2 * opacity) * 255)

    return `rgba(${r},${g},${b},${a})`
}
/**
 * 坐标转换canvas
 * @param x
 * @param y
 * @param position
 * @param scale
 * @param thumbnail
 * @returns
 */
export const transformCanvasCoord = (
    graphId: string,
    x: number,
    y: number,
    position: number[],
    scale: number,
    thumbnail: boolean = false,
) => {
    ; (x += position[0]), (y += position[1])
    x *= scale / 2.0
    y *= scale / 2.0
    let width = thumbnail
        ? globalInfo[graphId].thumbnail?.width
        : globalInfo[graphId].BoxCanvas.getWidth,
        height = thumbnail
            ? globalInfo[graphId].thumbnail?.height
            : globalInfo[graphId].BoxCanvas.getHeight
    x = roundedNum((x += width / 2))
    y = roundedNum((y += height / 2))
    return {
        x,
        y,
    }
}

export const roundedNum = (somenum: number) => {
    let rounded
    rounded = (0.5 + somenum) | 0
    rounded = ~~(0.5 + somenum)
    rounded = (0.5 + somenum) << 0
    return rounded
}

/**
 * 位置选择
 * @param location
 * @param sourceX
 * @param sourceY
 * @param radius
 */
export const switchSelfLinePostion = (
    renderType: string,
    location: string | undefined,
    sourceX: number,
    sourceY: number,
    radius: number,
    useMiddle: boolean = true,
) => {
    let pot1: number[] = [],
        pot2: number[] = [],
        ANGLE = 0,
        boundBox: number[] = []

    if (renderType == 'webgl' && useMiddle) {
        if (location == 'lowerLeft') location = 'upperLeft'
        else if (location == 'upperLeft') location = 'lowerLeft'

        if (location == 'lowerRight') location = 'upperRight'
        else if (location == 'upperRight') location = 'lowerRight'
    }
    switch (Number(loopLineType[location as any])) {
        case 1:
            pot1 = [
                radius * Math.cos((Math.PI / 180) * 90) + sourceX,
                radius * Math.sin((Math.PI / 180) * 90) + sourceY,
            ]
            pot2 = [
                radius * Math.cos((Math.PI / 180) * 190) + sourceX,
                radius * Math.sin((Math.PI / 180) * 190) + sourceY,
            ]
            ANGLE = 0.872
            boundBox = [
                sourceX,
                sourceX - radius / 150,
                sourceY + radius / 150,
                sourceY - radius / 150,
            ]
            break
        case 2:
            pot1 = [
                radius * Math.cos((Math.PI / 180) * 170) + sourceX,
                radius * Math.sin((Math.PI / 180) * 170) + sourceY,
            ]
            pot2 = [
                radius * Math.cos((Math.PI / 180) * 270) + sourceX,
                radius * Math.sin((Math.PI / 180) * 270) + sourceY,
            ]
            ANGLE = -0.858
            boundBox = [
                sourceX,
                sourceX - radius / 150,
                sourceY + radius / 150,
                sourceY - radius / 300,
            ]
            break
        case 3:
            pot1 = [
                radius * Math.cos((Math.PI / 180) * 0) + sourceX,
                radius * Math.sin((Math.PI / 180) * 0) + sourceY,
            ]
            pot2 = [
                radius * Math.cos((Math.PI / 180) * 100) + sourceX,
                radius * Math.sin((Math.PI / 180) * 100) + sourceY,
            ]
            ANGLE = -0.698
            boundBox = [
                sourceX + radius / 150,
                sourceX,
                sourceY + radius / 300,
                sourceY - radius / 150,
            ]
            break
        case 4:
            pot1 = [
                radius * Math.cos((Math.PI / 180) * 10) + sourceX,
                radius * Math.sin((Math.PI / 180) * 10) + sourceY,
            ]
            pot2 = [
                radius * Math.cos((Math.PI / 180) * 270) + sourceX,
                radius * Math.sin((Math.PI / 180) * 270) + sourceY,
            ]
            ANGLE = 0.872
            boundBox = [sourceX + radius / 150, sourceX, sourceY + radius / 150, sourceY]
            break
        default:
            break
    }
    return {
        controlCoordOne: pot1,
        controlCoordTwo: pot2,
        ANGLE,
        boundBox,
    }
}
/**
 * 返回容器宽度
 * @param container
 * @returns
 */
export const getContainerWidth = (container: any) => {
    return container.width || container.clientWidth || container.offsetWidth
}

/**
 * 返回容器高度
 * @param container
 * @returns
 */
export const getContainerHeight = (container: any) => {
    return container.height || container.clientHeight || container.offsetHeight
}
/**
 * 纹理
 * @param gl webgl对象
 * @param activeTexture n号纹理
 * @param tex 纹理对象
 * @param ctx 基地
 * @param filpY 是否反转
 */
export const initGlTextureBind = (
    gl: WebGLRenderingContext,
    activeTexture: number,
    tex: WebGLTexture | null,
    ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    filpY: boolean = true,
) => {
    ctx = ctx instanceof CanvasRenderingContext2D ? ctx.canvas : ctx

    gl.activeTexture(activeTexture)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    // UNPACK_FLIP_Y_WEBGL 在文字哪里并不需要反转
    if (filpY) {
        if (!gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL)) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        }
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    } else {
        if (gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL)) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        }
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx)

    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
}

/**
 * 判断当前点是否在屏幕上
 * @param ratio
 * @param position
 * @param data
 * @param type   1是点相关 2是边相关
 * @returns
 */
export const isInSceen = (
    graphId: string,
    renderType: string,
    scale: number,
    position: number[] | vec3,
    data: any,
    type: number,
) => {
    let width = globalInfo[graphId].BoxCanvas.getWidth,
        height = globalInfo[graphId].BoxCanvas.getHeight
    if (isNaN(position[0]) || isNaN(position[1])) {
        position[0] = 0
        position[1] = 0
    }
    if (type == 1) {
        let { x, y, radius: size } = data
        // 根据相机位置更改点的初始位置
        if (renderType === 'canvas') {
            ; (x += position[0]), (y += position[1])
            x *= scale / 2.0
            y *= scale / 2.0
            x += width / 2
            y += height / 2
            size = size * scale
        } else {
            let ratio = scale,
                unitWidth = width / ratio,
                unitHeight = height / ratio,
                aspectRatio = width / height

            let offset = coordTransformation(graphId, x, y)
            x = offset[0] - position[0]
            y = offset[1] - position[1]

            x = (x / aspectRatio + ratio / 2) * unitWidth
            y = (-y + ratio / 2) * unitHeight

            size = Math.ceil(
                (size / basicData[graphId].transform) * Math.max(unitWidth, unitHeight) * 2,
            )
                // @ts-ignore
                ; (offset = null), (data = null)
        }
        if (x >= -size && x <= width + size && y >= -size && y <= height + size) {
            return true
        } else {
            return false
        }
    } else {
        let { source, target, edge, initAttributes, graphId } = data
        let nodeList = basicData[graphId].nodeList,
            { attribute: souceAttribute } = nodeList.get(source).value,
            { attribute: targetAttribute } = nodeList.get(target).value

        if (
            isInSceen(
                graphId,
                renderType,
                scale,
                position,
                { ...edge.getMiddlePoint(true, initAttributes), radius: 1 },
                1,
            )
        ) {
            edge.value.attribute.labelInSceen = true
        }

        if (
            isInSceen(graphId, renderType, scale, position, souceAttribute, 1) ||
            isInSceen(graphId, renderType, scale, position, targetAttribute, 1) ||
            edge.value.attribute.labelInSceen == true
        ) {
            edge.value.attribute.labelInSceen = true
            return true
        }
        else return false
    }
}

export function wheelFunction(this: any, event: MouseEvent) {
    this.camera.processMouseScroll(event)
}

export function mousedownFunction(this: any, event: MouseEvent) {
    this.mouseCaptor.MouseDownListener(event)
    this.camera.processMouseDown(event)
}

export function doubleClickFunction(this: any) {
    this.mouseCaptor!.MouseDbClickListener()
}

export const isSameSet = (set1: Set<string | number>, set2: Set<string | number>) => {
    let s = new Set([...set1, ...set2])
    return s.size == set1.size && s.size == set2.size
}