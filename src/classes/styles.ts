import { PlainObject, ClassOptions, RuleOptions } from '../types'
import {
    stylesAddRule,
    stylesCreateClass,
    stylesGetClass,
    stylesGetClassList,
    stylesSetHoveredEdgeAttributes,
    stylesSetHoveredNodeAttributes,
    stylesSetSelectedEdgeAttributes,
    stylesSetSelectedNodeAttributes,
} from '../utils/styles'

/**
 * @class styles 样式
 * @constructor
 * @param {value<any>} 初始化
 */
export default class styles<T, K> {
    private galaxyvis: any

    public classList: PlainObject<any> = {}

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
    }
    /**
     * 添加规则
     * @param options
     */
    public addRule = (options: RuleOptions) => {
        return stylesAddRule(this.galaxyvis, options)
    }

    /**
     * 创建一个新的class给点和边
     * @param options
     * @param use
     * @returns
     */
    public createClass = (options: ClassOptions, use: boolean = false) => {
        return stylesCreateClass(this.galaxyvis, options, use)
    }
    /**
     * 返回所有的classes
     * @returns
     */
    public getClassList = () => {
        return stylesGetClassList()
    }
    /**
     * 返回指定名字的class
     * @param className
     * @returns
     */
    public getClass = (className: string) => {
        return stylesGetClass(className)
    }
    /**
     * 添加hover点的样式
     * @param nodeAttributes
     * @returns
     */
    public setHoveredNodeAttributes = (nodeAttributes: PlainObject<any>) => {
        return stylesSetHoveredNodeAttributes(this.galaxyvis, nodeAttributes)
    }
    /**
     * 添加hover边的样式
     * @param edgeAttributes
     * @returns
     */
    public setHoveredEdgeAttributes = (edgeAttributes: PlainObject<any>) => {
        return stylesSetHoveredEdgeAttributes(this.galaxyvis, edgeAttributes)
    }
    /**
     * 添加selected点的样式
     * @param nodeAttributes
     */
    public setSelectedNodeAttributes = (nodeAttributes: PlainObject<any>) => {
        return stylesSetSelectedNodeAttributes(this.galaxyvis, nodeAttributes)
    }
    /**
     * 添加selected边的样式
     * @param nodeAttributes
     */
    public setSelectedEdgeAttributes = (edgeAttributes: PlainObject<any>) => {
        return stylesSetSelectedEdgeAttributes(this.galaxyvis, edgeAttributes)
    }
}
