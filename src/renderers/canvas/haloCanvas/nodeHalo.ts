import { globalProp } from '../../../initial/globalProp'
import { mixColor, transformCanvasCoord } from '../../../utils'

const rad = Math.PI * 2 / 100
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
        { color, width, progress } = halo,
        scale = (globalProp.globalScale / ratio) * 2.0
    color = mixColor(graphId, color, opacity)
    // 根据默认比例缩放当前点的大小
    let haloWidth = (width / 2) * scale,
        // 根据相机位置更改点的初始位置
        coord = transformCanvasCoord(graphId, x, y, position, scale, thumbnail)
        ; (x = coord.x), (y = coord.y)
    progress == undefined && (progress = 100);
    progress = 100 - progress
    if (progress == 100) return;
    context.save()
    context.strokeStyle = color
    context.lineWidth = haloWidth
    // context.lineCap = 'round'
    context.beginPath()
    if (progress == 0) {
        context.arc(x, y, Number(size) * scale + haloWidth / 2, 0, Math.PI * 2, true)
    }
    else {
        context.arc(x, y, Number(size) * scale + haloWidth / 2, -Math.PI / 2, -Math.PI / 2 - progress * rad, false)
    }
    context.stroke()
    context.closePath()
    context.restore()
}
