const INF = 1e20

export default class tinySDF {
    buffer: any
    cutoff: number
    radius: number
    size: number
    fontSize: number
    fontFamily: string
    ctx: CanvasRenderingContext2D | null
    gridOuter: Float64Array
    gridInner: Float64Array
    f: Float64Array
    z: Float64Array
    v: Uint16Array
    style: string | number | null
    constructor({
        fontSize = 32,
        buffer = 4,
        radius = 8,
        cutoff = 0.25,
        fontFamily = 'Arial', //Roboto Arial noto serif cursive
    }) {
        this.buffer = buffer
        this.cutoff = cutoff
        this.radius = radius
        this.fontSize = fontSize
        this.fontFamily = fontFamily
        this.style = null
        // 画布大小足够大，以便在glyph周围都有指定的缓冲区
        const size = (this.size = Math.floor(fontSize + buffer * 4))
        const canvas = this._createCanvas(size)
        const ctx = (this.ctx = canvas.getContext('2d'))

        ctx!.textBaseline = 'middle'
        ctx!.textAlign = 'left'
        ctx!.fillStyle = 'black'

        // 距离变换的临时数组
        this.gridOuter = new Float64Array(size * size)
        this.gridInner = new Float64Array(size * size)
        this.f = new Float64Array(size)
        this.z = new Float64Array(size + 1)
        this.v = new Uint16Array(size)
    }

    _createCanvas(size: number) {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        return canvas
    }

    getMetrics(char: string) {
        this.ctx!.font = `${this.style} ${this.fontSize}px ${this.fontFamily}`
        const {
            width: glyphAdvance,
            actualBoundingBoxAscent,
            actualBoundingBoxDescent,
            actualBoundingBoxLeft,
            actualBoundingBoxRight, //对齐点到文本矩形边界的距离，使用 CSS 像素计算
        } = this.ctx!.measureText(char)
        // 获取文字顶部距离
        const glyphTop = Math.floor(actualBoundingBoxAscent)
        const glyphLeft = 0
        // 如果图示符溢出画布大小，它将在底部/右侧被剪裁
        let bufferWidth = this.style == 'italic' ? Math.floor(this.buffer / 2 + 1) : 0
        const glyphWidth = !(!actualBoundingBoxRight && !actualBoundingBoxLeft)
            ? Math.min(
                  Math.ceil(glyphAdvance),
                  Math.ceil(actualBoundingBoxRight - actualBoundingBoxLeft),
              ) + bufferWidth
            : Math.ceil(glyphAdvance) + bufferWidth
        const aHeight = Math.min(
            this.size - this.buffer,
            Math.ceil(actualBoundingBoxAscent) + Math.ceil(actualBoundingBoxDescent),
        )

        const glyphHeight = this.size - 2 * this.buffer
        const width = glyphWidth
        const height = glyphHeight + 2 * this.buffer

        return {
            width,
            height,
            glyphWidth,
            glyphHeight,
            glyphTop,
            glyphLeft,
            glyphAdvance,
            aHeight,
        }
    }

    draw(charData: any) {
        let { char, style } = charData
        this.style = style
        const metrics = this.getMetrics(char)
        let { width, height, glyphWidth, glyphHeight } = metrics

        let iscjk = isCJK(char)

        const len = width * height
        const data = new Uint8ClampedArray(len) || new Uint8Array(len)
        const glyph = {
            data,
            ...metrics,
            iscjk,
        }
        glyphWidth = Math.ceil(glyphWidth * 1e3) / 1e3 || 0
        glyphHeight = Math.ceil(glyphHeight * 1e3) / 1e3 || 0

        if (glyphWidth === 0 || glyphHeight === 0) return glyph

        const { ctx, buffer, gridInner, gridOuter, fontSize, fontFamily } = this

        let drawBuff = buffer
        ctx!.clearRect(buffer, buffer, glyphWidth, glyphHeight)
        ctx!.font = `${style} ${fontSize}px ${fontFamily}`
        ctx!.fillText(char, drawBuff + buffer / 8, Math.floor(glyphHeight / 2 + buffer))
        const imgData = ctx!.getImageData(drawBuff, buffer, glyphWidth, glyphHeight)
        // 将轮廓范围外的栅格初始化为alpha 0
        gridOuter.fill(INF, 0, len)
        gridInner.fill(0, 0, len)

        for (let y = 0; y < glyphHeight; y++) {
            for (let x = 0; x < glyphWidth; x++) {
                const a = imgData.data[4 * (y * glyphWidth + x) + 3] / 255
                if (a === 0) continue

                const j = (y + buffer) * width + x

                if (a === 1) {
                    gridOuter[j] = 0
                    gridInner[j] = INF
                } else {
                    const d = 0.5 - a
                    gridOuter[j] = d > 0 ? d * d : 0
                    gridInner[j] = d < 0 ? d * d : 0
                }
            }
        }

        edt(gridOuter, width, height, this.f, this.v, this.z)
        edt(gridInner, width, height, this.f, this.v, this.z)

        for (let i = 0; i < len; i++) {
            const d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i])
            data[i] = Math.round(255 - 255 * (d / this.radius + this.cutoff))
        }

        return glyph
    }
}

// 2D 欧几里得平面距离
function edt(data: Float64Array, width: number, height: number, f: any, v: any, z: any) {
    for (let x = 0; x < width; x++) edt1d(data, x, width, height, f, v, z)
    for (let y = 0; y < height; y++) edt1d(data, y * width, 1, width, f, v, z)
}
// 一维平方距离变换
function edt1d(
    grid: any,
    offset: number,
    stride: number,
    length: number,
    f: number[],
    v: any[],
    z: number[],
) {
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    f[0] = grid[offset]

    for (let q = 1, k = 0, s = 0; q < length; q++) {
        f[q] = grid[offset + q * stride]
        const q2 = q * q
        do {
            const r = v[k]
            s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2
        } while (s <= z[k] && --k > -1)

        k++
        v[k] = q
        z[k] = s
        z[k + 1] = INF
    }

    for (let q = 0, k = 0; q < length; q++) {
        while (z[k + 1] < q) k++
        const r = v[k]
        const qr = q - r
        grid[offset + q * stride] = f[r] + qr * qr
    }
}

/**
 * 判断是不是中日韩的文字
 * @param {*} char
 * @returns
 */
function isCJK(char: any) {
    char = char.charCodeAt(0)
    return char >= 0x4e00 && char <= 0x9fff
}
