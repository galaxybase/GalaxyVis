import Node from '../../classes/node'
import Edge from '../../classes/edge'
import { cancelFrame, genID } from '..'
import { basieciDataSetting, DEFAULT_SETTINGS, originInfoSetting } from '../../initial/settings'
import { originInfo, originInitial } from '../../initial/originInitial'
import { edgeAttributes, LAYOUT_MESSAGE, NodeAttributes } from '../../types'
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
import { clone, cloneDeep, defaultsDeep, PartialObject } from 'lodash'
import { cameraFram } from '../cameraAnimate'
import { animateFram } from '../graphAnimate'
import { cleartNodeList } from '../../layouts/hierarchy/tclass'

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
    that.geo.enabled() && that.geo.layer.options.onUpdate(true)
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
) => {
    return new Promise(async resolve => {
        let temporaryNodes: any[] = []
        nodes.forEach(nodeInfo => {
            let node = graphAddNodeHandler(that, nodeInfo)
            node && temporaryNodes.push(node.getId())
        })
        await transformatStrategies['nodeFilter'](that)
        let nodeList = new NodeList(that, temporaryNodes)
        that.events.emit('addNodes', {
            nodes: nodeList,
        })
        that.geo.enabled() && update && that.geo.layer.options.onUpdate(true)
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
    let GraphId = that.id;
    let node: any
    nodeInfo.id = nodeInfo?.id || genID(8)
    let basicNodeList = basicData[GraphId].nodeList
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
        basicData[GraphId].nodeList.set(nodeInfo.id, node)
        originInfo[GraphId].nodeList.set(nodeInfo.id, attr)
        // canvas绘制顺序
        if (
            that.renderer === 'canvas' &&
            !globalInfo[GraphId].nodeOrder.has(nodeInfo.id as string)
        ) {
            globalInfo[GraphId].nodeOrder.add(nodeInfo.id as string)
        }
        globalInfo[GraphId].ruleList.forEach((key, item) => {
            let { nodeSelector, nodeAttributes } = key
            if (nodeSelector && nodeSelector(node)) {
                node.addClass(item, 2, false)
            }
            if (!nodeSelector && nodeAttributes) {
                node.addClass(item, 2, false)
            }
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
    that.geo.enabled() && that.geo.layer.options.onUpdate(true)
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
) => {
    return new Promise(async resolve => {
        let temporaryEdges: any[] = []

        edges.forEach(edgeInfo => {
            let edgeTarget = graphAddEdgeHandler(that, edgeInfo)
            edgeTarget && temporaryEdges.push(edgeTarget.getId())
        })

        await transformatStrategies['nodeFilter'](that)
        await transformatStrategies['edgeFilter'](that)
        await transformatStrategies['mergeEdge'](that)
        that.geo.enabled() && update && that.geo.layer.options.onUpdate(true)
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
    let GraphId = that.id;
    let edge: any;
    let { edgeList } = basicData[GraphId]
    edgeInfo.id = edgeInfo?.id || genID(8)
    if (
        !edgeList.has(edgeInfo.id) ||
        (!edgeList.get(edgeInfo.id).getAttribute('isVisible') &&
            !edgeList.get(edgeInfo.id).getAttribute('useMergeEdge')
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
        edgeList.set(edgeInfo.id, edge)
        originInfo[GraphId].edgeList.set(edgeInfo.id, attr)

        // canvas绘制顺序
        if (
            that.renderer === 'canvas' &&
            !globalInfo[GraphId].edgeOrder.has(edgeInfo.id as string)
        ) {
            globalInfo[GraphId].edgeOrder.add(edgeInfo.id as string)
        }
        globalInfo[GraphId].ruleList.forEach((key, item) => {
            let { edgeSelector, edgeAttributes } = key
            if (edgeSelector && edgeSelector(edge)) {
                edge.addClass(item, 2, false)
            }
            if (!edgeSelector && edgeAttributes) {
                edge.addClass(item, 2, false)
            }
        })

        if (globalInfo[GraphId].mergeEdgesTransformat) {
            let { transformat } = globalInfo[GraphId].mergeEdgesTransformat
            let ids = transformat.subEdges.getId()
            if (ids && ids.indexOf(edgeInfo.id) != -1) {
                return null
            }
        }

        if (!edgeList.get(edgeInfo.id).getAttribute('isVisible')) {
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
    let GraphId = that.id;
    let visibleList: string[] = []
    //@ts-ignore
    basicData[GraphId][listKey].forEach((item: any, key: string) => {
        if (!getMerge) {
            if (item.getAttribute('isVisible') || getHidden) {
                visibleList.push(key)
            }
        } else {
            if (
                item.getAttribute('isVisible') ||
                (globalInfo[GraphId].mergeEdgesTransformat && item.getAttribute('usedMerge'))
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
        selectedNodes.forEach((item: any, key: string) => {
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
        selectedEdges.forEach((item: any, key: string) => {
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
export const graphRemoveNode = async (that: any, nodeId: string, isReFlash: boolean) => {
    let relationTable = that.getRelationTable()
    let GraphId = that.id;
    let edgelist = relationTable[nodeId]
    let { nodeList, edgeList } = basicData[GraphId];
    let node = nodeList.get(nodeId)

    if (node?.getAttribute('useMergeNode') || !node) return

    if (edgelist) {
        edgelist.forEach((item: any) => {
            edgeList.delete(item)
            originInfo[GraphId].edgeList.delete(item)
        })
    }

    node?.setSelected(false)
    nodeList.delete(nodeId)
    originInfo[GraphId].nodeList.delete(nodeId)

    if (isReFlash) {
        that.events.emit('removeNodes', {
            nodes: new NodeList(that, [nodeId]),
        })
        await that.render()
    }
}
/**
 * 删除多点
 * @param that
 * @param nodes
 * @returns
 */
export const graphRemoveNodes = (that: any, nodes: string[]) => {
    return new Promise(async (resolve, reject) => {
        try {
            for (let index = 0, len = nodes.length; index < len; index++) {
                that.removeNode(nodes[index], false)
            }
            let nodeList = new NodeList(that, nodes)
            that.events.emit('removeNodes', {
                nodes: nodeList,
            })
            await that.render()
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
    let GraphId = that.id;
    let { edgeList } = basicData[GraphId]
    let edge = edgeList.get(edgeId)

    if (
        !force &&
        edge &&
        !globalInfo[GraphId].mergeEdgesTransformat &&
        edge.getAttribute('usedMerge') == false
    )
        return

    edge?.setSelected(false)
    edgeList.delete(edgeId)
    originInfo[GraphId].edgeList.delete(edgeId)
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
export const graphAddGraph = (that: any, RawGraph: PartialObject<any>) => {
    return new Promise(async (resolve, reject) => {
        let { nodes, edges } = RawGraph
        let nodelist, edgelist
        nodes && (nodelist = await that.addNodes(nodes, false))
        edges && (edgelist = await that.addEdges(edges, false))
        that.geo.enabled() && that.geo.layer.options.onUpdate(true)
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
    const globalInfoGraph = globalInfo[graphId]
    globalInfoGraph.mergeNodesTransformat = new Map()
    globalInfoGraph.mergeEdgesTransformat = null
    globalInfoGraph.filterNodesTransformat = new Map()
    globalInfoGraph.filterEdgesTransformat = new Map()

    if (graph.overLay) {
        graph.overLay.clear()
    }

    globalInfoGraph.edgeType = null

    if (graph.pulse) {
        graph.pulseCanvas.clear();
    }

    if (destory) {
        globalInfoGraph.ruleList = new Map()
    }

    if (cameraFram) {
        cancelFrame(cameraFram)
    }

    if (animateFram) {
        cancelFrame(animateFram)
        graph.textStatus = true;
        graph.events.emit(
            LAYOUT_MESSAGE.END,
            () => { }
        )
    }

    cleartNodeList()
    graph.camera.updateTransform()
    graph.clear()
}
/**
 * 销毁graph对象
 * @param that
 * @returns
 */
export const graphDestory = (that: any) => {
    return new Promise((resolve, reject) => {
        try {
            let GraphId = that.id;
            that.geo.enabled() && that.geo.disable()

            if (thumbnailInfo[GraphId] && that.thumbnail) {
                thumbnailInfo[GraphId] && delete thumbnailInfo[GraphId]
                resolve(true)
                return
            }

            if (!(thumbnailInfo[GraphId] && that.thumbnail)) {
                // 清除数据
                graphClearGraph(that)
                clearChars()

                if (Object.keys(instancesGL).length <= 1)
                    globalProp.textureCtx = null
                delete basicData[GraphId]
                delete originInfo[GraphId]
                delete globalInfo[GraphId]

                // webgl上下文清除
                var t = that.gl?.getExtension('WEBGL_lose_context')
                t && t.loseContext()
                // 删除dom元素
                that.gl?.canvas.remove()
                that.ctx?.canvas.remove()
                that.PREctx?.canvas.remove()

                if (that.pulse) {
                    that.pulseCanvas.destory();
                    that.pulseCanvas = null;
                }
                if (that.overLay) {
                    that.overLay.destory()
                    that.overLay = null;
                }

            }
            instancesGL[GraphId] && delete instancesGL[GraphId]
            thumbnailInfo[GraphId] && delete thumbnailInfo[GraphId]
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

            for (let i in that) {
                that[i] = null;
                delete that[i]
            }

            that = null;
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
