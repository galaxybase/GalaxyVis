import Layout from './layout'
import Algorithms from './algorithms'
import Export from './export'
import styles from './styles'
import view from './view'
import EventEmitter from './event'
import transformations from './transformations'
import tools from './tools'
import geo from './geo'
import NodeList from './nodeList'
import EdgeList from './edgeList'
import {
    graphAddEdge,
    graphAddEdges,
    graphAddGraph,
    graphAddNode,
    graphAddNodes,
    graphClearGraph,
    graphDestory,
    graphGetData,
    graphGetDatas,
    graphGetNonSelectedEdges,
    graphGetNonSelectedNodes,
    graphGetRenderType,
    graphGetSelectedEdges,
    graphGetSelectedNodes,
    graphRemoveEdges,
    graphRemoveNode,
    graphRemoveNodes,
    graphRemoveEdge,
} from '../utils/graph'
import {
    excessGetEdgeDrawVal,
    excessGetEdgeType,
    excessGetEdgeWithArrow,
    graphFilterEdges,
    graphFilterNodes,
    getRelationTable,
    graphGetOriginData,
    getNodeTable,
} from '../utils/graph/excess'
import { edgeAttributes, NodeAttributes } from '../types'

export default class Graph {
    [x: string]: any
    // 布局
    public layouts = new Layout(this)
    // 导出
    public export = new Export(this)
    // 算法
    public algorithms = new Algorithms(this)
    // 样式
    public styles = new styles(this)
    // 视图
    public view = new view(this)
    // 转换
    public transformations = new transformations(this)
    // 事件
    public events = new EventEmitter()
    // 工具
    public tools = new tools(this)
    // 地图
    public geo = new geo(this)

    /**
     * 添加单个点
     * @param {*} nodeInfo
     * @returns
     */
    addNode = (nodeInfo: NodeAttributes) => {
        return graphAddNode(this, nodeInfo)
    }
    /**
     * 添加多个点
     * @param nodes nodes:Array<Node>
     */
    addNodes = (nodes: Array<any>, update: boolean = true) => {
        return graphAddNodes(this, nodes, update)
    }
    /**
     * 添加单个边
     * @param {*} edgeInfo 边属性
     * @returns
     */
    addEdge = (edgeInfo: edgeAttributes) => {
        return graphAddEdge(this, edgeInfo)
    }
    /**
     * 添加多条边
     * @param edges
     * @returns
     */
    addEdges = (edges: Array<any>, update: boolean = true) => {
        return graphAddEdges(this, edges, update)
    }

    /**
     * 添加Graph
     * @param RawGraph
     * @returns
     */
    addGraph(RawGraph: { [key: string]: any[] }) {
        return graphAddGraph(this, RawGraph)
    }

    /**
     * 获取多个点的数据 ids可以为空 为空时获取到全部
     * @param ids
     * @returns
     */
    getNodes = (ids?: any, getHidden: boolean = false): any => {
        if (ids && typeof ids === 'boolean') {
            getHidden = ids
            ids = null
        }

        return graphGetDatas(this, 'nodeList', NodeList, getHidden, ids)
    }
    /**
     * 获取未被隐藏的点
     * @returns
     */
    getFilterNode = (): any => {
        return graphFilterNodes(this)
    }
    /**
     * 获取某个点
     * @param nodeId 点id
     * @returns
     */
    getNode = (nodeId: string | number, getHidden: boolean = false) => {
        return graphGetData(this.id, nodeId, 'nodeList', getHidden)
    }
    /**
     * 获取边
     * @param ids
     * @param getHidden
     * @param getMerge
     * @returns
     */
    getEdges = (ids?: any, getHidden: boolean = false, getMerge?: boolean): Map<string, any> => {
        if (ids && typeof ids === 'boolean') {
            getHidden = ids
            ids = null
        }
        return graphGetDatas(this, 'edgeList', EdgeList, getHidden, ids, getMerge)
    }
    /**
     * 获取未被隐藏的边
     * @returns
     */
    getFilterEdges = (): any => {
        return graphFilterEdges(this)
    }
    /**
     * 获取单个边
     * @param edgeId 边id
     * @returns
     */
    getEdge = (edgeId: string | number, getHidden: boolean = false) => {
        return graphGetData(this.id, edgeId, 'edgeList', getHidden)
    }
    /**
     * 统计两点之间各个类型的个数
     * @returns
     */
    getEdgeType = () => {
        return excessGetEdgeType(this)
    }
    /**
     * 获取关联表
     * @returns
     */
    getRelationTable = () => {
        return getRelationTable(this)
    }
    /**
     * 获取Node关联表
     * @returns
     */
    getNodeTable = () => {
        return getNodeTable(this)
    }
    /**
     * 获取线的绘制的数据
     * @returns drawEdgeList
     */
    getEdgeDrawVal = () => {
        return excessGetEdgeDrawVal(this)
    }
    /**
     * 获取绘制线和箭头的属性
     * @returns lineArray
     */
    getEdgeWithArrow = (Partial?: any, needFresh?: any) => {
        return excessGetEdgeWithArrow(this, Partial, needFresh)
    }
    /**
     * 返回选中的node的ids
     */
    getSelectedNodes() {
        return graphGetSelectedNodes(this)
    }
    /**
     * 返回未选中的node的ids
     * @returns
     */
    getNonSelectedNodes() {
        return graphGetNonSelectedNodes(this)
    }
    /**
     * 返回选中的edge的ids
     */
    getSelectedEdges() {
        return graphGetSelectedEdges(this)
    }
    /**
     * 返回未选中的边的ids
     * @returns
     */
    getNonSelectedEdges() {
        return graphGetNonSelectedEdges(this)
    }
    /**
     * 删除点
     * @param nodeId
     */
    removeNode(nodeId: string, isReFlash = true) {
        return graphRemoveNode(this, nodeId, isReFlash)
    }
    /**
     * 删除多点
     * @param nodes
     */
    removeNodes(nodes: string[]) {
        return graphRemoveNodes(this, nodes)
    }
    /**
     * 删除边
     * @param edgeId
     */
    removeEdge(edgeId: string, force = true, isReFlash = true) {
        return graphRemoveEdge(this, edgeId, force, isReFlash)
    }
    /**
     * 删除多边
     * @param edges
     */
    removeEdges(edges: string[], force = true) {
        return graphRemoveEdges(this, edges, force)
    }
    /**
     * 清空图数据
     * @returns
     */
    clearGraph = () => {
        return graphClearGraph(this, false)
    }
    /**
     * 销毁实例
     * @returns
     */
    destroy() {
        return graphDestory(this)
    }
    /**
     * 返回render的类型
     * @returns
     */
    getRenderType() {
        return graphGetRenderType(this)
    }
    /**
     * 获取当前页面下所有点边（该方法会获取合并点边下点边信息）
     * @returns
     */
    getOriginGraphData() {
        return graphGetOriginData(this)
    }
    /**
     * 在规定的时间内强刷
     * @param timeout
     */
    refreshRender(timeout: number = 500) {
        this.textStatus = false
        setTimeout(() => {
            this.textStatus = true
            this.render()
            return true
        }, timeout)
    }
}
