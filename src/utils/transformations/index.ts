import { defaultsDeep, merge } from 'lodash'
import { genID, hashNumber } from '..'
import { originInfo, originInitial } from '../../initial/originInitial'
import { DEFAULT_SETTINGS } from '../../initial/settings'
import { animateNodes } from '../graphAnimate'
import { transformat } from './transformat'
import { basicData, globalInfo } from '../../initial/globalProp'
import { nodeInitAttribute } from '../node'
import { edgeInitAttribute } from '../edge'
import { PlainObject } from '../../types'
import EdgeList from '../../classes/edgeList'
import NodeList from '../../classes/nodeList'
import Node from '../../classes/node'
import Edge from '../../classes/edge'

/**
 * 添加点过滤规则
 * @param galaxyvis
 * @param criteria
 * @returns
 */
export const transformatAddNodeFilter = (galaxyvis: any, criteria: Function, isRender: boolean) => {
    let nodeList = basicData[galaxyvis.id].nodeList,
        edgeList = basicData[galaxyvis.id].edgeList,
        relationTable = galaxyvis.getEdgeType().relationTable, //获取关联表
        changedTable: string[] = [] //更改的数据id表
    nodeList.forEach((item: any, key: any) => {
        // 匹配规则
        if (!criteria(item)) {
            // 获取当前边的关联关系
            let edgelist = relationTable[key]
            if (edgelist) {
                edgelist.forEach((item: any) => {
                    if (edgeList.has(item)) {
                        // 获取起始点和终止点
                        let { source, target } = edgeList.get(item).getAttribute()
                        nodeList.get(source).setSelected(false, false, true)
                        basicData[galaxyvis.id].selectedTable.delete(source)
                        basicData[galaxyvis.id].selectedNodes.delete(source)
                        nodeList.get(target).setSelected(false, false, true)
                        basicData[galaxyvis.id].selectedTable.delete(target)
                        basicData[galaxyvis.id].selectedNodes.delete(target)
                        // 是否是从过滤点那边影响到的隐藏边
                        edgeList.get(item).changeAttribute({
                            isVisible: false,
                            isFilterNode: true,
                            isSelect: false,
                        })
                        edgeList.get(item).setSelected(false, false, true)
                        basicData[galaxyvis.id].selectedEdgeTable.delete(item)
                        basicData[galaxyvis.id].selectedEdges.delete(item)
                    }
                })
            }
            // 设置为不可见
            item.changeAttribute({
                isVisible: false,
                isFilter: true,
            })
            galaxyvis.mouseCaptor.selected = false
            //把当前更改的点id传入到changedTable
            changedTable[changedTable.length] = item.getId()
        }
    })
    if (isRender) galaxyvis.render()
    // 返回transformat对象
    let filter = new transformat(galaxyvis, changedTable, 1)
    return filter
}
/**
 * 添加边过滤
 * @param galaxyvis
 * @param criteria
 * @returns
 */
export const transformatAddEdgeFilter = (galaxyvis: any, criteria: Function, isRender = true) => {
    let edgeList = basicData[galaxyvis.id].edgeList,
        nodeList = basicData[galaxyvis.id].nodeList,
        changedTable: string[] = [] //更改的数据id表

    edgeList.forEach((item: any, key: any) => {
        if (!criteria(item)) {
            if (!item.getAttribute('isFilter') && !item.getAttribute('usedMerge')) {
                let { source, target } = item.getAttribute()
                nodeList.get(source).setSelected(false, false, true)
                basicData[galaxyvis.id].selectedTable.delete(source)
                basicData[galaxyvis.id].selectedNodes.delete(source)
                nodeList.get(target).setSelected(false, false, true)
                basicData[galaxyvis.id].selectedTable.delete(target)
                basicData[galaxyvis.id].selectedNodes.delete(target)
                // 是否是从过滤点那边影响到的隐藏边
                item.changeAttribute({
                    isVisible: false,
                    isFilter: true,
                    isSelect: false,
                })
                edgeList.get(key).setSelected(false, false, true)
                basicData[galaxyvis.id].selectedEdgeTable.delete(key)
                basicData[galaxyvis.id].selectedEdges.delete(key)
                // 添加到可更改表
                changedTable[changedTable.length] = item.getId()
            }
        }
    })
    galaxyvis.mouseCaptor.selected = false
    // 返回transformat对象
    if (isRender) galaxyvis.render()
    return new transformat(galaxyvis, changedTable, 2)
}

/**
 * 合并点
 * @param galaxyvis
 * @param opts
 * @returns
 */
export const transformatNodeGroup = (galaxyvis: any, opts?: any): Promise<any> => {
    let {
        duration = 0,
        edgeGenerator, //边样式
        nodeGenerator, //点样式
        selector, //哪些点被选中
        groupIdFunction, //分组再细分
    } = opts
    let changedTable: string[] = [] //需要更改的数据
    try {
        return new Promise((resolve, reject) => {
            // 创建一个唯一id
            let genid = genID(4)
            //先拿到所有需要分组的点
            //没有selector的话拿到全部
            let groupNodes = new Map()
            if (typeof selector == 'function') {
                let nodes = defaultsDeep(galaxyvis.getFilterNode())
                nodes.forEach((item: any, key: string) => {
                    if (selector!(item)) {
                        groupNodes.set(key, item)
                    }
                })
            } else {
                groupNodes = defaultsDeep(galaxyvis.getFilterNode())
            }

            //再根据groupIdFunction再一次分组
            let groupNodesbyId: PlainObject<any> = {}
            if (typeof groupIdFunction == 'function') {
                groupNodes.forEach((item: any, key: string) => {
                    let ids = groupIdFunction!(item)
                    let groupId = `gen_group_${ids}`
                    if (groupNodesbyId[groupId]) {
                        groupNodesbyId[groupId].set(key, item)
                    } else {
                        groupNodesbyId[groupId] = new Map().set(key, item)
                    }
                })
            } else {
                let groupId = `gen_group_default_${genid}`
                groupNodesbyId[groupId] = groupNodes
            }
            let allNodelist = basicData[galaxyvis.id].nodeList,
                allEdgelist = basicData[galaxyvis.id].edgeList,
                edgeAllAttribute: PlainObject<any> = {} //边合并的属性
            if (typeof edgeGenerator == 'function') {
                try {
                    edgeAllAttribute = edgeGenerator(allEdgelist)
                } catch (err) {
                    reject(err)
                }
                if (edgeAllAttribute?.attribute)
                    edgeAllAttribute.attribute = nodeInitAttribute(
                        galaxyvis,
                        edgeAllAttribute.attribute,
                    )
            }

            //处理数据
            let groupNode = new Map()
            for (let i in groupNodesbyId) {
                let thisNode = defaultsDeep(groupNodesbyId[i]),
                    nodeAllAttribute: PlainObject<any> = {} //点合并的属性
                if (typeof nodeGenerator == 'function') {
                    try {
                        nodeAllAttribute = nodeGenerator(thisNode)
                    } catch (error) {
                        reject(error)
                    }
                    if (nodeAllAttribute?.attribute)
                        nodeAllAttribute.attribute = nodeInitAttribute(
                            galaxyvis,
                            nodeAllAttribute.attribute,
                        )
                }
                //计算中心位置
                let sumX = 0,
                    sumY = 0,
                    children: any[] = [],
                    len = thisNode.size
                // 记录子节点坐标
                thisNode.forEach((item: any, key: string) => {
                    sumX += item.getAttribute('x')
                    sumY += item.getAttribute('y')
                    children.push({
                        key,
                        x: item.getAttribute('x'),
                        y: item.getAttribute('y'),
                    })
                })
                // 创建属性
                let creatAttribute = {
                    attribute: {
                        ...DEFAULT_SETTINGS.nodeAttribute,
                        x: sumX / len,
                        y: sumY / len,
                        isVisible: false,
                        isGroupNode: true,
                    },
                    id: i,
                    num: originInitial.graphIndex++,
                    children,
                }
                // 合并属性
                creatAttribute = merge(creatAttribute, nodeAllAttribute)
                let groupNodes: any = new Node(creatAttribute)
                groupNodes.__proto__ = galaxyvis
                originInfo[galaxyvis.id].nodeList.set(i, creatAttribute.attribute)
                // 添加rule
                globalInfo[galaxyvis.id].ruleList.forEach((key, item) => {
                    groupNodes.addClass(item, 2, false)
                })
                // 记录当前点id
                changedTable[changedTable.length] = i
                allNodelist.set(i, groupNodes)
                groupNode.set(i, groupNodes)
                // canvas绘制顺序
                if (!globalInfo[galaxyvis.id].nodeOrder.has(i)) {
                    globalInfo[galaxyvis.id].nodeOrder.add(i)
                }
            }
            //动画效果的添加
            let target: { [k: string]: any } = {},
                thisNodes = defaultsDeep(galaxyvis.getFilterNode()),
                thisEdges = defaultsDeep(galaxyvis.getFilterEdges())
            // 数据处理
            thisNodes.forEach((item: any, key: string) => {
                target[key] = {
                    x: item.getAttribute('x'),
                    y: item.getAttribute('y'),
                }
            })
            groupNode.forEach((item: any, key: string) => {
                let children = item.value.children
                for (let index = 0, len = children.length; index < len; index++) {
                    let key = children[index].key
                    target[key] = {
                        x: item.getAttribute('x'),
                        y: item.getAttribute('y'),
                    }
                }
            })

            // 动画效果
            animateNodes(
                galaxyvis,
                target,
                { duration },
                () => {
                    // 在回调函数里处理显示和隐藏效果
                    let relationTable = galaxyvis.getRelationTable()

                    groupNode.forEach((item: any, key: string) => {
                        let children = item.value.children
                        for (let index = 0, len = children.length; index < len; index++) {
                            let keys = children[index].key,
                                edgelist = relationTable[keys]
                            // 处理合并点相关联的边
                            if (edgelist) {
                                edgelist.forEach((item: any) => {
                                    if (thisEdges.has(item)) {
                                        thisEdges.get(item).changeAttribute({
                                            isVisible: false,
                                            isSelect: false,
                                        })
                                    }
                                })
                            }
                            thisNodes.get(keys).changeAttribute({
                                isVisible: false,
                                // isSelect: false,
                                useMergeNode: true,
                            })
                            thisNodes.get(keys).setSelected(false, false, true)
                        }
                        //处理子节点
                        let hash = new Set()
                        for (let index = 0, len = children.length; index < len; index++) {
                            let keys = children[index].key,
                                edgelist = relationTable[keys]
                            if (edgelist) {
                                edgelist.forEach((item: any) => {
                                    let source = allEdgelist.get(item)?.getSource()
                                    let target = allEdgelist.get(item)?.getTarget()

                                    if (source && target) {
                                        let node = source.getAttribute('isVisible')
                                                ? source.getId()
                                                : target.getAttribute('isVisible')
                                                ? target.getId()
                                                : null, // 创建因为合并点所形成的合并边
                                            n =
                                                node &&
                                                hashNumber(
                                                    allNodelist.get(node).value.num,
                                                    allNodelist.get(key).value.num,
                                                ),
                                            id = `gen_group_${item}_edge_${genid}` //创建唯一id
                                        if (node && !hash.has(n)) {
                                            hash.add(n)
                                            let creatAttribute = {
                                                attribute: {
                                                    ...DEFAULT_SETTINGS.edgeAttribute,
                                                    isVisible: true,
                                                    source: node,
                                                    target: key,
                                                    isGroup: true,
                                                    isMerge: true,
                                                },
                                                id,
                                                source: node,
                                                target: key,
                                                data: {},
                                                classList: [],
                                                // 谁创建了这个边
                                                createBy: key,
                                                num: originInitial.graphIndex++,
                                            }
                                            creatAttribute = merge(creatAttribute, edgeAllAttribute)
                                            // 添加到初始属性之中
                                            originInfo[galaxyvis.id].edgeList.set(
                                                id,
                                                creatAttribute.attribute,
                                            )
                                            let groupEdge: any = new Edge(creatAttribute)
                                            groupEdge.__proto__ = galaxyvis
                                            globalInfo[galaxyvis.id].ruleList.forEach(
                                                (key, item) => {
                                                    groupEdge.addClass(item, 2, false)
                                                },
                                            )
                                            allEdgelist.set(id, groupEdge)
                                            // canvas绘制顺序
                                            if (!globalInfo[galaxyvis.id].edgeOrder.has(id)) {
                                                globalInfo[galaxyvis.id].edgeOrder.add(id)
                                            }

                                            if (allNodelist.get(node).value?.children?.length) {
                                                let nodeChilds =
                                                    allNodelist.get(node).value.children
                                                for (
                                                    let i = 0, len = nodeChilds.length;
                                                    i < len;
                                                    i++
                                                ) {
                                                    id = `gen_group_agin_${nodeChilds[i].key}_edge_${genid}` //创建唯一id
                                                    let creatAttribute = {
                                                        attribute: {
                                                            ...DEFAULT_SETTINGS.edgeAttribute,
                                                            isVisible: true,
                                                            source: nodeChilds[i].key,
                                                            target: key,
                                                            isGroup: true,
                                                            isMerge: true,
                                                        },
                                                        id,
                                                        source: nodeChilds[i].key,
                                                        target: key,
                                                        data: {},
                                                        classList: [],
                                                        // 谁创建了这个边
                                                        createBy: key,
                                                        num: originInitial.graphIndex++,
                                                    }
                                                    creatAttribute = merge(
                                                        creatAttribute,
                                                        edgeAllAttribute,
                                                    )
                                                    // 添加到初始属性之中
                                                    originInfo[galaxyvis.id].edgeList.set(
                                                        id,
                                                        creatAttribute.attribute,
                                                    )
                                                    let groupEdge: any = new Edge(creatAttribute)
                                                    groupEdge.__proto__ = galaxyvis
                                                    globalInfo[galaxyvis.id].ruleList.forEach(
                                                        (key, item) => {
                                                            groupEdge.addClass(item, 2, false)
                                                        },
                                                    )
                                                    allEdgelist.set(id, groupEdge)
                                                    // canvas绘制顺序
                                                    if (
                                                        !globalInfo[galaxyvis.id].edgeOrder.has(id)
                                                    ) {
                                                        globalInfo[galaxyvis.id].edgeOrder.add(id)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                })
                            }
                        }
                        item.changeAttribute({ isVisible: true })
                    })

                    basicData[galaxyvis.id].selectedTable = new Set()
                    basicData[galaxyvis.id].selectedEdgeTable = new Set()
                    basicData[galaxyvis.id].selectedNodes = new Set()
                    basicData[galaxyvis.id].selectedEdges = new Set()
                    let nodeList: string[] = []
                    groupNodes.forEach((item: any, key: string) => {
                        nodeList.push(item)
                    })
                    galaxyvis.events.emit('nodesUnselected', new NodeList(galaxyvis, nodeList))
                    galaxyvis.render(false)
                    resolve(new transformat(galaxyvis, changedTable, 3))
                },
                false,
            )
        })
    } catch (err: any) {
        throw new Error(err)
    }
}
/**
 * 合并边
 * @param galaxyvis
 * @param opts
 * @returns
 */
export const transformatEdgeGroup = (
    galaxyvis: any,
    opts?: any,
    isRender = true,
    isMerge = false,
): Promise<any> => {
    let { generator } = opts
    try {
        return new Promise((resolve, reject) => {
            // 获取两边之间的类型
            const { typeHash, baseTypeHash } = galaxyvis.getEdgeType()
            let edgeList = basicData[galaxyvis.id].edgeList,
                nodeList = basicData[galaxyvis.id].nodeList,
                changedTable: any[] = []
            for (let w = 0; w < 2; w++) {
                // 获取当前的Hash表
                let isHas = w == 0 ? typeHash : baseTypeHash
                if (isHas.size > 0) {
                    isHas.forEach((item: any, key: string) => {
                        //如果两点之间的边不止一条就会被操作
                        if (item.total.size > 1) {
                            let newTotal = [...item.total],
                                target,
                                source,
                                groupEdges = [],
                                children = []
                            for (let i = 0, len = newTotal.length; i < len; i++) {
                                let edgeId = newTotal[i]
                                let this_edge = edgeList.get(edgeId)
                                if (this_edge.getAttribute('isGroupEdge')) continue
                                groupEdges.push(edgeId)
                                if (i == 0 || (!target && !source)) {
                                    target = this_edge.value.target
                                    source = this_edge.value.source
                                }
                                // 当前边可见设置为false
                                this_edge.changeAttribute({
                                    isVisible: false,
                                    isSelect: false,
                                    usedMerge: true,
                                })

                                let sourceNode = nodeList.get(source),
                                    targetNode = nodeList.get(target)
                                if (
                                    sourceNode.getAttribute('isSelect') &&
                                    targetNode.getAttribute('isSelect')
                                ) {
                                    sourceNode.setSelected(false, false, true)
                                    basicData[galaxyvis.id].selectedTable.delete(source)
                                    basicData[galaxyvis.id].selectedNodes.delete(source)
                                    targetNode.setSelected(false, false, true)
                                    basicData[galaxyvis.id].selectedTable.delete(target)
                                    basicData[galaxyvis.id].selectedNodes.delete(target)
                                }

                                this_edge.setSelected(false, false, true)
                                basicData[galaxyvis.id].selectedEdgeTable.delete(edgeId)
                                basicData[galaxyvis.id].selectedEdges.delete(edgeId)

                                // 添加到子集中
                                children.push(newTotal[i])
                            }
                            let edgeAllAttribute: PlainObject<any> = {}
                            // generator过滤
                            if (typeof generator == 'function') {
                                try {
                                    edgeAllAttribute = generator(
                                        new EdgeList(galaxyvis, groupEdges),
                                    )
                                } catch (error) {
                                    reject(error)
                                }
                                if (edgeAllAttribute?.attribute)
                                    edgeAllAttribute.attribute = edgeInitAttribute(
                                        galaxyvis,
                                        edgeAllAttribute.attribute,
                                    )
                            }
                            // 创建唯一id
                            let id = `gen_group_edge_${key}`,
                                creatAttribute = {
                                    attribute: {
                                        ...DEFAULT_SETTINGS.edgeAttribute,
                                        isVisible: true,
                                        source,
                                        target,
                                        isGroupEdge: true,
                                        isMerge: true,
                                    },
                                    id,
                                    source,
                                    target,
                                    data: {},
                                    classList: [],
                                    children,
                                    num: originInitial.graphIndex++,
                                }
                            // 合并属性
                            creatAttribute = merge(creatAttribute, edgeAllAttribute)
                            // 初始化属性
                            originInfo[galaxyvis.id].edgeList.set(id, creatAttribute.attribute)
                            let groupEdge: any = new Edge(creatAttribute)
                            groupEdge.__proto__ = galaxyvis
                            globalInfo[galaxyvis.id].ruleList.forEach((key, item) => {
                                groupEdge.addClass(item, 2, false)
                            })
                            edgeList.set(id, groupEdge)
                            globalInfo[galaxyvis.id].edgeOrder.add(id)
                            changedTable[changedTable.length] = id
                        }
                    })
                }
            }
            if (isRender) galaxyvis.render()

            resolve(new transformat(galaxyvis, changedTable, 4, isMerge))
        })
    } catch (err: any) {
        throw new Error(err)
    }
}
