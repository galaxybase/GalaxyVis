import {
    AddEdgesEve,
    AddNodesEve,
    ClickEve,
    DoubleClickEve,
    DragStartEve,
    EdgesSelectedEve,
    EdgesUnselectedEve,
    LayoutEndEve,
    LayoutEvt,
    MouseOutEve,
    MouseOverEve,
    NodeDragProgressEve,
    NodesSelectedEve,
    NodesUnselectedEve,
    RemoveEdgesEve,
    RemoveNodesEve,
} from '../../types'

export const EventType = {
    layoutStart: (params: LayoutEvt) => {
        return params
    }, //开始布局
    layoutEnd: (params: LayoutEndEve) => {
        return params
    }, //布局结束
    click: (params: ClickEve) => {
        return params
    }, //鼠标点击事件
    doubleClick: (params: DoubleClickEve) => {
        return params
    }, //鼠标双击事件
    hover: (params: DoubleClickEve) => {
        return params
    }, //鼠标hover到点或者边事件
    unhover: (params: DoubleClickEve) => {
        return params
    }, //鼠标移除当前点或边的事件
    addNodes: (params: AddNodesEve) => {
        return params
    }, //添加点
    removeNodes: (params: RemoveNodesEve) => {
        return params
    }, //移除点
    addEdges: (params: AddEdgesEve) => {
        return params
    }, //添加点
    removeEdges: (params: RemoveEdgesEve) => {
        return params
    }, //移除点
    mouseover: (params: MouseOverEve) => {
        return params
    }, //移动
    mouseout: (params: MouseOutEve) => {
        return params
    }, //移出
    nodesDragProgress: (params: NodeDragProgressEve) => {
        return params
    }, //点移动
    dragStart: (params: DragStartEve) => {
        return params
    },
    nodesSelected: (params: NodesSelectedEve) => {
        return params
    }, //点选中
    edgesSelected: (params: EdgesSelectedEve) => {
        return params
    }, //边选中
    nodesUnselected: (params: NodesUnselectedEve) => {
        return params
    }, //点取消选中
    edgesUnselected: (params: EdgesUnselectedEve) => {
        return params
    }, //边取消选中
    viewChanged: (type: string) => {
        return {
            type,
        }
    }, //视图发生改变
}
