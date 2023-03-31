import { originInfo } from '../../initial/originInitial'
import { PlainObject } from '../../types'
import { globalInfo } from '../../initial/globalProp'
import { initText, updateSDFTextData } from '..'
import { drawText } from '../tinySdf/sdfDrawText'
import { initWebglAttribute } from '../node'
import { DEFAULT_SETTINGS } from '../../initial/settings'
import { defaultsDeep, has, get, merge, cloneDeep, unionBy, throttle, set } from 'lodash'

// 节流函数
const throttled = throttle((that) => {
    that.render()
}, 100)

/**
 * 移除Class
 * @param that
 * @param className class名字
 * @param type  class/rule的类型
 * @param nodeOrEdge 边或者点
 * @param isReFresh 是否调用render
 * @returns
 */
export const removeClass = (
    that: any,
    className: string,
    type: number,
    nodeOrEdge: boolean,
    isReFresh: boolean = true,
) => {
    return new Promise((resolve, reject) => {
        try {
            //@ts-ignore
            let classList = that.styles.getClassList()
            var flag = has(classList, className)
            let selfClasses = that.value.classList
            if (flag && selfClasses) {
                let index = -1
                for (let i = 0, len = selfClasses!.length; i < len; i++) {
                    if (selfClasses[i].className == className && selfClasses[i].type == type) {
                        index = i
                        break
                    }
                }
                if (index >= 0) {
                    // 删除class
                    selfClasses.splice(index, 1)
                    that.value.classList = selfClasses
                    // 将属性重新赋值加载class
                    classAttributes(that, selfClasses, classList, nodeOrEdge)
                }
                if (isReFresh) throttled(that)
                resolve(that)
            }
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * 添加Class
 * @param that
 * @param className class名字
 * @param type  class/rule的类型
 * @param nodeOrEdge 边或者点
 * @param isReFresh 是否调用render
 * @returns
 */
export const addClass = (
    that: any,
    className: string,
    type: number = 1,
    nodeOrEdge: boolean,
    update: boolean = true,
) => {
    return new Promise((resolve, reject) => {
        //@ts-ignore
        let classList = that.styles.getClassList()
        let acquiredClass = get(classList, className)
        let selfClasses = that.value.classList
        let GraphId = that.id;
        if (!acquiredClass) {
            reject(`class ${className} does not exist`)
        } else {
            that.value.classList = unionBy(selfClasses, [{ className, type }], 'className')
            selfClasses = that.value.classList
            // 让hover 和 select的class放在最顶层
            if (selfClasses.length > 1) {
                let selectedStyle =
                    nodeOrEdge == false
                        ? globalInfo[GraphId].edgeSelectStyle
                        : globalInfo[GraphId].nodeSelectStyle
                let hoverStyle =
                    nodeOrEdge == false
                        ? globalInfo[GraphId].edgeHoverStyle
                        : globalInfo[GraphId].nodeHoverStyle
                if (selectedStyle && Object.keys(selectedStyle).length) {
                    let index = selfClasses.find((x: any) => x.className == selectedStyle.rule)
                    if (
                        index &&
                        Object.keys(index).length &&
                        selfClasses[selfClasses.length - 1]?.className != index.className
                    ) {
                        selfClasses.splice(selfClasses.indexOf(index), 1)
                        selfClasses.push(index)
                    }
                }
                if (hoverStyle && Object.keys(hoverStyle).length) {
                    let index = selfClasses.find((x: any) => x.className == hoverStyle.rule)
                    if (
                        index &&
                        Object.keys(index).length &&
                        selfClasses[selfClasses.length - 1]?.className != index.className
                    ) {
                        selfClasses.splice(selfClasses.indexOf(index), 1)
                        selfClasses.push(index)
                    }
                }
            }
            // 根据新的classlist更新属性
            classAttributes(that, selfClasses, classList, nodeOrEdge)
            let attribute = that.value.attribute

            if (nodeOrEdge && that.renderer === 'webgl') {
                initWebglAttribute(that, attribute)
            } else if (that.renderer === 'webgl' && !that.thumbnail) {
                let flag = updateSDFTextData(attribute?.text, GraphId)
                if (flag) initText(that)
                drawText(
                    attribute?.text.fontSize,
                    attribute?.text.content,
                    attribute?.text.maxLength,
                    attribute?.text.style,
                )
            }
            if (update) throttled(that)
            resolve(that)
        }
    })
}

/**
 * 获取class列表
 * @param that
 * @returns
 */
export const getClassList = (that: any) => {
    let classList: any = []
    that.value.classList.map((item: any) => {
        if (item.type == 1) {
            classList[classList.length] = item.className
        }
    })
    return classList
}

/**
 * 重置属性
 * @param that
 * @param nodeOrEdge 边或者点
 * @param attributeNames 重置属性
 */
export const resetAttributes = (
    that: any,
    nodeOrEdge: boolean,
    update?: boolean,
    attributeNames?: any[],
) => {
    return new Promise((resolve, reject) => {
        try {
            const DEFAULT_ATTRIBUTES = nodeOrEdge
                ? DEFAULT_SETTINGS.nodeAttribute
                : DEFAULT_SETTINGS.edgeAttribute

            if (!attributeNames || attributeNames.length == 0) {
                that.value.attribute = DEFAULT_ATTRIBUTES
            } else {
                attributeNames.forEach((item: string) => {
                    that.value.attribute[item] = DEFAULT_ATTRIBUTES[item]
                })
            }
            let attributes = cloneDeep(that.value.attribute)
            if (nodeOrEdge) {
                originInfo[that.id].nodeList.set(that.value.id, attributes)
            } else {
                originInfo[that.id].edgeList.set(that.value.id, attributes)
            }
            if (update) that.render()
            resolve(that)
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * 获取data数据
 * @param that
 * @param param 要获取那些数据
 * @returns
 */
export const getData = (that: any, param: string | Array<string>) => {
    if (param) return get(that.value.data, param, undefined)
    else return that.value.data
}

/**
 * 设置data数据
 * @param that
 * @param nodeOrEdge
 * @param param
 * @param value
 * @returns
 */
export const setData = (
    that: any,
    nodeOrEdge: boolean,
    param: string | Array<string>,
    value: any,
    isRender: boolean = true
) => {
    let object = that.value.data || {}
    let data = set(object, param, value)
    that.value.data = data
    let classList = that.value.classList
    for (let i in classList) {
        addClass(that, classList[i].className, classList[i].type, nodeOrEdge, isRender)
    }
    return data
}

/**
 * 返回id
 * @param that
 * @returns
 */
export const getId = (that: any) => {
    return that.value.id
}

/**
 * 获取属性
 * @param that
 * @param attribute
 * @returns
 */
export const getAttribute = (that: any, attribute?: any) => {
    let result: any = that.value.attribute
    if (attribute) {
        return get(that.value.attribute, attribute)
    }
    return result
}

/**
 * 设置属性
 * @param that
 * @param attribute
 * @returns
 */
export const setAttribute = (that: any, attribute: any, isEdgeList?:boolean) => {
    return new Promise((resolve, reject) => {
        let flag = that.changeAttribute(attribute, true)
        if (flag) {
            !isEdgeList && that.render()
            resolve(that)
        } else {
            reject(that)
        }
    })
}

export const hasClass = (that: any, className: any) => {
    let classList: any = that.value.classList
    return has(classList, className)
}

function classAttributes(that: any, selfClasses: any, classList: any, nodeOrEdge: boolean) {
    that.value.attribute = nodeOrEdge
        ? originInfo[that.id].nodeList.get(that.value.id)
        : originInfo[that.id].edgeList.get(that.value.id)

    let attributeDeep = cloneDeep(that.value.attribute)
    for (let i = 0, len = selfClasses.length; i < len; i++) {
        var acquiredClass = get(classList, selfClasses[i].className)
        let Attributes =
            nodeOrEdge == false
                ? defaultsDeep(acquiredClass.edgeAttributes)
                : defaultsDeep(acquiredClass.nodeAttributes)
        let newAttribute: PlainObject<any> = {}
        if (typeof Attributes == 'function') {
            let newAttributes = Attributes(that)
            Attributes = {}
            for (let i in newAttributes) {
                if (typeof newAttributes[i] == 'function') {
                    Attributes[i] = newAttributes[i](that)
                    newAttribute[i] = newAttributes[i]
                } else {
                    Attributes[i] = newAttributes[i]
                    newAttribute[i] = newAttributes[i]
                }
            }
        } else {
            for (let i in Attributes) {
                if (typeof Attributes[i] == 'function') {
                    Attributes[i] = Attributes[i]
                    newAttribute[i] = Attributes[i](that)
                } else {
                    Attributes[i] = Attributes[i]
                    newAttribute[i] = Attributes[i]
                }
            }
        }
        attributeDeep = merge(attributeDeep, newAttribute)
        that.value.attribute = attributeDeep
    }
    attributeDeep = null
}
