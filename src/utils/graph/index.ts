import Node from '../../classes/node'
import Edge from '../../classes/edge'
import { genID } from '..'
import { basieciDataSetting, DEFAULT_SETTINGS, originInfoSetting } from '../../initial/settings'
import { originInfo, originInitial } from '../../initial/originInitial'
import { edgeAttributes, NodeAttributes } from '../../types'
import {
    globalProp,
    basicData,
    globalInfo,
    thumbnailInfo,
    instancesGL,
} from '../../initial/globalProp'
import NodeList from '../../classes/nodeList'
import EdgeList from '../../classes/edgeList'
import event from '../event'
import { nodeInitAttribute } from '../node'
import { edgeInitAttribute } from '../edge'
import { transformatAddEdgeFilter, transformatAddNodeFilter } from '../transformations'
import { clearChars } from '../tinySdf/sdfDrawText'
import { clone, cloneDeep } from 'lodash'

const transformatStrategies = {
    nodeFilter: (that: any) => {
        if (globalInfo[that.id].filterNodesTransformat?.size) {
            let filterNodes = cloneDeep(globalInfo[that.id].filterNodesTransformat)
            filterNodes!.forEach((item: any, key: string) => {
                let { transformat, options } = item
                transformat.destroy(false, 0, false).then(() => {
                    let transFilter = transformatAddNodeFilter(that, options, true)
                    transformat.update(transFilter.changed)
                })
            })
        }
    },
    edgeFilter: (that: any) => {
        if (globalInfo[that.id].filterEdgesTransformat?.size) {
            let filterEdges = cloneDeep(globalInfo[that.id].filterEdgesTransformat)
            filterEdges!.forEach((item: any, key: string) => {
                let { transformat, options } = item
                transformat.destroy(false, 0, false).then(() => {
                    let transFilter = transformatAddEdgeFilter(that, options, true)
                    transformat.update(transFilter.changed)
                })
            })
        }
    },
    mergeEdge: (that: any) => {
        if (globalInfo[that.id].mergeEdgesTransformat) {
            let { transformat, options } = globalInfo[that.id].mergeEdgesTransformat
            transformat.destroy(false, 0, false).then(() => {
                that.transformations.addEdgeGrouping(options, false).then((data: any) => {
                    transformat.changed = data.changed
                })
            })
        }
    }
}

/**
 * 添加点数据
 * @param that: galaxyvis对象
 * @param nodeInfo: 点属性数据
 * @returns
 */
export const graphAddNode = (that: any, nodeInfo: NodeAttributes) => {
    let node = graphAddNodeHandler(that, nodeInfo)
    node &&
        that.events.emit('addNodes', {
            nodes: new NodeList(that, [node.getId()]),
        })
    transformatStrategies['nodeFilter'](that)
    that.render()
    return node
}

/**
 * 添加点数据列表
 * @param that: galaxyvis对象
 * @param nodeInfo: 点属性数据
 * @returns
 */
export const graphAddNodes = (
    that: any,
    nodes: Array<any>,
    update: boolean = true,
): Promise<any> => {
    return new Promise(resolve => {
        let temporaryNodes: any[] = []
        nodes.forEach(nodeInfo => {
            let node = graphAddNodeHandler(that, nodeInfo)
            node && temporaryNodes.push(node.getId())
        })
        transformatStrategies['nodeFilter'](that)
        let nodeList = new NodeList(that, temporaryNodes)
        that.events.emit('addNodes', {
            nodes: nodeList,
        })

        update && that.render()
        resolve(nodeList)
    })
}

/**
 * 添加点的处理Attribute
 * @param attribute
 * @returns
 */
const graphAddNodeHandler = (that: any, nodeInfo: NodeAttributes) => {
    let node: any
    nodeInfo.id = nodeInfo?.id || genID(8)
    let basicNodeList = basicData[that.id].nodeList
    if (
        !basicNodeList.has(nodeInfo.id) ||
        (!basicNodeList.get(nodeInfo.id).getAttribute('isVisible') &&
            !basicNodeList.get(nodeInfo.id).getAttribute('useMergeNode'))
    ) {
        let attribute = nodeInitAttribute(that, nodeInfo?.attribute || nodeInfo?.attributes)

        let attr = { ...DEFAULT_SETTINGS.nodeAttribute, ...attribute, isFilter: false }
        let nodeAttr = {
            attribute: attr,
            id: nodeInfo.id,
            num: originInitial.graphIndex++,
            data: nodeInfo?.data,
            classList: nodeInfo?.class,
        }
        node = new Node(nodeAttr)
        // @ts-ignore
        node.__proto__ = that
        basicData[that.id].nodeList.set(nodeInfo.id, node)
        originInfo[that.id].nodeList.set(nodeInfo.id, attr)
        // canvas绘制顺序
        if (
            that.renderer === 'canvas' &&
            !globalInfo[that.id].nodeOrder.has(nodeInfo.id as string)
        ) {
            globalInfo[that.id].nodeOrder.add(nodeInfo.id as string)
        }
        globalInfo[that.id].ruleList.forEach((key, item) => {
            node.addClass(item, 2, false)
        })
    }

    return node
}

/**
 * 添加边数据
 * @param that: galaxyvis对象
 * @param edgeInfo: 边属性数据
 * @returns
 */
export const graphAddEdge = (that: any, edgeInfo: edgeAttributes) => {
    let edge = graphAddEdgeHandler(that, edgeInfo)
    edge &&
        that.events.emit('addEdges', {
            edges: new EdgeList(that, [edge.getId()]),
        })
    transformatStrategies['nodeFilter'](that)
    transformatStrategies['edgeFilter'](that)
    transformatStrategies['mergeEdge'](that)
    that.render()
    return edge
}
/**
 * 添加边数据
 * @param that: galaxyvis对象
 * @param edgeInfo: 边属性数据
 * @returns
 */
export const graphAddEdges = (
    that: any,
    edges: Array<any>,
    update: boolean = true,
): Promise<any> => {
    return new Promise(resolve => {
        let temporaryEdges: any[] = []

        edges.forEach(edgeInfo => {
            let edgeTarget = graphAddEdgeHandler(that, edgeInfo)
            edgeTarget && temporaryEdges.push(edgeTarget.getId())
        })

        transformatStrategies['nodeFilter'](that)
        transformatStrategies['edgeFilter'](that)
        transformatStrategies['mergeEdge'](that)

        update && that.render()
        let edgeList = new EdgeList(that, temporaryEdges)
        that.events.emit('addEdges', {
            edges: edgeList,
        })

        resolve(edgeList)
    })
}

/**
 * 添加边的处理Attribute
 * @param attribute
 * @returns
 */

const graphAddEdgeHandler = (that: any, edgeInfo: edgeAttributes) => {
    let edge: any
    edgeInfo.id = edgeInfo?.id || genID(8)
    if (
        !basicData[that.id].edgeList.has(edgeInfo.id) ||
        (!basicData[that.id].edgeList.get(edgeInfo.id).getAttribute('isVisible') &&
            !basicData[that.id].edgeList.get(edgeInfo.id).getAttribute('useMergeEdge')
        )
    ) {
        let attribute = edgeInitAttribute(that, edgeInfo?.attribute || edgeInfo?.attributes)
        let attr = { ...DEFAULT_SETTINGS.edgeAttribute, ...attribute, isFilter: false }
        attr.target = edgeInfo.target
        attr.source = edgeInfo.source

        if (attr?.usedMerge != undefined) {
            attr.isVisible = true
        }

        let edgeAttr = {
            attribute: attr,
            id: edgeInfo.id,
            target: edgeInfo.target,
            source: edgeInfo.source,
            data: edgeInfo?.data,
            classList: edgeInfo?.class || [],
            num: originInitial.graphIndex++,
        }

        edge = new Edge(edgeAttr)
        // @ts-ignore
        edge.__proto__ = that
        basicData[that.id].edgeList.set(edgeInfo.id, edge)
        originInfo[that.id].edgeList.set(edgeInfo.id, attr)

        // canvas绘制顺序
        if (
            that.renderer === 'canvas' &&
            !globalInfo[that.id].edgeOrder.has(edgeInfo.id as string)
        ) {
            globalInfo[that.id].edgeOrder.add(edgeInfo.id as string)
        }
        globalInfo[that.id].ruleList.forEach((key, item) => {
            edge.addClass(item, 2, false)
        })

        if (globalInfo[that.id].mergeEdgesTransformat) {
            let { transformat } = globalInfo[that.id].mergeEdgesTransformat
            let ids = transformat.subEdges.getId()
            if (ids && ids.indexOf(edgeInfo.id) != -1) {
                return null
            }
        }

        if (!basicData[that.id].edgeList.get(edgeInfo.id).getAttribute('isVisible')) {
            return null
        }

        return edge
    }
}

/**
 * 获取点边数据方法
 * @param that: galaxyvis对象
 * @param listKey: basicData的key名称
 * @param listClass: new的类名称
 * @param ids: id数组
 * @returns
 */
export const graphGetDatas = (
    that: any,
    listKey: string,
    listClass: any,
    getHidden: boolean,
    ids?: string[],
    getMerge?: boolean,
): any => {
    let visibleList: string[] = []
    //@ts-ignore
    basicData[that.id][listKey].forEach((item: any, key: any) => {
        if (!getMerge) {
            if (item.getAttribute('isVisible') || getHidden) {
                visibleList.push(key)
            }
        } else {
            if (
                item.getAttribute('isVisible') ||
                (globalInfo[that.id].mergeEdgesTransformat && item.getAttribute('usedMerge'))
            ) {
                visibleList.push(key)
            }
        }
    })
    if (ids) {
        let newIds = visibleList.filter(id => {
            return ids.includes(id)
        })
        return new listClass(that, newIds)
    } else {
        return new listClass(that, visibleList)
    }
}

/**
 * 获取单点或边数据
 * @param id: 点或边id
 * @returns Node: 点对象
 */
export const graphGetData = (
    graphId: any,
    id: string | number,
    listKey: string,
    getHidden: boolean,
) => {
    // @ts-ignore
    let data = basicData[graphId][listKey].get(id)
    if (getHidden && data) {
        return data
    } else if (data && data.getAttribute('isVisible')) {
        return data
    } else {
        return undefined
    }
}

/**
 * 获取点边数据方法
 * @param that: galaxyvis对象
 * @returns NodeList: 点列表对象
 */
export const graphGetSelectedNodes = (that: any) => {
    let newIds: string[] = [],
        { selectedNodes, selectedEdges } = basicData[that.id]
    if (selectedEdges.size === 0 && selectedNodes.size) {
        selectedNodes.forEach((item: any, key: any) => {
            newIds.push(key)
        })
    }
    return new NodeList(that, newIds)
}
/**
 * 获取未选中点
 * @param that
 * @returns
 */
export const graphGetNonSelectedNodes = (that: any) => {
    let nodes = that.getFilterNode(),
        { selectedNodes } = basicData[that.id],
        newIds: string[] = []

    nodes.forEach((item: any, key: string) => {
        if (!selectedNodes.has(key)) {
            newIds.push(key)
        }
    })
    return new NodeList(that, newIds)
}

/**
 * 获取点边数据方法
 * @param that: galaxyvis对象
 * @returns NodeList: 点列表对象
 */
export const graphGetSelectedEdges = (that: any) => {
    let newIds: any[] = [],
        { selectedEdges } = basicData[that.id]
    if (selectedEdges.size) {
        selectedEdges.forEach((item: any, key: any) => {
            newIds.push(key)
        })
    }
    return new EdgeList(that, newIds)
}
/**
 * 获取未选中边
 * @param that
 * @returns
 */
export const graphGetNonSelectedEdges = (that: any) => {
    let edges = that.getFilterEdges(),
        { selectedEdges } = basicData[that.id],
        newIds: string[] = []

    edges.forEach((item: any, key: string) => {
        if (!selectedEdges.has(key)) {
            newIds.push(key)
        }
    })
    return new EdgeList(that, newIds)
}
/**
 * 删除点
 * @param that
 * @param nodeId
 * @param isReFlash
 */
export const graphRemoveNode = (that: any, nodeId: string, isReFlash: boolean) => {
    let relationTable = that.getRelationTable()

    let edgelist = relationTable[nodeId]
    let node = basicData[that.id].nodeList.get(nodeId)

    if (node?.getAttribute('useMergeNode') || !node) return

    if (edgelist) {
        edgelist.forEach((item: any) => {
            basicData[that.id].edgeList.delete(item)
            originInfo[that.id].edgeList.delete(item)
        })
    }

    node?.setSelected(false, isReFlash)
    basicData[that.id].nodeList.delete(nodeId)
    originInfo[that.id].nodeList.delete(nodeId)

    if (isReFlash) {
        that.events.emit('removeNodes', {
            nodes: new NodeList(that, [nodeId]),
        })
        that.render()
    }
}
/**
 * 删除多点
 * @param that
 * @param nodes
 * @returns
 */
export const graphRemoveNodes = (that: any, nodes: string[]) => {
    return new Promise((resolve, reject) => {
        try {
            for (let index = 0, len = nodes.length; index < len; index++) {
                that.removeNode(nodes[index], false)
            }
            let nodeList = new NodeList(that, nodes)
            that.events.emit('removeNodes', {
                nodes: nodeList,
            })
            that.render()
            resolve(nodeList)
        } catch (err) {
            reject(err)
        }
    })
}
/**
 * 删除边
 * @param that
 * @param edgeId
 * @param isReFlash
 */
export const graphRemoveEdge = async (that: any, edgeId: string, force: boolean, isReFlash: boolean) => {
    let edge = basicData[that.id].edgeList.get(edgeId)

    if (
        !force &&
        edge &&
        !globalInfo[that.id].mergeEdgesTransformat &&
        edge.getAttribute('usedMerge') == false
    )
        return

    edge?.setSelected(false)
    basicData[that.id].edgeList.delete(edgeId)
    originInfo[that.id].edgeList.delete(edgeId)
    if (isReFlash) {
        that.events.emit('removeEdges', {
            edges: new EdgeList(that, [edgeId]),
        })
        await that.render()
    }
}
/**
 * 删除多条边
 * @param that
 * @param edges
 * @returns
 */
export const graphRemoveEdges = (that: any, edges: string[], force: boolean = true) => {
    return new Promise(async (resolve, reject) => {
        try {
            for (let index = 0, len = edges.length; index < len; index++) {
                that.removeEdge(edges[index], force, false)
            }
            let edgeList = new EdgeList(that, edges)
            that.events.emit('removeEdges', {
                edges: edgeList,
            })
            await that.render()
            resolve(edgeList)
        } catch (err) {
            reject(err)
        }
    })
}
/**
 * 添加数据
 * @param that
 * @param RawGraph
 * @returns
 */
export const graphAddGraph = (that: any, RawGraph: { [key: string]: any[] }): Promise<any> => {
    return new Promise(async (resolve: any, reject: any) => {
        let { nodes, edges } = RawGraph
        let nodelist, edgelist
        nodes && (nodelist = await that.addNodes(nodes, false))
        edges && (edgelist = await that.addEdges(edges, false))
        that.render()
        resolve({
            nodes: nodelist,
            edges: edgelist,
        })
    })
}

/**
 * 清空图数据
 * @param destory = true 是否销毁实例
 * @returns
 */
export const graphClearGraph = (graph: any, destory: boolean = true) => {
    const graphId = graph.id
    basicData[graphId] = cloneDeep(basieciDataSetting)
    originInfo[graphId] = cloneDeep(originInfoSetting)
    globalProp.iconMap = new Map([
        [
            '',
            {
                num: 0,
                style: 'normal',
                scale: 0.5,
            },
        ],
    ])
    globalProp.useIniticon = 0

    globalInfo[graph.id].mergeNodesTransformat = new Map()
    globalInfo[graph.id].mergeEdgesTransformat = null
    globalInfo[graph.id].filterNodesTransformat = new Map()
    globalInfo[graph.id].filterEdgesTransformat = new Map()
    globalInfo[graph.id].edgeType = null
    if (destory) {
        globalInfo[graph.id].ruleList = new Map()
    }
    graph.clear()
}
/**
 * 销毁graph对象
 * @param that
 * @returns
 */
export const graphDestory = (that: any) => {
    return new Promise((resolve: any, reject: any) => {
        try {
            if (thumbnailInfo[that.id] && that.thumbnail) {
                thumbnailInfo[that.id] && delete thumbnailInfo[that.id]
                resolve(true)
                return
            }

            if (!(thumbnailInfo[that.id] && that.thumbnail)) {
                // 清除数据
                graphClearGraph(that)
                clearChars()
                globalProp.textureCtx = null
                delete basicData[that.id]

                // webgl上下文清除
                var t = that.gl?.getExtension('WEBGL_lose_context')
                t && t.loseContext()
                // 删除dom元素
                that.gl?.canvas.remove()
                that.ctx?.canvas.remove()
                that.PREctx?.canvas.remove()
            }
            instancesGL[that.id] && delete instancesGL[that.id]
            thumbnailInfo[that.id] && delete thumbnailInfo[that.id]
            // 清除graph 的 events
            let Graphevents = that.events._events
            for (let i in Graphevents) {
                that.events.removeListener(i)
            }
            // 清除event
            let events = event.clientList
            for (let i in events) {
                // @ts-ignore
                event.remove(i)
            }

            resolve(true)
        } catch (err) {
            reject(err)
        }
    })
}
/**
 * 返回render的类型
 * @returns
 */
export const graphGetRenderType = (that: any) => {
    return that.renderer
}
