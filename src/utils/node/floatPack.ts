import { floatColor } from '..'
import { globalProp } from '../../initial/globalProp'
import { PlainObject, position } from '../../types'

/**
 * 把部分属性只是传1个或者2个的 整合在一起
 * @param props 需要被整合的属性
 * @param atlas
 * @returns
 */
const wid = 128

const INT8 = new Int8Array(4)
const INT32 = new Int32Array(INT8.buffer, 0, 1)

export function packCircleVertex(props: any) {
    let {
        color,
        offsets,
        innerStroke,
        zoomResults,
        isSelect,
        iconNum,
        iconType,
        gradient,
        shapeType,
        badges,
        opacity,
        iconColor,
    } = props

    const atlas = globalProp.atlas
    let packedBuffer = []
    let uvBuffer = []
    let colorBuffer = []
    let typesBuffer = []
    let strokeColor: PlainObject<any> = {}

    colorBuffer.push(color)

    if (isSelect) {
        strokeColor = floatColor(innerStroke?.selectedColor || innerStroke || '#fff')
    } else {
        strokeColor = floatColor(innerStroke?.color || innerStroke || '#fff')
    }

    /**
     * width
     * scale
     * strokeColor
     * icon 颜色
     */
    let graType = 5
    if (gradient?.isGradient == true) {
        graType = Number(position[gradient.position])
    }

    let nums: number = 1
    let innerWidth = Number(innerStroke?.width) >= 0 ? innerStroke.width : 2
    packedBuffer = [(innerWidth * nums) / 100, zoomResults, strokeColor.rgb, iconColor]
    /**
     * 类型
     * shapeType
     * iconType
     * gradient
     */
    INT32[0] = (shapeType << 16) | (iconType << 8) | (graType & 0xfeffffff)
    typesBuffer.push(INT32[0])
    /**
     * offset 偏移量<x,y>
     */

    let offsetsBuffer = [offsets[0], offsets[1]]
    /**
     * uvScale 缩放
     * uvOffset 偏移量<x,y>
     * iconType icon类型
     */
    uvBuffer = [
        ((wid * iconNum) % (wid * atlas)) / (wid * atlas),
        1 - (wid + wid * Math.floor(iconNum / atlas)) / (wid * atlas),
        opacity,
    ]

    if (badges) {
        
        for (let i = 0; i < badges.length; i++) {
            let { stroke, color, iconNum, iconType, size, x, y, iconColor } = badges[i]

            packedBuffer.push((stroke.width * nums) / 100, size, stroke.color, iconColor)
    
            INT32[0] = (1 << 16) | (iconType << 8) | (5 & 0xfeffffff)
            typesBuffer.push(INT32[0])
    
            offsetsBuffer.push(x, y)
    
            colorBuffer.push(color)
    
            uvBuffer.push(
                ((wid * iconNum) % (wid * atlas)) / (wid * atlas),
                1 - (wid + wid * Math.floor(iconNum / atlas)) / (wid * atlas),
                opacity,
            )
        }
    }

    return {
        packedBuffer,
        offsetsBuffer,
        typesBuffer,
        uvBuffer,
        colorBuffer,
    }
}
