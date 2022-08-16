import { coordTransformation, floatColor, newfloatColor } from '..'
import { globalProp } from '../../initial/globalProp'
import { typeShape } from '../../types'

/**
 * 过滤部分数据和处理部分数据
 * @param attribute
 * @param iconMap
 * @returns
 */
export const getPoint = (
    graphId: string,
    attribute: any,
    iconMap: Map<any, any>,
    transform: number,
) => {
    let {
        x,
        y,
        radius,
        color,
        innerStroke,
        isNode,
        shape,
        isSelect,
        icon,
        text,
        image,
        gradient,
        badges,
        opacity,
    } = attribute
    // 真实的r比例
    let zoomResults: number = Math.ceil((radius / globalProp.standardRadius) * 1e2) / 1e2
    // 偏移量
    let offsets: number[] = coordTransformation(graphId, x, y, transform)
    // 图标的类型
    let iconType = image.url ? 1 : icon.content != '' ? 2 : 3
    let iconNum: number = image.url ? iconMap.get(image.url)?.num : iconMap.get(icon.content)?.num
    let iconColor = floatColor(icon.color || '#fff').rgb
    if (!iconNum) {
        iconNum = 0
    }

    let colorFloat = newfloatColor(color)
    let shapeType = Number(typeShape[shape])

    if (badges) {
        let { color: badgesColor, scale, text, stroke, image, postion } = badges
        badgesColor =
            badgesColor == 'inherit'
                ? colorFloat
                : badgesColor
                ? newfloatColor(badgesColor)
                : newfloatColor('#fff')
        scale = scale || 0.35
        let zoomResults =
            Math.ceil(((radius - stroke.width) / globalProp.standardRadius) * 1e2) / 1e2
        let size = zoomResults * scale

        postion = postion || 'bottomRight'

        let direction = globalProp.direction

        let x = offsets[0] + direction[postion][0] * (zoomResults - size) * 0.1,
            y = offsets[1] - direction[postion][1] * (zoomResults - size) * 0.1

        let iconType = image ? 1 : text?.content != '' ? 2 : 3
        let badgesIconColor = floatColor(text.color || '#fff').rgb
        let iconNum: number = image ? iconMap.get(image)?.num : iconMap.get(text.content)?.num
        let innerWidth = Number(stroke?.width) >= 0 ? stroke.width : 2
        badges = {
            x,
            y,
            iconType,
            iconNum,
            color: badgesColor,
            size,
            stroke: {
                color: floatColor(stroke?.color || '#fff').rgb,
                width: innerWidth,
            },
            opacity,
            iconColor: badgesIconColor,
        }
    }

    return {
        color: colorFloat,
        offsets,
        innerStroke,
        radius,
        isNode,
        zoomResults,
        isSelect,
        text,
        iconNum,
        iconType,
        gradient,
        shapeType,
        badges,
        opacity,
        iconColor,
    }
}
