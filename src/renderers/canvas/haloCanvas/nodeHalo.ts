import { globalProp } from '../../../initial/globalProp'
import { mixColor, transformCanvasCoord } from '../../../utils'

/**
 * 点halo绘制
 * @param graphId
 * @param context
 * @param data
 * @param ratio
 * @param position
 * @param thumbnail
 */
export default function nodeHalo(
    graphId: string,
    context: CanvasRenderingContext2D,
    data: any,
    ratio: number,
    position: any[],
    thumbnail: boolean,
): any {
    let { x, y, radius: size, halo, opacity } = data,
        { color, width } = halo,
        scale = (globalProp.globalScale / ratio) * 2.0
    color = mixColor(graphId, color, opacity)
    // 根据默认比例缩放当前点的大小
    let haloWidth = (Number(size) + width / 2) * scale,
        // 根据相机位置更改点的初始位置
        coord = transformCanvasCoord(graphId, x, y, position, scale, thumbnail)
    ;(x = coord.x), (y = coord.y)

    context.fillStyle = color
    context.beginPath()
    context.arc(x, y, haloWidth, 0, Math.PI * 2, true)
    context.closePath()
    context.fill()
}
