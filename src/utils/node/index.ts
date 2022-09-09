import { coordTransformation, initIconOrImage, initText } from '..'
import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { originInfo } from '../../initial/originInitial'
import { TEPLATE } from '../../initial/settings'
import { animateCamera } from '../cameraAnimate'
import { drawText } from '../tinySdf/sdfDrawText'
import { mouseAddClass, mouseRemoveClass } from '../mouse'
import { updateSDFTextData } from '../../utils'
import NodeList from '../../classes/nodeList'
import { AdjacencyOptions } from '../../types'
import { cloneDeep, clone, defaultsDeep, get, merge } from 'lodash'

/**
 * 多点居中
 * @param that
 * @param ids
 * @param options
 * @returns
 */
export const nodeListLocate = (that: any, ids: any, options?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            if (that.geo.enabled()) {
                return that.geo.locate(ids)
            }
            let coordx_max: number = -Infinity,
                coordx_min: number = Infinity,
                coordy_max: number = -Infinity,
                coordy_min: number = Infinity
            let camera = that.camera
            let nodeList = basicData[that.id].nodeList
            let renderer = that.renderer
            let padding = renderer === 'webgl' ? 3 / 5 : 5
            for (let keys in ids) {
                let key = ids[keys]
                let value = nodeList.get(key)
                let x = value.getAttribute('x')
                let y = value.getAttribute('y')
                if (renderer == 'webgl') {
                    let offset = coordTransformation(that.id, x, y)
                    ;(x = offset[0]), (y = offset[1])
                }
                // 计算最大最小边界
                coordx_max = Math.max(coordx_max, x)
                coordy_max = Math.max(coordy_max, y)
                coordx_min = Math.min(coordx_min, x)
                coordy_min = Math.min(coordy_min, y)
            }

            // 相机偏移量
            let coordMid_x = (coordx_max + coordx_min) / 2
            let coordMid_y = (coordy_max + coordy_min) / 2
            let nowPosition = [-coordMid_x, -coordMid_y, 3]
            if (renderer == 'webgl') {
                nowPosition = [coordMid_x, coordMid_y, 3]
            }

            let maxratio = Math.max(
                (coordy_max - coordy_min + 2 * padding) * 2,
                coordx_max - coordx_min + 2 * padding,
            )

            let zommratio = renderer === 'webgl' ? 12 : globalInfo[that.id].canvasBox.width

            let zoom = (Math.atan2(maxratio, zommratio) * 360) / Math.PI

            // 计算zoom的大小
            camera.ratio = 6 * Math.tan((zoom * Math.PI) / 360)

            if (zoom > camera.maxZoom) zoom = camera.maxZoom
            if (zoom < camera.minZoom) zoom = camera.minZoom

            animateCamera(
                that,
                { zoom, position: nowPosition },
                { duration: options.duration, easing: options.easing },
                () => {
                    resolve((): void => {})
                },
            )
        } catch (err) {
            reject(err)
        }
    })
}
/**
 * 点居中
 * @param that
 * @param options
 * @returns
 */
export const nodeLocate = (that: any, options?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            if (that.geo.enabled()) {
                return that.geo.locate(that.getId())
            }
            let camera = that.camera
            let x = that.getAttribute('x'),
                y = that.getAttribute('y')
            let offset = that.renderer === 'webgl' ? coordTransformation(that.id, x, y) : [-x, -y]
            ;(x = offset[0]), (y = offset[1])
            let nowPosition = [x, y, 3]
            let zoom = globalProp.defaultZoom
            animateCamera(
                that,
                { zoom, position: nowPosition },
                { duration: options.duration, easing: options.easing },
                () => {
                    resolve((): void => {})
                },
            )
        } catch (err) {
            reject(err)
        }
    })
}
/**
 * 获取1度点
 * @param that
 * @param options
 * @returns
 */
export const nodeGetAdjacent = (that: any, options?: AdjacencyOptions) => {
    if (!options) options = { direction: 'both', policy: 'include-sources' }
    let { direction } = options
    let relationTable = that.getEdgeType().relationTable
    let Nodes = relationTable[that.value.id] || new Set()
    let inTable: Set<any> = new Set()
    let outTable: Set<any> = new Set()
    try {
        if(!direction) direction = "both"
        Nodes?.forEach((item: any) => {
            //@ts-ignore
            let edge = basicData[that.id].edgeList.get(item)
            let edgeValue = edge.value
            let source = edgeValue.source
            let target = edgeValue.target
            // 无向边
            let flag = false
            if (!get(edgeValue.attribute, 'shape.head')) {
                flag = true
            }
            if (that.value.id == source) {
                outTable.add(target)
                if (flag) {
                    inTable.add(target)
                }
            }
            if (that.value.id == target) {
                inTable.add(source)
                if (flag) {
                    outTable.add(source)
                }
            }
        })
    } catch {}

    let list: any = new Set()
    if (direction == 'both') {
        list = new Set([...inTable, ...outTable])
    } else if (direction == 'in') {
        list = inTable
    } else {
        list = outTable
    }
    // 当获取模式需要删除当前选中的点时
    if (options.policy !== 'exclude-sources') {
        list.add(that.value.id)
    }
    return [...list]
}

/**
 * 点设置选中
 * @param that
 * @param active
 * @param update
 */
export const nodeSetSelected = (
    that: any,
    active: boolean,
    update: boolean,
    nodeList: boolean = false,
) => {
    let isSelect = that.getAttribute('isSelect')
    let success = 0
    if (isSelect !== active) {
        let { id } = that.value
        if (active) {
            basicData[that.id].selectedNodes.add(id)
            basicData[that.id].selectedTable.add(id)
            mouseAddClass(that.id, id)
            success = 1
            if (!nodeList) {
                let scene = that.__proto__
                let nodeList = new NodeList(scene, [id])
                that.events.emit('nodesSelected', nodeList)
            }
        } else {
            if (basicData[that.id].selectedNodes.has(id)) {
                basicData[that.id].selectedNodes.delete(id)
                basicData[that.id].selectedTable.delete(id)
                mouseRemoveClass(that.id, id)
                success = 2
                if (!nodeList) {
                    let scene = that.__proto__
                    let nodeList = new NodeList(scene, [id])
                    that.events.emit('nodesUnselected', nodeList)
                }
            }
        }
        that.changeAttribute({ isSelect: active })
        basicData[that.id].selectedTable.add(that.getId())
        if (update) {
            that.selectMovefresh()
        }
    }
    return success
}
/**
 * 获取点坐标
 * @param that
 * @returns
 */
export const nodeGetPosition = (that: any) => {
    return {
        x: that.value.attribute.x || 0,
        y: that.value.attribute.y || 0,
    }
}

/**
 * 获取点连边
 * @param that
 * @param hasFilter  是否包含过滤边
 * @returns
 */
export const nodeGetAdjacentEdges = (that: any, hasFilter?: boolean) => {
    let nodeId = that.value.id
    let edges = get(that.getRelationTable(), nodeId) || new Set()
    let list: any[] = []
    let { nodeList, edgeList } = basicData[that.id]
    that.getRelationTable()

    if (nodeList.get(nodeId)?.getAttribute('isVisible'))
        try {
            edges?.forEach((id: string) => {
                let edge = edgeList.get(id)
                if (
                    edge &&
                    edge.getAttribute('isVisible') ||
                    (hasFilter && edge.getAttribute('isFilter'))
                ) {
                    list.push(id)
                }
            })
        } catch {}
    return list
}

/**
 * 改变点属性不触发render
 * @param that
 * @param attribute
 * @param useSet
 * @returns
 */
export const nodeChangeAttribute = (that: any, attribute: any, useSet: boolean = false) => {
    try {
        attribute = defaultsDeep(that.initAttribute(attribute, useSet))
        let attributes = cloneDeep(that.value.attribute)
        that.value.attribute = merge(attributes, attribute)
        let originNode = cloneDeep(originInfo[that.id].nodeList.get(that.value.id))
        originNode = merge(originNode, attribute)
        originInfo[that.id].nodeList.set(that.value.id, originNode)
        return true
    } catch (error) {
        console.log('error node' + error)
        return false
    }
}
/**
 * 格式化点属性
 * @param that
 * @param attribute
 * @param useSet
 * @returns
 */
export const nodeInitAttribute = (that: any, attribute: any, useSet: boolean = false) => {
    let attributes
    if (useSet) attributes = clone(that.value.attribute)
    // 文字可能有text：xxx的情况
    if (attribute?.text) {
        if (typeof attribute.text == 'string') {
            attribute.text = {
                content: attribute.text,
            }
        }
        if (!useSet) {
            attribute.text = {
                ...TEPLATE.textTemplate,
                ...attribute.text,
            }
        } else {
            attribute.text = {
                ...attributes.text,
                ...attribute.text,
            }
        }
    }
    // icon可能有icon：xxx的情况
    if (attribute?.icon) {
        if (typeof attribute.icon == 'string') {
            attribute.icon = {
                content: attribute.icon,
            }
        }
        if (!useSet) {
            attribute.icon = {
                ...TEPLATE.iconTemplate,
                ...attribute.icon,
            }
        } else {
            attribute.icon = {
                ...attributes.icon,
                ...attribute.icon,
            }
        }
    }

    if (attribute?.image) {
        if (typeof attribute.image == 'string') {
            attribute.image = {
                url: attribute.image,
            }
        }
        if (!useSet) {
            attribute.image = {
                ...TEPLATE.iconTemplate,
                ...attribute.image,
            }
        } else {
            attribute.image = {
                ...attributes.image,
                ...attribute.image,
            }
        }
    }

    if (attribute?.innerStroke) {
        if (typeof attribute.innerStroke == 'string') {
            attribute.innerStroke = {
                color: attribute.innerStroke,
            }
        }
        if (!useSet) {
            attribute.innerStroke = {
                ...TEPLATE.innerTemplate,
                ...attribute.innerStroke,
            }
        } else {
            attribute.innerStroke = {
                ...attributes.innerStroke,
                ...attribute.innerStroke,
            }
        }
    }

    if (that.renderer === 'webgl') initWebglAttribute(that, attribute)
    return attribute
}
/**
 * webgl的数据加载处理
 * @param attribute
 */
export function initWebglAttribute(that: any, attribute: any) {
    let thumbnail = that instanceof String || that == null ? that : that.thumbnail
    if (attribute) {
        // 处理icon
        if (!globalProp.iconMap.has(attribute.icon?.content) && attribute.icon?.content) {
            let initIcon: any = {
                type: 'icon',
                style: attribute.icon.style,
                scale: attribute.icon.scale,
                num: globalProp.iconMap.size,
                font: attribute.icon.font,
            }
            initIconOrImage(that, {
                key: attribute.icon.content,
                ...initIcon,
            })

            globalProp.iconMap.set(attribute.icon.content, { ...initIcon })

            initIcon = null
        }
        // 处理图片
        if (!globalProp.iconMap.has(attribute.image?.url) && attribute.image?.url) {
            let initImage: any = {
                type: 'image',
                num: globalProp.iconMap.size,
            }
            initIconOrImage(that, {
                key: attribute.image.url,
                ...initImage,
            })

            globalProp.iconMap.set(attribute.image.url, {
                ...initImage,
            })

            initImage = null
        }
        // 处理badge
        if (attribute?.badges) {
            let { text, image } = attribute.badges
            let iconType = image ? 1 : text?.content != '' ? 2 : 3

            if (iconType == 1 && !globalProp.iconMap.has(image)) {
                let initImage: any = {
                    type: 'image',
                    num: globalProp.iconMap.size,
                }

                initIconOrImage(that, {
                    key: image,
                    ...initImage,
                })

                globalProp.iconMap.set(image, {
                    ...initImage,
                })
                initImage = null
            }

            if (iconType == 2 && !globalProp.iconMap.has(text?.content)) {
                let initIcon: any = {
                    type: 'icon',
                    style: text?.style || 'normal',
                    scale: text?.scale || 0.5,
                    num: globalProp.iconMap.size,
                    font: text?.font || 'iconfont',
                }

                initIconOrImage(that, {
                    key: text?.content,
                    ...initIcon,
                })

                globalProp.iconMap.set(text?.content, {
                    ...initIcon,
                })

                initIcon = null
            }
        }
        //处理文字
        if (attribute?.text && !thumbnail) {
            let flag = updateSDFTextData(attribute.text)
            if (flag) initText(that)
            drawText(
                attribute.text.fontSize,
                attribute.text.content,
                attribute.text.maxLength,
                attribute.text.style,
            )
        }
    }
}
/**
 * 设置点属性
 * @param that
 * @param attribute
 * @returns
 */
export const nodeSetAttributes = (that: any, attribute: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        let flag = that.changeAttribute(attribute, true)
        if (flag) {
            that.render()
            resolve(that)
        } else {
            reject(that)
        }
    })
}
