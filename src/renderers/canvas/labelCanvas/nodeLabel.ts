import { globalProp } from '../../../initial/globalProp'
import { mixColor, transformCanvasCoord } from '../../../utils'
import { getLines } from './common'

const pattern = /[1-9]\d*\.\d*|0\.\d*[1-9]\d*$/
/**
 * 点文字的绘制
 * @param graphId
 * @param context
 * @param data
 * @param positions
 * @param ratio
 * @param thumbnail
 * @returns
 */
export default function canvasLabelNode(
    graphId: string,
    context: CanvasRenderingContext2D,
    data: any,
    positions: any[],
    ratio: number,
    thumbnail: boolean,
): void {
    let { x, y, radius: size, text, opacity } = data

    let {
        color,
        background,
        position,
        margin = [0, 0],
        fontSize,
        maxLength,
        content,
        style = 'normal',
        minVisibleSize,
    } = text
    if (style == 'none') style = 'normal'
    // 根据默认比例缩放当前点的大小
    let scale = (globalProp.globalScale / ratio) * 2.0
    // 根据相机位置更改点的初始位置
    size = size * scale
    let coord = transformCanvasCoord(graphId, x, y, positions, scale, thumbnail)
    ;(x = coord.x), (y = coord.y)
    // 字体的偏移量
    let labelOffsetX,
        labelOffsetY,
        fontFamily = 'Arial'

    labelOffsetX = 0
    labelOffsetY = fontSize / 3

    fontSize = Math.ceil(fontSize * (scale / 2))

    if (fontSize <= minVisibleSize) return

    // 默认左对齐
    context.textAlign = 'left'
    // 根据不同位置给点有不同偏移量
    switch (position) {
        case 'bottom':
            labelOffsetY = +size + fontSize + 3
            break
        case 'center':
            break
        case 'left':
            labelOffsetX = -size - 3
            break
        case 'top':
            labelOffsetY = -size - fontSize / 4
            break
        case 'right':
            labelOffsetX = +size + 3
            break
        default:
            break
    }
    // 文字换行记录
    var lines = getLines(content, maxLength),
        baseX = x + labelOffsetX + margin[0] * 100,
        baseY = Math.round(y + labelOffsetY + margin[1] * 100)

    context.font = `${style} ${fontSize}px ${fontFamily}`
    // 不同位置下位置的处理
    let len =
        lines.length > 1 && position == 'top'
            ? lines.length - 1
            : lines.length > 1 && position !== 'bottom'
            ? lines.length / 2
            : 0

    baseY -= len * (fontSize + 1)

    let width = context.measureText(lines[0]).width

    if (position == 'top' || position == 'bottom' || position == 'center') baseX -= width / 2
    if (position == 'left') baseX -= width
    let buffer = fontSize / 8

    let height = lines.length > 1 ? lines.length - 1 : 0
    color = mixColor(graphId, color, opacity)
    context.save()
    try {
        // 兼容chrome57
        let execFontSize = (pattern.exec(context.font) as Array<any>)[0]
        if (`${fontSize}` !== execFontSize) {
            let execScale = Math.ceil(fontSize / execFontSize)
            let combinedRatio = Math.ceil((1 - execScale) / execScale)
            context.scale(execScale, execScale)
            context.translate(
                baseX * combinedRatio + (width / 2) * combinedRatio,
                baseY * combinedRatio,
            )
        }
    } catch {}

    // 绘制背景色
    context.beginPath()
    // context.font = `${style} ${fontSize}px ${fontFamily}`
    context.fillStyle = background
    context.moveTo(baseX, baseY - fontSize) //左
    context.lineTo(baseX, baseY + 2 * buffer + height * (fontSize + 1)) //左
    context.lineTo(baseX + width, baseY + 2 * buffer + height * (fontSize + 1)) //右
    context.lineTo(baseX + width, baseY - fontSize) //右
    context.closePath()
    context.fill()
    // 绘制文字
    context.fillStyle = color
    for (var i = 0; i < lines.length; ++i) {
        context.fillText(lines[i], baseX, baseY + i * (fontSize + 1))
    }

    context.restore()
}
