import { CoordBezie } from '../../types'

/**
 * 生成二阶贝塞尔曲线定点数据
 * @param p0   起始点  { x : number, y : number, z : number }
 * @param p1   控制点1 { x : number, y : number, z : number }
 * @param p2   终止点 { x : number, y : number, z : number }
 * @param num  线条精度
 * @param tick 绘制系数
 * @returns {{points: Array, num: number}}
 */
export function create3DBezier(
    p0: CoordBezie,
    p1: CoordBezie,
    p2: CoordBezie,
    num: number,
    tick: number,
) {
    let pointMum = num || 100
    let _tick = tick || 1.0
    let t = _tick / (pointMum - 1)
    let points = []
    for (let i = pointMum - 1; i >= 0; i--) {
        let point = getBezierNowPoint(p0, p1, p2, i, t)
        points.push([point.x, point.y])
        // @ts-ignore
        point = null
    }
    return points
}
/**
 * 二阶贝塞尔曲线公式
 * B(t) = (1-t)^2 * P0 + 2t * (1-t) * P1 + t^2 * P2
 * @param p0 起始点
 * @param p1 控制点
 * @param p2 终止点
 * @param t  绘制系数
 * @returns {*}
 * @constructor
 */
export function Bezier(p0: number, p1: number, p2: number, t: number) {
    let P0, P1, P2
    P0 = p0 * Math.pow(1 - t, 2)
    P1 = 2 * p1 * t * (1 - t)
    P2 = p2 * Math.pow(t, 2)
    return P0 + P1 + P2
}

/**
 * 获取二阶贝塞尔曲线中指定位置的点坐标
 * @param p0 起始点
 * @param p1 控制点
 * @param p2 终止点
 * @param num 绘制个数
 * @param tick 绘制系数
 * @returns {{x, y, z}}
 */
function getBezierNowPoint(
    p0: CoordBezie,
    p1: CoordBezie,
    p2: CoordBezie,
    num: number,
    tick: number,
) {
    return {
        x: Bezier(p0.x, p1.x, p2.x, num * tick),
        y: Bezier(p0.y, p1.y, p2.y, num * tick),
    }
}

/**
 * 生成三阶贝塞尔曲线定点数据
 * @param p0   起始点  { x : number, y : number, z : number }
 * @param p1   控制点1 { x : number, y : number, z : number }
 * @param p2   控制点2 { x : number, y : number, z : number }
 * @param p3   终止点 { x : number, y : number, z : number }
 * @param num  线条精度
 * @param tick 绘制系数
 * @returns {{points: Array, num: number}}
 */
export function create4DBezier(
    p0: CoordBezie,
    p1: CoordBezie,
    p2: CoordBezie,
    p3: CoordBezie,
    num: number,
    tick: number,
) {
    let pointMum = num || 100
    let _tick = tick || 1.0
    let t = _tick / (pointMum - 1)
    let points = []
    for (let i = 0; i < pointMum; i++) {
        let point = getBezierNow4DPoint(p0, p1, p2, p3, i, t)
        points.push([point.x, point.y])
    }
    return points.reverse()
}

/**
 * 获取三阶贝塞尔曲线中指定位置的点坐标
 * @param p0 起始点
 * @param p1 控制点
 * @param p2 终止点
 * @param num 绘制个数
 * @param tick 绘制系数
 * @returns {{x, y, z}}
 */
function getBezierNow4DPoint(
    p0: CoordBezie,
    p1: CoordBezie,
    p2: CoordBezie,
    p3: CoordBezie,
    num: number,
    tick: number,
) {
    return {
        x: Bezier4D(p0.x, p1.x, p2.x, p3.x, num * tick),
        y: Bezier4D(p0.y, p1.y, p2.y, p3.y, num * tick),
        // z: Bezier(p0.z, p1.z, p2.z, num * tick),
    }
}

/**
 * 三阶贝塞尔曲线公式
 * B(t) = (1-t)^3 * P0 + 3t(1-t)^2 * P1 + 3t^2(1-t) * P2 + t^3 * P3
 * @param p0 起始点
 * @param p1 控制点
 * @param p2 终止点
 * @param t  绘制系数
 * @returns {*}
 * @constructor
 */
export function Bezier4D(p0: number, p1: number, p2: number, p3: number, t: number) {
    let P0, P1, P2, P3
    P0 = p0 * Math.pow(1 - t, 3)

    P1 = 3 * t * (1 - t) * (1 - t) * p1

    P2 = 3 * Math.pow(t, 2) * (1 - t) * p2

    P3 = Math.pow(t, 3) * p3
    return P0 + P1 + P2 + P3
}
