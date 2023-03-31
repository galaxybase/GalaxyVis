import { animateNodes } from '../graphAnimate'
import { cloneDeep, defaultsDeep, isString } from 'lodash'
import { basicData, globalInfo } from '../../initial/globalProp'
import NodeList from '../../classes/nodeList'
import { genID } from '..'
import { transformatAddEdgeFilter, transformatAddNodeFilter, transformatEdgeGroup } from '.'
import EdgeList from '../../classes/edgeList'
import { originInfo } from '../../initial/originInitial'

export class transformat<T, K> {
    private galaxyvis: any
    public changed: any[] //改变的数据
    private type: number = 1 //类型
    private toggleFlag: boolean = true //撤回的数据
    private geoEdge: Map<string, any> = new Map() //记录边
    public id: string

    private subEdges: any
    private subNodes: any
    public isMerge: boolean
    constructor(galaxyvis: any, changed: any[], type: number, isMerge: boolean = false) {
        this.changed = changed
        this.type = type
        this.galaxyvis = galaxyvis
        this.id = 'transformat_id_by_' + genID(4)
        this.geoEdge = new Map()
        this.isMerge = isMerge
        let { nodeList: basicNodeList, edgeList: basicEdgeList } = basicData[this.galaxyvis.id]

        if (type == 1) this.subNodes = new NodeList(galaxyvis, this.changed)
        else if (type == 2) this.subEdges = new EdgeList(galaxyvis, this.changed)
        else if (type == 3) {
            let nodes: any[] = [],
                edges: any[] = []
            let relationTable: any = this.galaxyvis.getRelationTable()
            for (let index = 0, len = this.changed.length; index < len; index++) {
                let targetNode = basicNodeList.get(this.changed[index]),
                    children = targetNode?.value.children
                for (let i = 0, len = children.length; i < len; i++) {
                    nodes.push(children[i].key)
                    let groupEdgeList = relationTable[children[i].key]
                    groupEdgeList?.forEach((item: any) => {
                        let edge = basicEdgeList.get(item)
                        edge && edges.push(item)
                    })
                }
            }
            this.subNodes = new NodeList(galaxyvis, nodes)
            this.subEdges = new EdgeList(galaxyvis, edges)
        } else if (type == 4) {
            let edges: any = new Set()
            for (let index = 0, len = this.changed.length; index < len; index++) {
                const key = this.changed[index]
                let item = basicEdgeList.get(key)
                let children = item.value?.children
                for (let j = 0; j < children.length; j++) {
                    let edge = basicEdgeList.get(children[j])
                    edge && edges.add(children[j])
                }
            }
            this.subEdges = new EdgeList(galaxyvis, [...edges])
        }
    }
    /**
     * 返回第一次解析转换后的promise
     * @returns
     */
    public whenApplied = () => {
        var promise = new Promise((resolve, reject) => {
            resolve((): void => { })
        })
        return promise
    }

    /**
     * 删除转换
     */
    public destroy = (update: boolean = true, duration?: number, isRender: boolean = true) => {
        duration = duration == 0 ? 0 : 500
        return new Promise((resolve, reject) => {
            const graphId = this.galaxyvis.id
            let relationTable: any = this.galaxyvis.getRelationTable() //关联数据表
            let { edgeList, nodeList } = basicData[graphId]
            let basicNodeList = basicData[graphId].nodeList
            let basicEdgeList = basicData[graphId].edgeList
            // 策略模式
            let destroyStrategic: { [key: string]: Function } = {
                1: () => {
                    let hasMergeFlag = false

                    if (globalInfo[graphId].mergeEdgesTransformat) {
                        hasMergeFlag = true
                    }

                    for (let index = 0, len = this.changed.length; index < len; index++) {
                        const key = this.changed[index]
                        let edgelist = relationTable[key]
                        // 处理关联边
                        if (edgelist) {
                            let arrMerge: any[] = []
                            if (!hasMergeFlag) {
                                edgelist?.forEach((item: any) => {
                                    let edge = basicEdgeList.get(item)
                                    if (edge?.getAttribute('isGroupEdge')) {
                                        arrMerge.push(item)
                                    }
                                })
                            } else {
                                edgelist?.forEach((item: any) => {
                                    let edge = basicEdgeList.get(item)
                                    let children = edge.value?.children
                                    if (edge?.getAttribute('isGroupEdge') && children.length) {
                                        arrMerge.push(...children)
                                    }
                                })
                            }

                            edgelist?.forEach((item: any) => {
                                let edge = basicEdgeList.get(item)
                                if (edge?.getAttribute('isFilter') == true) {
                                    edge.changeAttribute({
                                        isFilterNode: false,
                                    })
                                } else {
                                    if (edge && arrMerge.indexOf(item) == -1) {
                                        edge.changeAttribute({
                                            isVisible: true,
                                            isFilterNode: false,
                                        })
                                    }
                                }
                                edge && edge.changeAttribute({
                                    isFilterNode: false,
                                })
                            })
                        }

                        let item = nodeList.get(key)

                        let useMergeNode = item?.getAttribute('useMergeNode')

                        if (item && !useMergeNode)
                            item.changeAttribute({
                                isVisible: true,
                                isFilter: false
                            })
                    }
                    if (update) {
                        globalInfo[graphId].filterNodesTransformat?.delete(this.id)
                    }
                    try {
                        if (globalInfo[graphId].mergeEdgesTransformat) {
                            let { transformat, options } = globalInfo[graphId].mergeEdgesTransformat
                            transformat.isMerge = true
                            transformat.destroy(true, 0, false).then(async () => {
                                await this.galaxyvis.transformations.addEdgeGrouping(options, false)
                                globalInfo[graphId].mergeEdgesTransformat.transformat.isMerge = false
                            })
                        }
                    } catch { }
                    if (isRender)
                        this.galaxyvis.render(false)
                    resolve((): void => { })
                },
                2: () => {
                    let hasMergeFlag = false,
                        arrMerge: any[] = []

                    if (globalInfo[graphId].mergeEdgesTransformat) {
                        hasMergeFlag = true
                    }

                    if (hasMergeFlag) {
                        let { changed } =
                            globalInfo[graphId].mergeEdgesTransformat.transformat

                        for (let index = 0, len = changed.length; index < len; index++) {
                            const key = changed[index]
                            let item = edgeList.get(key)
                            let children = item.value?.children
                            if (item && item.getAttribute('isGroupEdge') && children.length) {
                                arrMerge.push(...children)
                            }
                        }
                    }

                    for (let index = 0, len = this.changed.length; index < len; index++) {
                        const key = this.changed[index]
                        let item = edgeList.get(key)

                        if (!item) {
                            continue
                        }

                        if (item.getAttribute('isFilterNode') == true) {
                            item.changeAttribute({
                                isFilter: false,
                            })
                        } else {
                            if (!item.getAttribute('isMerge') && arrMerge.indexOf(key) == -1)
                                item.changeAttribute({
                                    isVisible: true,
                                    isFilter: false,
                                })
                            else if (!item.getAttribute('isMerge')) {
                                item.changeAttribute({
                                    isFilter: false,
                                })
                            }
                            let sourceNode = item.getSource()
                            let targetNode = item.getTarget()
                            if (sourceNode.getAttribute('isVisible') && targetNode.getAttribute('isVisible')) {
                                if (sourceNode.getAttribute('isGroupNode') || targetNode.getAttribute('isGroupNode')) {
                                    item.changeAttribute({
                                        isVisible: true,
                                        isFilter: false,
                                    })
                                }
                            }
                        }
                    }
                    if (update)
                        globalInfo[graphId].filterEdgesTransformat?.delete(this.id)

                    try {
                        if (globalInfo[graphId].mergeEdgesTransformat) {
                            let { transformat, options } = globalInfo[graphId].mergeEdgesTransformat
                            transformat.isMerge = true
                            transformat.destroy(true, 0, false).then(async () => {
                                await this.galaxyvis.transformations.addEdgeGrouping(options, false)
                                globalInfo[graphId].mergeEdgesTransformat.transformat.isMerge = false
                            })
                        }
                    } catch { }
                    if (isRender)
                        this.galaxyvis.render(false)
                    resolve((): void => { })
                },
                3: () => {
                    let allNodelist = basicNodeList,
                        allEdgelist = basicEdgeList,
                        target: { [k: string]: any } = {},
                        this_Nodes = defaultsDeep(this.galaxyvis.getFilterNode()), // 深拷贝一份数据 防止污染
                        hasMergeFlag = false,
                        mergeEageTable: any[] = [],
                        mergeEdge: any[] = []
                    this_Nodes?.forEach((item: any, key: string) => {
                        target[key] = {
                            x: item.getAttribute('x'),
                            y: item.getAttribute('y'),
                        }
                    })
                    if (globalInfo[graphId].mergeEdgesTransformat) {
                        hasMergeFlag = true
                    }
                    for (let index = 0, len = this.changed.length; index < len; index++) {
                        let targetNode = allNodelist.get(this.changed[index]),
                            children = targetNode?.value.children
                        if (targetNode) {
                            targetNode.changeAttribute({ isVisible: false, isSelect: false })
                            // 恢复子集元素
                            for (let j = 0, len = children.length; j < len; j++) {
                                let childrenNode = allNodelist.get(children[j].key)
                                if (childrenNode) {
                                    childrenNode.changeAttribute({
                                        isVisible: true,
                                        useMergeNode: false,
                                    })
                                    allNodelist.get(children[j].key).value.attribute.isVisible =
                                        true
                                }
                            }
                        }
                    }
                    for (let index = 0, len = this.changed.length; index < len; index++) {
                        let targetNode = allNodelist.get(this.changed[index]),
                            children = targetNode.value.children,
                            groupEdgeList = relationTable[this.changed[index]] // 处理合并的边
                        groupEdgeList?.forEach((item: any) => {
                            let edge = allEdgelist.get(item)
                            if (edge) {
                                edge.changeAttribute({ isVisible: false })
                                edge.setSelected(false, false, true)
                                this.geoEdge.set(item, edge)
                            }
                        })
                        // 恢复子集元素
                        for (let j = 0, len = children.length; j < len; j++) {
                            let childrenNode = allNodelist.get(children[j].key),
                                edgeList = relationTable[children[j].key]
                            if (!childrenNode) continue
                            childrenNode.changeAttribute({
                                x: targetNode.getAttribute('x'),
                                y: targetNode.getAttribute('y'),
                            })
                            // 更新被合并的点的位置
                            target[children[j].key] = cloneDeep({
                                x: children[j].x,
                                y: children[j].y,
                            })

                            if (hasMergeFlag) {
                                edgeList?.forEach((item: any) => {
                                    let edge = allEdgelist.get(item)
                                    if (
                                        edge &&
                                        edge.getAttribute('isGroupEdge') &&
                                        edge.value?.children?.length
                                    ) {
                                        mergeEageTable.push(...edge.value.children)
                                        mergeEdge.push(item)
                                    }
                                })
                            }

                            edgeList?.forEach((item: any) => {
                                let edge = allEdgelist.get(item)
                                let flag = false
                                if (
                                    edge &&
                                    allNodelist
                                        .get(edge.value?.source)
                                        ?.getAttribute('isVisible') &&
                                    allNodelist.get(edge.value?.target)?.getAttribute('isVisible')
                                )
                                    flag = true

                                if (edge && !edge.getAttribute('isVisible') && flag) {
                                    if (!hasMergeFlag && !edge.getAttribute('isGroupEdge')) {
                                        edge.changeAttribute({ isVisible: true, useMergeEdge: false })
                                    } else if (hasMergeFlag && mergeEageTable.indexOf(item) == -1) {
                                        edge.changeAttribute({ isVisible: true, useMergeEdge: false })
                                    }
                                }
                                if (
                                    !hasMergeFlag &&
                                    edge &&
                                    edge.getAttribute('isGroupEdge') &&
                                    edge.value?.children?.length
                                ) {
                                    for (
                                        let j = 0, len = edge.value?.children.length;
                                        j < len;
                                        j++
                                    ) {
                                        let mergeEdge = allEdgelist.get(edge.value?.children[j])
                                        let sourceNode = mergeEdge?.getSource()
                                        let targetNode = mergeEdge?.getTarget()
                                        if (
                                            mergeEdge &&
                                            (sourceNode?.getAttribute('isVisible') &&
                                                targetNode?.getAttribute('isVisible')) ||
                                            (sourceNode?.getAttribute('isFilter') &&
                                                targetNode?.getAttribute('isFilter'))
                                        ) {
                                            mergeEdge.changeAttribute({ isVisible: true, usedMerge: false, useMergeEdge: false })
                                        }
                                    }
                                }
                            })
                        }
                    }

                    if (hasMergeFlag && globalInfo[graphId].mergeEdgesTransformat) {
                        let { transformat } =
                            globalInfo[graphId].mergeEdgesTransformat
                        transformat.changed?.push(...mergeEdge)
                    }

                    if (globalInfo[graphId].filterNodesTransformat?.size) {
                        let filterNodes = globalInfo[graphId].filterNodesTransformat
                        filterNodes!.forEach(async (item: any, key: string) => {
                            let { transformat, options } = item
                            await transformat.destroy(false).then(() => {
                                let transFilter = transformatAddNodeFilter(
                                    this.galaxyvis,
                                    options,
                                    false,
                                )
                                transformat.update(transFilter.changed)
                            })
                        })
                    }

                    if (globalInfo[graphId].filterEdgesTransformat?.size) {
                        let filterEdges = globalInfo[graphId].filterEdgesTransformat
                        filterEdges!.forEach(async (item: any, key: string) => {
                            let { transformat, options } = item
                            transformat.hasMergeFlag = hasMergeFlag
                            await transformat.destroy(false).then(() => {
                                let transFilter = transformatAddEdgeFilter(
                                    this.galaxyvis,
                                    options,
                                    false,
                                )
                                transformat.update(transFilter.changed)
                            })
                        })
                    }

                    if (hasMergeFlag && globalInfo[graphId].mergeEdgesTransformat) {
                        let { transformat, options } =
                            globalInfo[graphId].mergeEdgesTransformat
                        transformat.destroy(false).then(() => {
                            transformatEdgeGroup(this.galaxyvis, options, false).then(
                                (data: any) => {
                                    let changed = data.changed
                                    changed?.push(...mergeEdge)
                                    transformat.changed = changed
                                    globalInfo[graphId].mergeEdgesTransformat = {
                                        transformat,
                                        options,
                                    }
                                },
                            )
                        })
                    }
                    // 动画效果
                    animateNodes(
                        this.galaxyvis,
                        target,
                        { duration },
                        () => {
                            basicData[graphId].selectedTable = new Set()
                            basicData[graphId].selectedEdgeTable = new Set()
                            basicData[graphId].selectedNodes = new Set()
                            basicData[graphId].selectedEdges = new Set()
                            globalInfo[graphId].mergeNodesTransformat = new Map()
                            this.galaxyvis.events.emit(
                                'nodesUnselected',
                                new NodeList(this.galaxyvis, []),
                            )
                            resolve((): void => { })
                        },
                        false,
                    )
                },
                4: () => {
                    if (update && isRender) {
                        this.isMerge = false
                        basicEdgeList.forEach((value, key) => {
                            if (value.getAttribute('isGroupEdge') &&
                                (value.getAttribute('isVisible') || value.getAttribute('isFilter')))
                                this.changed.push(key)
                        })
                    }
                    if (globalInfo[graphId].mergeEdgesTransformat && !this.isMerge) {
                        let { transformat } = globalInfo[graphId].mergeEdgesTransformat
                        let concatChanged = this.changed.concat(transformat.changed)
                        this.changed = [...new Set(concatChanged)];
                    }

                    for (let index = 0, len = this.changed.length; index < len; index++) {
                        const key = this.changed[index]
                        let item = edgeList.get(key)
                        let sourceNode = item.getSource()
                        let targetNode = item.getTarget()
                        let flag = false;
                        if (!sourceNode || !targetNode) continue;
                        if (
                            (sourceNode.getAttribute('isVisible') &&
                                targetNode.getAttribute('isVisible')) ||
                            (sourceNode.getAttribute('isFilter') &&
                                targetNode.getAttribute('isFilter')
                            )
                        ) {
                            if ((sourceNode.getAttribute('isFilter') &&
                                targetNode.getAttribute('isFilter')
                            ))
                                flag = true;
                            item.changeAttribute({
                                isVisible: false,
                            })
                            item.setSelected(false, false, true)
                            let children = item.value.children

                            for (let j = 0; j < children.length; j++) {
                                let item = edgeList.get(children[j])
                                item.changeAttribute({
                                    isVisible: true,
                                    usedMerge: flag ? false : this.isMerge,
                                })
                            }
                        }
                    }
                    if (update) {
                        globalInfo[graphId].mergeEdgesTransformat = null
                    }

                    if (globalInfo[graphId].filterEdgesTransformat?.size && !this.isMerge) {
                        let filterEdges = globalInfo[graphId].filterEdgesTransformat
                        filterEdges!.forEach((item: any, key: string) => {
                            let { transformat, options } = item
                            transformat.destroy(false, 0, false).then(() => {
                                let transFilter = transformatAddEdgeFilter(
                                    this.galaxyvis,
                                    options,
                                    false,
                                )
                                transformat.update(transFilter.changed)
                            })
                        })
                    }

                    basicData[graphId].selectedTable = new Set()
                    basicData[graphId].selectedEdgeTable = new Set()
                    basicData[graphId].selectedNodes = new Set()
                    basicData[graphId].selectedEdges = new Set()
                    if (isRender)
                        this.galaxyvis.render(false)
                    resolve((): void => { })
                },
            }
            try {
                destroyStrategic[this.type]()
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * 隐藏/显示
     * @param duration
     * @returns
     */
    public toggle = (duration?: number) => {
        duration = duration || 0
        if (this.toggleFlag) {
            this.toggleFlag = false
            return this.destroy(true, duration)
        } else {
            return new Promise((reslove, reject) => {
                const graphId = this.galaxyvis.id
                let relationTable: any = this.galaxyvis.getEdgeType().relationTable,
                    allNodelist = basicData[graphId].nodeList,
                    allEdgelist = basicData[graphId].edgeList
                // 策略模式
                let toggleStrategic: { [key: string]: Function } = {
                    1: () => {
                        for (let index = 0, len = this.changed.length; index < len; index++) {
                            let targetNode = allNodelist.get(this.changed[index]),
                                groupEdgeList = relationTable[this.changed[index]]
                            groupEdgeList?.forEach((item: any) => {
                                allEdgelist.get(item)?.changeAttribute({
                                    isVisible: false,
                                    isFilterNode: true,
                                    isSelect: false,
                                })
                            })
                            targetNode?.changeAttribute({
                                isVisible: false,
                            })
                        }
                    },
                    2: () => {
                        for (let index = 0, len = this.changed.length; index < len; index++) {
                            let targetEdge = allEdgelist.get(this.changed[index])
                            let { source, target } = targetEdge.getAttribute()
                            allNodelist.get(source)?.changeAttribute({
                                isSelect: false,
                            })
                            allNodelist.get(target)?.changeAttribute({
                                isSelect: false,
                            })
                            targetEdge?.changeAttribute({
                                isVisible: false,
                                isFilter: true,
                                isSelect: false,
                            })
                        }
                    },
                    3: () => {
                        for (let index = 0, len = this.changed.length; index < len; index++) {
                            let targetNode = allNodelist.get(this.changed[index]),
                                children = targetNode.value?.children // 处理子集
                            targetNode?.changeAttribute({ isVisible: true })
                            targetNode?.setSelected(false, false, true)
                            for (let j = 0, len = children.length || 0; j < len; j++) {
                                let childrenNode = allNodelist.get(children[j].key)
                                childrenNode?.changeAttribute({
                                    isVisible: false,
                                })
                                let edgeList = relationTable[children[j].key]
                                edgeList?.forEach((item: any) => {
                                    let edge = allEdgelist.get(item)
                                    if (edge?.getAttribute('isVisible')) {
                                        edge?.changeAttribute({
                                            isVisible: false,
                                        })
                                    }
                                })
                            }
                            // 处理边集合
                            this.geoEdge?.forEach((item: any, key: string) => {

                                let target = isString(item.value?.target) ? item.getTarget() : item.value?.target
                                let source = isString(item.value?.source) ? item.getSource() : item.value?.source

                                let sourceNodeVisible = source?.getAttribute('isVisible');
                                let targetNodeVisible = target?.getAttribute('isVisible');

                                if (sourceNodeVisible && targetNodeVisible) {
                                    if (globalInfo[graphId].mergeEdgesTransformat && item.getAttribute('isGroupEdge')) {
                                        item?.changeAttribute({ isVisible: true })
                                        basicData[graphId].edgeList.set(key, item)
                                        originInfo[graphId].edgeList.set(key, item.getAttribute())
                                    } else if (!globalInfo[graphId].mergeEdgesTransformat && !item.getAttribute('isGroupEdge')) {
                                        item?.changeAttribute({ isVisible: true })
                                        basicData[graphId].edgeList.set(key, item)
                                        originInfo[graphId].edgeList.set(key, item.getAttribute())
                                    }
                                }
                            })
                        }
                        if (globalInfo[graphId].mergeEdgesTransformat) {
                            let { transformat, options } =
                                globalInfo[graphId].mergeEdgesTransformat
                            transformat.destroy(false).then(() => {
                                transformatEdgeGroup(this.galaxyvis, options, false).then(
                                    (data: any) => {
                                        let changed = data.changed
                                        transformat.changed = changed
                                        globalInfo[graphId].mergeEdgesTransformat = {
                                            transformat,
                                            options,
                                        }
                                    },
                                )
                            })
                        }
                    },
                    4: () => {
                        for (let index = 0, len = this.changed.length; index < len; index++) {
                            let item = this.changed[index],
                                edge = allEdgelist.get(item),
                                children = edge.value.children
                            if (!edge.getAttribute('isVisible')) {
                                edge?.changeAttribute({ isVisible: true })
                            }
                            for (let j = 0; j < children.length; j++) {
                                let item = allEdgelist.get(children[j])
                                item?.changeAttribute({
                                    isVisible: false,
                                    usedMerge: true,
                                })
                            }
                        }
                    },
                }
                try {
                    toggleStrategic[this.type]()
                    this.galaxyvis.render(false)
                    this.toggleFlag = true
                } catch (err) {
                    reject(err)
                }

                reslove(() => { })
            })
        }
    }
    /**
     * 更新
     * @param changed
     */
    public update = (changed: any[]) => {
        this.changed = changed
    }
}
