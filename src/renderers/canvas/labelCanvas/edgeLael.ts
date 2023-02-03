import { basicData, globalProp } from '../../../initial/globalProp'
import { mixColor } from '../../../utils'
import { getLines } from './common'

const pattern = /[1-9]\d*\.\d*|0\.\d*[1-9]\d*$/
const RGBA_TEST_REGEX = /^\s*rgba?\s*\(/
const RGBA_EXTRACT_REGEX =
    /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)(?:\s*,\s*(.*)?)?\)\s*$/
/**
 * 边文字绘制
 * @param graphId
 * @param context
 * @param data
 * @param ratio
 * @returns
 */
export default function canvasLabelEdge(
    graphId: string,
    context: CanvasRenderingContext2D,
    data: any,
    ratio: number,
): void {
    let scale = (globalProp.globalScale / ratio) * 2.0
    let { text, opacity } = data

    let {
        color,
        background,
        margin = [0, 0],
        fontSize,
        maxLength,
        content,
        textPos,
        style = 'normal',
        minVisibleSize,
        position
    } = text
    let bench = position == "top" ? 0 : -10
    if (style == 'none') style = 'normal'

    if (!textPos) {
        return
    }
    if(!textPos.type){
        textPos.type = "def"
    }
    // 字体的偏移量
    let labelOffsetX,
        labelOffsetY,
        fontFamily = 'Arial'
    fontSize = Math.ceil(fontSize * (scale / 2))

    if (fontSize <= minVisibleSize) return
    const transform = (basicData[graphId]?.transform || 223) * scale / 2
    labelOffsetX = 0
    labelOffsetY = fontSize / 3
    // 文字换行记录
    var lines = getLines(content, maxLength),
        baseX = labelOffsetX + margin[0] * transform,
        baseY = Math.round(labelOffsetY + margin[1] * transform)
    context.font = `${style} ${fontSize}px ${fontFamily}`
    // 计算换行之后的偏移量
    let len = lines.length > 1 ? lines.length / Math.min(fontSize, 16) : 0
    let width = context.measureText(lines[0]).width
    let buffer = fontSize / 8
    let height = lines.length > 1 ? lines.length - 1 : 0
    if(textPos.type !== "self" && textPos.position == "top")
        baseY -= len * (fontSize + 1) + bench
    baseX -= width / 2
    color = mixColor(graphId, color, opacity)

    // 记录当前canvas配置
    context.save()
    context.translate(textPos.x, textPos.y)
    context.rotate(textPos.ANGLE)

    try {
        // 兼容chrome57
        let execFontSize = (pattern.exec(context.font) as Array<any>)[0]
        if (`${fontSize}` !== execFontSize) {
            let execScale = Math.ceil(fontSize / execFontSize)
            let combinedRatio = Math.ceil((1 - execScale) / execScale)
            context.scale(execScale, execScale)
            context.translate(
                baseX * combinedRatio + (width / 2) * combinedRatio,
                baseY * combinedRatio,
            )
        }
    } catch {}
    let useBackGround = true
    if (RGBA_TEST_REGEX.test(background)) {
        let match: any = background.match(RGBA_EXTRACT_REGEX)
        if (!match[4] || match[4] == 0) {
            useBackGround = false
        }
    }

    let maxLabelLength = width;

    for (let i = 1; i < lines.length; i++) {
        maxLabelLength = Math.max(
            maxLabelLength,
            context.measureText(lines[i]).width
        )
    }

    // 绘制背景色
    if (useBackGround) {
        context.beginPath()
        context.fillStyle = mixColor(graphId, background, opacity)
        context.moveTo(baseX, baseY - fontSize) //左
        context.lineTo(baseX, baseY + 2 * buffer + height * (fontSize + 1)) //左
        context.lineTo(baseX + maxLabelLength, baseY + 2 * buffer + height * (fontSize + 1)) //右
        context.lineTo(baseX + maxLabelLength, baseY - fontSize) //右
        context.closePath()
        context.fill()
    }
    // 绘制文字
    context.fillStyle = color
    for (var i = 0; i < lines.length; ++i) {
        context.fillText(lines[i], baseX, baseY + i * (fontSize + 1))
    }
    // 还原canvas配置
    context.restore()
}
