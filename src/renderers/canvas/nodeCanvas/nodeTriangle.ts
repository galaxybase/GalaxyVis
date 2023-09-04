import { globalInfo, globalProp } from '../../../initial/globalProp'
import { mixColor, transformCanvasCoord } from '../../../utils'
import { drawIcon, drawImage, useGradient } from './common'
/**
 * 绘制三角形
 * @param graphId
 * @param context
 * @param data
 * @param ratio
 * @param position
 * @param thumbnail
 * @returns
 */
export default function canvasNodeTriangle(
    graphId: string,
    context: CanvasRenderingContext2D,
    data: any,
    ratio: number,
    position: any[],
    thumbnail: boolean,
): any {
    let { color, x, y, radius: size, innerStroke, isSelect, gradient, image, icon, opacity } = data,
        { color: unSelectedColor, width: borderSize, selectedColor } = innerStroke,
        scale = (globalProp.globalScale / ratio) * 2.0 // 根据默认比例缩放当前点的大小
    borderSize = Number(borderSize) >= 0 ? borderSize / 100 : 2 / 100
    // 根据相机位置更改点的初始位置
    size *= scale * Math.sqrt(1.5)
    let coord = transformCanvasCoord(graphId, x, y, position, scale, thumbnail)
    ;(x = coord.x), (y = coord.y)
    y += size / 4

    color = mixColor(graphId, color, opacity)
    drawMainPart(context, x, y, size, color, gradient)
    // 外环
    let backgroundColor = isSelect ? selectedColor : unSelectedColor
    drawBorder(
        context,
        x,
        y,
        size,
        backgroundColor,
        (borderSize / 0.4) * size,
        borderSize ? ((borderSize / 2 + 0.015) / 0.4) * size : 0,
    )
    backgroundColor = mixColor(graphId, backgroundColor, opacity)

    context.globalAlpha = opacity
    if (image.url != '' && image.url != null) {
        if (opacity != 1.0) {
            drawMainPart(
                context,
                x,
                y,
                size,
                globalInfo[graphId].backgroundColor.color,
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
            size - (borderSize / 0.4) * size - ((borderSize / 2 + 0.015) / 0.4) * size,
            context,
            'anonymous',
            (x: number, y: number, size: number, context: CanvasRenderingContext2D) => {
                triangleGraphic(context, x, y, size)
            },
        )
    } else if (icon.content != '' && icon.content != null) {
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

const triangleGraphic = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
) => {
    var rotate = (Math.PI * 240) / 180
    context.moveTo(x + radius * Math.sin(rotate), y - radius * Math.cos(rotate))
    for (var i = 1; i < 3; i++) {
        context.lineTo(
            x + Math.sin(rotate + (2 * Math.PI * i) / 3) * radius,
            y - Math.cos(rotate + (2 * Math.PI * i) / 3) * radius,
        )
    }
}

// 绘制外环
const drawBorder = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string | CanvasGradient | CanvasPattern,
    line_width: number,
    outLine: number = 0,
) => {
    if (outLine) {
        context.beginPath()
        context.strokeStyle = '#fff'
        context.lineWidth = outLine
        triangleGraphic(context, x, y, radius - outLine)
        context.closePath()
        context.stroke()
    }
    if (line_width != 0) {
        context.beginPath()
        context.strokeStyle = color
        context.lineWidth = line_width
        triangleGraphic(context, x, y, radius + outLine / 4)
        context.closePath()
        context.stroke()
    }
}

// 绘制主体
const drawMainPart = (
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
    triangleGraphic(context, x, y, size)
    context.closePath()
    context.fill()
}
