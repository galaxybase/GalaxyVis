import { min, max } from 'lodash'
import { mixColor } from '../../../utils'
import { bezier2, getPoint, parallelGetCoord, preBezierCalc } from './commom'

/**
 * parallel类型边的绘制
 * @param graphId
 * @param context
 * @param ratio
 * @param position
 * @param data
 * @param sourceX
 * @param sourceY
 * @param targetX
 * @param targetY
 * @param num
 * @param forward
 * @param sourceSize
 * @param targetSize
 * @param thumbnail
 * @param size
 * @returns
 */
export default function canvasEdgeParallel(
    graphId: any,
    context: CanvasRenderingContext2D,
    ratio: number,
    position: any[],
    data: any,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    num: number,
    forward: number,
    sourceSize: number,
    targetSize: number,
    thumbnail: boolean,
    size: number,
): any {
    let { color, width: lineWidth, shape, text, isSelect, selectedColor, opacity } = data
    let po = undefined
    let {
        scale,
        width,
        originalNode,
        numOfLine,
        XYdistance,
        moveX,
        moveY,
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
    // 缩放目标点和起始点的大小
    sourceSize *= scale
    targetSize *= scale
    let { realX1, realX2, realY1, realY2 } = parallelGetCoord(
        sourceX,
        sourceY,
        targetX,
        targetY,
        originalNode,
        sourceSize,
        targetSize,
    )

    // 是否被遮罩
    let inOtherCircle = false
    if (XYdistance <= Math.max(sourceSize, targetSize)) {
        inOtherCircle = true
    }
    // 绘制虚线
    if (shape.style == 'dash') {
        context.setLineDash([5 * scale])
    }
    color = mixColor(graphId, color, opacity)
    context.strokeStyle = color
    context.lineWidth = width
    var bezier = []
    let bezierNumber = 0.025
    // 绘制箭头的
    if (shape.head == 'arrow') {
        if (inOtherCircle) {
            context.beginPath()
            context.moveTo(sourceX, sourceY)
            context.quadraticCurveTo(originalNode.x, originalNode.y, targetX, targetY)
            context.stroke()
            context.closePath()

            for (var i = 0; i < 1; i += bezierNumber) {
                var p = bezier2(
                    i,
                    { x: sourceX, y: sourceY },
                    { x: originalNode.x, y: originalNode.y },
                    { x: targetX, y: targetY },
                )
                bezier.push(p)
            }
        } else {
            let d = Math.sqrt(
                Math.pow(realX2 - originalNode.x, 2) + Math.pow(realY2 - originalNode.y, 2),
            )
            let aSize = lineWidth * scale * 450
            let aX = originalNode.x + ((realX2 - originalNode.x) * (d - aSize)) / d
            let aY = originalNode.y + ((realY2 - originalNode.y) * (d - aSize)) / d
            let vX = ((realX2 - originalNode.x) * aSize) / d || 0
            let vY = ((realY2 - originalNode.y) * aSize) / d || 0
            // 绘制线
            context.beginPath()
            context.moveTo(realX1, realY1)
            context.quadraticCurveTo(originalNode.x, originalNode.y, aX, aY)
            context.stroke()

            for (var i = 0; i < 1; i += bezierNumber) {
                var p = bezier2(
                    i,
                    { x: realX1, y: realY1 },
                    { x: originalNode.x, y: originalNode.y },
                    { x: aX, y: aY },
                )
                bezier.push(p)
            }

            // 绘制箭头
            context.fillStyle = color
            context.beginPath()
            context.moveTo(aX + vX, aY + vY)
            context.lineTo(aX + vY * 0.7, aY - vX * 0.7)
            context.lineTo(aX - vY * 0.7, aY + vX * 0.7)
            context.lineTo(aX + vX, aY + vY)
            context.closePath()
            context.fill()
        }
    } else {
        // 直接调用canvas的api来绘制
        context.beginPath()
        if (inOtherCircle) {
            context.moveTo(sourceX, sourceY)
            context.quadraticCurveTo(originalNode.x, originalNode.y, targetX, targetY)

            for (var i = 0; i < 1; i += bezierNumber) {
                var p = bezier2(
                    i,
                    { x: sourceX, y: sourceY },
                    { x: originalNode.x, y: originalNode.y },
                    { x: targetX, y: targetY },
                )
                bezier.push(p)
            }
        } else {
            context.moveTo(realX1, realY1)
            context.quadraticCurveTo(originalNode.x, originalNode.y, realX2, realY2)

            for (var i = 0; i < 1; i += bezierNumber) {
                var p = bezier2(
                    i,
                    { x: realX1, y: realY1 },
                    { x: originalNode.x, y: originalNode.y },
                    { x: realX2, y: realY2 },
                )
                bezier.push(p)
            }
        }
        context.stroke()
        context.closePath()
    }

    context.setLineDash([])
    // 计算线的中心位置用来给文字
    let bezierMid = bezier2(
        0.5,
        { x: realX1, y: realY1 },
        { x: originalNode.x, y: originalNode.y },
        { x: realX2, y: realY2 },
    )

    let dirtyData = 1
    if ((targetY >= sourceY && sourceX >= targetX) || (sourceY >= targetY && sourceX > targetX)) {
        ;[sourceY, targetY] = [targetY, sourceY]
        ;[sourceX, targetX] = [targetX, sourceX]
        dirtyData = -1
    }

    let change =
            num == 0
                ? dirtyData
                : Math.sign(
                      (targetX - sourceX) * (originalNode.y - sourceY) -
                          (targetY - sourceY) * (originalNode.x - sourceX),
                  ),
        pos = XYdistance,
        c2 = numOfLine != 0 ? -Math.pow(-1, num) / pos : -3 / pos,
        xp = change * moveX * c2,
        yp = change * moveY * c2,
        pos2 = ((20 - lineWidth * 150) * XYdistance) / (scale * 100),
        c3 = numOfLine != 0 ? Math.pow(-1, num) / pos2 : 1 / pos2,
        xp2 = change * moveX * c3,
        yp2 = change * moveY * c3
    const Direction = text?.position === 'bottom' ? -1 : 1

    // 返回文字位置和旋转角度
    let textMod = {
        x: text?.position === 'center' ? bezierMid.x + xp : bezierMid.x + xp2 * Direction,
        y: text?.position === 'center' ? bezierMid.y + yp : bezierMid.y + yp2 * Direction,
        ANGLE: Math.ceil(Math.atan2(targetY - sourceY, targetX - sourceX) * 1e5) / 1e5,
    }

    let point = getPoint(bezier, width)

    if (originalNode.y == sourceY && originalNode.y == targetY) {
        sourceY += width / 2
        targetY -= width / 2
    } else if (originalNode.x == sourceX && originalNode.x == targetX) {
        sourceX += width / 2
        targetX -= width / 2
    }

    // 计算一个AABB的包围盒
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
