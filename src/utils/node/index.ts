import { coordTransformation, initIconOrImage, initText, reBindTexture } from '..'
import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { originInfo } from '../../initial/originInitial'
import { TEPLATE } from '../../initial/settings'
import { animateCamera } from '../cameraAnimate'
import { drawText } from '../tinySdf/sdfDrawText'
import { mouseAddClass, mouseRemoveClass } from '../mouse'
import { updateSDFTextData } from '../../utils'
import NodeList from '../../classes/nodeList'
import { AdjacencyOptions, AnimateOptions } from '../../types'
import clone from 'lodash/clone'
import defaultsDeep from 'lodash/defaultsDeep'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import merge from 'lodash/merge'
/**
 * 多点居中
 * @param that
 * @param ids
 * @param options
 * @returns
 */
export const nodeListLocate = (that: any, ids: string[], options?: AnimateOptions) => {
    return new Promise((resolve, reject) => {
        try {
            if (that.geo.enabled()) {
                return that.geo.locate(ids)
            }
            let GraphId = that.id;
            let coordx_max: number = -Infinity,
                coordx_min: number = Infinity,
                coordy_max: number = -Infinity,
                coordy_min: number = Infinity
            let camera = that.camera
            let nodeList = basicData[GraphId].nodeList
            let renderer = that.renderer
            let padding = renderer === 'webgl' ? 3 / 5 : 5
            for (let keys in ids) {
                let key = ids[keys]
                let value = nodeList.get(key)
                let x = value.getAttribute('x')
                let y = value.getAttribute('y')
                if (renderer == 'webgl') {
                    let offset = coordTransformation(GraphId, x, y)
                        ; (x = offset[0]), (y = offset[1])
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

            let zommratio = renderer === 'webgl' ? 12 : globalInfo[GraphId].canvasBox.width

            let zoom = (Math.atan2(maxratio, zommratio) * 360) / Math.PI

            // 计算zoom的大小
            camera.ratio = 6 * Math.tan((zoom * Math.PI) / 360)

            if (zoom > camera.maxZoom) zoom = camera.maxZoom
            if (zoom < camera.minZoom) zoom = camera.minZoom

            animateCamera(
                that,
                { zoom, position: nowPosition },
                { duration: options!.duration, easing: options!.easing },
                () => {
                    resolve((): void => { })
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
export const nodeLocate = (that: any, options?: AnimateOptions) => {
    return new Promise((resolve, reject) => {
        try {
            if (that.geo.enabled()) {
                return that.geo.locate(that.getId())
            }
            let x = that.getAttribute('x'),
                y = that.getAttribute('y')
            let offset = that.renderer === 'webgl' ? coordTransformation(that.id, x, y) : [-x, -y]
                ; (x = offset[0]), (y = offset[1])
            let nowPosition = [x, y, 3]
            let zoom = that.camera.defaultZoom
            animateCamera(
                that,
                { zoom, position: nowPosition },
                { duration: options!.duration, easing: options!.easing },
                () => {
                    resolve((): void => { })
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
    let direction = options?.direction || "both"
    let hasFilter = options?.hasFilter || false
    let relationTable = that.getEdgeType().relationTable
    let Nodes = relationTable[that.value.id] || new Set()
    let inTable: Set<any> = new Set()
    let outTable: Set<any> = new Set()
    try {
        Nodes?.forEach((item: any) => {
            //@ts-ignore
            let edge = basicData[that.id].edgeList.get(item)
            if (edge && (hasFilter || edge.getAttribute('isVisible'))) {
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
            }
        })
    } catch { }

    let list = new Set()
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
    let GraphId = that.id;
    let isSelect = that.getAttribute('isSelect')
    let success = 0
    let { selectedNodes, selectedTable } = basicData[GraphId]
    if (isSelect !== active) {
        let { id } = that.value
        if (active) {
            selectedNodes.add(id)
            selectedTable.add(id)
            mouseAddClass(GraphId, id)
            success = 1
            if (!nodeList) {
                let scene = that.__proto__
                let nodeList = new NodeList(scene, [id])
                that.events.emit('nodesSelected', nodeList)
            }
        } else {
            if (selectedNodes.has(id)) {
                selectedNodes.delete(id)
                selectedTable.delete(id)
                mouseRemoveClass(GraphId, id)
                success = 2
                if (!nodeList) {
                    let scene = that.__proto__
                    let nodeList = new NodeList(scene, [id])
                    that.events.emit('nodesUnselected', nodeList)
                }
            }
        }
        that.changeAttribute({ isSelect: active })
        selectedTable.add(that.getId())
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
 * @param options
 * @returns
 */
export const nodeGetAdjacentEdges = (that: any, options?: AdjacencyOptions) => {
    if (!options) options = { direction: 'both', policy: 'include-sources' }
    let direction = options?.direction || "both"
    let hasFilter = options?.hasFilter || false
    let nodeId = that.value.id
    let edges: Set<string> = new Set()
    let { inRelationTable, outRelationTable } = that.getNodeTable()
    let inTable = inRelationTable[nodeId] || new Set(), outTable = outRelationTable[nodeId] || new Set();
    let RelationTable = that.getRelationTable()[nodeId]

    if (direction == 'both') {
        edges = new Set([...inTable, ...outTable])
    } else if (direction == 'in') {
        edges = inTable
    } else {
        edges = outTable
    }
    let list: any[] = []
    let { nodeList } = basicData[that.id]

    if (nodeList.get(nodeId)?.getAttribute('isVisible'))
        try {
            RelationTable?.forEach((id: string) => {
                let edge = that.getEdge(id)
                let isHas = edges.has(id)
                if (
                    isHas &&
                    edge &&
                    (edge.getAttribute('isVisible') || hasFilter)
                ) {
                    let sourceVis = edge.getSource()?.getAttribute("isVisible")
                    let targetVis = edge.getTarget()?.getAttribute("isVisible")
                    if (sourceVis && targetVis)
                        list.push(id)
                }
            })
        } catch { }
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
        console.warn('error node' + error)
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
    const IColor = attribute?.color || attribute?.image?.color || 'rgba(255,255,255,0)'

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
                ...TEPLATE.imageTemplate,
                color: IColor,
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

    if (attribute?.pulse) {
        if (!useSet) {
            if (
                Object.keys(attribute.pulse).length == 1 &&
                attribute.pulse["range"]
            ) {
                attribute.pulse = {
                    ...that.value.attribute.pulse,
                    ...attribute.pulse,
                }
            } else {
                attribute.pulse = {
                    ...TEPLATE.pulseTemplate,
                    ...attribute.pulse,
                }
            }
        } else {
            attribute.pulse = {
                ...attributes.pulse,
                ...attribute.pulse,
            }
        }
    }
    if (that.renderer === 'webgl') initWebglAttribute(that, attribute)
    return attribute
}

const DefaultTEXT = {
    scale: 0.5,
    style: "normal",
    font: "Arial"
}

export const graphTextureMap: { [key: string]: Set<string> } = {}

const initBadges = (that: any, badges: { text: any; image: any }) => {
    let { text, image } = badges
    let iconType = image ? 1 : text?.content != '' ? 2 : 3

    if (image) {
        let { url, scale: iScale } = image

        if (iconType == 1 && !globalProp.iconMap.has(url) && url != "") {
            let initImage: any = {
                type: 'image',
                num: globalProp.iconMap.size,
                scale: iScale,
            }

            initIconOrImage(that, {
                key: url,
                ...initImage,
            })

            globalProp.iconMap.set(url, {
                ...initImage,
                key: url,
            })

            graphTextureMap[that.id].add(url)

            initImage = null
        } else if (
            iconType == 1 &&
            globalProp.iconMap.has(url) &&
            !graphTextureMap[that.id].has(url)
        ) {
            graphTextureMap[that.id].add(url)
            reBindTexture(that)
        }
    }

    let rt = {
        ...DefaultTEXT,
        ...text
    }

    let { content, scale, style, font } = rt

    if (iconType == 2 && !globalProp.iconMap.has(content + scale)) {
        let initIcon: any = {
            type: 'icon',
            style,
            scale,
            num: globalProp.iconMap.size,
            font,
        }

        initIconOrImage(that, {
            key: content,
            ...initIcon,
        })

        globalProp.iconMap.set(content + scale, {
            ...initIcon,
            key: text.content
        })

        graphTextureMap[that.id].add(content + scale)

        initIcon = null
    } else if (
        iconType == 2 &&
        globalProp.iconMap.has(content + scale) &&
        !graphTextureMap[that.id].has(content + scale)
    ) {
        graphTextureMap[that.id].add(content + scale)
        reBindTexture(that)
    }
}

/**
 * webgl的数据加载处理
 * @param attribute
 */
export function initWebglAttribute(that: any, attribute: any) {
    let thumbnail = that instanceof String || that == null ? that : that.thumbnail

    !graphTextureMap[that.id] && (graphTextureMap[that.id] = new Set())

    !globalProp.iconMap && (globalProp.iconMap = new Map([
        [
            '',
            {
                num: 0,
                style: 'normal',
                scale: 0.5,
            },
        ],
    ]))

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

            globalProp.iconMap.set(attribute.icon.content, { ...initIcon, key: attribute.icon.content })

            graphTextureMap[that.id].add(attribute.icon.content)

            initIcon = null
        } else if (
            attribute.icon && attribute.icon.content != "" &&
            globalProp.iconMap.has(attribute.icon.content) &&
            !graphTextureMap[that.id].has(attribute.icon.content)
        ) {
            graphTextureMap[that.id].add(attribute.icon.content)
            reBindTexture(that)
        }
        // 处理图片
        let color = attribute?.color || attribute?.image?.color || 'rgba(255,255,255,0)'
        if (!globalProp.iconMap.has(attribute.image?.url + color) && attribute.image?.url) {
            let initImage: any = {
                type: 'image',
                num: globalProp.iconMap.size,
                scale: attribute?.image.scale,
                color
            }
            initIconOrImage(that, {
                key: attribute.image.url,
                ...initImage,
            })

            globalProp.iconMap.set(attribute.image.url + color, {
                ...initImage,
                key: attribute.image.url,
            })

            graphTextureMap[that.id].add(attribute.image.url + color)

            initImage = null
        } else if (
            attribute.image && attribute.image.url != "" &&
            globalProp.iconMap.has(attribute.image.url + color) &&
            !graphTextureMap[that.id].has(attribute.image.url + color)
        ) {
            graphTextureMap[that.id].add(attribute.image.url + color)
            reBindTexture(that)
        }
        // 处理badge
        if (attribute?.badges) {
            let badges = attribute.badges;
            if (Object.keys(badges).length == 0) {
                attribute.badges = null;
            } else {
                if (badges?.bottomRight) {
                    initBadges(that, badges.bottomRight)
                }
                if (badges?.bottomLeft) {
                    initBadges(that, badges.bottomLeft)
                }
                if (badges?.topLeft) {
                    initBadges(that, badges.topLeft)
                }
                if (badges?.topRight) {
                    initBadges(that, badges.topRight)
                }
            }
        }
        //处理文字
        if (attribute?.text && !thumbnail) {
            let flag = updateSDFTextData(attribute.text, that.id)
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
export const nodeSetAttributes = (that: any, attribute: any, isNodeList?: boolean) => {
    return new Promise((resolve, reject) => {
        let flag = that.changeAttribute(attribute, true)
        if (flag) {
            !isNodeList && that.render()
            resolve(that)
        } else {
            reject(that)
        }
    })
}
