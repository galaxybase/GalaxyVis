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
    iconMap: Map<string | number, any>,
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
    let iconNum: number = image.url ? iconMap.get(image.url + color)?.num : iconMap.get(icon.content)?.num
    let iconColor = floatColor(icon.color || '#fff').rgb
    if (!iconNum) {
        iconNum = 0
    }

    let colorFloat = newfloatColor(color)
    let shapeType = Number(typeShape[shape])
    let badgesArr = []
    if (badges) {
        let badgesArray = Object.keys(badges)
        for (let i = 0; i < badgesArray.length; i++) {
            let { color: badgesColor, scale, text, stroke, image, postion } = badges[badgesArray[i]]
            badgesColor =
                badgesColor == 'inherit'
                    ? colorFloat
                    : badgesColor
                        ? newfloatColor(badgesColor)
                        : newfloatColor('#fff')
            scale = scale || 0.35
            let innerWidth = Number(stroke?.width) >= 0 ? stroke.width : 2
            let zoomResults2 =
                Math.ceil(((radius - innerWidth) / globalProp.standardRadius) * 1e2) / 1e2
            let size = zoomResults2 * scale

            postion = badgesArray[i] || 'bottomRight'

            let direction = globalProp.direction

            let x = offsets[0] + direction[postion][0] * (zoomResults) * 0.1 * 0.60,
                y = offsets[1] - direction[postion][1] * (zoomResults) * 0.1 * 0.60
            let iconType = image ? 1 : text?.content != '' ? 2 : 3
            let badgesIconColor = floatColor(text?.color || '#f00').rgb
            let iconNum: number = image ? iconMap.get(image)?.num : iconMap.get(text?.content || '')?.num
            badgesArr.push({
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
            })
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
        badges: badgesArr,
        opacity,
        iconColor,
    }
}
