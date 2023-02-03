import { basicData } from '../initial/globalProp'
import { edgeAttributes } from '../types'
import { hashNumber } from '../utils'
import {
    edgeChangeAttribute,
    edgeGetMiddlePoint,
    edgeInitAttribute,
    edgeSetSelected,
} from '../utils/edge'
import {
    addClass,
    getAttribute,
    getClassList,
    getData,
    getId,
    hasClass,
    removeClass,
    resetAttributes,
    setAttribute,
    setData,
} from '../utils/edgeAndNode'
import EdgeList from './edgeList'

/**
 * @class Edge 边类型
 * @constructor
 * @param {value<edgeAttributes>} 初始化
 */
export default class Edge {
    private value: edgeAttributes
    constructor(value: any) {
        this.value = value
    }

    /**
     * 是否为点
     * @returns false
     */
    public isNode = () => {
        return false
    }

    /**
     * 删除某个边的指定class
     * @param className  删除边的名称
     * @param type 1是class 2是rule
     * @param isReFresh  是否需要刷新
     * @returns
     */
    public removeClass = (className: string, type = 1, isReFresh: boolean = true) => {
        return removeClass(this, className, type, false, isReFresh)
    }

    /**
     * 将指定的类添加到边
     * @param className 添加类的名称
     * @param type 1是class 2是rule
     * @param update 是否需要刷新
     * @returns {Promise}
     */
    public addClass = (className: string, type: number = 1, update: boolean = true) => {
        return addClass(this, className, type, false, update)
    }

    /**
     * 返回这个边的class
     * @returns {Array}
     */
    public getClassList = () => {
        return getClassList(this)
    }

    /**
     * 重置attribute的属性 当attributeName为空的时候整个重置
     * 有值的时候重置值的那一部分。
     * @param attributeNames 重置的属性
     * @returns {Promise}
     */
    public resetAttributes = (attributeNames?: string[], update: boolean = true) => {
        return resetAttributes(this, false, update, attributeNames)
    }

    /**
     * 设置选中
     * @param active 是否选中
     * @param update 是否更新
     * @param edgeList 是否为边集合
     */
    public setSelected = (
        active: boolean = true,
        update: boolean = true,
        edgeList: boolean = false,
    ) => {
        return edgeSetSelected(this, active, update, edgeList)
    }

    /**
     * 检索节点的指定数据属性。
     * 该方法返回内部数据对象;修改它可能会导致意外的行为。
     * @param param data的路径
     * @returns {any}
     */
    public getData = (param: string | Array<string>) => {
        return getData(this, param)
    }

    /**
     * 设置节点的指定数据属性。如果没有指定属性，则更新整个数据对象。
     * @param param 指定数据 string | Array<string>
     * @param value 要改变的值
     * @returns {data}
     */
    public setData = (param: string | Array<string>, value: any, isRender: boolean = true) => {
        return setData(this, false, param, value, isRender)
    }

    /**
     * 返回当前边的id
     * @returns {string}
     */
    public getId = () => {
        return getId(this)
    }

    /**
     * 获取所有属性 或者 根据属性名获取某个属性
     * 使用loadsh里的方法原先的不能获取到层级较深的属性
     * @param  {...any} attribute
     * @returns {attribute}
     */
    public getAttribute = (attribute?: any) => {
        return getAttribute(this, attribute)
    }

    /**
     * 这个只是改变数据不会主动刷新视图
     * @param attribute 改变的属性
     * @param useSet 是否来自setAttribute
     * @returns
     */
    public changeAttribute = (attribute: any, useSet: boolean = false) => {
        return edgeChangeAttribute(this, attribute, useSet)
    }
    /**
     * 初始化属性
     * @param attribute 初始化的属性
     * @param useSet 是否来自setAttribute
     * @returns
     */
    private initAttribute = (attribute: any, useSet: boolean = false) => {
        return edgeInitAttribute(this, attribute, useSet)
    }

    /**
     * 设置属性
     * @param {*} attribute 需要设置属性
     * @returns {Promise}
     */
    public setAttributes = (attribute: any, isEdgeList?: boolean) => {
        return setAttribute(this, attribute, isEdgeList)
    }

    /**
     * 返回这条边的source节点
     * @returns
     */
    public getSource = () => {
        let source = this.value.source
        // @ts-ignore
        return basicData[this.id].nodeList.get(source) || source
    }
    /**
     * 返回这条边上的Target节点
     * @returns
     */
    public getTarget = () => {
        let target = this.value.target
        // @ts-ignore
        return basicData[this.id].nodeList.get(target)
    }
    /**
     * 获取中心点坐标
     * @param withOutInit 是否需要初始化
     * @param InitAttribute 初始化的属性
     * @returns { x: number, y:number }
     */
    public getMiddlePoint = (withOutInit = false, InitAttribute?: any) => {
        return edgeGetMiddlePoint(this, withOutInit, InitAttribute)
    }
    /**
     * 是否有这个class
     * @param className
     * @returns
     */
    public hasClass = (className: string) => {
        return hasClass(this, className)
    }

    public getParallelEdges = async () => {
        // @ts-ignore
        const { typeHash, baseTypeHash } = await this.getEdgeType()
        let source = this.getSource()
        let target = this.getTarget()
        let sourceNumber = source.value.num;
        let targetNumber = target.value.num;
        let hash = hashNumber(sourceNumber, targetNumber);
        // @ts-ignore
        if(this.getAttribute('type') == "basic") return new EdgeList(this.__proto__, [...baseTypeHash.get(hash).total])
        // @ts-ignore
        else return new EdgeList(this.__proto__, [...typeHash.get(hash).total])
    }
}
