import NodeList from '../../classes/nodeList'
import { basicData } from '../../initial/globalProp'
import {
    circleIntersectsBox,
    createNewBound,
    distance,
    unitary,
    returnArray,
    largestEmptyCircle,
    minCal,
    Trigonometric,
    isCrossOver,
    SmallEnclDisk,
} from './math'

/**
 * 增量布局 (发生在某次布局之后的布局)
 * @param galaxyvis  galaxyvis实例
 * @param options  布局配置
 * @param positions  上次布局结束的坐标
 * @param incrementalNodes
 */
export const incrementalLayout = (
    id: string,
    positions: { [key: string]: any },
    incrementalNodes: NodeList,
    options: any,
) => {
    const margin = options?.nodeSize || 80
    var originNodes = incrementalNodes.inverse() // 取反,获取除布局外的点 返回类型为NodeList

    if (originNodes.size == 0) {
        let data: any = {}
        positions.map((item: any) => {
            item.id &&
                (data[item.id] = {
                    x: item.x,
                    y: item.y,
                })
        })
        return data
    }

    var originBoundBox = originNodes.getBoundingBox() //获取包围盒B f为之前图上的点的坐标包围盒

    let { incrementalNode } = options

    let staticOffsetX = 0,
        staticOffsetY = 0

    if (typeof incrementalNode === 'string') {
        let node = basicData[id].nodeList.get(incrementalNode)
        if(!node) {
            return {}
        }
        let { x, y } = node.getPosition();
        staticOffsetX = x, staticOffsetY = y
    }

    var originNodesPositions = originNodes
        .getPosition()
        .map(function (item: { x: number; y: number }) {
            return [item.x, item.y]
        })

    var incrementalBoundBox = incrementalNodes.getBoundingBox(
        staticOffsetX,
        -staticOffsetY,
        incrementalNode,
    ) //获取包围盒A g为新增的点的坐标包围盒

    var p,
        mindisk = SmallEnclDisk(
            positions.map(function (t: any) {
                return t.x + staticOffsetX
            }),
            positions.map(function (t: any) {
                return t.y + staticOffsetY
            }),
            incrementalNodes.getAttribute('radius').map(Number),
        ), //mindisk: mindisk算法生成的重心
        mindiskx = mindisk ? mindisk[0] : staticOffsetX, //重心x
        mindisky = mindisk ? mindisk[1] : staticOffsetY, //重心y
        mindiskr = mindisk ? mindisk[2] + margin : margin, //重心r
        offsetX = 0, //偏移量x
        offsetY = 0 //偏移量y
    if (isCrossOver(originNodesPositions, [mindiskx, mindisky, mindiskr])) {
        if (originNodes.size <= 3) {
            if (
                circleIntersectsBox(
                    mindiskx,
                    mindisky,
                    mindisk ? mindisk[2] : margin,
                    originBoundBox.minX,
                    originBoundBox.minY,
                    originBoundBox.maxX,
                    originBoundBox.maxY,
                )
            ) {
                let E = createNewBound(mindiskx, mindisky, originBoundBox)
                // @ts-ignore
                p = E ? distance(originBoundBox.cx, originBoundBox.cy, E.x, E.y) || 1 : 1
                // @ts-ignore
                var offset = E
                    ? unitary(originBoundBox.cx, originBoundBox.cy, E.x, E.y, (p + mindiskr) / p)
                    : { x: 0, y: 0 }
                offsetX = offset.x - mindiskx
                offsetY = offset.y - mindisky
            }
        } else {
            var convex = Trigonometric.from(
                    originNodesPositions,
                    function (t) {
                        return t[0]
                    },
                    function (t) {
                        return t[1]
                    },
                ),
                triangles = returnArray(convex.triangles, originNodesPositions),
                hull = returnArray(convex.hull, originNodesPositions),
                empty = largestEmptyCircle(originNodes.getPosition(), 10, mindiskr, triangles, hull)

            let E = minCal([mindiskx, mindisky], hull, mindiskr) //偏移量

            if (empty.length > 0) {
                for (
                    var i = Math.pow(mindiskx - E[0], 2) + Math.pow(mindisky - E[1], 2),
                        k = 0,
                        L = empty;
                    k < L.length;
                    k++
                ) {
                    var N = L[k]
                    ;(offsetX = mindiskx - N[0]),
                        (offsetY = mindisky - N[1]),
                        (p = offsetX * offsetX + offsetY * offsetY) < i &&
                            ((i = p), (E = N.slice(0, 2)))
                }
                ;(offsetX = E[0] - mindiskx), (offsetY = E[1] - mindisky)
            } else
                (offsetX = E[0] - incrementalBoundBox.cx), (offsetY = E[1] - incrementalBoundBox.cy)
        }
    }

    var data: any = {}

    positions.map((item: any) => {
        data[item.id] = {
            x: (item.x += offsetX + staticOffsetX),
            y: (item.y += offsetY + staticOffsetY),
        }
    })

    return data
}
