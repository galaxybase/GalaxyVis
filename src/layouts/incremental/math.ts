export function SmallEnclDisk(x: any, y: any, radius: any[], unitArray?: any) {
    if (!unitArray) {
        unitArray = new Uint32Array(x.length)
        for (var i = 0, len = x.length; i < len; i++) {
            unitArray[i] = i
        }
    }
    function initArray(unitArray: any) {
        for (var i = unitArray.length - 1; i >= 0; i--) {
            var random = Math.floor(Math.random() * (i + 1))
            random = Math.max(Math.min(random, i), 0)
            var count = unitArray[i]
            unitArray[i] = unitArray[random]
            unitArray[random] = count
        }
        return unitArray
    }
    function checkThreePoints(
        unitArray: any,
        result: string | any[],
        xObject: { [x: string]: any },
        yObject: { [x: string]: any },
        radius: { [x: string]: any },
        pointCenter: any,
        minPointCenter: any,
    ) {
        var ans = null
        var len = result.length
        var l, d, h
        if (len === 1) {
            l = result[0]
            ans = [xObject[l], yObject[l], radius[l] || 0]
        } else if (len === 2) {
            l = result[0]
            d = result[1]
            ans = pointCenter(xObject[l], yObject[l], xObject[d], yObject[d], radius[l], radius[d])
        } else if (len === 3) {
            l = result[0]
            d = result[1]
            h = result[2]
            ans = minPointCenter(
                xObject[l],
                yObject[l],
                xObject[d],
                yObject[d],
                xObject[h],
                yObject[h],
                radius[l],
                radius[d],
                radius[h],
            )
        }
        return ans
    }
    // @ts-ignore
    function minDisk(
        unitArray: any,
        result: any[],
        len: number,
        xObject: { [x: string]: any },
        yObject: { [x: string]: any },
        radius: any[],
        checkWay: any,
        pointCenter: any,
        minPointCenter: any,
    ) {
        // debugger
        var ans = null
        if (len === 0 || result.length === 3) {
            ans = checkThreePoints(
                unitArray,
                result,
                xObject,
                yObject,
                radius,
                pointCenter,
                minPointCenter,
            )
        } else {
            var thisPoint = unitArray[len - 1]
            ans = minDisk(
                unitArray,
                result,
                len - 1,
                xObject,
                yObject,
                radius,
                checkWay,
                pointCenter,
                minPointCenter,
            )
            if (
                ans === null ||
                !checkWay(ans, xObject[thisPoint], yObject[thisPoint], radius[thisPoint])
            ) {
                result.push(thisPoint)
                ans = minDisk(
                    unitArray,
                    result,
                    len - 1,
                    xObject,
                    yObject,
                    radius,
                    checkWay,
                    pointCenter,
                    minPointCenter,
                )
                result.pop()
            }
        }
        return ans
    }
    function getdefaultCenter(
        Point1_x: number,
        Point1_y: number,
        Point2_x: number,
        Point2_y: number,
    ) {
        var disx = Point1_x - Point2_x,
            disy = Point1_y - Point2_y
        return [
            (Point1_x + Point2_x) / 2,
            (Point1_y + Point2_y) / 2,
            Math.sqrt(disx * disx + disy * disy) / 2,
        ]
    }
    function getCenter(
        Point1_x: number,
        Point1_y: number,
        Point2_x: number,
        Point2_y: number,
        Point3_x: number,
        Point3_y: number,
    ) {
        var disx = Point2_x - Point1_x
        var disy = Point2_y - Point1_y
        var disr = Point3_y - Point3_x
        var distance = Math.sqrt(disx * disx + disy * disy) || 1
        return [
            (Point1_x + Point2_x + (disx / distance) * disr) / 2,
            (Point1_y + Point2_y + (disy / distance) * disr) / 2,
            (distance + Point3_x + Point3_y) / 2,
        ]
    }
    function getMinCenter(
        Point1_x: number,
        Point1_y: number,
        Point2_x: number,
        Point2_y: number,
        Point3_x: number,
        Point3_y: number,
        r1: number,
        r2: number,
        r3: number,
    ) {
        var disx = 2 * (Point1_x - Point2_x),
            disy = 2 * (Point1_y - Point2_y),
            disr = 2 * (r2 - r1)
        var heart =
            Point1_x * Point1_x +
            Point1_y * Point1_y -
            r1 * r1 -
            Point2_x * Point2_x -
            Point2_y * Point2_y +
            r2 * r2
        var boundx = 2 * (Point1_x - Point3_x),
            boundy = 2 * (Point1_y - Point3_y),
            boundr = 2 * (r3 - r1)
        var p =
            Point1_x * Point1_x +
            Point1_y * Point1_y -
            r1 * r1 -
            Point3_x * Point3_x -
            Point3_y * Point3_y +
            r3 * r3
        var boundDistance = boundx * disy - disx * boundy || 1,
            y = (disy * p - boundy * heart) / boundDistance - Point1_x,
            m = (boundy * disr - disy * boundr) / boundDistance,
            x = (boundx * heart - disx * p) / boundDistance - Point1_y,
            b = (disx * boundr - boundx * disr) / boundDistance
        var S = m * m + b * b - 1,
            A = 2 * (y * m + x * b + r1),
            E = y * y + x * x - r1 * r1,
            w = (-A - Math.sqrt(A * A - 4 * S * E)) / (2 * S)
        return [y + m * w + Point1_x, x + b * w + Point1_y, w]
    }
    function getDefaultMinCenter(
        Point1_x: number,
        Point1_y: number,
        Point2_x: number,
        Point2_y: number,
        r1: number,
        r2: number,
    ) {
        var distance =
            (Point1_x * (Point2_y - r2) + Point2_x * (r2 - Point1_y) + r1 * (Point1_y - Point2_y)) *
            2
        if (distance === 0) {
            return null
        }
        var disx =
            ((Point1_x * Point1_x + Point1_y * Point1_y) * (Point2_y - r2) +
                (Point2_x * Point2_x + Point2_y * Point2_y) * (r2 - Point1_y) +
                (r1 * r1 + r2 * r2) * (Point1_y - Point2_y)) /
            distance
        var disy =
            ((Point1_x * Point1_x + Point1_y * Point1_y) * (r1 - Point2_x) +
                (Point2_x * Point2_x + Point2_y * Point2_y) * (Point1_x - r1) +
                (r1 * r1 + r2 * r2) * (Point2_x - Point1_x)) /
            distance
        var disrx = disx - Point1_x,
            disy = disy - Point1_y
        return [disx, disy, Math.sqrt(disrx * disrx + disy * disy)]
    }
    unitArray = initArray(unitArray)
    var pointCenter = radius ? getCenter : getdefaultCenter
    var minPointCenter = radius ? getMinCenter : getDefaultMinCenter
    var checkWay = radius ? judge : check
    radius = radius || []
    return minDisk(
        unitArray,
        [],
        unitArray.length,
        x,
        y,
        radius,
        checkWay,
        pointCenter,
        minPointCenter,
    )
}

function judge(threePoints: number[], x: number, y: number, r: number) {
    var disx = threePoints[0] - x,
        diy = threePoints[1] - y,
        disr = threePoints[2] - r
    return disx * disx + diy * diy < disr * disr + 1e-6
}

function check(threePoints: number[], x: number, y: number) {
    var disr = threePoints[2]
    var disx = Math.abs(threePoints[0] - x),
        disy = Math.abs(threePoints[1] - y)
    if (disx + disy <= disr) {
        return true
    }
    if (disx > disr || disy > disr) {
        return false
    }
    return Math.sqrt(disx * disx + disy * disy) < disr + 1e-12
}

export function isCrossOver(originPosition: any, t: any) {
    var x = t[0]
    var y = t[1]
    var r = t[2]
    var abs = Math.abs
    for (var i = 0, len = originPosition.length; i < len; i++) {
        var position = originPosition[i]
        var px = position[0]
        var py = position[1]
        var disx = abs(px - x),
            disy = abs(py - y)
        if (disx + disy <= r) {
            return true
        }
        if (disx > r || disy > r) {
            continue
        }
        if (disx * disx + disy * disy <= r * r) {
            return true
        }
    }
    return false
}

function getCross(p1: number[], p2: number[], p3: number[]) {
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
}

function getOutpoint(stack: string | any[]) {
    var len = stack.length,
        r = [0, 1],
        i = 2
    for (var n = 2; n < len; n++) {
        while (i > 1 && getCross(stack[r[i - 2]], stack[r[i - 1]], stack[n]) <= 0) {
            --i
        }
        r[i++] = n
    }
    return r.slice(0, i)
}

export function convex(originPosition: any) {
    // let points = originPosition;
    // let n = points.length;
    // if (n <= 2) return null;
    // points.sort(function (a: any, b: any) {
    //     // return a[1] != b[1] ? a[1] - b[1] : a[0] - b[0]
    //     return a[0] - b[0] || a[1] - b[1]
    // });

    // let stack = new Array(n + 2);
    // let p = 0;

    // for (let i = 0; i < n; i++) {
    //     while (p >= 2 && cross(points[stack[p - 2]], points[i], points[stack[p - 1]]) > 0)
    //         p--;
    //     stack[p++] = i;
    // }

    // let inf = p + 1;
    // for (let i = n - 2; i >= 0; i--) {
    //     if (equal(points[stack[p - 2]], points[i])) continue;
    //     while (p >= inf && cross(points[stack[p - 2]], points[i], points[stack[p - 1]]) > 0)
    //         p--;
    //     stack[p++] = i;
    // }

    // let len = Math.max(p - 1, 1);
    // let ret = new Array();
    // for (let i = 0; i < len; i++) {
    //     ret.push(points[stack[i]]);
    // }

    // return ret;
    var len = originPosition.length,
        r
    if (len < 3) {
        return null
    }
    var sortPositions = new Array(len)
    var n = new Array(len)
    for (r = 0; r < len; r++) {
        sortPositions[r] = [+originPosition[r][0], +originPosition[r][1], r]
    }
    sortPositions.sort(function (a, b) {
        return a[0] - b[0] || a[1] - b[1]
        // return a[1] != b[1] ? a[1] - b[1] : a[0] - b[0]
    })
    for (r = 0; r < len; r++) {
        n[r] = [sortPositions[r][0], -sortPositions[r][1]]
    }
    var outPoint = getOutpoint(sortPositions),
        outPointLeft = getOutpoint(n)
    var start = outPointLeft[0] === outPoint[0],
        end = outPointLeft[outPointLeft.length - 1] === outPoint[outPoint.length - 1],
        convexArray = []
    for (r = outPoint.length - 1; r >= 0; --r) {
        convexArray.push(originPosition[sortPositions[outPoint[r]][2]])
    }
    // @ts-ignore
    for (r = +start; r < outPointLeft.length - end; r++) {
        convexArray.push(originPosition[sortPositions[outPointLeft[r]][2]])
    }
    return convexArray
}
// // @ts-ignore
// function cross(o, a, b) {
//     return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
// }
// // @ts-ignore
// function equal(a, b) {
//     return a[0] == b[0] && a[1] == b[1];
// }
export function miniCal(mindisk: number[], t: any, r: any) {
    var i = Infinity
    var n, a
    for (var j = 1, len = t.length; j < len; j += 2) {
        var pointA = t[j - 1],
            pointB = t[j % len]
        var midx = (pointA[0] + pointB[0]) / 2,
            midy = (pointA[1] + pointB[1]) / 2
        var disx = mindisk[0] - midx,
            disy = mindisk[1] - midy
        var disr = disx * disx + disy * disy
        if (disr < i) {
            i = disr
            n = pointA
            a = pointB
        }
    }
    return offset(n[0], n[1], a[0], a[1], r)
}
function offset(px: number, py: number, tx: number, ty: number, r: number) {
    var midx = (px + tx) / 2,
        midy = (py + ty) / 2
    var disx = px - tx,
        disy = py - ty
    var y = -disy,
        x = disx
    var h = Math.sqrt(y * y + x * x)
    y /= h
    x /= h
    return [midx - r * y, midy - r * x]
}

export function circleIntersectsBox(
    offsetX: number,
    offsetY: number,
    offsetR: number,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
) {
    var horizontal = Math.max(minX, Math.min(maxX, offsetX))
    var vertical = Math.max(minY, Math.min(maxY, offsetY))
    var centrifugalX = offsetX - horizontal
    var centrifugalY = offsetY - vertical
    return centrifugalX * centrifugalX + centrifugalY * centrifugalY < offsetR * offsetR
}

export function createNewBound(mindiskx: any, mindisky: any, boundBox: any) {
    var segmentRectangle = segmentRectangleIntersection(
        boundBox.cx,
        boundBox.cy,
        mindiskx,
        mindisky,
        boundBox.minX,
        boundBox.minY,
        boundBox.maxX,
        boundBox.maxY,
    )
    var n = +Infinity,
        dis,
        result
    for (var s = 0, u = segmentRectangle.length; s < u; s++) {
        var rectangle = segmentRectangle[s]
        dis = distance(mindiskx, mindisky, rectangle.x, rectangle.y)
        if (dis < n) {
            n = dis
            result = rectangle
        }
    }
    return result
}
// @ts-ignore
export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}
// @ts-ignore
function segmentRectangleIntersection(cx, cy, x, y, minX, minY, maxX, maxY) {
    var u
    var ans = []
    u = segmentIntersection(cx, cy, x, y, minX, minY, minX, maxY)
    if (u) {
        ans.push(u)
    }
    u = segmentIntersection(cx, cy, x, y, minX, maxY, maxX, maxY)
    if (u) {
        ans.push(u)
    }
    u = segmentIntersection(cx, cy, x, y, maxX, maxY, maxX, minY)
    if (u) {
        ans.push(u)
    }
    u = segmentIntersection(cx, cy, x, y, maxX, minY, minX, minY)
    if (u) {
        ans.push(u)
    }
    return ans
}
// @ts-ignore
function segmentIntersection(cx, cy, x, y, startX, startY, endX, endY) {
    var h = (endY - startY) * (x - cx) - (endX - startX) * (y - cy)
    if (h === 0) {
        return null
    }
    var vertical = cy - startY
    var horizontal = cx - startX
    var d = (endX - startX) * vertical - (endY - startY) * horizontal
    var k = d / h
    return {
        x: cx + k * (x - cx),
        y: cy + k * (y - cy),
    }
}
// @ts-ignore
export function unitary(x1, y1, x2, y2, k) {
    return {
        x: x1 + k * (x2 - x1),
        y: y1 + k * (y2 - y1),
    }
}

const MACHEP = 11102230246251565e-32,
    minValue = 134217729,
    MACHEP8 = (3 + 8 * MACHEP) * MACHEP,
    MACHEP16 = (3 + 16 * MACHEP) * MACHEP,
    MACHEP12 = (2 + 12 * MACHEP) * MACHEP,
    MACHEP64 = (9 + 64 * MACHEP) * MACHEP * MACHEP,
    FloatArray4 = getFloat64Array(4),
    FloatArray8 = getFloat64Array(8),
    FloatArray12 = getFloat64Array(12),
    FloatArray16 = getFloat64Array(16),
    newFloatArray4 = getFloat64Array(4)

function getFloat64Array(t: any) {
    return new Float64Array(t)
}

function vectors(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    const crossA = (y1 - y3) * (x2 - x3),
        crossB = (x1 - x3) * (y2 - y3),
        subCross = crossA - crossB
    if (0 === crossA || 0 === crossB || crossA > 0 != crossB > 0) return subCross
    const l = Math.abs(crossA + crossB)
    return Math.abs(subCross) >= MACHEP16 * l
        ? subCross
        : -weighteUnitArraySubscriptectors(x1, y1, x2, y2, x3, y3, l)
}

function forEachTypeArray(len: number, typeArray: any[] | Float64Array) {
    let n = typeArray[0]
    for (let i = 1; i < len; i++) n += typeArray[i]
    return n
}

function triangulation(
    num: number,
    floatArray: any,
    count: number,
    floatArray4: any,
    floatArray8: any,
) {
    let newA,
        newB,
        ans,
        nex,
        Fa = floatArray[0],
        Fb = floatArray4[0],
        front = 0,
        end = 0
    Fb > Fa == Fb > -Fa
        ? ((newA = Fa), (Fa = floatArray[++front]))
        : ((newB = Fb), (Fb = floatArray4[++end]))
    let i = 0
    if (front < num && end < count)
        for (
            Fb > Fa == Fb > -Fa
                ? ((newB = Fa + newA), (ans = newA - (newB - Fa)), (Fa = floatArray[++front]))
                : ((newB = Fb + newA), (ans = newA - (newB - Fb)), (Fb = floatArray4[++end])),
                newA = newB,
                0 !== ans && (floatArray8[i++] = ans);
            front < num && end < count;

        )
            Fb > Fa == Fb > -Fa
                ? ((newB = newA + Fa),
                  (nex = newB - newA),
                  (ans = newA - (newB - nex) + (Fa - nex)),
                  (Fa = floatArray[++front]))
                : ((newB = newA + Fb),
                  (nex = newB - newA),
                  (ans = newA - (newB - nex) + (Fb - nex)),
                  (Fb = floatArray4[++end])),
                (newA = newB),
                0 !== ans && (floatArray8[i++] = ans)
    for (; front < num; )
        (newB = newA + Fa),
            (nex = newB - newA),
            (ans = newA - (newB - nex) + (Fa - nex)),
            (Fa = floatArray[++front]),
            (newA = newB),
            0 !== ans && (floatArray8[i++] = ans)
    for (; end < count; )
        (newB = newA + Fb),
            (nex = newB - newA),
            (ans = newA - (newB - nex) + (Fb - nex)),
            (Fb = floatArray4[++end]),
            (newA = newB),
            0 !== ans && (floatArray8[i++] = ans)
    return (0 === newA && 0 !== i) || (floatArray8[i++] = newA), i
}

function weighteUnitArraySubscriptectors(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    s: number,
) {
    let a,
        u,
        l,
        d,
        remainingH,
        minDisx,
        cxDis,
        x,
        cyDis,
        y,
        remainingA,
        overlatCross,
        remainingCross,
        corssA,
        remaining,
        A,
        E,
        S
    const disx = x1 - x3,
        disx2 = x2 - x3,
        disy = y1 - y3,
        disy2 = y2 - y3
    corssA = disx * disy2
    minDisx = minValue * disx
    cxDis = minDisx - (minDisx - disx)
    x = disx - cxDis
    minDisx = minValue * disy2
    cyDis = minDisx - (minDisx - disy2)
    y = disy2 - cyDis
    remaining = x * y - (corssA - cxDis * cyDis - x * cyDis - cxDis * y)
    A = disy * disx2
    minDisx = minValue * disy
    cxDis = minDisx - (minDisx - disy)
    x = disy - cxDis
    minDisx = minValue * disx2
    cyDis = minDisx - (minDisx - disx2)
    y = disx2 - cyDis
    E = x * y - (A - cxDis * cyDis - x * cyDis - cxDis * y)
    remainingA = remaining - E
    remainingH = remaining - remainingA
    FloatArray4[0] = remaining - (remainingA + remainingH) + (remainingH - E)
    overlatCross = corssA + remainingA
    remainingH = overlatCross - corssA
    remainingCross = corssA - (overlatCross - remainingH) + (remainingA - remainingH)
    remainingA = remainingCross - A
    remainingH = remainingCross - remainingA
    FloatArray4[1] = remainingCross - (remainingA + remainingH) + (remainingH - A)
    S = overlatCross + remainingA
    remainingH = S - overlatCross
    FloatArray4[2] = overlatCross - (S - remainingH) + (remainingA - remainingH)
    FloatArray4[3] = S
    let I = forEachTypeArray(4, FloatArray4),
        k = MACHEP12 * s
    if (I >= k || -I >= k) return I
    if (
        ((remainingH = x1 - disx),
        (a = x1 - (disx + remainingH) + (remainingH - x3)),
        (remainingH = x2 - disx2),
        (l = x2 - (disx2 + remainingH) + (remainingH - x3)),
        (remainingH = y1 - disy),
        (u = y1 - (disy + remainingH) + (remainingH - y3)),
        (remainingH = y2 - disy2),
        (d = y2 - (disy2 + remainingH) + (remainingH - y3)),
        0 === a && 0 === u && 0 === l && 0 === d)
    )
        return I
    if (
        ((k = MACHEP64 * s + MACHEP8 * Math.abs(I)),
        (I += disx * d + disy2 * a - (disy * l + disx2 * u)),
        I >= k || -I >= k)
    )
        return I
    corssA = a * disy2
    minDisx = minValue * a
    cxDis = minDisx - (minDisx - a)
    x = a - cxDis
    minDisx = minValue * disy2
    ;(cyDis = minDisx - (minDisx - disy2)), (y = disy2 - cyDis)
    remaining = x * y - (corssA - cxDis * cyDis - x * cyDis - cxDis * y)
    A = u * disx2
    minDisx = minValue * u
    cxDis = minDisx - (minDisx - u)
    x = u - cxDis
    minDisx = minValue * disx2
    cyDis = minDisx - (minDisx - disx2)
    y = disx2 - cyDis
    E = x * y - (A - cxDis * cyDis - x * cyDis - cxDis * y)
    remainingA = remaining - E
    remainingH = remaining - remainingA
    newFloatArray4[0] = remaining - (remainingA + remainingH) + (remainingH - E)
    overlatCross = corssA + remainingA
    remainingH = overlatCross - corssA
    remainingCross = corssA - (overlatCross - remainingH) + (remainingA - remainingH)
    ;(remainingA = remainingCross - A), (remainingH = remainingCross - remainingA)
    newFloatArray4[1] = remainingCross - (remainingA + remainingH) + (remainingH - A)
    S = overlatCross + remainingA
    remainingH = S - overlatCross
    newFloatArray4[2] = overlatCross - (S - remainingH) + (remainingA - remainingH)
    newFloatArray4[3] = S
    const L = triangulation(4, FloatArray4, 4, newFloatArray4, FloatArray8)
    corssA = disx * d
    minDisx = minValue * disx
    cxDis = minDisx - (minDisx - disx)
    x = disx - cxDis
    minDisx = minValue * d
    cyDis = minDisx - (minDisx - d)
    y = d - cyDis
    remaining = x * y - (corssA - cxDis * cyDis - x * cyDis - cxDis * y)
    ;(A = disy * l), (minDisx = minValue * disy)
    cxDis = minDisx - (minDisx - disy)
    x = disy - cxDis
    minDisx = minValue * l
    cyDis = minDisx - (minDisx - l)
    y = l - cyDis
    E = x * y - (A - cxDis * cyDis - x * cyDis - cxDis * y)
    ;(remainingA = remaining - E), (remainingH = remaining - remainingA)
    newFloatArray4[0] = remaining - (remainingA + remainingH) + (remainingH - E)
    overlatCross = corssA + remainingA
    remainingH = overlatCross - corssA
    remainingCross = corssA - (overlatCross - remainingH) + (remainingA - remainingH)
    remainingA = remainingCross - A
    remainingH = remainingCross - remainingA
    newFloatArray4[1] = remainingCross - (remainingA + remainingH) + (remainingH - A)
    S = overlatCross + remainingA
    remainingH = S - overlatCross
    newFloatArray4[2] = overlatCross - (S - remainingH) + (remainingA - remainingH)
    newFloatArray4[3] = S
    const N = triangulation(L, FloatArray8, 4, newFloatArray4, FloatArray12)
    corssA = a * d
    minDisx = minValue * a
    cxDis = minDisx - (minDisx - a)
    x = a - cxDis
    minDisx = minValue * d
    cyDis = minDisx - (minDisx - d)
    y = d - cyDis
    remaining = x * y - (corssA - cxDis * cyDis - x * cyDis - cxDis * y)
    A = u * l
    minDisx = minValue * u
    cxDis = minDisx - (minDisx - u)
    x = u - cxDis
    minDisx = minValue * l
    cyDis = minDisx - (minDisx - l)
    y = l - cyDis
    E = x * y - (A - cxDis * cyDis - x * cyDis - cxDis * y)
    remainingA = remaining - E
    remainingH = remaining - remainingA
    newFloatArray4[0] = remaining - (remainingA + remainingH) + (remainingH - E)
    overlatCross = corssA + remainingA
    remainingH = overlatCross - corssA
    remainingCross = corssA - (overlatCross - remainingH) + (remainingA - remainingH)
    remainingA = remainingCross - A
    remainingH = remainingCross - remainingA
    newFloatArray4[1] = remainingCross - (remainingA + remainingH) + (remainingH - A)
    S = overlatCross + remainingA
    remainingH = S - overlatCross
    newFloatArray4[2] = overlatCross - (S - remainingH) + (remainingA - remainingH)
    newFloatArray4[3] = S
    const F = triangulation(N, FloatArray12, 4, newFloatArray4, FloatArray16)
    return FloatArray16[F - 1]
}

const minSubPower = Math.pow(2, -52),
    UnitArraySubscript = new Uint32Array(512)

function getTheFirstofArray(t: any) {
    return t[0]
}

function getTheSecondofArray(t: any) {
    return t[1]
}

function TriangularDistance(x1: number, y1: number, x2: number, y2: number) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)
}

function Triangular(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    const distanceA = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1),
        distanceB = (x3 - x1) * (x3 - x1) + (y3 - y1) * (y3 - y1),
        k = 0.5 / ((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1)),
        newX = ((y3 - y1) * distanceA - (y2 - y1) * distanceB) * k,
        newY = ((x2 - x1) * distanceB - (x3 - x1) * distanceA) * k
    return newX * newX + newY * newY
}

function swapCoord(ids: any, a: number, b: number) {
    const i = ids[a]
    ;(ids[a] = ids[b]), (ids[b] = i)
}

function IterationHull(ids: any, dists: any, n: number, len: number) {
    if (len - n <= 20)
        for (let r = n + 1; r <= len; r++) {
            const i = ids[r],
                o = dists[i]
            let s = r - 1
            for (; s >= n && dists[ids[s]] > o; ) ids[s + 1] = ids[s--]
            ids[s + 1] = i
        }
    else {
        let r = n + 1,
            o = len
        swapCoord(ids, (n + len) >> 1, r),
            dists[ids[n]] > dists[ids[len]] && swapCoord(ids, n, len),
            dists[ids[r]] > dists[ids[len]] && swapCoord(ids, r, len),
            dists[ids[n]] > dists[ids[r]] && swapCoord(ids, n, r)
        const s = ids[r],
            a = dists[s]
        for (;;) {
            do {
                r++
            } while (dists[ids[r]] < a)
            do {
                o--
            } while (dists[ids[o]] > a)
            if (o < r) break
            swapCoord(ids, r, o)
        }
        ;(ids[n + 1] = ids[o]),
            (ids[o] = s),
            len - r + 1 >= o - n
                ? (IterationHull(ids, dists, r, len), IterationHull(ids, dists, n, o - 1))
                : (IterationHull(ids, dists, n, o - 1), IterationHull(ids, dists, r, len))
    }
}

function triangularOffset(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    const distanceA = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1),
        distanceB = (x3 - x1) * (x3 - x1) + (y3 - y1) * (y3 - y1),
        k = 0.5 / ((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1)),
        newX = ((y3 - y1) * distanceA - (y2 - y1) * distanceB) * k,
        newY = ((x2 - x1) * distanceB - (x3 - x1) * distanceA) * k
    return {
        x: x1 + newX,
        y: y1 + newY,
    }
}

export var returnArray = function (t: any, e: any) {
    for (var n = new Array(t.length), i = 0; i < t.length; i++) n[i] = e[t[i]]
    return n
}

export function largestEmptyCircle(
    coords: any,
    num: any,
    n: any,
    triangles: any,
    convexhull: any[],
) {
    if ((void 0 === num && (num = 1), void 0 === n && (n = 0), !triangles || !convexhull)) {
        var positions = coords.map(function (t: any) {
                return [t.x, t.y]
            }),
            convex = Trigonometric.from(
                positions,
                function (t) {
                    return t.x
                },
                function (t) {
                    return t.y
                },
            )
        ;(triangles = returnArray(convex.triangles, positions)),
            (convexhull = returnArray(convex.hull, positions))
    }
    if (!convexhull) return []
    for (var s = n * n, a = [], u: any = {}, l = 0; l < triangles.length; l += 3) {
        if (
            convexCollision(
                convexhull,
                linearPoint(triangles[l], triangles[l + 1], triangles[l + 2]),
            )
        )
            (g = multipl(triangles[l], triangles[l + 1], triangles[l + 2])) > s &&
                (a.push(l), (u[l] = g))
    }
    if (0 === a.length) return []
    a.sort(function (t, e) {
        return u[t] - u[e]
    })
    var d = a[0],
        h = u[d],
        c = []
    for (l = 0; l < a.length; l++) {
        var g,
            f = a[l]
        ;(g = u[f]) > h && g > s && ((d = f), (h = g), c.push(d), c.length > num && c.shift())
    }
    return c.map(function (t) {
        return $v(triangles[t], triangles[t + 1], triangles[t + 2])
    })
}
function convexCollision(convexhull: string | any[], point: any[]) {
    for (
        var len = convexhull.length,
            i = convexhull[len - 1],
            pointX = point[0],
            pointY = point[1],
            s = i[0],
            a = i[1],
            flag = !1,
            j = 0;
        j < len;
        j++
    ) {
        var hull = convexhull[j],
            x = hull[0],
            y = hull[1]
        y > pointY != a > pointY &&
            pointX < ((s - x) * (pointY - y)) / (a - y) + x &&
            (flag = !flag),
            (s = x),
            (a = pointX)
    }
    return flag
}

function $v(triangleA: number[], triangleB: number[], triangleC: number[]) {
    for (var point = linearPoint(triangleA, triangleB, triangleC), r = 0, i = 0; i < 3; i++) {
        var s = arguments[i],
            x = s[0] - point[0],
            y = s[1] - point[1],
            dis = Math.sqrt(x * x + y * y)
        dis > r && (r = dis)
    }
    return [point[0], point[1], r]
}

function multipl(triangleA: number[], triangleB: number[], triangleC: number[]) {
    var point = linearPoint(triangleA, triangleB, triangleC),
        x = point[0],
        y = point[1],
        newX = x - triangleA[0],
        newY = y - triangleA[1]
    return newX * newX + newY * newY
}

function linearPoint(triangleA: number[], triangleB: number[], triangleC: number[]) {
    var midA = [(triangleA[0] + triangleB[0]) / 2, (triangleA[1] + triangleB[1]) / 2],
        midB = [(triangleB[0] + triangleC[0]) / 2, (triangleB[1] + triangleC[1]) / 2],
        k1 = -1 / ((triangleB[1] - triangleA[1]) / (triangleB[0] - triangleA[0])),
        k2 = -1 / ((triangleC[1] - triangleB[1]) / (triangleC[0] - triangleB[0])),
        y = midA[1] - k1 * midA[0],
        x = (y - (midB[1] - k2 * midB[0])) / (k2 - k1)
    return [x, k1 * x + y]
}

export class Trigonometric {
    coords: any
    _triangles: Uint32Array
    _halfedges: Int32Array
    _hashSize: number
    _hullPrMACHEP8: Uint32Array
    _hullNext: Uint32Array
    _hullTri: Uint32Array
    _hullHash: Int32Array
    _ids: Uint32Array
    _dists: Float64Array
    _cx: any
    _cy: any
    _hullStart: any
    hull: any
    triangles: any
    trianglesLen: any
    halfedges: any
    static from(t: any, e = getTheFirstofArray, n = getTheSecondofArray) {
        const i = t.length,
            r = new Float64Array(2 * i)
        for (let o = 0; o < i; o++) {
            const i = t[o]
            ;(r[2 * o] = e(i)), (r[2 * o + 1] = n(i))
        }
        return new Trigonometric(r)
    }

    constructor(t: any) {
        const e = t.length >> 1
        if (e > 0 && 'number' != typeof t[0]) throw new Error('Expected coords to contain numbers.')
        this.coords = t
        const n = Math.max(2 * e - 5, 0)
        ;(this._triangles = new Uint32Array(3 * n)),
            (this._halfedges = new Int32Array(3 * n)),
            (this._hashSize = Math.ceil(Math.sqrt(e))),
            (this._hullPrMACHEP8 = new Uint32Array(e)),
            (this._hullNext = new Uint32Array(e)),
            (this._hullTri = new Uint32Array(e)),
            (this._hullHash = new Int32Array(this._hashSize).fill(-1)),
            (this._ids = new Uint32Array(e)),
            (this._dists = new Float64Array(e)),
            this.update()
    }
    update() {
        const { coords, _hullPrMACHEP8, _hullNext, _hullTri, _hullHash } = this,
            o = coords.length >> 1
        let leftBorder = 1 / 0, //左边界
            lowerBorder = 1 / 0, //下边界
            rightBorder = -1 / 0, //右边界
            topBorder = -1 / 0 //上边界
        for (let e = 0; e < o; e++) {
            const x = coords[2 * e],
                y = coords[2 * e + 1]
            x < leftBorder && (leftBorder = x),
                y < lowerBorder && (lowerBorder = y),
                x > rightBorder && (rightBorder = x),
                y > topBorder && (topBorder = y),
                (this._ids[e] = e)
        }
        // 矩形的中心点坐标A
        const middleX = (leftBorder + rightBorder) / 2,
            middleY = (lowerBorder + topBorder) / 2
        // 寻找最接近中心A的点B
        let suffixB: any,
            suffixC: any,
            suffixD: any,
            p = 1 / 0
        for (let e = 0; e < o; e++) {
            const n = TriangularDistance(middleX, middleY, coords[2 * e], coords[2 * e + 1])
            n < p && ((suffixB = e), (p = n))
        }
        const closestMiddleX = coords[2 * suffixB],
            closestMiddleY = coords[2 * suffixB + 1]
        // 寻找最接点B的点C
        p = 1 / 0
        for (let e = 0; e < o; e++) {
            if (e === suffixB) continue
            const n = TriangularDistance(
                closestMiddleX,
                closestMiddleY,
                coords[2 * e],
                coords[2 * e + 1],
            )
            n < p && n > 0 && ((suffixC = e), (p = n))
        }
        let closestX = coords[2 * suffixC],
            closestY = coords[2 * suffixC + 1],
            x = 1 / 0
        // 寻找B与点C最小角的点D
        for (let e = 0; e < o; e++) {
            if (e === suffixB || e === suffixC) continue
            const n = Triangular(
                closestMiddleX,
                closestMiddleY,
                closestX,
                closestY,
                coords[2 * e],
                coords[2 * e + 1],
            )
            n < x && ((suffixD = e), (x = n))
        }
        let minClosestX = coords[2 * suffixD],
            minClosestY = coords[2 * suffixD + 1]
        // 找不到符合的点则按距离输出hull
        if (x === 1 / 0) {
            for (let e = 0; e < o; e++)
                this._dists[e] = coords[2 * e] - coords[0] || coords[2 * e + 1] - coords[1]
            IterationHull(this._ids, this._dists, 0, o - 1)
            const e = new Uint32Array(o)
            let n = 0
            for (let t = 0, i = -1 / 0; t < o; t++) {
                const r = this._ids[t]
                this._dists[r] > i && ((e[n++] = r), (i = this._dists[r]))
            }
            return (
                (this.hull = e.subarray(0, n)),
                (this.triangles = new Uint32Array(0)),
                void (this.halfedges = new Uint32Array(0))
            )
        }
        if (
            vectors(closestMiddleX, closestMiddleY, closestX, closestY, minClosestX, minClosestY) <
            0
        ) {
            const t = suffixC,
                e = closestX,
                n = closestY
            ;(suffixC = suffixD),
                (closestX = minClosestX),
                (closestY = minClosestY),
                (suffixD = t),
                (minClosestX = e),
                (minClosestY = n)
        }
        const E = triangularOffset(
            closestMiddleX,
            closestMiddleY,
            closestX,
            closestY,
            minClosestX,
            minClosestY,
        )
        ;(this._cx = E.x), (this._cy = E.y)
        // 计算每个点的距离
        for (let e = 0; e < o; e++) {
            this._dists[e] = TriangularDistance(coords[2 * e], coords[2 * e + 1], E.x, E.y)
        }
        IterationHull(this._ids, this._dists, 0, o - 1), (this._hullStart = suffixB)
        let S = 3
        ;(_hullNext[suffixB] = _hullPrMACHEP8[suffixD] = suffixC),
            (_hullNext[suffixC] = _hullPrMACHEP8[suffixB] = suffixD),
            (_hullNext[suffixD] = _hullPrMACHEP8[suffixC] = suffixB),
            (_hullTri[suffixB] = 0),
            (_hullTri[suffixC] = 1),
            (_hullTri[suffixD] = 2),
            _hullHash.fill(-1),
            (_hullHash[this._hashKey(closestMiddleX, closestMiddleY)] = suffixB),
            (_hullHash[this._hashKey(closestX, closestY)] = suffixC),
            (_hullHash[this._hashKey(minClosestX, minClosestY)] = suffixD),
            (this.trianglesLen = 0),
            this._addTriangle(suffixB, suffixC, suffixD, -1, -1, -1)
        for (let o, s, a = 0; a < this._ids.length; a++) {
            const u = this._ids[a],
                l = coords[2 * u],
                d = coords[2 * u + 1]
            if (a > 0 && Math.abs(l - o) <= minSubPower && Math.abs(d - s) <= minSubPower) continue
            if (((o = l), (s = d), u === suffixB || u === suffixC || u === suffixD)) continue
            let h = 0
            for (
                let t = 0, e = this._hashKey(l, d);
                t < this._hashSize &&
                ((h = _hullHash[(e + t) % this._hashSize]), -1 === h || h === _hullNext[h]);
                t++
            );
            h = _hullPrMACHEP8[h]
            let p,
                _ = h
            for (
                ;
                (p = _hullNext[_]),
                    vectors(
                        l,
                        d,
                        coords[2 * _],
                        coords[2 * _ + 1],
                        coords[2 * p],
                        coords[2 * p + 1],
                    ) >= 0;

            )
                if (((_ = p), _ === h)) {
                    _ = -1
                    break
                }
            if (-1 === _) continue
            let m: any = this._addTriangle(_, u, _hullNext[_], -1, -1, _hullTri[_])
            ;(_hullTri[u] = this._legalize(m + 2)), (_hullTri[_] = m), S++
            let v = _hullNext[_]
            for (
                ;
                (p = _hullNext[v]),
                    vectors(
                        l,
                        d,
                        coords[2 * v],
                        coords[2 * v + 1],
                        coords[2 * p],
                        coords[2 * p + 1],
                    ) < 0;

            ) {
                m = this._addTriangle(v, u, p, _hullTri[u], -1, _hullTri[v])
                _hullTri[u] = this._legalize(m + 2)
                _hullNext[v] = v
                S--
                v = p
            }
            if (_ === h)
                for (
                    ;
                    (p = _hullPrMACHEP8[_]),
                        vectors(
                            l,
                            d,
                            coords[2 * p],
                            coords[2 * p + 1],
                            coords[2 * _],
                            coords[2 * _ + 1],
                        ) < 0;

                ) {
                    m = this._addTriangle(p, u, _, -1, _hullTri[_], _hullTri[p])
                    this._legalize(m + 2)
                    _hullTri[p] = m
                    _hullNext[_] = _
                    S--
                    _ = p
                }
            this._hullStart = _hullPrMACHEP8[u] = _
            _hullNext[_] = _hullPrMACHEP8[v] = u
            _hullNext[u] = v
            _hullHash[this._hashKey(l, d)] = u
            _hullHash[this._hashKey(coords[2 * _], coords[2 * _ + 1])] = _
        }
        this.hull = new Uint32Array(S)
        for (let t = 0, e = this._hullStart; t < S; t++) {
            this.hull[t] = e
            e = _hullNext[e]
        }
        this.triangles = this._triangles.subarray(0, this.trianglesLen)
        this.halfedges = this._halfedges.subarray(0, this.trianglesLen)
    }
    _hashKey(t: any, e: any) {
        return (
            Math.floor(FourFractions(t - this._cx, e - this._cy) * this._hashSize) % this._hashSize
        )
    }
    _legalize(t: any) {
        const { _triangles, _halfedges, coords } = this
        let countI = 0,
            countJ = 0
        for (;;) {
            const s = _halfedges[t],
                a = t - (t % 3)
            if (((countJ = a + ((t + 2) % 3)), -1 === s)) {
                if (0 === countI) break
                t = UnitArraySubscript[--countI]
                continue
            }
            const u = s - (s % 3),
                l = a + ((t + 1) % 3),
                d = u + ((s + 2) % 3),
                trianglesA = _triangles[countJ],
                trianglesB = _triangles[t],
                trianglesC = _triangles[l],
                trianglesD = _triangles[d]
            if (
                isLegalize(
                    coords[2 * trianglesA],
                    coords[2 * trianglesA + 1],
                    coords[2 * trianglesB],
                    coords[2 * trianglesB + 1],
                    coords[2 * trianglesC],
                    coords[2 * trianglesC + 1],
                    coords[2 * trianglesD],
                    coords[2 * trianglesD + 1],
                )
            ) {
                ;(_triangles[t] = trianglesD), (_triangles[s] = trianglesA)
                const i = _halfedges[d]
                if (-1 === i) {
                    let e = this._hullStart
                    do {
                        if (this._hullTri[e] === d) {
                            this._hullTri[e] = t
                            break
                        }
                        e = this._hullPrMACHEP8[e]
                    } while (e !== this._hullStart)
                }
                this._link(t, i), this._link(s, _halfedges[countJ]), this._link(countJ, d)
                const a = u + ((s + 1) % 3)
                countI < UnitArraySubscript.length && (UnitArraySubscript[countI++] = a)
            } else {
                if (0 === countI) break
                t = UnitArraySubscript[--countI]
            }
        }
        return countJ
    }
    _link(t: number, e: number) {
        ;(this._halfedges[t] = e), -1 !== e && (this._halfedges[e] = t)
    }
    _addTriangle(t: number, e: number, n: number, i: number, r: number, o: number) {
        const s: any = this.trianglesLen
        return (
            (this._triangles[s] = t),
            (this._triangles[s + 1] = e),
            (this._triangles[s + 2] = n),
            this._link(s, i),
            this._link(s + 1, r),
            this._link(s + 2, o),
            (this.trianglesLen += 3),
            s
        )
    }
}

function FourFractions(x: number, y: number) {
    const n = x / (Math.abs(x) + Math.abs(y))
    return (y > 0 ? 3 - n : 1 + n) / 4
}

function isLegalize(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
) {
    const crossA = (x2 - x4) * (x2 - x4) + (y2 - y4) * (y2 - y4),
        crossB = (x3 - x4) * (x3 - x4) + (y3 - y4) * (y3 - y4)
    return (
        (x1 - x4) * ((y2 - y4) * crossB - crossA * (y3 - y4)) -
            (y1 - y4) * ((x2 - x4) * crossB - crossA * (x3 - x4)) +
            ((x1 - x4) * (x1 - x4) + (y1 - y4) * (y1 - y4)) *
                ((x2 - x4) * (y3 - y4) - (y2 - y4) * (x3 - x4)) <
        0
    )
}

function getClosestPointOnSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
) {
    var disx = x3 - x2,
        disy = y3 - y2
    if (0 === disx && 0 === disy)
        return {
            x: x2,
            y: y2,
        }
    var u = ((x1 - x2) * disx + (y1 - y2) * disy) / (disx * disx + disy * disy)
    return u < 0
        ? {
              x: x2,
              y: y2,
          }
        : u > 1
        ? {
              x: x3,
              y: y3,
          }
        : {
              x: x2 + u * disx,
              y: y2 + u * disy,
          }
}

function multiplDistance(x1: number, y1: number, x2: number, y2: number) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)
}

function distToSegmentSquared(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
) {
    var s = multiplDistance(x2, y2, x3, y3)
    if (0 === s) return multiplDistance(x1, y1, x2, y2)
    var a = ((x1 - x2) * (x3 - x2) + (y1 - y2) * (y3 - y2)) / s
    return multiplDistance(
        x1,
        y1,
        x2 + (a = Math.max(0, Math.min(1, a))) * (x3 - x2),
        y2 + a * (y3 - y2),
    )
}

export function minCal(t: any[], hull: string | any[], distance: any) {
    for (var n, i, r = 1 / 0, o = 0, s = hull.length; o < s; o++) {
        var a = hull[o],
            u = hull[(o + 1) % s],
            l = distToSegmentSquared(t[0], t[1], a[0], a[1], u[0], u[1])
        l < r && ((r = l), (n = a), (i = u))
    }
    return getClosestPoint(t[0], t[1], n[0], n[1], i[0], i[1], distance)
}

function getClosestPoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    distance: number,
) {
    var segment = getClosestPointOnSegment(x1, y1, x2, y2, x3, y3),
        disy = -(y2 - y3),
        disx = x2 - x3,
        disr = Math.sqrt(disy * disy + disx * disx)
    ;(disy /= disr), (disx /= disr)
    return [segment.x - distance * disy, segment.y - distance * disx]
}

export function SegmentBoundBox(t: any) {
    return [
        [t.minX, t.minY],
        [t.minX, t.maxY],
        [t.maxX, t.maxY],
        [t.maxX, t.minY],
    ]
}

export function getBoundingBox(position: any) {
    let maxX = -Infinity,
        minX = Infinity,
        maxY = -Infinity,
        minY = Infinity

    position.forEach((item: any) => {
        let { x, y } = item
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
    })

    return {
        maxX,
        minX,
        maxY,
        minY,
        width: maxX - minX,
        height: maxY - minY,
        cx: minX + (maxX - minX) / 2,
        cy: minY + (maxY - minY) / 2,
    }
}
