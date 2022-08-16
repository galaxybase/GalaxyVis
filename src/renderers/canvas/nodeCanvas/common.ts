import { PlainObject } from '../../../types'
import event from '../../../utils/event'
/**
 * 渐变色的操作
 * @param context
 * @param gradient
 * @param color
 * @param x
 * @param y
 * @param size
 * @returns
 */
export const useGradient = (
    context: CanvasRenderingContext2D,
    gradient: { isGradient: any; position: any },
    color: any,
    x: number,
    y: number,
    size: number,
) => {
    if (gradient?.isGradient) {
        let defaultColor = color
        switch (gradient.position) {
            case 'left':
                color = context.createLinearGradient(x - size, y - size, x + size, y + size)
                break
            case 'right':
                color = context.createLinearGradient(x + size, y + size, x - size, y - size)
                break
            case 'top':
                color = context.createLinearGradient(x, y + size, x, y - size)
                break
            case 'bottom':
                color = context.createLinearGradient(x, y - size, x, y + size)
                break
            default:
                break
        }
        color.addColorStop(0, '#FFFFFF')
        color.addColorStop(0.75, defaultColor)
        color.addColorStop(1, defaultColor)
    }

    return color
}

var imgCache: PlainObject<any> = {}
/**
 * 绘制图片到点
 * @param node
 * @param x
 * @param y
 * @param size
 * @param context
 * @param imgCrossOrigin
 * @param clipFn
 * @returns
 */
export const drawImage = (
    node: any,
    x: number,
    y: number,
    size: number,
    context: CanvasRenderingContext2D,
    imgCrossOrigin: string,
    clipFn?: Function,
) => {
    if (!node.image || !node.image.url) return

    var url = node.image.url
    var scale = 1
    var clip = 1
    // 加载图片 防止过度加载
    var image = imgCache[url]
    if (!image) {
        image = document.createElement('IMG')
        image.setAttribute('crossOrigin', imgCrossOrigin)
        image.src = url
        image.onload = function () {
            event.trigger('renderCanvas')
        }
        imgCache[url] = image
    }
    var r = size * scale
    context.save()
    try {
        context.beginPath()
        // 适配不同形状的点
        if (typeof clipFn === 'function') {
            clipFn(x, y, size * clip, context)
        } else {
            context.arc(x, y, size * clip, 0, Math.PI * 2, true)
        }
        context.closePath()
        context.clip()
        context.drawImage(image, x - r, y - r, r * 2, r * 2)
    } catch {}
    context.restore()
}
const pattern = /[1-9]\d*\.\d*|0\.\d*[1-9]\d*$/
/**
 * 绘制icon到点
 * @param node
 * @param x
 * @param y
 * @param size
 * @param context
 * @returns
 */
export const drawIcon = async (
    node: any,
    x: number,
    y: number,
    size: number,
    context: CanvasRenderingContext2D,
) => {
    if (!node.icon) return

    var font = node.icon.font || 'Arial',
        fgColor = node.icon.color || '#F00',
        text = node.icon.content || '?',
        height = size

    // icon的缩放
    var fontSizeRatio = 0.7
    if (typeof node.icon.scale === 'number') {
        fontSizeRatio = Math.abs(Math.max(0.01, node.icon.scale * 2))
    }
    var fontSize = Math.round(fontSizeRatio * height)

    // 加载字体
    let checkFont = `12px ${font}`
    //@ts-ignore
    if (!document.fonts.check(checkFont)) {
        // @ts-ignore
        await document.fonts.load(checkFont)
    }

    context.save()
    context.fillStyle = fgColor
    context.font = '' + fontSize + 'px ' + font

    try {
        // 兼容chrome57
        let execFontSize = (pattern.exec(context.font) as Array<any>)[0]
        if (`${fontSize}` !== execFontSize) {
            context.restore()
            return
        }
    } catch {}

    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, x, y)
    context.restore()
}
