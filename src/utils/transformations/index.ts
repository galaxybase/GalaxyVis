import { cloneDeep, defaultsDeep, find, isString, merge } from 'lodash'
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
    let GraphId = galaxyvis.id
    let { nodeList, edgeList, selectedTable, selectedNodes, selectedEdgeTable, selectedEdges } = basicData[GraphId],
        relationTable = galaxyvis.getEdgeType().relationTable, //获取关联表
        changedTable: string[] = [] //更改的数据id表
    nodeList.forEach((item: any, key: string) => {
        // 匹配规则
        if (!criteria(item) && item.getAttribute('isVisible')) {
            // 获取当前边的关联关系
            let edgelist = relationTable[key]
            if (edgelist) {
                edgelist.forEach((item: any) => {
                    if (edgeList.has(item)) {
                        // 获取起始点和终止点
                        let { source, target } = edgeList.get(item).getAttribute()
                        nodeList.get(source).setSelected(false, false, true)
                        selectedTable.delete(source)
                        selectedNodes.delete(source)
                        nodeList.get(target).setSelected(false, false, true)
                        selectedTable.delete(target)
                        selectedNodes.delete(target)
                        // 是否是从过滤点那边影响到的隐藏边
                        edgeList.get(item).changeAttribute({
                            isVisible: false,
                            isFilterNode: true,
                            isSelect: false,
                        })
                        edgeList.get(item).setSelected(false, false, true)
                        selectedEdgeTable.delete(item)
                        selectedEdges.delete(item)
                    }
                })
            }
            // 设置为不可见
            item.changeAttribute({
                isVisible: false,
                isFilter: true
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
    let GraphId = galaxyvis.id;
    let { nodeList, edgeList, selectedTable, selectedNodes, selectedEdgeTable, selectedEdges } = basicData[GraphId],
        changedTable: string[] = [] //更改的数据id表

    edgeList.forEach((item: any, key: string) => {
        if (!criteria(item)) {
            if ((!item.getAttribute('isFilter') &&
                !item.getAttribute('usedMerge'))) {
                let { source, target } = item.getAttribute()
                nodeList.get(source).setSelected(false, false, true)
                selectedTable.delete(source)
                selectedNodes.delete(source)
                nodeList.get(target).setSelected(false, false, true)
                selectedTable.delete(target)
                selectedNodes.delete(target)
                // 是否是从过滤点那边影响到的隐藏边
                item.changeAttribute({
                    isVisible: false,
                    isFilter: true,
                    isSelect: false,
                })
                edgeList.get(key).setSelected(false, false, true)
                selectedEdgeTable.delete(key)
                selectedEdges.delete(key)
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
export const transformatNodeGroup = (galaxyvis: any, opts?: any) => {
    let {
        duration = 0,
        edgeGenerator, //边样式
        nodeGenerator, //点样式
        selector, //哪些点被选中
        groupIdFunction, //分组再细分
        reserve, //保留边
        createSelfLoop, //生成自环边
    } = opts
    let changedTable: string[] = [] //需要更改的数据
    try {
        return new Promise((resolve, reject) => {
            // 创建一个唯一id
            let genid = genID(4)
            let GraphId = galaxyvis.id;
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
            let { nodeList: allNodelist, edgeList: allEdgelist } = basicData[GraphId],
                edgeAllAttribute: PlainObject<any> = {} //边合并的属性
            if (typeof edgeGenerator == 'function') {
                try {
                    edgeAllAttribute = edgeGenerator(allEdgelist)
                } catch (err) {
                    reject(err)
                }
                if (edgeAllAttribute?.attribute)
                    edgeAllAttribute.attribute = edgeInitAttribute(
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
                originInfo[GraphId].nodeList.set(i, creatAttribute.attribute)
                // 添加rule
                globalInfo[GraphId].ruleList.forEach((key, item) => {
                    groupNodes.addClass(item, 2, false)
                })
                // 记录当前点id
                changedTable[changedTable.length] = i
                allNodelist.set(i, groupNodes)
                groupNode.set(i, groupNodes)
                // canvas绘制顺序
                if (!globalInfo[GraphId].nodeOrder.has(i)) {
                    globalInfo[GraphId].nodeOrder.add(i)
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
                    let relationTable = galaxyvis.getRelationTable();
                    let usedEdges = new Set()
                    groupNode.forEach((item: any, key: string) => {
                        let children = item.value.children
                        let group = item
                        for (let index = 0, len = children.length; index < len; index++) {
                            let keys = children[index].key,
                                edgelist = relationTable[keys]
                            // 处理合并点相关联的边
                            if (edgelist) {
                                edgelist.forEach((item: any) => {
                                    if (
                                        thisEdges.has(item) &&
                                        !usedEdges.has(item) &&
                                        thisEdges.get(item).getAttribute('isVisible')
                                    ) {
                                        usedEdges.add(item);
                                        let edge = thisEdges.get(item)
                                        edge.changeAttribute({
                                            isVisible: false,
                                            isSelect: false,
                                            useMergeEdge: true,
                                        })
                                        // 保留原始边
                                        if (reserve) {
                                            let id = `gen_group_${item}_edge_${genid}`;

                                            let target = isString(edge.value?.target) ? edge.value?.target : edge.getTarget()?.getId()
                                            let source = isString(edge.value?.source) ? edge.value?.source : edge.getSource()?.getId()

                                            // let source = edge.getSource()?.getId() || edge.value?.source?.getId(),
                                            //     target = edge.getTarget()?.getId() || edge.value?.target?.getId();
                                            let data = edge.getData();
                                            let sourceNode, targetNode;

                                            let checkSource = find(children, (child) => {
                                                return child.key == source
                                            })

                                            let checkTarget = find(children, (child) => {
                                                return child.key == target
                                            })
                                            // 2个都对上
                                            let isCreate = true, whereIn = 0;
                                            if (checkSource && checkTarget) {
                                                // 是否创建自环边
                                                if (createSelfLoop) {
                                                    source = key;
                                                    target = key;
                                                } else {
                                                    isCreate = false
                                                }
                                                sourceNode = group;
                                                targetNode = group;
                                            } else if (checkTarget) {
                                                // 如果终点被合并 起始点 + 合并点
                                                target = key;
                                                sourceNode = thisNodes.get(source);
                                                targetNode = group;
                                                whereIn = 1;
                                            } else if (checkSource) {
                                                // 如果起始点被合并 合并点 + 终点
                                                source = key;
                                                sourceNode = group;
                                                targetNode = thisNodes.get(target);
                                                whereIn = 2;
                                            } else {
                                                isCreate = false
                                            }
                                            if (isCreate) {
                                                let edgeChildren: any[] = thisEdges.get(item)?.value?.children || [];

                                                let func = (
                                                    source: any, target: any, child: any[],
                                                    add: boolean = true, ids?: any, attributes?: any, datas?: any
                                                ) => {
                                                    let genid = genID(4)
                                                    let id = ids ? ids : `${key}_edge_${genid}`;
                                                    let cloneEdge = cloneDeep(
                                                        attributes ? attributes :
                                                            edge.getAttribute()
                                                    )

                                                    let cloneEdgeAttr = {
                                                        ...cloneEdge,
                                                        isVisible: false,
                                                        source,
                                                        target,
                                                    }

                                                    let nowcreatAttribute = {
                                                        attribute: cloneEdgeAttr,
                                                        id,
                                                        source,
                                                        target,
                                                        data,
                                                        classList: [],
                                                        // 谁创建了这个边
                                                        createBy: key,
                                                        children: child,
                                                        num: originInitial.graphIndex++,
                                                    }

                                                    originInfo[GraphId].edgeList.set(
                                                        id,
                                                        cloneEdgeAttr,
                                                    )
                                                    let groupEdge: any = new Edge(nowcreatAttribute)
                                                    groupEdge.__proto__ = galaxyvis

                                                    if (datas) {
                                                        groupEdge.value.data = datas
                                                    }

                                                    globalInfo[GraphId].ruleList.forEach(
                                                        (key, item) => {
                                                            groupEdge.addClass(item, 2, false)
                                                        },
                                                    )
                                                    allEdgelist.set(id, groupEdge)
                                                    // canvas绘制顺序
                                                    if (!globalInfo[GraphId].edgeOrder.has(id)) {
                                                        globalInfo[GraphId].edgeOrder.add(id)
                                                    }
                                                    add && edgeChildren.push(id) && (edgeChildren = [...new Set(edgeChildren)])
                                                }

                                                if (whereIn == 1 && sourceNode?.value.children?.length) {
                                                    let sourceChildren = sourceNode.value.children;
                                                    for (let i = 0; i < sourceChildren.length; i++) {
                                                        let sourceNode = sourceChildren[i].key;
                                                        let originEdgeId = edge.value.createBy;
                                                        let originEdge = allEdgelist.get(originEdgeId);
                                                        if (originEdge) {
                                                            let originSourceNode = originEdge.getSource()?.getId();

                                                            if (originSourceNode == sourceNode) {
                                                                func(sourceNode, key, [], false)
                                                            }
                                                        }
                                                    }
                                                }

                                                if (whereIn == 2 && targetNode?.value.children?.length) {
                                                    let targetChildren = targetNode.value.children;
                                                    for (let i = 0; i < targetChildren.length; i++) {
                                                        let targetNode = targetChildren[i].key;
                                                        let originEdgeId = edge.value.createBy;
                                                        let originEdge = allEdgelist.get(originEdgeId);
                                                        if (originEdge) {
                                                            let originTargetNode = originEdge.getTarget()?.getId();

                                                            if (originTargetNode == targetNode) {
                                                                func(key, targetNode, [], false)
                                                            }
                                                        }
                                                    }
                                                }

                                                if (edgeChildren.length) {
                                                    let edgeChildrenLen = cloneDeep(edgeChildren.length);
                                                    for (let i = 0; i < edgeChildrenLen; i++) {
                                                        let edgechild = allEdgelist.get(edgeChildren[i]);
                                                        let source = edgechild.getSource()?.getId() || edgechild.value?.source?.getId(),
                                                            target = edgechild.getTarget()?.getId() || edgechild.value?.target?.getId();
                                                        let checkSource = find(children, (child) => {
                                                            return child.key == source
                                                        })

                                                        let checkTarget = find(children, (child) => {
                                                            return child.key == target
                                                        })
                                                        let child = edgechild.value.children || []
                                                        let childData = edgechild.getData()

                                                        if (checkSource) {
                                                            func(key, target, child, true, edgechild.getId(), cloneDeep(edgechild.getAttribute()), childData)
                                                        } else if (checkTarget) {
                                                            func(source, key, child, true, edgechild.getId(), cloneDeep(edgechild.getAttribute()), childData)
                                                        }
                                                    }
                                                }

                                                let creatAttribute = {
                                                    attribute: {
                                                        ...edge.getAttribute(),
                                                        isVisible: true,
                                                        source,
                                                        target,
                                                        isGroup: true,
                                                        isMerge: true,
                                                        useMergeEdge: undefined
                                                    },
                                                    id,
                                                    source,
                                                    target,
                                                    data,
                                                    classList: [],
                                                    // 谁创建了这个边
                                                    createBy: edge.getId(),
                                                    children: edgeChildren, //子集
                                                    num: originInitial.graphIndex++,
                                                }
                                                originInfo[GraphId].edgeList.set(
                                                    id,
                                                    creatAttribute.attribute,
                                                )
                                                let groupEdge: any = new Edge(creatAttribute)
                                                groupEdge.__proto__ = galaxyvis
                                                globalInfo[GraphId].ruleList.forEach(
                                                    (key, item) => {
                                                        groupEdge.addClass(item, 2, false)
                                                    },
                                                )
                                                allEdgelist.set(id, groupEdge)
                                                // canvas绘制顺序
                                                if (!globalInfo[GraphId].edgeOrder.has(id)) {
                                                    globalInfo[GraphId].edgeOrder.add(id)
                                                }

                                                try {
                                                    if (globalInfo[GraphId].mergeEdgesTransformat) {
                                                        let { transformat, options } = globalInfo[GraphId].mergeEdgesTransformat
                                                        transformat.destroy(true, 0, false).then(async () => {
                                                            await galaxyvis.transformations.addEdgeGrouping(options, false)
                                                        })
                                                    }
                                                } catch { }

                                            }
                                        }
                                    }
                                })
                            }
                            thisNodes.get(keys).changeAttribute({
                                isVisible: false,
                                useMergeNode: true,
                            })
                            thisNodes.get(keys).setSelected(false, false, true)
                        }
                        if (!reserve) {
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
                                                originInfo[GraphId].edgeList.set(
                                                    id,
                                                    creatAttribute.attribute,
                                                )
                                                let groupEdge: any = new Edge(creatAttribute)
                                                groupEdge.__proto__ = galaxyvis
                                                globalInfo[GraphId].ruleList.forEach(
                                                    (key, item) => {
                                                        groupEdge.addClass(item, 2, false)
                                                    },
                                                )
                                                allEdgelist.set(id, groupEdge)
                                                // canvas绘制顺序
                                                if (!globalInfo[GraphId].edgeOrder.has(id)) {
                                                    globalInfo[GraphId].edgeOrder.add(id)
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
                                                        originInfo[GraphId].edgeList.set(
                                                            id,
                                                            creatAttribute.attribute,
                                                        )
                                                        let groupEdge: any = new Edge(creatAttribute)
                                                        groupEdge.__proto__ = galaxyvis
                                                        globalInfo[GraphId].ruleList.forEach(
                                                            (key, item) => {
                                                                groupEdge.addClass(item, 2, false)
                                                            },
                                                        )
                                                        allEdgelist.set(id, groupEdge)
                                                        // canvas绘制顺序
                                                        if (
                                                            !globalInfo[GraphId].edgeOrder.has(id)
                                                        ) {
                                                            globalInfo[GraphId].edgeOrder.add(id)
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    })
                                }
                            }
                        }

                        item.changeAttribute({ isVisible: true })
                    })

                    basicData[GraphId].selectedTable = new Set()
                    basicData[GraphId].selectedEdgeTable = new Set()
                    basicData[GraphId].selectedNodes = new Set()
                    basicData[GraphId].selectedEdges = new Set()
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
export const transformatEdgeGroup = (galaxyvis: any, opts?: any, isRender = true, isMerge = false) => {
    let { generator, selector } = opts
    try {
        return new Promise((resolve, reject) => {
            // 获取两边之间的类型
            const { typeHash, baseTypeHash } = galaxyvis.getEdgeType()
            let GraphId = galaxyvis.id;
            let { edgeList, nodeList, selectedTable, selectedNodes, selectedEdgeTable, selectedEdges } = basicData[GraphId],
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
                                if (this_edge.getAttribute('isGroupEdge')) continue;
                                if (selector && !selector(this_edge)) continue;
                                groupEdges.push(edgeId)
                                if (i == 0 || (!target && !source)) {
                                    target = isString(this_edge.value.target) ? this_edge.value.target : this_edge.value.target.getId()
                                    source = isString(this_edge.value.source) ? this_edge.value.source : this_edge.value.source.getId()
                                }
                                // 当前边可见设置为false
                                this_edge.changeAttribute({
                                    isVisible: false,
                                    isSelect: false,
                                    usedMerge: true,
                                })
                                let sourceNode = nodeList.get(source),
                                    targetNode = nodeList.get(target);
                                if (
                                    sourceNode.getAttribute('isSelect') &&
                                    targetNode.getAttribute('isSelect')
                                ) {
                                    sourceNode.setSelected(false, false, true)
                                    selectedTable.delete(source)
                                    selectedNodes.delete(source)
                                    targetNode.setSelected(false, false, true)
                                    selectedTable.delete(target)
                                    selectedNodes.delete(target)
                                }

                                this_edge.setSelected(false, false, true)
                                selectedEdgeTable.delete(edgeId)
                                selectedEdges.delete(edgeId)
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
                            if (children.length > 1) {
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
                                originInfo[GraphId].edgeList.set(id, creatAttribute.attribute)
                                let groupEdge: any = new Edge(creatAttribute)
                                groupEdge.__proto__ = galaxyvis
                                globalInfo[GraphId].ruleList.forEach((key, item) => {
                                    groupEdge.addClass(item, 2, false)
                                })
                                edgeList.set(id, groupEdge)
                                globalInfo[GraphId].edgeOrder.add(id)
                                changedTable[changedTable.length] = id
                            } else if (children.length == 1) {
                                let id = children[0];
                                let this_edge = edgeList.get(id)
                                let target = isString(this_edge.value.target) ? this_edge.value.target : this_edge.value.target.getId()
                                let source = isString(this_edge.value.source) ? this_edge.value.source : this_edge.value.source.getId()
                                let sourceNode = nodeList.get(source)?.getAttribute("isVisible"),
                                    targetNode = nodeList.get(target)?.getAttribute("isVisible");
                                if (sourceNode && targetNode)
                                    this_edge.changeAttribute({
                                        isVisible: true,
                                        isSelect: false,
                                        usedMerge: false,
                                    })
                            }
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
