import { globalInfo, globalProp } from '../../../initial/globalProp'
import { mixColor, transformCanvasCoord } from '../../../utils'
import { drawIcon, drawImage, useGradient } from './common'
/**
 * 绘制圆
 * @param graphId
 * @param context
 * @param data
 * @param ratio
 * @param position
 * @param thumbnail
 * @returns
 */
export default function canvasNodeDef(
    graphId: string,
    context: CanvasRenderingContext2D,
    data: any,
    ratio: number,
    position: any[],
    thumbnail: boolean,
): any {
    let { color, x, y, radius: size, innerStroke, isSelect, gradient, icon, image, opacity } = data,
        { color: unSelectedColor, width: borderSize, selectedColor } = innerStroke,
        scale = (globalProp.globalScale / ratio) * 2.0,
        backgroundColor = isSelect ? selectedColor : unSelectedColor
    borderSize = Number(borderSize) >= 0 ? borderSize / 100 : 2 / 100
    color = mixColor(graphId, color, opacity)
    backgroundColor = mixColor(graphId, backgroundColor, opacity)
    // 根据默认比例缩放当前点的大小
    size = size * scale
    // 根据相机位置更改点的初始位置
    let coord = transformCanvasCoord(graphId, x, y, position, scale, thumbnail)
    ;(x = coord.x), (y = coord.y)
    // 主体
    drawMainPart(context, x, y, size - Math.ceil(0.08 * size * 1e3) / 1e3, color, gradient)
    // 外环
    drawBorder(
        context,
        x,
        y,
        size,
        backgroundColor,
        (borderSize / 0.4) * size,
        borderSize ? Math.ceil(0.06 * size * 1e3) / 1e3 : 0,
    ) //(borderSize * 5 / scale) * scale
    context.globalAlpha = opacity
    if (image.url != '') {
        if (opacity != 1.0) {
            drawMainPart(
                context,
                x,
                y,
                globalInfo[graphId].backgroundColor.color,
                color,
                gradient,
                false,
            )
        }
        // 绘制图片
        drawImage(
            graphId,
            data,
            x,
            y,
            (size - Math.ceil(0.11 * size * 1e3 + (borderSize / 0.8) * size) / 1e3) * image.scale,
            context,
            'anonymous',
        )
    } else if (icon.content != '') {
        // 绘制icon
        drawIcon(data, x, y, size, context)
    }
    context.globalAlpha = 1.0
    return {
        x,
        y,
        size,
    }
}

// 绘制外环
export const drawBorder = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string | CanvasGradient | CanvasPattern,
    line_width: number,
    outLine: number = 0,
) => {
    if (line_width != 0) {
        context.beginPath()
        context.strokeStyle = color
        context.lineWidth = line_width + outLine
        context.arc(x, y, Math.abs(radius - line_width / 2 - outLine / 2), 0, Math.PI * 2, true)
        context.closePath()
        context.stroke()
    }
    if (outLine) {
        context.beginPath()
        context.strokeStyle = '#fff'
        context.lineWidth = outLine
        context.arc(x, y, Math.abs(radius - line_width - outLine / 2), 0, Math.PI * 2, true)
        context.closePath()
        context.stroke()
    }
}
// 绘制主体
export const drawMainPart = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string | CanvasGradient | CanvasPattern,
    gradient: any,
    type: boolean = true,
) => {
    // 开启渐变色
    context.fillStyle = type ? useGradient(context, gradient, color, x, y, size) : color
    context.beginPath()
    context.arc(x, y, size, 0, Math.PI * 2, true)
    context.closePath()
    context.fill()
}
