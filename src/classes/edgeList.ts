import NodeList from './nodeList'
import { basicData } from '../initial/globalProp'
import isArray from 'lodash/isArray'

/**
 * @class EdgeList
 * @constructor
 * @param {value<any>} 初始化
 */
export default class EdgeList {
    private galaxyvis: any
    private ids: string[]
    private size: number = 0
    public isEdgeList: boolean = true
    constructor(galaxyvis: any, ids: string[] | undefined) {
        this.galaxyvis = galaxyvis
        if (ids) {
            this.ids = ids
        } else {
            this.ids = this.galaxyvis.getEdges()
        }
        this.size = this.ids.length || 0
    }

    /**
     * 添加forEach方法
     * @param callback
     * @param context
     */
    public forEach = (callback: any, context: any) => {
        for (var i = 0; i < this.ids.length; i++) {
            callback.call(
                context || null,
                basicData[this.galaxyvis.id].edgeList.get(this.ids[i]),
                i,
                this.ids,
            )
        }
    }

    /**
     * 删除某个边的指定class
     * @param className
     * @returns {Promise.all}
     */
    public removeClass = (className: string) => {
        let promiseList: any[] = []
        this.ids?.forEach(id => {
            promiseList.push(this.galaxyvis.getEdge(id)?.removeClass(className, 1, false))
        })
        this.galaxyvis.render()
        return Promise.all(promiseList)
    }

    /**
     * 将指定的类添加到边
     * @param className
     * @returns {Promise.all}
     */
    public addClass = (className: string) => {
        let promiseList: any[] = []
        this.ids?.forEach(id => {
            promiseList.push(this.galaxyvis.getEdge(id)?.addClass(className, 1, false))
        })
        this.galaxyvis.render()
        return Promise.all(promiseList)
    }

    /**
     * 返回这个边的class
     * @returns {Array<string>}
     */
    public getClassList = () => {
        let list: string[] = []
        this.ids?.forEach(id => {
            list.push(this.galaxyvis.getEdge(id)?.getClassList())
        })
        return list
    }

    /**
     * 重置attribute的属性 当attributeName为空的时候整个重置
     * 有值的时候重置值的那一部分。
     * @param attributeNames
     * @returns {Promise.all}
     */
    public resetAttributes = (attributeNames?: any[]) => {
        let promiseList: any[] = []
        this.ids?.forEach(id => {
            promiseList.push(this.galaxyvis.getEdge(id)?.resetAttributes(attributeNames, false))
        })
        this.galaxyvis.render()
        return Promise.all(promiseList)
    }

    /**
     * 设置选中
     * @param active
     */
    public setSelected = (active: boolean = true) => {
        let edgeListActive: string[] = []
        this.ids?.forEach(id => {
            let successful = basicData[this.galaxyvis.id].edgeList
                .get(id)
                ?.setSelected(active, false, true)
            if (successful !== 0 && successful != undefined) {
                edgeListActive.push(id)
            }
        })

        if (active) {
            let edgeList = new NodeList(this.galaxyvis, edgeListActive)
            this.galaxyvis.events.emit('edgesSelected', edgeList)
        } else {
            let edgeList = new NodeList(this.galaxyvis, edgeListActive)
            this.galaxyvis.events.emit('edgesUnselected', edgeList)
        }

        this.galaxyvis.selectMovefresh()
    }

    /**
     * 检索节点的指定数据属性。
     * 该方法返回内部数据对象;修改它可能会导致意外的行为。
     * @param param 属性的路径
     * @returns
     */
    public getData = (param: string | Array<string>) => {
        let list: string[] = []
        this.ids?.forEach(id => {
            list.push(this.galaxyvis.getEdge(id)?.getData(param))
        })
        return list
    }

    /**
     * 设置节点的指定数据属性。如果没有指定属性，则更新整个数据对象。
     * @param param 指定数据 string | Array<string>
     * @param value 要改变的值
     * @returns
     */
    public setData = (param: string | Array<string>, value: any, isRender: boolean = true) => {
        this.ids?.forEach(id => {
            this.galaxyvis.getEdge(id)?.setData(param, value, isRender)
        })
    }

    /**
     * 返回当前边的id
     * @returns
     */
    public getId = () => {
        return this.ids
    }

    /**
     * 获取所有属性 或者 根据属性名获取某个属性
     * 使用loadsh里的方法原先的不能获取到层级较深的属性
     * @param  {...any} attribute
     * @returns
     */
    public getAttribute = (attribute?: any, useHidden = false) => {
        let list: string[] = []
        this.ids?.forEach(id => {
            list.push(this.galaxyvis.getEdge(id, useHidden)?.getAttribute(attribute))
        })
        return list
    }

    /**
     * 设置属性
     * @param {*} attribute
     */
    public setAttributes = (attribute: any, useHidden = false) => {
        let promiseList: any[] = []
        let attributeisArray = isArray(attribute) ? true : false
        
        this.ids.forEach((id, index) => {
            let cloneAttribute = attribute;
            promiseList.push(
                this.galaxyvis.getEdge(id, useHidden)?.
                                setAttributes(attributeisArray ? cloneAttribute[index] : cloneAttribute, this.isEdgeList))
        })
        this.galaxyvis.render();
        return Promise.all(promiseList)
    }

    /**
     * 返回这条边的source节点
     * @returns
     */
    public getSource = () => {
        let list: string[] = []

        this.ids?.forEach(id => {
            list.push(this.galaxyvis.getEdge(id)?.getSource().getId())
        })
        return new NodeList(this.galaxyvis, list)
    }
    /**
     * 返回这条边上的Target节点
     * @returns
     */
    public getTarget = () => {
        let list: string[] = []
        this.ids?.forEach(id => {
            list.push(this.galaxyvis.getEdge(id)?.getTarget().getId())
        })
        return new NodeList(this.galaxyvis, list)
    }
}
