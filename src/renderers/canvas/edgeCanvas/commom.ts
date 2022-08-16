import getNormals from 'polyline-normals'
import { globalProp } from '../../../initial/globalProp'
import {
    disParallel,
    disPoint,
    getClem,
    getInsertPointBetweenCircleAndLine,
    minMulti,
    transformCanvasCoord,
} from '../../../utils'

/**
 * 贝塞尔曲线先决条件计算
 * @param graphId
 * @param lineWidth
 * @param ratio
 * @param position
 * @param thumbnail
 * @param sourceX
 * @param sourceY
 * @param targetX
 * @param targetY
 * @param num
 * @param po
 * @param forward
 * @returns
 */
export const preBezierCalc = (
    graphId: string,
    lineWidth: number,
    ratio: number,
    position: any[],
    thumbnail: boolean | undefined,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    num: number,
    po: number | undefined,
    forward: number,
): any => {
    lineWidth /= 25
    // 根据默认比例缩放当前点的大小
    let scale = (globalProp.globalScale / ratio) * 2.0,
        width = lineWidth * scale * 150,
        // 根据相机位置更改点的初始位置
        coord = transformCanvasCoord(graphId, sourceX, sourceY, position, scale, thumbnail),
        coordTarget = transformCanvasCoord(graphId, targetX, targetY, position, scale, thumbnail)
    ;(sourceX = coord.x), (sourceY = coord.y)
    ;(targetX = coordTarget.x), (targetY = coordTarget.y)
    let originalNode = {
            x: 0,
            y: 0,
        },
        midx = (sourceX + targetX) / 2,
        midy = (sourceY + targetY) / 2, //计算中心点
        distanceX = (targetX - sourceX) * forward,
        distanceY = (targetY - sourceY) * forward,
        XYdistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

    po = po != undefined ? po : ((10 - lineWidth) * XYdistance) / (scale * 150)

    if (XYdistance == 0) {
        originalNode.x = midx
        originalNode.y = midy
        XYdistance = 1
    }

    let moveX = distanceY,
        moveY = -distanceX,
        // 判断是不是中心条
        numOfLine = num == 0 ? 0 : Math.ceil(num / 2) * Math.pow(-1, num),
        // 计算贝塞尔曲线的控制点
        c = -numOfLine / (po as number)
    originalNode.x = midx + moveX * c
    originalNode.y = midy + moveY * c
    return {
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
        calcSourceX: sourceX,
        calcSourceY: sourceY,
        calcTargetX: targetX,
        calcTargetY: targetY,
    }
}
/**
 * 计算箭头位置
 * @param bezier
 * @param sourceX
 * @param sourceY
 * @param sourceSize
 * @param lineWidth
 * @param scale
 * @returns
 */
export const calcArrowCoords = (
    bezier: string | any[],
    sourceX: number,
    sourceY: number,
    sourceSize: number,
    lineWidth: number,
    scale: number,
) => {
    let minX: number = -Infinity,
        minY: number = -Infinity,
        maxX: number = Infinity,
        maxY: number = Infinity,
        triangles = true,
        KL = 0
    // 计算箭头所在位置
    // 记录最近外边的两个点 删除里面的
    // 然后计算一个新的 填充
    for (let i = 1; i < bezier.length; i++) {
        let r = disPoint(sourceX, sourceY, bezier[i].x, bezier[i].y)
        if (r > sourceSize && triangles) {
            maxX = bezier[i].x
            maxY = bezier[i].y
            minX = bezier[i - 1].x
            minY = bezier[i - 1].y
            triangles = false
        }
        if (r > sourceSize + lineWidth * scale * 250) {
            KL = i
            break
        }
    }

    return {
        minX,
        minY,
        maxX,
        maxY,
        KL,
    }
}
/**
 * parallel类型线位置计算
 * @param sourceX
 * @param sourceY
 * @param targetX
 * @param targetY
 * @param originalNode
 * @param sourceSize
 * @param targetSize
 * @returns
 */
export const parallelGetCoord = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    originalNode: { y: number; x: number },
    sourceSize: number,
    targetSize: number,
) => {
    // A,B点的斜率
    let multiMin = minMulti(
            {
                x: sourceX,
                y: sourceY,
            },
            {
                x: targetX,
                y: targetY,
            },
        ),
        originalNodeM = originalNode.y - multiMin.n * originalNode.x,
        // 起算其中某个起始点的坐标
        originalN1 = disParallel(
            {
                x: sourceX,
                y: sourceY,
                r: sourceSize,
            },
            {
                x: targetX,
                y: targetY,
                r: targetSize,
            },
        ),
        originalN2 = disParallel(
            {
                x: targetX,
                y: targetY,
                r: targetSize,
            },
            {
                x: sourceX,
                y: sourceY,
                r: sourceSize,
            },
        ),
        // 计算起始点的线性函数
        clem1 = getClem(multiMin.n, originalN1.x, originalN1.y),
        clem2 = getClem(multiMin.n, originalN2.x, originalN2.y)
    // 计算起始点和终止点的坐标
    let realX1 =
            clem1.m == 0 && clem1.k == 0 && !multiMin.f
                ? originalN1.x
                : clem1.m == 0 && clem1.k == 0 && multiMin.f
                ? originalNode.x
                : (clem1.m - originalNodeM) / (multiMin.n - clem1.k),
        realY1 =
            clem1.m == 0 && clem1.k == 0 && !multiMin.f
                ? originalNode.y
                : clem1.m == 0 && clem1.k == 0 && multiMin.f
                ? originalN1.y
                : realX1 * clem1.k + clem1.m,
        realX2 =
            clem2.m == 0 && clem2.k == 0 && !multiMin.f
                ? originalN2.x
                : clem2.m == 0 && clem2.k == 0 && multiMin.f
                ? originalNode.x
                : (clem2.m - originalNodeM) / (multiMin.n - clem2.k),
        realY2 =
            clem2.m == 0 && clem2.k == 0 && !multiMin.f
                ? originalNode.y
                : clem2.m == 0 && clem2.k == 0 && multiMin.f
                ? originalN2.y
                : realX2 * clem2.k + clem2.m
    return {
        realX1,
        realX2,
        realY1,
        realY2,
    }
}
/**
 * 箭头位置的计算
 * @param minX
 * @param minY
 * @param maxX
 * @param maxY
 * @param targetX
 * @param targetY
 * @param targetSize
 * @param lineWidth
 * @param scale
 * @param isSelf
 * @returns
 */
export const defaultEdge = (
    minX: any,
    minY: any,
    maxX: any,
    maxY: any,
    targetX: any,
    targetY: any,
    targetSize: number,
    lineWidth: number,
    scale: number,
    isSelf: boolean = false,
) => {
    let insertPoints, insertPoints2
    // 计算箭头的位置
    insertPoints = getInsertPointBetweenCircleAndLine(
        minX,
        minY,
        maxX,
        maxY,
        targetX,
        targetY,
        targetSize + lineWidth * scale * 250,
    )

    insertPoints2 = getInsertPointBetweenCircleAndLine(
        minX,
        minY,
        maxX,
        maxY,
        targetX,
        targetY,
        targetSize + lineWidth * scale * 450,
    )

    insertPoints2 = insertPoints2 ? insertPoints2 : { x: maxX, y: maxY }

    let aX = insertPoints ? insertPoints.x : maxX,
        aY = insertPoints ? insertPoints.y : maxY,
        d = !isSelf
            ? Math.sqrt(Math.pow(aX - targetX, 2) + Math.pow(aY - targetY, 2))
            : Math.sqrt(Math.pow(aX - insertPoints2.x, 2) + Math.pow(aY - insertPoints2.y, 2)),
        aSize = lineWidth * scale * 150 * 3.0,
        vX = !isSelf ? ((aX - targetX) * aSize) / d : ((aX - insertPoints2.x) * aSize) / d,
        vY = !isSelf ? ((aY - targetY) * aSize) / d : ((aY - insertPoints2.y) * aSize) / d

    return {
        aX,
        aY,
        vX,
        vY,
        insertPoints,
        insertPoints2,
    }
}

/**
 * 计算四次贝塞尔曲线
 * @param t
 * @param p0
 * @param p1
 * @param p2
 * @param p3
 * @returns
 */
export const bezier3 = (
    t: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
) => {
    var cX = 3 * (p1.x - p0.x),
        bX = 3 * (p2.x - p1.x) - cX,
        aX = p3.x - p0.x - cX - bX

    var cY = 3 * (p1.y - p0.y),
        bY = 3 * (p2.y - p1.y) - cY,
        aY = p3.y - p0.y - cY - bY

    var x = aX * Math.pow(t, 3) + bX * Math.pow(t, 2) + cX * t + p0.x
    var y = aY * Math.pow(t, 3) + bY * Math.pow(t, 2) + cY * t + p0.y

    return { x: x, y: y }
}
/**
 * 计算三次贝塞尔曲线
 * @param t
 * @param p0
 * @param p1
 * @param p2
 * @returns
 */
export const bezier2 = (
    t: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
) => {
    var cX = 2 * (p1.x - p0.x),
        bX = 2 * (p2.x - p1.x) - cX,
        aX = p2.x - p0.x - cX - bX

    var cY = 2 * (p1.y - p0.y),
        bY = 2 * (p2.y - p1.y) - cY,
        aY = p2.y - p0.y - cY - bY

    var x = aX * Math.pow(t, 2) + bX * Math.pow(t, 1) + cX * t + p0.x
    var y = aY * Math.pow(t, 2) + bY * Math.pow(t, 1) + cY * t + p0.y

    return { x: x, y: y }
}
/**
 * 获取曲线每个点位置
 * @param bezier
 * @param width
 * @returns
 */
export const getPoint = (bezier: any, width: number) => {
    let beziers = []

    for (let i in bezier) {
        beziers.push([bezier[i].x, bezier[i].y])
    }

    let normals = getNormals(beziers, false),
        attrNormal: any = [],
        attrMiter: any = [],
        point: any = []

    /**
     * 计算扩充后的线段边界的斜接 和 对边的点
     */
    for (let i = 0, len = normals.length; i < len; i++) {
        let norm = normals[i][0]
        let miter = normals[i][1]
        let ry = i * 4
        // 法向量
        attrNormal[ry] = norm[0]
        attrNormal[ry + 1] = norm[1]
        attrNormal[ry + 2] = norm[0]
        attrNormal[ry + 3] = norm[1]
        // 斜接
        let rx = i * 2
        attrMiter[rx] = -miter
        attrMiter[rx + 1] = miter
    }

    for (let i = 0, len = beziers.length; i < len; i++) {
        let rx = i * 4
        let item = beziers[i]
        // 用于选中的点
        point[rx] = item[0]
        point[rx + 1] = item[1]
        point[rx + 2] = item[0]
        point[rx + 3] = item[1]
    }

    for (let i = 0, j = 0; i < point.length; i += 2, j++) {
        point[i] += attrNormal[i] * width * attrMiter[j]
        point[i + 1] += attrNormal[i + 1] * width * attrMiter[j]
    }

    return point
}
