import { disPoint, isIE, switchSelfLinePostion, transformCanvasCoord } from '..'
import { globalProp } from '../../initial/globalProp'
import {
    bezier2,
    bezier3,
    calcArrowCoords,
    defaultEdge,
    parallelGetCoord,
    preBezierCalc,
} from '../../renderers/canvas/edgeCanvas/commom'
import { getLines } from '../../renderers/canvas/labelCanvas/common'
import { loopLineType } from '../../types'
import { drawQuardBezier, drawSelfBezier, svgInnerHTML, svgLinePath, textBaseSvgSetAttribute } from './common'

var xmlns = isIE() ? 'http://www.w3.org/2000/svg' : 'xmlns'

export const svgEdgeDef = (
    graphId: string,
    edgeG: any, //上一级标签
    ratio: number, //缩放比
    position: any[], //相机位置
    data: any, //属性
    sourceX: number, //起始点x
    sourceY: number, //起始点y
    targetX: number, //终止点x
    targetY: number, //终止点y
    targetSize: number, //终止点大小
    num: number, //这两个点之间第几条边
    forward: number, //是否换向
    thumbnail: boolean,
    dsr: number = 1
) => {
    xmlns = isIE() ? 'http://www.w3.org/2000/svg' : 'xmlns'
    let { color, width: lineWidth, shape, text } = data
    let po = 5
    forward *= -1
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
        dsr
    );
    sourceX = calcSourceX,
        sourceY = calcSourceY,
        targetX = calcTargetX,
        targetY = calcTargetY;
    lineWidth /= 35
    // 创建svg的path
    let path = svgLinePath(
        drawQuardBezier(sourceX, sourceY, originalNode, targetX, targetY),
        width,
        color,
    )
    // 判断是是含有箭头
    if (shape?.head == 'arrow') {
        originalNode.x = midx + -1 * moveX * c
        originalNode.y = midy + -1 * moveY * c
        var bezier = []
        // 计算每一段曲线中心点坐标
        for (let i = 0; i < 1; i += 0.025) {
            let point = bezier2(
                i,
                { x: sourceX, y: sourceY },
                { x: originalNode.x, y: originalNode.y },
                { x: targetX, y: targetY },
            )
            bezier.push(point)
        }
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

        let svgPathLength = 0
        // 计算两个控制点的距离
        for (let i = 1, len = bezier.length; i < len; i++) {
            svgPathLength += disPoint(bezier[i - 1].x, bezier[i - 1].y, bezier[i].x, bezier[i].y)
        }
        // 设置dashArray的属性实现有箭头的效果
        path.setAttributeNS(null, 'stroke-dasharray', svgPathLength + ' 0 0 ' + targetSize)
        let arrowPath = document.createElementNS(xmlns, 'path')
        // 填充三角形
        let arrowD =
            'M' +
            (aX - vX * 0.5) +
            ' , ' +
            (aY - vY * 0.5) +
            ' L' +
            (insertPoints2.x - vY * 0.8) +
            ' , ' +
            (insertPoints2.y + vX * 0.8) +
            ' L' +
            (insertPoints2.x + vY * 0.8) +
            ' , ' +
            (insertPoints2.y - vX * 0.8) +
            ' Z'
        arrowPath.setAttributeNS(null, 'd', arrowD)
        arrowPath.setAttributeNS(null, 'fill', color)
        edgeG.appendChild(arrowPath)
    }
    // 如果有虚线属性
    if (shape?.style == 'dash') {
        path.setAttributeNS(null, 'stroke-dasharray', 5 * scale + '')
    }

    edgeG.appendChild(path)
    if (text) {
        // 绘制文字
        let {
            color: textColor,
            background,
            margin = [0, 0],
            fontSize,
            maxLength,
            content,
            style = 'normal',
            fontFamily = 'Arial',
            minVisibleSize
        } = text

        if (content) {

            // 缩放文字大小
            fontSize = Math.ceil(fontSize * (scale / 2) * 1e2) / 1e2

            if (fontSize <= minVisibleSize) {
                return
            }

            originalNode.x = midx + -1 * moveX * c
            originalNode.y = midy + -1 * moveY * c

            // 计算线的中心位置用于计算文字位置
            let bezierMid = bezier2(
                0.5,
                { x: sourceX, y: sourceY },
                { x: originalNode.x, y: originalNode.y },
                { x: targetX, y: targetY },
            ),
                dirtyData = -1

            if (
                (targetY >= sourceY && sourceX >= targetX) ||
                (sourceY >= targetY && sourceX > targetX)
            ) {
                ;[sourceY, targetY] = [targetY, sourceY]
                    ;[sourceX, targetX] = [targetX, sourceX]
                dirtyData = 1
            }
            // 计算文字换向
            let change =
                num == 0
                    ? dirtyData
                    : Math.sign(
                        (targetX - sourceX) * (originalNode.y - sourceY) -
                        (targetY - sourceY) * (originalNode.x - sourceX),
                    )
            // 计算文字离控制点距离
            let c2 = numOfLine != 0 ? (Math.pow(-1, num) * -3) / XYdistance : 3 / XYdistance
            // 缩放距离的大小
            let r =
                lineWidth * scale * 40 +
                scale * Math.max(Math.floor(((text?.fontSize as number) / 10) * 1e3) / 1e3, 1)

            const Direction = text?.position === 'bottom' ? -1 : 1

            let textMod = {
                x:
                    text?.position === 'center'
                        ? bezierMid.x
                        : bezierMid.x + moveX * c2 * r * change * Direction,
                y:
                    text?.position === 'center'
                        ? bezierMid.y
                        : bezierMid.y + moveY * c2 * r * change * Direction,
                ANGLE: (Math.atan2(targetY - sourceY, targetX - sourceX) * 180) / Math.PI,
            }

            let textG = textBaseSvgSetAttribute(fontFamily, fontSize, style, textColor, background)
            // 先平移后旋转
            textG.setAttributeNS(
                null,
                'transform',
                'translate(' + textMod.x + ' ' + textMod.y + ') rotate(' + textMod.ANGLE + ')',
            )

            // 字体的偏移量
            let labelOffsetX, labelOffsetY

            labelOffsetX = 0
            labelOffsetY = fontSize / 3
            // 文字换行记录
            var lines = getLines(content, maxLength),
                baseX = labelOffsetX + margin[0] * 100,
                baseY = Math.round(labelOffsetY + margin[1] * 100)
            // 绘制文字
            for (var i = 0; i < lines.length; ++i) {
                var textSvg = document.createElementNS(xmlns, 'text')
                textSvg.setAttributeNS(null, 'x', baseX + '')
                textSvg.setAttributeNS(null, 'y', baseY + i * (fontSize + 1) + '')
                // textSvg.innerHTML = lines[i]
                svgInnerHTML(textSvg, lines[i])
                textG.appendChild(textSvg)
            }
            edgeG.appendChild(textG)
        }
    }
}

export const svgEdgeSelf = (
    graphId: string,
    edgeG: any, //上一级标签
    ratio: number, //缩放比
    position: any[], //相机位置
    data: any, //属性
    sourceX: number, //起始点x
    sourceY: number, //起始点y
    sourceSize: number, //起始点大小
    num: number, //对于这个点来说这是第几条边
    thumbnail: boolean,
    dsr: number = 1
) => {
    xmlns = isIE() ? 'http://www.w3.org/2000/svg' : 'xmlns'
    // 根据默认比例缩放当前点的大小
    let scale = (globalProp.globalScale / ratio) * 2.0 * dsr,
        // 根据相机位置更改点的初始位置
        coord = transformCanvasCoord(graphId, sourceX, sourceY, position, scale, thumbnail)
        ; (sourceX = coord.x), (sourceY = coord.y)

    let { color, width: lineWidth, location, shape, text } = data
    // 缩放边的大小
    lineWidth /= 30
    let width = lineWidth * scale * 150
    // 点的缩放
    let radius = scale * ((num - 1) * 40 + sourceSize * 5),
        {
            controlCoordOne: pot1,
            controlCoordTwo: pot2,
            ANGLE,
        } = switchSelfLinePostion('canvas', location, sourceX, sourceY, radius, false)

    let path = svgLinePath(
        drawSelfBezier(
            sourceX,
            sourceY,
            { x: pot2[0], y: pot2[1] },
            { x: pot1[0], y: pot1[1] },
            sourceX,
            sourceY,
        ),
        width,
        color,
    )
    document.createElementNS(xmlns, 'path')
    // 如果含有箭头
    if (shape?.head == 'arrow') {
        var bezier = []
        sourceSize *= scale
        // 旋转箭头指向的位置
        if (loopLineType[location] == '1' || loopLineType[location] == '2')
            for (var i = 0; i < 1; i += 0.025) {
                var points = bezier3(
                    i,
                    { x: sourceX, y: sourceY },
                    { x: pot2[0], y: pot2[1] },
                    { x: pot1[0], y: pot1[1] },
                    { x: sourceX, y: sourceY },
                )
                bezier.push(points)
            }
        else
            for (var i = 0; i < 1; i += 0.025) {
                var points = bezier3(
                    i,
                    { x: sourceX, y: sourceY },
                    { x: pot1[0], y: pot1[1] },
                    { x: pot2[0], y: pot2[1] },
                    { x: sourceX, y: sourceY },
                )
                bezier.push(points)
            }
        bezier = bezier.reverse()

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

        let arrowPath = document.createElementNS(xmlns, 'path')
        // 计算每个控制点之间的距离然后赋值给dasharray的属性
        let svgPathLength = 0
        for (let i = 1, len = bezier.length; i < len; i++) {
            svgPathLength += disPoint(bezier[i - 1].x, bezier[i - 1].y, bezier[i].x, bezier[i].y)
        }
        path.setAttributeNS(null, 'stroke-dasharray', svgPathLength + ' 0 0 ' + sourceSize)
        // 绘制箭头
        let arrowD =
            'M' +
            (aX + vX * 0.5) +
            ' , ' +
            (aY + vY * 0.5) +
            ' L' +
            (insertPoints2.x - vY * 0.8) +
            ' , ' +
            (insertPoints2.y + vX * 0.8) +
            ' L' +
            (insertPoints2.x + vY * 0.8) +
            ' , ' +
            (insertPoints2.y - vX * 0.8) +
            ' Z'
        arrowPath.setAttributeNS(null, 'd', arrowD)
        arrowPath.setAttributeNS(null, 'fill', color)
        edgeG.appendChild(arrowPath)
    }
    // 如果属性虚线
    if (shape?.style == 'dash') {
        path.setAttributeNS(null, 'stroke-dasharray', 5 * scale + '')
    }

    edgeG.appendChild(path)
    if (text) {
        // 绘制文字
        let {
            color: textColor,
            background,
            margin = [0, 0],
            fontSize,
            maxLength,
            content,
            style = 'normal',
            fontFamily = 'Arial',
            minVisibleSize
        } = text

        if (content) {

            fontSize = Math.ceil(fontSize * (scale / 2) * 1e2) / 1e2

            if (fontSize <= minVisibleSize) {
                return
            }

            // 计算边的中点位置用于计算文字位置
            let bezierMid = bezier3(
                0.5,
                { x: sourceX, y: sourceY },
                { x: pot1[0], y: pot1[1] },
                { x: pot2[0], y: pot2[1] },
                { x: sourceX, y: sourceY },
            )
            // 计算中心位置
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
                ANGLE: (ANGLE * 180) / Math.PI,
            }

            let textG = textBaseSvgSetAttribute(fontFamily, fontSize, style, textColor, background)
            textG.setAttributeNS(
                null,
                'transform',
                'translate(' + textMod.x + ' ' + textMod.y + ') rotate(' + textMod.ANGLE + ')',
            )

            // 字体的偏移量
            let labelOffsetX, labelOffsetY

            labelOffsetX = 0
            labelOffsetY = fontSize / 3
            // 文字换行记录
            var lines = getLines(content, maxLength),
                baseX = labelOffsetX + margin[0] * 100,
                baseY = Math.round(labelOffsetY + margin[1] * 100)

            for (var i = 0; i < lines.length; ++i) {
                var textSvg = document.createElementNS(xmlns, 'text')
                textSvg.setAttributeNS(null, 'x', baseX + '')
                textSvg.setAttributeNS(null, 'y', baseY + i * (fontSize + 1) + '')
                // textSvg.innerHTML = lines[i]
                svgInnerHTML(textSvg, lines[i])
                textG.appendChild(textSvg)
            }
            edgeG.appendChild(textG)
        }
    }
}

export const svgEdgeParallel = (
    graphId: string,
    edgeG: any, //上一级标签
    ratio: number, //缩放比
    position: any[], //相机位置
    data: any, //属性
    sourceX: number, //起始点x
    sourceY: number, //起始点y
    targetX: number, //终止点x
    targetY: number, //终止点y
    num: number, //两点之间这是第几条边
    forward: number, //是否换向
    sourceSize: number, //起始点大小
    targetSize: number, //终止点大小
    thumbnail: boolean,
    dsr: number = 1
) => {
    xmlns = isIE() ? 'http://www.w3.org/2000/svg' : 'xmlns'
    let { color, width: lineWidth, shape, text } = data
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
        dsr
    );
    sourceX = calcSourceX,
        sourceY = calcSourceY,
        targetX = calcTargetX,
        targetY = calcTargetY;
    lineWidth /= 30
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

    let p
    if (inOtherCircle) {
        p = drawQuardBezier(sourceX, sourceY, originalNode, targetX, targetY)
    } else {
        p = drawQuardBezier(realX1, realY1, originalNode, realX2, realY2)
    }
    let path = svgLinePath(p, width, color)
    // 如果有箭头属性
    if (shape?.head == 'arrow' && !inOtherCircle) {
        // 绘制箭头
        let d = Math.sqrt(
            Math.pow(realX2 - originalNode.x, 2) + Math.pow(realY2 - originalNode.y, 2),
        ),
            aSize = lineWidth * scale * 150 * 3.0,
            aX = originalNode.x + ((realX2 - originalNode.x) * (d - aSize)) / d,
            aY = originalNode.y + ((realY2 - originalNode.y) * (d - aSize)) / d,
            vX = ((realX2 - originalNode.x) * aSize) / d || 0,
            vY = ((realY2 - originalNode.y) * aSize) / d || 0

        let newPath = drawQuardBezier(realX1, realY1, originalNode, aX, aY)

        path.setAttributeNS(null, 'd', newPath)
        let arrowPath = document.createElementNS(xmlns, 'path')
        let arrowD =
            'M' +
            (aX + vX) +
            ' , ' +
            (aY + vY) +
            ' L' +
            (aX + vY * 0.7) +
            ' , ' +
            (aY - vX * 0.7) +
            ' L' +
            (aX - vY * 0.7) +
            ' , ' +
            (aY + vX * 0.7) +
            ' Z'
        arrowPath.setAttributeNS(null, 'd', arrowD)
        arrowPath.setAttributeNS(null, 'fill', color)
        edgeG.appendChild(arrowPath)
    }
    // 如果有虚线属性
    if (shape?.style == 'dash') {
        path.setAttributeNS(null, 'stroke-dasharray', 5 * scale + '')
    }
    edgeG.appendChild(path)
    if (text) {
        // 绘制文字
        let {
            color: textColor,
            background,
            margin = [0, 0],
            fontSize,
            maxLength,
            content,
            style = 'normal',
            fontFamily = 'Arial',
            minVisibleSize
        } = text

        if (content) {
            // 缩放文字
            fontSize = Math.ceil(fontSize * (scale / 2) * 1e2) / 1e2
            
            if (fontSize <= minVisibleSize) {
                return
            }
            // 计算线的中心位置用来给文字
            let bezierMid = bezier2(
                0.5,
                { x: realX1, y: realY1 },
                { x: originalNode.x, y: originalNode.y },
                { x: realX2, y: realY2 },
            )

            let dirtyData = 1
            if (
                (targetY >= sourceY && sourceX >= targetX) ||
                (sourceY >= targetY && sourceX > targetX)
            ) {
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
                xp = change * moveX * c2, //上移坐标
                yp = change * moveY * c2,
                pos2 = ((20 - lineWidth * 150) * XYdistance) / (scale * 100),
                c3 = numOfLine != 0 ? (Math.pow(-1, num) * 1) / pos2 : 1 / pos2,
                xp2 = change * moveX * c3,
                yp2 = change * moveY * c3
            const Direction = text?.position === 'bottom' ? -1 : 1
            // 返回文字位置和旋转角度
            let textMod = {
                x: text?.position === 'center' ? bezierMid.x + xp : bezierMid.x + xp2 * Direction,
                y: text?.position === 'center' ? bezierMid.y + yp : bezierMid.y + yp2 * Direction,
                ANGLE: (Math.atan2(targetY - sourceY, targetX - sourceX) * 180) / Math.PI,
            }

            let textG = textBaseSvgSetAttribute(fontFamily, fontSize, style, textColor, background)
            textG.setAttributeNS(
                null,
                'transform',
                'translate(' + textMod.x + ' ' + textMod.y + ') rotate(' + textMod.ANGLE + ')',
            )

            // 字体的偏移量
            let labelOffsetX, labelOffsetY

            labelOffsetX = 0
            labelOffsetY = fontSize / 3
            // 文字换行记录
            var lines = getLines(content, maxLength),
                baseX = labelOffsetX + margin[0] * 100,
                baseY = Math.round(labelOffsetY + margin[1] * 100)

            for (var i = 0; i < lines.length; ++i) {
                var textSvg = document.createElementNS(xmlns, 'text')
                textSvg.setAttributeNS(null, 'x', baseX + '')
                textSvg.setAttributeNS(null, 'y', baseY + i * (fontSize + 1) + '')
                // textSvg.innerHTML = lines[i]
                svgInnerHTML(textSvg, lines[i])
                textG.appendChild(textSvg)
            }
            edgeG.appendChild(textG)
        }
    }
}
