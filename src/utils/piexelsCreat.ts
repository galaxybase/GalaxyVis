const pixelRatio = 1
const imageCanvas = document.createElement('canvas')
const imageCanvasContext = imageCanvas.getContext('2d')

/**
 * iconfont的加载
 * @param {*} filterType  filter类型
 * @param {*} typeface  文字
 * @param {*} written  字体
 * @param {*} style  style
 * @param {*} number  icon 大小 128
 * @param {*} xAxis  x轴的初始 用于text
 * @returns
 */
const getTextPixels = async function (
    filterType: number,
    typeface: string,
    written: any,
    style: any,
    number: number,
    xAxis: number,
) {
    var imageContext = imageCanvasContext as CanvasRenderingContext2D
    var pixel = number * pixelRatio
    // 字体宽度
    var textWidth = pixel

    var width = Math.ceil(textWidth * 1e3) / 1e3
    var height = Math.ceil(pixel * 1e3) / 1e3

    imageCanvas.height = height

    imageCanvas.width = width

    imageContext.font = `${style} ${width * xAxis * 0.9}px ${written}`
    // @ts-ignore
    if (document.fonts && !document.fonts.check(imageContext.font)) {
        // @ts-ignore
        await document.fonts.load(imageContext.font)
    }

    imageContext.clearRect(0, 0, width, height)
    imageContext.fillStyle = 'black'
    imageContext.textBaseline = 'middle'
    imageContext.textAlign = 'center'
    imageContext.fillText(typeface, width / 2, height / 2)

    let data: any = imageContext.getImageData(0, 0, width, height)

    return {
        content: typeface,
        pixels: data,
        filter: filterType,
    }
}

export { getTextPixels }
