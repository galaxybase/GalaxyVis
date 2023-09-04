import EdgeList from './edgeList'
import { nodeListLocate } from '../utils/node'
import isArray from 'lodash/isArray'
import { AdjacencyOptions, AnimateOptions } from '../types'
import { ANIMATE_DEFAULTS, basicData } from '../initial/globalProp'

/**
 * @class NodeList
 * @constructor
 * @param {value<any>} 初始化
 */
export default class NodeList {
    private galaxyvis: any
    private ids: string[]
    public isNodeList: boolean = true
    public size: number = 0
    constructor(galaxyvis: any, ids: string[] | undefined) {
        this.galaxyvis = galaxyvis
        if (ids) {
            this.ids = ids
        } else {
            this.ids = this.galaxyvis.getNodes()
        }
        this.size = this.ids.length | 0
    }

    // 添加forEach方法
    public forEach = (callback: any, context: any) => {
        for (var i = 0; i < this.ids.length; i++) {
            callback.call(
                context || null,
                basicData[this.galaxyvis.id].nodeList.get(this.ids[i]),
                i,
                this.ids,
            )
        }
    }
    /**
     * 多点居中
     * @param options
     * @returns
     */
    public locate = (options?: AnimateOptions) => {
        options = Object.assign({}, ANIMATE_DEFAULTS, options)
        return nodeListLocate(this.galaxyvis, this.ids, options)
    }

    /**
     * 删除某个点集合的指定class
     * @param className
     * @returns
     */
    public removeClass = (className: string) => {
        let promiseList: any[] = []
        this.ids.forEach(id => {
            promiseList.push(this.galaxyvis.getNode(id)?.removeClass(className, 1, false))
        })
        this.galaxyvis.render()
        return Promise.all(promiseList)
    }

    /**
     * 将指定的类添加到节点集合
     * @param className
     * @returns
     */
    public addClass = (className: string) => {
        let promiseList: any[] = []
        this.ids.forEach(id => {
            promiseList.push(this.galaxyvis.getNode(id)?.addClass(className, 1, false))
        })
        this.galaxyvis.render()
        return Promise.all(promiseList)
    }

    /**
     * 返回这个点集合的class
     * @returns
     */
    public getClassList = () => {
        let list: string[] = []
        this.ids?.forEach(id => {
            list.push(this.galaxyvis.getNode(id)?.getClassList())
        })
        return list
    }

    /**
     * 返回点一度关联点
     * @param options
     * @returns
     */
    public getAdjacentNodes = (options?: AdjacencyOptions) => {
        let list: string[] = []

        if (!this.ids || !this.ids?.length)
            return new NodeList(this.galaxyvis, list)
        try {
            for (let i = 0, len = this.ids.length; i < len; i++) {
                let id = this.ids[i];
                id && this.galaxyvis.getNode(id) && list.push(...this.galaxyvis.getNode(id).getAdjacentNodes(options))
            }
        } catch {}
        list = Array.from(new Set(list))
        return new NodeList(this.galaxyvis, list)
    }

    /**
     * 重置attribute的属性 当attributeName为空的时候整个重置
     * 有值的时候重置值的那一部分。
     * @param attributeNames
     * @returns
     */
    public resetAttributes = (attributeNames?: any[]) => {
        let promiseList: any[] = []
        this.ids.forEach(id => {
            promiseList.push(this.galaxyvis.getNode(id)?.resetAttributes(attributeNames, false))
        })
        this.galaxyvis.render()
        return Promise.all(promiseList)
    }

    /**
     * 设置选中
     * @param active
     */
    public setSelected = (active: boolean = true) => {
        let nodeListActive: string[] = []
        this.ids.forEach(id => {
            let successful = basicData[this.galaxyvis.id].nodeList
                .get(id)
                ?.setSelected(active, false, true)
            if (successful !== 0 && successful != undefined) {
                nodeListActive.push(id)
            }
        })

        if (active) {
            let nodeList = new NodeList(this.galaxyvis, nodeListActive)
            this.galaxyvis.events.emit('nodesSelected', nodeList)
        } else {
            let nodeList = new NodeList(this.galaxyvis, nodeListActive)
            this.galaxyvis.events.emit('nodesUnselected', nodeList)
        }

        this.galaxyvis.selectMovefresh()
    }

    /**
     * 检索节点的位置。它严格地等价于node.getAttributes ([' x ', ' y '])。
     */
    public getPosition = () => {
        let list: Array<{ x: number, y: number }> = []
        this.ids.forEach(id => {
            list.push(this.galaxyvis.getNode(id)?.getPosition())
        })
        return list
    }

    /**
     * 检索节点的指定数据属性。
     * 该方法返回内部数据对象;修改它可能会导致意外的行为。
     * @param param 指定数据 string | Array<string>
     * @returns
     */
    public getData = (param: string | Array<string>) => {
        let list: any[] = []
        this.ids.forEach(id => {
            list.push(this.galaxyvis.getNode(id)?.getData(param))
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
        this.ids.forEach(id => {
            this.galaxyvis.getNode(id)?.setData(param, value, isRender)
        })
    }

    /**
     * 返回节点的相邻边列表。
     * @returns
     */
    public getAdjacentEdges = (options?: AdjacencyOptions) => {
        let list: string[] = []
        if (!this.ids || !this.ids?.length)
            return new NodeList(this.galaxyvis, list)
        try {
            this.ids.forEach(id => {
                id && this.galaxyvis.getNode(id) && list.push(...this.galaxyvis.getNode(id).getAdjacentEdges(options))
            })
        } catch { }

        list = Array.from(new Set(list))
        return new EdgeList(this.galaxyvis, list)
    }

    /**
     * 返回当前点的id
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
        let list: any[] = []
        this.ids.forEach(id => {
            list.push(this.galaxyvis.getNode(id, useHidden)?.getAttribute(attribute))
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
                this.galaxyvis
                    .getNode(id, useHidden)
                    ?.setAttributes(attributeisArray ? cloneAttribute[index] : cloneAttribute, this.isNodeList),
            )
        })
        this.galaxyvis.render();
        return Promise.all(promiseList)
    }

    /**
     * 翻转nodelist及获取除了这个nodelist外的点
     * @returns
     */
    public inverse = () => {
        let inverseIds: any[] | undefined = []

        let nodeList = basicData[this.galaxyvis.id].nodeList

        nodeList.forEach(item => {
            let attributes = item.getAttribute()
            let { isVisible } = attributes
            let id = item.getId()
            if (isVisible && this.ids.indexOf(id) === -1) {
                inverseIds?.push(id)
            }
        })
        return new NodeList(this.galaxyvis, inverseIds)
    }

    /**
     * 获取当前nodeList的包围盒
     * @param staticOffsetX
     * @param staticOffsetY
     * @param incrementalNode
     * @returns
     */
    public getBoundingBox = (staticOffsetX = 0, staticOffsetY = 0, incrementalNode?: any) => {
        let maxX = -Infinity,
            minX = Infinity,
            maxY = -Infinity,
            minY = Infinity
        let nodeList = basicData[this.galaxyvis.id].nodeList
        this.ids.forEach(id => {
            let { x, y } = nodeList.get(id).getPosition()
            if (incrementalNode === id) {
                ; (x = 0), (y = 0)
            }
            maxX = Math.max(maxX, x + staticOffsetX)
            maxY = Math.max(maxY, y - staticOffsetY)
            minX = Math.min(minX, x + staticOffsetX)
            minY = Math.min(minY, y - staticOffsetY)
        })

        return {
            maxX,
            minX,
            maxY,
            minY,
            width: maxX - minX,
            height: maxY - minY,
            cx: minX + (maxX - minX) / 2,
            cy: minY + (maxY - minY) / 2,
        }
    }
}
