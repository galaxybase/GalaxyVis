import { min, max } from 'lodash'
import { mixColor } from '../../../utils'
import { bezier2, calcArrowCoords, defaultEdge, getPoint, preBezierCalc } from './commom'

/**
 * 常规边的绘制
 * @param graphId
 * @param context
 * @param ratio
 * @param position
 * @param data
 * @param sourceX
 * @param sourceY
 * @param targetX
 * @param targetY
 * @param targetSize
 * @param num
 * @param forward
 * @param thumbnail
 * @param size
 * @param useHalo
 * @returns
 */
export default function canvasEdgeDef(
    graphId: string,
    context: CanvasRenderingContext2D,
    ratio: number,
    position: any[],
    data: any,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    targetSize: number,
    num: number,
    forward: number,
    thumbnail: boolean,
    size: number,
    useHalo: boolean = false,
): any {
    let { color, width: lineWidth, shape, text, opacity, isSelect, selectedColor } = data
    let po = 5
    let {
        scale,
        width,
        originalNode,
        numOfLine,
        XYdistance,
        moveX,
        moveY,
        c,
        midx,
        midy,
        calcSourceX,
        calcSourceY,
        calcTargetX,
        calcTargetY,
    } = preBezierCalc(
        graphId,
        lineWidth,
        ratio,
        position,
        thumbnail,
        sourceX,
        sourceY,
        targetX,
        targetY,
        num,
        po,
        forward,
    )
    ;(sourceX = calcSourceX),
        (sourceY = calcSourceY),
        (targetX = calcTargetX),
        (targetY = calcTargetY)
    lineWidth /= 25
    color = isSelect ? selectedColor : color
    // 绘制虚线
    if (shape?.style == 'dash') {
        context.setLineDash([5 * scale])
    }

    color = mixColor(graphId, color, opacity)
    context.strokeStyle = color
    context.lineWidth = width

    var bezier: any = []
    let bezierNumber = 0.05
    context.beginPath()
    context.moveTo(sourceX, sourceY)
    for (var i = 0; i < 1; i += bezierNumber) {
        var p = bezier2(
            i,
            { x: sourceX, y: sourceY },
            { x: originalNode.x, y: originalNode.y },
            { x: targetX, y: targetY },
        )
        bezier.push(p)
    }
    // 绘制箭头
    if (shape?.head == 'arrow') {
        // 计算箭头所在位置
        targetSize *= scale
        bezier = bezier.reverse()
        let { minX, minY, maxX, maxY, KL } = calcArrowCoords(
            bezier,
            targetX,
            targetY,
            targetSize,
            lineWidth,
            scale,
        )

        // 计算箭头的位置
        let { aX, aY, vX, vY, insertPoints, insertPoints2 } = defaultEdge(
            minX,
            minY,
            maxX,
            maxY,
            targetX,
            targetY,
            targetSize,
            lineWidth,
            scale,
        )

        bezier = bezier.splice(KL)
        bezier = bezier.reverse()

        bezier.push({
            x: insertPoints ? insertPoints.x : maxX,
            y: insertPoints ? insertPoints.y : maxY,
        })
        // 绘制边
        if (num >= 1) {
            bezier.forEach((item: { x: number; y: number }) => {
                context.lineTo(item.x, item.y)
            })
            context.stroke()
            context.closePath()
        } else {
            let midX = midx + moveX * c * -1,
                midY = midy + moveY * c * -1
            context.quadraticCurveTo(midX, midY, aX, aY)
            context.stroke()
            context.closePath()
        }

        // 绘制箭头
        context.fillStyle = color
        context.beginPath()
        context.moveTo(aX - vX * 0.5, aY - vY * 0.5)
        context.lineTo(insertPoints2.x - vY * 0.7, insertPoints2.y + vX * 0.7)
        context.lineTo(insertPoints2.x + vY * 0.7, insertPoints2.y - vX * 0.7)
        context.moveTo(aX - vX * 0.5, aY - vY * 0.5)
        context.closePath()
        context.fill()
    } else {
        let midX = midx + moveX * c * -1,
            midY = midy + moveY * c * -1
        context.quadraticCurveTo(midX, midY, targetX, targetY)
        context.stroke()
        context.closePath()
    }

    if (useHalo) return

    context.setLineDash([])
    // 计算线的中心位置用于计算文字位置
    let bezierMid = bezier2(
            0.5,
            { x: sourceX, y: sourceY },
            { x: originalNode.x, y: originalNode.y },
            { x: targetX, y: targetY },
        ),
        dirtyData = -1

    if ((targetY >= sourceY && sourceX >= targetX) || (sourceY >= targetY && sourceX > targetX)) {
        ;[sourceY, targetY] = [targetY, sourceY]
        ;[sourceX, targetX] = [targetX, sourceX]
        dirtyData = 1
    }

    let change =
            num == 0
                ? dirtyData
                : Math.sign(
                      (targetX - sourceX) * (originalNode.y - sourceY) -
                          (targetY - sourceY) * (originalNode.x - sourceX),
                  ),
        r =
            lineWidth * scale * 40 +
            scale * Math.max(Math.floor(((text?.fontSize as number) / 10) * 1e3) / 1e3, 1),
        c2 = numOfLine != 0 ? (Math.pow(-1, num) * 3) / XYdistance : -3 / XYdistance
    const Direction = text?.position === 'bottom' ? -1 : 1
    // 返回文字位置和旋转角度
    let textMod = {
            x:
                text?.position === 'center'
                    ? bezierMid.x
                    : bezierMid.x + moveX * c2 * r * change * Direction,
            y:
                text?.position === 'center'
                    ? bezierMid.y
                    : bezierMid.y + moveY * c2 * r * change * Direction,
            ANGLE: Math.ceil(Math.atan2(targetY - sourceY, targetX - sourceX) * 1e5) / 1e5,
        },
        point = getPoint(bezier, width + 2)
    bezier = null
    if (num == 0) {
        if (originalNode.y == sourceY && originalNode.y == targetY) {
            sourceY += width / 2
            targetY -= width / 2
        } else if (originalNode.x == sourceX && originalNode.x == targetX) {
            sourceX += width / 2
            targetX -= width / 2
        }
    }

    // 计算一个AABB的包围盒
    originalNode.x = midx + -1 * moveX * c
    originalNode.y = midy + -1 * moveY * c

    let boundBox: any[] = [
        max([sourceX, targetX, originalNode.x]),
        min([sourceX, targetX, originalNode.x]),
        max([sourceY, targetY, originalNode.y]),
        min([sourceY, targetY, originalNode.y]),
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
