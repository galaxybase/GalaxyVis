import { min, max } from 'lodash'
import { globalProp } from '../../../initial/globalProp'
import { loopLineType } from '../../../types'
import { mixColor, switchSelfLinePostion, transformCanvasCoord } from '../../../utils'
import { bezier3, calcArrowCoords, defaultEdge, getPoint } from './commom'
/**
 * 自环边绘制
 * @param graphId
 * @param context
 * @param ratio
 * @param position
 * @param data
 * @param sourceX
 * @param sourceY
 * @param sourceSize
 * @param num
 * @param thumbnail
 * @param useHalo
 * @returns
 */
export default function canvasEdgeSelf(
    graphId: any,
    context: CanvasRenderingContext2D,
    ratio: number,
    position: any[],
    data: any,
    sourceX: number,
    sourceY: number,
    sourceSize: number,
    num: number,
    thumbnail: boolean,
    useHalo: boolean = false,
): any {
    // 根据默认比例缩放当前点的大小
    let scale = (globalProp.globalScale / ratio) * 2.0,
        // 根据相机位置更改点的初始位置
        coord = transformCanvasCoord(graphId, sourceX, sourceY, position, scale, thumbnail)
    ;(sourceX = coord.x), (sourceY = coord.y)

    let { color, width: lineWidth, location, shape, text, selectedColor, isSelect, opacity } = data
    lineWidth /= 25
    color = isSelect ? selectedColor : color
    // 点的缩放
    let radius = scale * ((num - 1) * 40 + sourceSize * 5),
        {
            controlCoordOne: pot1,
            controlCoordTwo: pot2,
            ANGLE,
        } = switchSelfLinePostion('canvas', location, sourceX, sourceY, radius)
    // 如果是虚线的边
    if (shape?.style == 'dash') {
        context.setLineDash([5 * scale])
    }
    color = mixColor(graphId, color, opacity)
    let width = lineWidth * scale * 150
    context.strokeStyle = color
    context.lineWidth = width
    var bezier = []

    // 如果是带箭头的边
    if (shape?.head == 'arrow') {
        sourceSize *= scale
        context.beginPath()
        context.moveTo(sourceX, sourceY)
        // 旋转箭头指向的位置
        if (loopLineType[location] == '1' || loopLineType[location] == '2') {
            ;[pot1[0], pot2[0]] = [pot2[0], pot1[0]]
            ;[pot1[1], pot2[1]] = [pot2[1], pot1[1]]
        }
        for (var i = 0; i < 1; i += 0.025) {
            var p = bezier3(
                i,
                { x: sourceX, y: sourceY },
                { x: pot2[0], y: pot2[1] },
                { x: pot1[0], y: pot1[1] },
                { x: sourceX, y: sourceY },
            )
            bezier.push(p)
        }

        let { minX, minY, maxX, maxY, KL } = calcArrowCoords(
            bezier,
            sourceX,
            sourceY,
            sourceSize,
            lineWidth,
            scale,
        )

        // 计算箭头的位置
        let { aX, aY, vX, vY, insertPoints, insertPoints2 } = defaultEdge(
            minX,
            minY,
            maxX,
            maxY,
            sourceX,
            sourceY,
            sourceSize,
            lineWidth,
            scale,
            true,
        )

        bezier = bezier.splice(KL)
        bezier = bezier.reverse()
        bezier.push({
            x: insertPoints ? insertPoints.x : maxX,
            y: insertPoints ? insertPoints.y : maxY,
        })
        // 绘制边
        bezier.forEach(item => {
            context.lineTo(item.x, item.y)
        })
        context.stroke()
        context.closePath()

        // 绘制箭头
        context.fillStyle = color
        context.beginPath()
        context.moveTo(aX + vX * 0.5, aY + vY * 0.5)
        context.lineTo(insertPoints2.x - vY * 0.7, insertPoints2.y + vX * 0.7)
        context.lineTo(insertPoints2.x + vY * 0.7, insertPoints2.y - vX * 0.7)
        context.moveTo(aX + vX * 0.5, aY + vY * 0.5)
        context.closePath()
        context.fill()
    } else {
        // 不含箭头直接调用bezier的api
        context.beginPath()
        context.moveTo(sourceX, sourceY)
        context.bezierCurveTo(pot1[0], pot1[1], pot2[0], pot2[1], sourceX, sourceY)
        context.stroke()
        context.closePath()

        for (var i = 0; i < 1; i += 0.025) {
            var p = bezier3(
                i,
                { x: sourceX, y: sourceY },
                { x: pot2[0], y: pot2[1] },
                { x: pot1[0], y: pot1[1] },
                { x: sourceX, y: sourceY },
            )
            bezier.push(p)
        }
    }
    context.setLineDash([])

    if (useHalo) return

    // 计算边的中点位置用于计算文字位置
    let bezierMid = bezier3(
        0.5,
        { x: sourceX, y: sourceY },
        { x: pot1[0], y: pot1[1] },
        { x: pot2[0], y: pot2[1] },
        { x: sourceX, y: sourceY },
    )

    let left = Math.max(0.6, 0.7 - num * 0.01),
        right = Math.min(0.4, 0.3 + num * 0.01)

    let bezierleft = bezier3(
        left,
        { x: sourceX, y: sourceY },
        { x: pot1[0], y: pot1[1] },
        { x: pot2[0], y: pot2[1] },
        { x: sourceX, y: sourceY },
    )

    let bezierright = bezier3(
        right,
        { x: sourceX, y: sourceY },
        { x: pot1[0], y: pot1[1] },
        { x: pot2[0], y: pot2[1] },
        { x: sourceX, y: sourceY },
    )
    // 返回文字位置和旋转角度
    let textMod = {
        x: text?.position === 'center' ? bezierMid.x : (bezierleft.x + bezierright.x) / 2,
        y: text?.position === 'center' ? bezierMid.y : (bezierleft.y + bezierright.y) / 2,
        ANGLE,
    }

    let point = getPoint(bezier, width)

    // 计算一个AABB的包围盒
    let boundBox: any[] = [
        max([sourceX, pot1[0], pot2[0]]),
        min([sourceX, pot1[0], pot2[0]]),
        max([sourceY, pot1[1], pot2[1]]),
        min([sourceY, pot1[1], pot2[1]]),
    ]

    let boundMod = {
        x: (boundBox[0] + boundBox[1]) / 2,
        y: (boundBox[2] + boundBox[3]) / 2,
        width: boundBox[0] - boundBox[1],
        height: boundBox[2] - boundBox[3],
        point,
    }

    return {
        textMod,
        boundMod,
    }
}
