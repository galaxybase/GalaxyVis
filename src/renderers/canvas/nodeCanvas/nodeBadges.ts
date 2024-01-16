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
        { color: nodeColor, x, y, radius: size, badges, opacity } = data;

    let badgesArray = Object.keys(badges)

    let coord = transformCanvasCoord(graphId, x, y, position, camScale, thumbnail);
    let badgeSize = size * camScale
    x = coord.x, y = coord.y;
    for (let i = 0; i < badgesArray.length; i++) {

        let {
            color, scale, text, stroke, image
        } = badges[badgesArray[i]];
        let { url } = image
        color = color == 'inherit' ? nodeColor : color ? color : '#fff'
        color = mixColor(graphId, color, opacity)
        scale = scale || 0.35

        let radius = badgeSize * scale * 0.9

        let rotate = (Math.PI * 45) / 180

        let postion = badgesArray[i] || 'bottomRight'
        let direction = globalProp.direction,
            newX = x + direction[postion][0] * (badgeSize - 2) * Math.sin(rotate),
            newY = y + direction[postion][1] * (badgeSize - 2) * Math.cos(rotate);

        context.save()
        drawMainPart(context, newX, newY, radius, color, null, false)
        // 外环
        if(!stroke) {
            stroke = {color: "#fff", width: 0.02}
        }
        let { color: strokeColor, width: storkeWidth } = stroke
        if (!strokeColor) strokeColor = "#fff"
        storkeWidth = Number(storkeWidth) >= 0 ? storkeWidth / 100 : 0.02
        strokeColor = mixColor(graphId, strokeColor, opacity)
        drawBorder(context, newX, newY, radius + Math.ceil(0.08 * radius * 1e3) / 1e3, strokeColor, (storkeWidth / 0.4) * badgeSize)
        context.globalAlpha = opacity
        if (url) {
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
                graphId,
                {
                    image: {
                        url,
                        scale: 1.0,
                    },
                },
                newX,
                newY,
                radius - (storkeWidth * badgeSize) / 40,
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
                radius - (storkeWidth * badgeSize) / 20,
                context,
            )
        }
        context.globalAlpha = 1.0;
        context.restore()
    }
}
