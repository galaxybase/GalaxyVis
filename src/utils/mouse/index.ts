import findIndex from 'lodash/findIndex'
import { basicData, globalInfo } from '../../initial/globalProp'
import NodeList from '../../classes/nodeList'
import EdgeList from '../../classes/edgeList'

// 给点和边添加样式和触发回调
export const nodeOrEdgeSelect = (
    scene: any,
    list: Set<string>,
    funcName: Function,
    emitName: string,
    sel?: string,
) => {
    if (list.size) {
        let { selectedNodes, unSelectedNodes, selectedEdges, unSelectedEdges } =
            basicData[scene.id],
            hasNodeEmit =
                unSelectedNodes.size !== 1 ||
                selectedNodes.size !== 1 ||
                [...unSelectedNodes][0] !== [...selectedNodes][0] ||
                selectedEdges.size !== 0 || unSelectedEdges.size !== 0,
            hasEdgeEmit =
                unSelectedEdges.size !== 1 ||
                selectedEdges.size !== 1 ||
                [...unSelectedEdges][0] !== [...selectedEdges][0]

        if (['nodesSelected', 'edgesSelected'].includes(emitName)) {
            if (sel) {
                let result =
                    emitName === 'nodesSelected'
                        ? new NodeList(scene, [sel])
                        : new EdgeList(scene, [sel])
                hasNodeEmit && hasEdgeEmit && scene.events.emit(emitName, result)
            }
        } else {
            let result =
                emitName === 'nodesUnselected'
                    ? new NodeList(scene, [...list])
                    : new EdgeList(scene, [...list])
            if (
                (emitName === 'nodesUnselected' && unSelectedEdges.size === 0) ||
                emitName !== 'nodesUnselected'
            ) {
                hasNodeEmit && hasEdgeEmit && scene.events.emit(emitName, result)
            }
        }
        let nodeList = new NodeList(scene, [...list])
        funcName(scene.id, nodeList, sel)
    }
}

// 给点添加mouse的select样式
export const mouseAddClass = (graphId: string, list: any, sel?: string) => {
    // 当点存在hover的样式
    let { nodeList } = basicData[graphId],
        hoverRule = null
    nodeOrEdgeAddOrRemoveClass(
        nodeList,
        globalInfo[graphId].nodeSelectStyle,
        list instanceof Object ? list.getId() : [list],
        'addClass',
    )

    if (Object.keys(globalInfo[graphId].nodeHoverStyle).length && sel) {
        hoverRule = globalInfo[graphId].nodeHoverStyle.rule
        let node = nodeList.get(sel)
        node?.addClass(hoverRule, 2, false)
    }
}

// 给点移除mouse的select样式
export const mouseRemoveClass = (graphId: string, list: any) => {
    nodeOrEdgeAddOrRemoveClass(
        basicData[graphId].nodeList,
        globalInfo[graphId].nodeSelectStyle,
        list instanceof Object ? list.getId() : [list],
        'removeClass',
    )
}

// 给边添加mouse的select样式
export const mouseAddEdgeClass = (graphId: string, list: any, edgeSel?: string) => {
    const { nodeList, edgeList } = basicData[graphId],
        { edgeSelectStyle, nodeSelectStyle, edgeHoverStyle, nodeHoverStyle } = globalInfo[graphId]
    nodeOrEdgeAddOrRemoveClass(
        edgeList,
        edgeSelectStyle,
        list instanceof Object ? list.getId() : [list],
        'addClass',
    )
    nodeOrEdgeAddOrRemoveClass(
        nodeList,
        nodeSelectStyle,
        [...basicData[graphId].selectedNodes],
        'addClass',
    )

    if (edgeSel) {
        let edge = edgeList.get(edgeSel)
        if (Object.keys(edgeHoverStyle).length) {
            let hoverEdgeRule = edgeHoverStyle.rule
            edge?.addClass(hoverEdgeRule, 2, false)
        }

        if (Object.keys(nodeHoverStyle).length) {
            let hoverRule = nodeHoverStyle.rule
            let { source, target } = edge?.getAttribute()
            let sourceNode = nodeList.get(source)
            let targetNode = nodeList.get(target)
            sourceNode?.addClass(hoverRule, 2, false)
            targetNode?.addClass(hoverRule, 2, false)
        }
    }
}

// 边添加或移除样式方法
export const mouseRemoveEdgeClass = (graphId: string, list: any) => {
    nodeOrEdgeAddOrRemoveClass(
        basicData[graphId].nodeList,
        globalInfo[graphId].nodeHoverStyle,
        [...basicData[graphId].selectedNodes],
        'removeClass',
    )
    nodeOrEdgeAddOrRemoveClass(
        basicData[graphId].nodeList,
        globalInfo[graphId].nodeSelectStyle,
        [...basicData[graphId].selectedNodes],
        'removeClass',
    )
    nodeOrEdgeAddOrRemoveClass(
        basicData[graphId].edgeList,
        globalInfo[graphId].edgeSelectStyle,
        list instanceof Object ? list.getId() : [list],
        'removeClass',
    )
}

// 点或边添加或移除样式方法
export const nodeOrEdgeAddOrRemoveClass = (list: any, style: any, ids: string[], type: string) => {
    if (Object.keys(style).length) {
        let { rule } = style
        for (let i = 0, len = ids.length; i < len; i++) {
            let target = list.get(ids[i]);
            if (!target) continue;
            let ownClassList = target.value.classList,
                classList = findIndex(ownClassList, ['className', rule])
            if (
                (type === 'addClass' && classList == -1) ||
                (type === 'removeClass' && classList !== -1)
            ) {
                target[type](rule, 2, false)
            }
        }
    }
}
