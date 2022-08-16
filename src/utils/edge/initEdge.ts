import { max, min } from 'lodash'
import {
    minMulti,
    getClem,
    disParallel,
    disPoint,
    getInsertPointBetweenCircleAndLine,
    getInsertPointBetweenSquareAndLine,
    floatColor,
    switchSelfLinePostion,
} from '..'
import { Bezier4D, create3DBezier, create4DBezier } from './bezier'
import { edgeAttribute } from '../../types'
import { globalProp } from '../../initial/globalProp'
const EPSILON = 1e-5
const LARGECONSTANTS = 1e5
const edgeGroups = globalProp.edgeGroups
const defaultGroup = 2
/**
 * 直线和二阶贝塞尔曲线
 * @param x1 起始圆心A（x1,y1）
 * @param y1
 * @param x2 终止圆心B（x2,y2）
 * @param y2
 * @param m 对于这两个圆来说这是第m条边
 * @param attribute 边的属性值
 * @param targetRadius 终止点圆的板筋
 * @param forward 对于上一条边来说这条边是否同向
 * @returns
 */
export function createLineMesh(
    size: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    m: number,
    attribute: edgeAttribute,
    targetRadius: number,
    nodeShape: string,
    forward = 1,
) {
    let { color, width, text, shape, isSelect, selectedColor } = attribute
    width = Number(width)
    width /= 25
    color = isSelect ? selectedColor : color

    let isChange = false
    if (Math.abs(x1 - x2) <= EPSILON) {
        x1 = x2 + EPSILON
        isChange = true
    }

    let bezierCalc: any = preBezierCalc(x1, x2, y1, y2, m, forward)
    let { originalNode, numOfLine, XYdistance, midx, midy, moveX, moveY } = bezierCalc,
        targetX = x2,
        targetY = y2

    const bezierNumber = size > 1 || shape?.style == 'dash' ? edgeGroups : defaultGroup

    // 计算贝塞尔曲线
    let bezierPoint = create3DBezier(
        {
            x: x1,
            y: y1,
        }, // p0
        {
            x: originalNode.x,
            y: originalNode.y,
        }, // p1
        {
            x: x2,
            y: y2,
        }, // p2
        bezierNumber,
        1.0,
    )

    // 旋转的时候 文字换向
    let dirtyData = -1
    if ((y2 >= y1 && x1 >= x2) || (y1 >= y2 && x1 > x2)) {
        ;[y1, y2] = [y2, y1]
        ;[x1, x2] = [x2, x1]
        dirtyData = 1
    }

    let change =
        m == 0
            ? dirtyData
            : Math.sign((x2 - x1) * (originalNode.y - y1) - (y2 - y1) * (originalNode.x - x1))

    // y2-y1 和 x2-x1 同时为0的时候会导致错误域
    let ANGLE = Math.atan2(y2 - y1, x2 - x1) || 0
    // isline = false的时候计算他的上下距离
    let mc = -numOfLine / 5
    let mx = midx + moveX * mc,
        my = midy + moveY * mc

    let controlX = 0.25 * x1 + 0.5 * mx + 0.25 * x2,
        controlY = 0.25 * y1 + 0.5 * my + 0.25 * y2

    if (text?.position !== 'center') {
        let c = numOfLine != 0 ? -Math.pow(-1, m) / (15 * XYdistance) : 1 / (15 * XYdistance)

        let constants, flag

        text?.position === 'bottom'
            ? ((constants = -0.5), (flag = -1))
            : ((constants = 0.1), (flag = 1))
        let r =
            width * 10 +
            Math.max(Math.floor((((text?.fontSize as number) - 5) / 15) * 1e3) / 1e3, 1) +
            constants
        controlX += change * moveX * c * r * flag
        controlY += change * moveY * c * r * flag
    } else if (text?.position === 'center') {
        let c = numOfLine != 0 ? -Math.pow(-1, m) / (40 * XYdistance) : 1 / (40 * XYdistance)
        controlX += change * moveX * c
        controlY += change * moveY * c
    }

    if (XYdistance <= (2.0 * targetRadius) / 100) {
        controlX = x1
        controlY = y1
    }

    let hasContent = false,
        content = text?.content,
        arrowPoint: any = {},
        arrowDisplay: any[] = []
    if (content == '' || content == null || content == undefined) {
        hasContent = false
    } else {
        hasContent = true
    }

    if (shape?.head == 'arrow') {
        let minX: number = -Infinity,
            minY: number = -Infinity,
            maxX: number = Infinity,
            maxY: number = Infinity,
            triangles = true,
            cutoff = 0

        // 计算箭头所在位置
        let insertPoints

        if (nodeShape === 'square') {
            for (let i = 1; i < bezierPoint.length; i++) {
                let r = disPoint(targetX, targetY, bezierPoint[i][0], bezierPoint[i][1])
                if (r > (targetRadius * Math.sqrt(2)) / 100 && triangles) {
                    maxX = bezierPoint[i][0]
                    maxY = bezierPoint[i][1]
                    minX = bezierPoint[i - 1][0]
                    minY = bezierPoint[i - 1][1]
                    triangles = false
                }
                if (r > (targetRadius * Math.sqrt(2)) / 100 + width) {
                    cutoff = i
                    break
                }
            }
            insertPoints = getInsertPointBetweenSquareAndLine(
                targetX,
                targetY,
                maxX,
                maxY,
                targetRadius / 100 + width,
            )
        } else {
            // 遍历曲线的每个片段 计算圆心的距离到这个线段的距离 找到最近的位置
            // 再通过这两个点位置计算箭头的旋转角度
            for (let i = 1; i < bezierPoint.length; i++) {
                let r = disPoint(targetX, targetY, bezierPoint[i][0], bezierPoint[i][1])
                if (r > targetRadius / 100 && triangles) {
                    maxX = bezierPoint[i][0]
                    maxY = bezierPoint[i][1]
                    minX = bezierPoint[i - 1][0]
                    minY = bezierPoint[i - 1][1]
                    triangles = false
                }
                if (r > targetRadius / 100 + width) {
                    cutoff = i
                    break
                }
            }
            insertPoints = getInsertPointBetweenCircleAndLine(
                minX,
                minY,
                maxX,
                maxY,
                targetX,
                targetY,
                targetRadius / 100 + width,
            )
        }

        const EDGE_ANGLE = Math.atan2(minY - maxY, minX - maxX) || 0

        arrowPoint = {
            x: insertPoints ? insertPoints.x : maxX,
            y: insertPoints ? insertPoints.y : maxY,
            angle: EDGE_ANGLE,
            lineWidth: width,
        }
        // 把箭头之后的那段截掉 然后再把箭头的坐标插入 防止出线条有部分不显示

        bezierPoint = bezierPoint.splice(cutoff)
        for (let i = 0; i < cutoff; i++) {
            bezierPoint.unshift([arrowPoint.x, arrowPoint.y])
        }
    }

    let ans: any = operationUnion(bezierPoint, color, width, shape, false)

    if (shape?.head == 'arrow') {
        let { x, y, angle, lineWidth } = arrowPoint
        let matLen = ans.MatArray2.length

        ans.MatArray2[matLen - 5] = x
        ans.MatArray2[matLen - 4] = y
        ans.MatArray2[matLen - 3] = angle + (Math.PI * -90) / 180
        ans.MatArray2[matLen - 2] = lineWidth * 3.0
        ans.MatArray2[matLen - 1] = 1
    }
    if (m == 0) {
        //同一列
        if (isChange) {
            x1 += width / 2 + 1e-3
            x2 -= width / 2 - 1e-3
        }
        //同一行
        else if (Math.abs(originalNode.y - y1) <= width && Math.abs(originalNode.y - y2) <= width) {
            originalNode.y += width
            y2 -= width
            y1 -= width
        }
    }
    // 计算一个AABB的包围盒
    let boundBox = [
        max([x1, x2, originalNode.x]),
        min([x1, x2, originalNode.x]),
        max([y1, y2, originalNode.y]),
        min([y1, y2, originalNode.y]),
    ]

    const result = {
        ...ans,
        ANGLE,
        x: controlX,
        y: controlY,
        text,
        hasContent,
        shape,
        boundBox,
        arrowDisplay,
        bezierNumber,
    }
    // @ts-ignore
    arrowPoint = null
    originalNode = null
    bezierCalc = null
    ans = null
    return result
}

/**
 * 自环边 由3阶贝塞尔曲线生成
 * @param x 起始圆心A（x1,y1）
 * @param y
 * @param m 对于这个圆来说这是第m条边
 * @param radius 半径
 * @param attribute  边的属性
 * @param targetRadius 目标半径
 * @returns
 */
export function loopLineMesh(
    renderer: string,
    x: number,
    y: number,
    m: number,
    radius: number,
    attribute: edgeAttribute,
    targetRadius: number,
) {
    let { color, width, text, shape, isSelect, location, selectedColor } = attribute
    width = Number(width)
    width /= 25
    color = isSelect ? selectedColor : color
    // 通过三阶的贝塞尔函数 画出更多的点
    m == 0 && m++
    radius = (m - 1) * 60 + (targetRadius + 1) * 6
    let rx = x,
        ry = y
    // 以（X,Y）为圆心 做两个塞尔函数的控制点
    let {
        controlCoordOne: pot1,
        controlCoordTwo: pot2,
        boundBox,
        ANGLE,
    } = switchSelfLinePostion(renderer, location, x, y, radius)

    let curvePath = create4DBezier(
        {
            x: x,
            y: y,
        }, // p0
        {
            x: pot1[0],
            y: pot1[1],
        }, // p1
        {
            x: pot2[0],
            y: pot2[1],
        },
        {
            x: x,
            y: y,
        }, // p2
        edgeGroups,
        1.0,
    )

    let normalizePath = curvePath
    // 缩放距离
    normalizePath.forEach((item: any) => {
        item[0] = (item[0] - x) / 150 + rx
        item[1] = (item[1] - y) / 150 + ry
    })
    let hasContent = false
    let content = text?.content
    if (content == '' || content == null || content == undefined) {
        hasContent = false
    } else {
        hasContent = true
    }

    let arrowPoint: any = {}
    if (shape?.head == 'arrow') {
        let minX: any,
            minY: any,
            maxX: any,
            maxY: any,
            j,
            triangles = true,
            cutoff = 0
        // 遍历曲线的每个片段 计算圆心的距离到这个线段的距离 找到最近的位置
        // 再通过这两个点位置计算箭头的旋转角度
        for (let i = 0; i < normalizePath.length; i++) {
            let r = disPoint(rx, ry, normalizePath[i][0], normalizePath[i][1])
            if (r > targetRadius / 100 + width && triangles) {
                maxX = normalizePath[i][0]
                maxY = normalizePath[i][1]
                j = i > 0 ? i - 1 : 0
                minX = normalizePath[j][0]
                minY = normalizePath[j][1]
                triangles = false
            }
            if (r > targetRadius / 100 + width * 2.0) {
                cutoff = i
                break
            }
        }
        // 计算箭头所在位置
        // 本计算方法是计算线段和圆的交点
        // @ts-ignore
        let insertPoints = getInsertPointBetweenCircleAndLine(
            minX,
            minY,
            maxX,
            maxY,
            rx,
            ry,
            targetRadius / 100 + width,
        )
        // @ts-ignore
        const EDGE_ANGLE = Math.atan2(minY - maxY, minX - maxX) || 0

        arrowPoint = {
            x: insertPoints ? insertPoints.x : maxX,
            y: insertPoints ? insertPoints.y : maxY,
            angle: EDGE_ANGLE,
            lineWidth: width,
        }
        normalizePath = curvePath.splice(cutoff)
        for (let i = 0; i < cutoff; i++) {
            normalizePath.unshift([arrowPoint.x, arrowPoint.y])
        }
    }
    let arrowDisplay: any = []
    // 计算inline和非inline的位置

    let left = Math.max(0.55, 0.65 - m * 0.01)
    let right = Math.min(0.45, 0.35 + m * 0.01)

    let left2 = m == 1 ? 0.74 : Math.max(0.6, 0.7 - m * 0.01)
    let right2 = m == 1 ? 0.26 : Math.min(0.4, 0.3 + m * 0.01)
    let midX =
        ((Bezier4D(x, pot1[0], pot2[0], x, left) - x) / 150 +
            rx +
            (Bezier4D(x, pot1[0], pot2[0], x, right) - x) / 150 +
            rx) /
        2
    let centerX =
        ((Bezier4D(x, pot1[0], pot2[0], x, left2) - x) / 150 +
            rx +
            (Bezier4D(x, pot1[0], pot2[0], x, right2) - x) / 150 +
            rx) /
        2
    let midY =
        ((Bezier4D(y, pot1[1], pot2[1], y, left) - y) / 150 +
            ry +
            (Bezier4D(y, pot1[1], pot2[1], y, right) - y) / 150 +
            ry) /
        2
    let centerY =
        ((Bezier4D(y, pot1[1], pot2[1], y, left2) - y) / 150 +
            ry +
            (Bezier4D(y, pot1[1], pot2[1], y, right2) - y) / 150 +
            ry) /
        2
    let ans: any = operationUnion(normalizePath, color, width, shape, true)

    if (shape?.head == 'arrow') {
        let { x, y, angle, lineWidth } = arrowPoint
        let matLen = ans.MatArray2.length

        ans.MatArray2[matLen - 5] = x
        ans.MatArray2[matLen - 4] = y
        ans.MatArray2[matLen - 3] = angle + (Math.PI * -90) / 180
        ans.MatArray2[matLen - 2] = lineWidth * 3.0
        ans.MatArray2[matLen - 1] = 1
    }

    // @ts-ignore
    arrowPoint = null

    const result = {
        ...ans,
        ANGLE,
        x: text?.position === 'center' ? midX : centerX,
        y: text?.position === 'center' ? midY : centerY,
        text,
        hasContent,
        shape,
        boundBox,
        isSelect,
        arrowDisplay,
        bezierNumber: edgeGroups,
    }
    ans = null
    return result
}

/**
 * 平行的线  在点A与点B之间生成的多条平行的线    to do list: 优化计算
 * @param x1 起始点圆心A（x1,y1）
 * @param y1
 * @param r1 起始点半径
 * @param x2 终止点圆心A（x1,y1）
 * @param y2
 * @param r2 终止点半径
 * @param m  对于这两个点来说这是第m条边
 * @param attribute 边的属性
 * @param forward 对于上一条边来说这条边是否同向
 * @returns
 */
export const creatParallelLine = (
    size: number,
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number,
    m: number,
    attribute: edgeAttribute,
    forward = 1,
) => {
    let { color, width, text, shape, isSelect, selectedColor } = attribute
    width = Number(width)
    width /= 25
    color = isSelect ? selectedColor : color
    // 缩放圆的半径
    r1 /= 100
    r2 /= 100

    let originalNode = {
        x: 0,
        y: 0,
    }

    let midx = (x1 + x2) / 2,
        midy = (y1 + y2) / 2 //计算中心点
    let distanceX = (x2 - x1) * forward,
        distanceY = (y2 - y1) * forward,
        XYdistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

    let po = (10 - width * 100) * XYdistance

    if (XYdistance == 0) {
        originalNode.x = midx
        originalNode.y = midy
    }

    let moveX = distanceY
    let moveY = -distanceX

    let numOfLine = m == 0 ? 0 : Math.ceil(m / 2) * Math.pow(-1, m)

    var c = -numOfLine / po
    // 计算外偏的位置
    originalNode.x = midx + moveX * c
    originalNode.y = midy + moveY * c

    // A,B点的斜率
    let multiMin = minMulti(
        {
            x: x1,
            y: y1,
        },
        {
            x: x2,
            y: y2,
        },
    )

    let originalNodeM = originalNode.y - multiMin.n * originalNode.x

    // 起算其中某个起始点的坐标
    let originalN1 = disParallel(
        {
            x: x1,
            y: y1,
            r: r1,
        },
        {
            x: x2,
            y: y2,
            r: r2,
        },
    )
    let originalN2 = disParallel(
        {
            x: x2,
            y: y2,
            r: r2,
        },
        {
            x: x1,
            y: y1,
            r: r1,
        },
    )
    // 计算起始点的线性函数
    let clem1 = getClem(multiMin.n, originalN1.x, originalN1.y)
    let clem2 = getClem(multiMin.n, originalN2.x, originalN2.y)

    // 计算起始点和终止点的坐标
    let realX1 =
        clem1.m == 0 && clem1.k == 0 && !multiMin.f
            ? originalN1.x
            : clem1.m == 0 && clem1.k == 0 && multiMin.f
            ? originalNode.x
            : (clem1.m - originalNodeM) / (multiMin.n - clem1.k)
    let realY1 =
        clem1.m == 0 && clem1.k == 0 && !multiMin.f
            ? originalNode.y
            : clem1.m == 0 && clem1.k == 0 && multiMin.f
            ? originalN1.y
            : realX1 * clem1.k + clem1.m

    let realX2 =
        clem2.m == 0 && clem2.k == 0 && !multiMin.f
            ? originalN2.x
            : clem2.m == 0 && clem2.k == 0 && multiMin.f
            ? originalNode.x
            : (clem2.m - originalNodeM) / (multiMin.n - clem2.k)
    let realY2 =
        clem2.m == 0 && clem2.k == 0 && !multiMin.f
            ? originalNode.y
            : clem2.m == 0 && clem2.k == 0 && multiMin.f
            ? originalN2.y
            : realX2 * clem2.k + clem2.m

    let inOtherCircle = false
    if (XYdistance <= Math.max(r1, r2)) {
        inOtherCircle = true
    }
    const bezierNumber = size > 1 || shape?.style == 'dash' ? edgeGroups : defaultGroup
    let bezierPoint = create3DBezier(
        {
            x: inOtherCircle ? x1 : realX1,
            y: inOtherCircle ? y1 : realY1,
        }, // p0
        {
            x: originalNode.x,
            y: originalNode.y,
        }, // p1
        {
            x: inOtherCircle ? x2 : realX2,
            y: inOtherCircle ? y2 : realY2,
        }, // p2
        bezierNumber,
        1.0,
    )
    let ans: any = operationUnion(bezierPoint, color, width, shape, false)

    let x1Real = realX1,
        x2Real = realX2,
        y1Real = realY1,
        y2Real = realY2
    if (x1Real == x2Real) {
        x1Real += width / 2
        x2Real -= width / 2
    }

    if (y1Real == y2Real) {
        y1Real += width / 2
        y2Real -= width / 2
    }

    let boundBox = [
        Math.max(x1Real, x2Real),
        Math.min(x1Real, x2Real),
        Math.max(y1Real, y2Real),
        Math.min(y1Real, y2Real),
    ]

    let hasContent = false
    let content = text?.content
    if (content == '' || content == null || content == undefined) {
        hasContent = false
    } else {
        hasContent = true
    }
    const EDGE_ANGLE = Math.atan2(y2 - y1, x2 - x1)
    let dirtyData = 1
    if ((y2 >= y1 && x1 >= x2) || (y1 >= y2 && x1 > x2)) {
        ;[y1, y2] = [y2, y1]
        ;[x1, x2] = [x2, x1]
        dirtyData = -1
    }

    let change =
        m == 0
            ? dirtyData
            : Math.sign((x2 - x1) * (originalNode.y - y1) - (y2 - y1) * (originalNode.x - x1))

    let ANGLE = Math.atan2(y2 - y1, x2 - x1)

    let arrowPoint: { [key: string]: number } | null = {
        x: inOtherCircle ? x2 : realX2,
        y: inOtherCircle ? y2 : realY2,
        angle: EDGE_ANGLE,
        lineWidth: width,
    }
    // 计算非居中的上移量
    let pos = 40 * XYdistance

    c = numOfLine != 0 ? -Math.pow(-1, m) / pos : -1 / pos

    let xp = change * moveX * c,
        yp = change * moveY * c
    let Direction, Constants
    text?.position === 'bottom'
        ? ((Constants = 35), (Direction = -1))
        : ((Constants = 25), (Direction = 1))
    let pos2 = (Constants - width * 600) * XYdistance
    let c2 = numOfLine != 0 ? -Math.pow(-1, m) / pos2 : -1 / pos2
    let xp2 = change * moveX * c2 * Direction,
        yp2 = change * moveY * c2 * Direction

    if (shape?.head == 'arrow') {
        let { x, y, angle, lineWidth } = arrowPoint
        let matLen = ans.MatArray2.length

        ans.MatArray2[matLen - 5] = x
        ans.MatArray2[matLen - 4] = y
        ans.MatArray2[matLen - 3] = angle + (Math.PI * -90) / 180
        ans.MatArray2[matLen - 2] = lineWidth * 3.0
        ans.MatArray2[matLen - 1] = 1
    }

    const result = {
        ...ans,
        shape,
        text,
        isSelect,
        boundBox,
        hasContent,
        ANGLE,
        x: text?.position === 'center' ? originalNode.x + xp : originalNode.x + xp2,
        y: text?.position === 'center' ? originalNode.y + yp : originalNode.y + yp2,
        bezierNumber,
    }

    // @ts-ignore
    arrowPoint = null
    ans = null
    return result
}

/**
 * 生成边上点的法向量和斜接 形成拓展边
 * @param bezierPoint 未被扩展的点
 * @param color 颜色
 * @param width 宽度
 * @param shape 类型
 * @returns
 */
const operationUnion = (
    normalizePath: any[],
    color: any,
    width: number,
    shape: any,
    self?: any,
) => {
    // 计算法向量
    let attrNormal: number[] = [],
        attrMiter: number[] = [],
        points: number[] = [],
        oldPoint: number[] | null = []

    color = floatColor(color).rgb

    for (let i = 0, lens = normalizePath.length; i < lens; i++) {
        let x1, x2, y1, y2
        if (i == lens - 1) {
            x2 = normalizePath[i][0]
            y2 = normalizePath[i][1]
            x1 = normalizePath[i - 1][0]
            y1 = normalizePath[i - 1][1]
        } else {
            x1 = normalizePath[i][0]
            y1 = normalizePath[i][1]
            x2 = normalizePath[i + 1][0]
            y2 = normalizePath[i + 1][1]
        }
        const dx = x2 - x1,
            dy = y2 - y1
        let len = dx * dx + dy * dy,
            n1 = 0,
            n2 = 0

        if (len) {
            len = 1 / Math.sqrt(len)
            n1 = -dy * len
            n2 = dx * len
        }

        let rx = i * 4
        let item = normalizePath[i]
        // 用于选中的点
        points[rx] = item[0]
        points[rx + 1] = item[1]
        points[rx + 2] = item[0]
        points[rx + 3] = item[1]
        // 用于计算矩阵的点
        oldPoint[rx] = item[0]
        oldPoint[rx + 1] = item[1]
        oldPoint[rx + 2] = item[0]
        oldPoint[rx + 3] = item[1]

        let norm = [n1, n2]
        let miter = -1
        // 法向量
        attrNormal[rx] = norm[0]
        attrNormal[rx + 1] = norm[1]
        attrNormal[rx + 2] = norm[0]
        attrNormal[rx + 3] = norm[1]
        // 斜接
        let ry = i * 2
        attrMiter[ry] = -miter
        attrMiter[ry + 1] = miter
    }

    for (let i = 0, j = 0; i < points.length; i += 2, j++) {
        points[i] += attrNormal[i] * width * attrMiter[j]
        points[i + 1] += attrNormal[i + 1] * width * attrMiter[j]
    }
    let MatArray: any = [],
        MatArray2: any = [],
        sy = width * 0.5,
        scaleN = shape?.style == 'dash' || shape == 'dash' ? 3.0 : self == true ? 1.6 : 2.0,
        constantScale = shape?.style == 'dash' || shape == 'dash' || self ? 0 : 3

    for (let i = 0, j = 0; i < oldPoint.length - 4; i += 4, j += 5) {
        let distance = disPoint(oldPoint[i], oldPoint[i + 1], oldPoint[i + 4], oldPoint[i + 5])

        MatArray2[j] =
            Math.ceil(((oldPoint[i] + oldPoint[i + 4]) / 2) * LARGECONSTANTS) / LARGECONSTANTS
        MatArray2[j + 1] =
            Math.ceil(((oldPoint[i + 1] + oldPoint[i + 5]) / 2) * LARGECONSTANTS) / LARGECONSTANTS
        MatArray2[j + 2] =
            Math.ceil(
                Math.atan2(oldPoint[i + 5] - oldPoint[i + 1], oldPoint[i + 4] - oldPoint[i]) *
                    LARGECONSTANTS,
            ) / LARGECONSTANTS
        MatArray2[j + 3] =
            Math.ceil((distance / scaleN) * LARGECONSTANTS + constantScale) / LARGECONSTANTS
        MatArray2[j + 4] = 0
    }
    MatArray[0] = sy

    MatArray2.push(0, 0, 0, 0, 0)

    // @ts-ignore
    normalizePath = null
    oldPoint = null
    // @ts-ignore
    attrNormal = null
    // @ts-ignore
    attrMiter = null

    return {
        points,
        color,
        MatArray,
        MatArray2,
    }
}

const preBezierCalc = (
    x1: number,
    x2: number,
    y1: number,
    y2: number,
    m: number,
    forward: number,
) => {
    let originalNode = {
            x: 0,
            y: 0,
        },
        po = 5,
        midx = (x1 + x2) / 2,
        midy = (y1 + y2) / 2 //计算中心点

    let distanceX = (x2 - x1) * forward,
        distanceY = (y2 - y1) * forward,
        XYdistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

    if (XYdistance == 0) {
        originalNode.x = midx
        originalNode.y = midy
    }

    let moveX = distanceY,
        moveY = -distanceX

    // 判断是不是中心条
    let numOfLine = m == 0 ? 0 : Math.ceil(m / 2) * Math.pow(-1, m)
    // 计算贝塞尔曲线的控制点
    var c = -numOfLine / po
    originalNode.x = midx + moveX * c
    originalNode.y = midy + moveY * c

    return {
        originalNode,
        numOfLine,
        XYdistance,
        midx,
        midy,
        moveX,
        moveY,
    }
}
