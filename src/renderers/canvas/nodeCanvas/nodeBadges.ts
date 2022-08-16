import { globalInfo, globalProp } from '../../../initial/globalProp'
import { mixColor, transformCanvasCoord } from '../../../utils'
import { drawIcon, drawImage } from './common'
import { drawBorder, drawMainPart } from './nodesDef'
/**
 * 绘制徽章
 * @param graphId
 * @param context
 * @param data
 * @param ratio
 * @param position
 * @param thumbnail
 */
export default function drawBadges(
    graphId: string,
    context: CanvasRenderingContext2D,
    data: any,
    ratio: number,
    position: any[],
    thumbnail: boolean,
): void {
    let camScale = (globalProp.globalScale / ratio) * 2.0,
        { color: nodeColor, x, y, radius: size, badges, opacity } = data,
        { postion, color, scale, text, stroke, image } = badges

    color = color == 'inherit' ? nodeColor : color ? color : '#fff'
    color = mixColor(graphId, color, opacity)
    scale = scale || 0.35
    size = size * camScale
    let radius = size * scale
    let coord = transformCanvasCoord(graphId, x, y, position, camScale, thumbnail)
    ;(x = coord.x), (y = coord.y)
    let rotate = (Math.PI * 45) / 180

    postion = postion || 'bottomRight'
    let direction = globalProp.direction,
        newX = x + direction[postion][0] * (size - 2) * Math.sin(rotate),
        newY = y + direction[postion][1] * (size - 2) * Math.cos(rotate)
    drawMainPart(context, newX, newY, radius, color, null, false)
    // 外环
    let { color: strokeColor, width: storkeWidth } = stroke
    strokeColor = mixColor(graphId, strokeColor, opacity)
    drawBorder(context, newX, newY, radius, strokeColor, (storkeWidth * size) / 20)
    context.globalAlpha = opacity
    if (image) {
        if (opacity != 1.0) {
            drawMainPart(
                context,
                newX,
                newY,
                radius,
                globalInfo[graphId].backgroundColor.color,
                null,
                false,
            )
        }
        drawImage(
            {
                image: {
                    url: image,
                    scale: 1.0,
                },
            },
            newX,
            newY,
            radius - (storkeWidth * size) / 40,
            context,
            'anonymous',
        )
    } else if (text?.content) {
        drawIcon(
            {
                icon: text,
            },
            newX,
            newY,
            radius - (storkeWidth * size) / 20,
            context,
        )
    }
    context.globalAlpha = 1.0
}
