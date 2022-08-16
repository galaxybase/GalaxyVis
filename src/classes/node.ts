import { ANIMATE_DEFAULTS } from '../initial/globalProp'
import { AdjacencyOptions, AnimateOptions } from '../types'
import {
    addClass,
    getAttribute,
    getClassList,
    getData,
    getId,
    hasClass,
    removeClass,
    resetAttributes,
    setData,
} from '../utils/edgeAndNode'
import {
    nodeChangeAttribute,
    nodeGetAdjacent,
    nodeGetAdjacentEdges,
    nodeGetPosition,
    nodeInitAttribute,
    nodeLocate,
    nodeSetAttributes,
    nodeSetSelected,
} from '../utils/node'

/**
 * @class Node 点类型
 * @constructor
 * @param {value<any>} 初始化
 */
export default class Node {
    private value: any
    constructor(value: any) {
        this.value = value
    }

    /**
     * 点居中
     * @param options
     * @returns
     */
    public locate = (options?: AnimateOptions) => {
        options = Object.assign({}, ANIMATE_DEFAULTS, options)
        return nodeLocate(this, options)
    }

    /**
     * 是否为点
     * @returns
     */
    public isNode = () => {
        return true
    }

    /**
     * 删除某个边的指定class
     * @param className 删除边的名称
     * @param type 1是class 2是rule
     * @param isReFresh 是否需要刷新
     * @returns
     */
    public removeClass = (className: string, type = 1, isReFresh: boolean = true) => {
        return removeClass(this, className, type, true, isReFresh)
    }

    /**
     * 将指定的类添加到边
     * @param className 添加类的名称
     * @param type 1是class 2是rule
     * @param update 是否需要刷新
     * @returns
     */
    public addClass = (className: string, type: number = 1, update: boolean = true) => {
        return addClass(this, className, type, true, update)
    }

    /**
     * 返回这个点的class
     * @returns
     */
    public getClassList = () => {
        return getClassList(this)
    }

    /**
     * 返回点一度关联点
     * @param options
     * @returns
     */
    public getAdjacentNodes = (options?: AdjacencyOptions) => {
        return nodeGetAdjacent(this, options)
    }

    /**
     * 重置attribute的属性 当attributeName为空的时候整个重置
     * 有值的时候重置值的那一部分。
     * @param attributeNames
     * @returns
     */
    public resetAttributes = (attributeNames?: any[], update: boolean = true) => {
        return resetAttributes(this, true, update, attributeNames)
    }

    /**
     * 设置选中
     * @param active
     * @param update
     * @param nodeList
     */
    public setSelected = (
        active: boolean = true,
        update: boolean = true,
        nodeList: boolean = false,
    ) => {
        return nodeSetSelected(this, active, update, nodeList)
    }

    /**
     * 检索节点的位置。它严格地等价于node.getAttributes ([' x ', ' y '])。
     */
    public getPosition = () => {
        return nodeGetPosition(this)
    }

    /**
     * 检索节点的指定数据属性。
     * 该方法返回内部数据对象;修改它可能会导致意外的行为。
     * @param param 指定数据 string | Array<string>
     * @returns
     */
    public getData = (param: string | Array<string>) => {
        return getData(this, param)
    }
    /**
     * 设置节点的指定数据属性。如果没有指定属性，则更新整个数据对象。
     * @param param 指定数据 string | Array<string>
     * @param value 要改变的值
     * @returns
     */
    public setData = (param: string | Array<string>, value: any, isRender: boolean = true) => {
        return setData(this, true, param, value, isRender)
    }

    /**
     * 返回节点的相邻边列表。
     * @param  hasFilter 是否含有过滤边
     * @returns
     */
    public getAdjacentEdges = (hasFilter?: boolean) => {
        return nodeGetAdjacentEdges(this, hasFilter)
    }

    /**
     * 返回当前点的id
     * @returns
     */
    public getId = () => {
        return getId(this)
    }

    /**
     * 获取所有属性 或者 根据属性名获取某个属性
     * 使用loadsh里的方法原先的不能获取到层级较深的属性
     * @param  {...any} attribute
     * @returns
     */
    public getAttribute = (attribute?: any) => {
        return getAttribute(this, attribute)
    }

    /**
     * 这个只是改变数据不会主动刷新视图
     * @param attribute
     */
    public changeAttribute = (attribute: any, useSet: boolean = false) => {
        return nodeChangeAttribute(this, attribute, useSet)
    }
    /**
     * 属性格式化
     * @param attribute
     * @param useSet
     * @returns
     */
    private initAttribute = (attribute: any, useSet: boolean = false) => {
        return nodeInitAttribute(this, attribute, useSet)
    }

    /**
     * 设置属性
     * @param {*} attribute
     */
    public setAttributes = (attribute: any) => {
        return nodeSetAttributes(this, attribute)
    }
    /**
     * 是否有这个class
     * @param className
     * @returns
     */
    public hasClass = (className: string) => {
        return hasClass(this, className)
    }
}
