import Camera from '../classes/camera'
import galaxyvis from '../galaxyVis'
import NodeList from '../classes/nodeList'
import { debounce } from 'lodash'
import { computeArea, disPoint, getX, getY, isInside } from '../utils'
import { globalProp, basicData, globalInfo } from '../initial/globalProp'
import {
    nodeOrEdgeSelect,
    mouseAddClass,
    mouseAddEdgeClass,
    mouseRemoveClass,
    mouseRemoveEdgeClass,
} from '../utils/mouse'
import { PlainObject, typeShape, MouseType, GraphElement } from '../types'

class CaptorsMouse {
    private scene: galaxyvis // webgl上下文
    private camera: Camera // 相机
    private canvas: HTMLCanvasElement // canvas画布
    private startMouseX: number = 0 // 鼠标开始拖动位置x
    private startMouseY: number = 0 // 鼠标开始拖动位置y
    private mouseDownTime: number = 0 // 鼠标点下的时间
    private listenerData: PlainObject<any> = {} // 回调数据
    private divBox: HTMLElement | null = null // 外层div用于改变鼠标
    private firstDragStart: boolean = false // 是否时第一次拖动
    private mouseX: number = 0 // 鼠标在画布的位置x
    private mouseY: number = 0 // 鼠标在画布的位置y
    private throttled: Function // 节流函数
    private selectTarget: GraphElement | null | undefined // 选中的目标
    private oldHoverTarget: any // 鼠标hover老的目标列表
    private selected: boolean = false // 当前是否选中
    private draggable: boolean = false // 当前是否在拖动
    private renderType: string // 渲染类型
    public hoverTatget: any // 鼠标hover的目标
    public geoEnable: any // geo模式下选中操作

    constructor(scene: galaxyvis, camera: Camera, canvas: HTMLCanvasElement) {
        // 画布
        this.scene = scene
        // 相机
        this.camera = camera
        // canvas对象
        this.canvas = canvas
        // canvas外层div
        this.divBox = canvas.parentNode as HTMLElement
        // 节流函数
        this.throttled = debounce(() => this.scene.events.emit('viewChanged', { type: 'pan' }), 200)
        this.renderType = scene.renderer
        this.geoEnable = true
    }

    /**
     * 点击事件
     * @param e 鼠标
     */
    public MouseDownListener(e: MouseEvent) {
        // 拖动设置为true
        this.draggable = true
        // 获取当前时间用来判断是否是双击
        this.mouseDownTime = new Date().getTime()
        // 获取开始的鼠标位置
        this.startMouseX = getX(e)
        this.startMouseY = getY(e)
        // 当选中点边时
        if (this.hoverTatget) {
            this.selectTarget = this.hoverTatget
            this.selected = true
        } else {
            this.selectTarget = null
            this.selected = false
            basicData[this.scene.id].selectedTable = new Set()
        }
        // 本次mousedown的数据
        this.listenerData = {
            button: MouseType[e.button],
            source: 'mouse',
            x: this.mouseX,
            y: this.mouseY,
            domEvent: e,
            target: this.hoverTatget,
            isNode: this.hoverTatget?.isNode() || false,
        }
        this.scene.events.emit('mousedown', this.listenerData)
    }

    /**
     * 移动事件
     * @param e 鼠标
     */
    public MouseMoveListener(e: MouseEvent) {
        const graphId = this.scene.id
        let { globalScale } = globalProp,
            pointX: number,
            pointY: number,
            x: number,
            y: number,
            // 获取当前canvas大小
            { width, height } = this.canvas,
            // 获取长宽比
            aspectRatio = width / height,
            // 获取当前的canvas
            { ratio } = this.camera,
            screenX = getX(e) - width / 2,
            screenY = getY(e) - height / 2,
            // 转换为webgl或canvas的坐标
            mouseX =
                this.renderType === 'webgl'
                    ? (this.mouseX = ((screenX * ratio) / width) * aspectRatio)
                    : (this.mouseX = getX(e)),
            mouseY =
                this.renderType === 'webgl'
                    ? (this.mouseY = (-screenY * ratio) / height)
                    : (this.mouseY = getY(e))
        // 如果当前没有选中点或边
        if (!this.selected) {
            // 遍历包围盒
            let nodeFunckName = 'checkNode',
                edgeFuncName = 'checkEdge'
            if (this.renderType === 'canvas') {
                nodeFunckName = 'checkNodeCanvas'
                edgeFuncName = 'checkEdgeCanvas'
            }
            // @ts-ignore
            !this.draggable ? (this.hoverTatget = this[nodeFunckName](mouseX, mouseY)) : (this.hoverTatget = null)
            if (this.hoverTatget) {
                this.hoverTatget = this.scene.getNode(this.hoverTatget)
            } else if (!this.draggable) {
                // @ts-ignore
                this.hoverTatget = this[edgeFuncName](mouseX, mouseY)
                if (this.hoverTatget) {
                    this.hoverTatget = this.scene.getEdge(this.hoverTatget)
                }
            }
            // 当hover了点或者边的时候给其添加样式
            if (this.hoverTatget) {
                this.MouseSetCursor('pointer')
                let { isNode } = this.hoverTatget.getAttribute(),
                    id = this.hoverTatget.getId()
                // 当老的hover对象时空或者不等于当前hover对象的id则触发hover回调
                if (!this.oldHoverTarget || this.oldHoverTarget.getId() !== id) {
                    this.scene.events.emit('hover', {
                        source: 'mouse',
                        x: this.mouseX,
                        y: this.mouseY,
                        domEvent: e,
                        target: this.hoverTatget,
                        isNode: this.hoverTatget?.isNode() || false,
                    })
                }
                // 当hover的元素跟原来的不一样时
                if (this.oldHoverTarget && (id !== this.oldHoverTarget.getId() || this.oldHoverTarget.isNode() != isNode)) {
                    let odlIsNode = this.oldHoverTarget.isNode(),
                        oldId = this.oldHoverTarget.getId()
                    if (odlIsNode) {
                        this.MouseAddOrRemoveNodeHoverStyle(oldId, false)
                    } else {
                        this.MouseAddOrRemoveEdgeHoverStyle(oldId, false)
                    }

                    if (isNode) {
                        this.MouseAddOrRemoveNodeHoverStyle(id, true)
                    } else {
                        this.MouseAddOrRemoveEdgeHoverStyle(id, true)
                    }
                    this.oldHoverTarget = this.hoverTatget
                    if (basicData[graphId].selectedTable.has(id)) {
                        basicData[graphId].selectedTable.delete(id)
                        basicData[graphId].selectedTable.add(id)
                    }
                    this.scene.selectMovefresh(false)
                } else {
                    // 当选中了点的时候
                    if (
                        !this.oldHoverTarget ||
                        (this.oldHoverTarget && id !== this.oldHoverTarget.getId())
                    ) {
                        if (isNode) {
                            this.MouseAddOrRemoveNodeHoverStyle(id, true)
                        } else {
                            this.MouseAddOrRemoveEdgeHoverStyle(id, true)
                        }
                        this.oldHoverTarget = this.hoverTatget
                        this.scene.selectMovefresh(false)
                    }
                }
                // this.oldHoverTarget = this.hoverTatget
            } else {
                this.MouseSetCursor('default')
                // 鼠标移除了点或边的hover之后清空原来的hover样式
                if (this.oldHoverTarget) {
                    let isNode = this.oldHoverTarget.isNode(),
                        id = this.oldHoverTarget.getId()

                    if (isNode) {
                        basicData[graphId].selectedTable = new Set(
                            [...basicData[graphId].selectedNodes].concat(
                                this.oldHoverTarget.getId(),
                            ),
                        )
                    } else {
                        basicData[graphId].selectedTable = new Set(
                            [...basicData[graphId].selectedNodes]
                                .concat(this.oldHoverTarget.value.source)
                                .concat(this.oldHoverTarget.value.target),
                        )
                    }

                    if (isNode) {
                        this.MouseAddOrRemoveNodeHoverStyle(id, false)
                    } else {
                        this.MouseAddOrRemoveEdgeHoverStyle(id, false)
                    }
                    this.scene.selectMovefresh(false)
                    this.scene.events.emit('unhover', {
                        source: 'mouse',
                        x: this.mouseX,
                        y: this.mouseY,
                        domEvent: e,
                        target: this.oldHoverTarget,
                        isNode: isNode || false,
                    })
                }
                this.oldHoverTarget = null
                this.hoverTatget = null
            }
        } else {
            let { isNode, draggable, x: realX, y: realY } = this.hoverTatget.getAttribute()
            let id = this.hoverTatget.getId(),
                // 当前拖动的点是否真正的被选中
                hasRealSelect =
                    basicData[graphId].selectedNodes.has(id) &&
                    basicData[graphId].selectedEdges.size === 0
            if (isNode && draggable && this.draggable) {
                // 获取当前在画布上的坐标
                pointX = getX(e)
                pointY = getY(e)
                if (this.renderType === 'webgl') {
                    x =
                        ((pointX - this.startMouseX) * ratio * aspectRatio) /
                        (width / basicData[graphId].transform)
                    y =
                        ((pointY - this.startMouseY) * ratio) /
                        (height / basicData[graphId].transform)
                } else {
                    let scale = globalScale / ratio
                    x = (pointX - this.startMouseX) / scale
                    y = (pointY - this.startMouseY) / scale
                }
                // 如果按住ctrl则更新其他选中的点坐标
                let dragNodes = []
                if (hasRealSelect) {
                    // 遍历被选中的点 更改他的x，y坐标
                    basicData[graphId].selectedNodes.forEach(item => {
                        let node = this.scene.getNode(item)
                        let { x: realX, y: realY, draggable } = node.getAttribute()
                        if (draggable) {
                            this.geoEnable && node.changeAttribute({
                                x: realX + x,
                                y: realY + y,
                            })
                        }
                    })
                    dragNodes = [...basicData[graphId].selectedNodes].filter(item => {
                        return this.scene.getNode(item).getAttribute('draggable')
                    })
                } else {
                    // 没按住ctrl则更新当前选中的点
                    this.geoEnable && this.hoverTatget.changeAttribute({
                        x: realX + x,
                        y: realY + y,
                    })
                    dragNodes = [id]
                }

                if (!this.firstDragStart) {
                    // 触发dragStart回调
                    this.scene.events.emit('dragStart', {
                        button: MouseType[e.button],
                        source: 'mouse',
                        x: mouseX,
                        y: mouseY,
                        domEvent: e,
                        target: new NodeList(this.scene, dragNodes),
                    })
                    this.firstDragStart = true
                } else {
                    this.MouseSetCursor('move')
                }
                // 触发nodesDragProgress回调
                this.scene.events.emit('nodesDragProgress', {
                    dx: x,
                    dy: y,
                    nodes: new NodeList(this.scene, dragNodes),
                })
                this.startMouseX = pointX
                this.startMouseY = pointY

                this.scene.selectMovefresh(true)
                return false
            }
            if(isNode == false) return false
        }
        if (this.draggable) {
            this.throttled()
            return true
        }
    }

    /**
     * 鼠标松开事件
     */
    public MouseOutListener(e: MouseEvent) {
        const graphId = this.scene.id
        let { ctrlKey, button } = e
        let selected = false,
            hasSelected = false
        // 如果没按住ctrl并且up的时间比down的时间小于200ms，则视为一次click事件
        let taskStartTime = new Date().getTime()
        if (taskStartTime - this.mouseDownTime <= 200 || ctrlKey) {
            if (!ctrlKey || !this.selectTarget) {
                // 清空当时选中的边数据
                if (button === 0) {
                    this.ClearSelectEdges()
                    this.ClearSelectNodes()
                }
            } else if (ctrlKey && this.selectTarget) {
                let isNode = this.selectTarget.isNode(),
                    id = this.selectTarget.getId(),
                    { selectedNodes, selectedEdges } = basicData[graphId]
                if (isNode) {
                    if (selectedEdges.size === 0 && selectedNodes.has(id)) {
                        this.AddSelectNodes(id, false)
                        hasSelected = true
                    }
                    this.ClearSelectEdges()
                } else {
                    if (selectedEdges.has(id)) {
                        this.AddSelectEdges(id, false)
                        hasSelected = true
                    }
                    basicData[graphId].selectedEdges.size == 0 && this.ClearSelectNodes()
                }
            }
            if (this.selectTarget && !hasSelected) {
                let isNode = this.selectTarget.isNode(),
                    id = this.selectTarget.getId(),
                    { selectedEdges } = basicData[graphId]
                if (isNode) {
                    if (button === 2) {
                        this.ClearSelectEdges()
                    }
                    this.AddSelectNodes(id)
                } else {
                    if (button === 2 && selectedEdges.size === 0) {
                        this.ClearSelectNodes()
                    }
                    this.AddSelectEdges(id)
                }
            }
            selected = true
            // 触发click的回调
            setTimeout(() => {
                this.scene.events.emit('click', this.listenerData)
            }, 1)
        }
        if (!this.selectTarget) {
            this.MouseSetCursor('default')
        } else {
            this.MouseSetCursor('pointer')
        }
        this.selected = false
        this.draggable = false
        this.firstDragStart = false
        let { selectedNodes, unSelectedNodes, selectedEdges, unSelectedEdges } =
            basicData[graphId]

        nodeOrEdgeSelect(this.scene, unSelectedNodes, mouseRemoveClass, 'nodesUnselected')

        nodeOrEdgeSelect(this.scene, unSelectedEdges, mouseRemoveEdgeClass, 'edgesUnselected')

        nodeOrEdgeSelect(
            this.scene,
            selectedEdges,
            mouseAddEdgeClass,
            'edgesSelected',
            selected &&
            this.selectTarget &&
            !this.selectTarget.isNode() &&
            this.selectTarget.getId(),
        )

        nodeOrEdgeSelect(
            this.scene,
            selectedNodes,
            mouseAddClass,
            'nodesSelected',
            selected && this.selectTarget && this.selectTarget.isNode && this.selectTarget.getId(),
        )

        basicData[graphId].unSelectedNodes = new Set()
        basicData[graphId].unSelectedEdges = new Set()

        if (!this.selectTarget) {
            this.scene.render()
        } else {
            this.scene.selectMovefresh()
        }
    }

    /**
     * 鼠标双击事件
     */
    public MouseDbClickListener() {
        this.scene.events.emit('doubleClick', this.listenerData)
    }

    /**
     * 鼠标点击事件
     * @param style 鼠标的样式
     */
    public MouseSetCursor(style: string) {
        ; (this.divBox as HTMLElement).style.cursor = `${style}`
    }

    /**
     * 添加选中的点数据
     * @param nodeId 点ID
     * @param isSelect 是否选中
     */
    public AddSelectNodes(nodeId: string, isSelect: boolean = true) {
        const graphId = this.scene.id
        this.scene.getNode(nodeId)?.changeAttribute({
            isSelect,
        })
        if (isSelect) {
            basicData[graphId].selectedNodes.add(nodeId)
        } else {
            basicData[graphId].selectedNodes.delete(nodeId)
            basicData[graphId].unSelectedNodes.add(nodeId)
        }
    }

    /**
     * 添加选中的边数据
     * @param edgeId 边ID
     * @param isSelect 是否选中
     */
    public AddSelectEdges(edgeId: string, isSelect: boolean = true) {
        const graphId = this.scene.id
        let edge = this.scene.getEdge(edgeId)
        edge?.changeAttribute({
            isSelect,
        })
        if (isSelect) {
            basicData[graphId].selectedEdges.add(edgeId)
        } else {
            basicData[graphId].selectedEdges.delete(edgeId)
            basicData[graphId].unSelectedEdges.add(edgeId)
        }
        let { source, target } = edge?.getAttribute()
        this.AddSelectNodes(source, isSelect)
        this.AddSelectNodes(target, isSelect)
    }

    /**
     * 清空选中的点数据
     * @param isEdge 是否时边触发的清空点选中
     */
    public ClearSelectNodes(isEdge: boolean = false) {
        const graphId = this.scene.id
        basicData[graphId].selectedNodes.forEach(item => {
            let node = this.scene.getNode(item)
            if (node?.getAttribute('isSelect')) {
                !isEdge && basicData[graphId].unSelectedNodes.add(item)
            }
            node?.changeAttribute({
                isSelect: false,
            })
        })
        basicData[graphId].selectedNodes = new Set()
    }

    /**
     * 清空选中的边数据
     */
    public ClearSelectEdges() {
        const graphId = this.scene.id
        basicData[graphId].selectedEdges.forEach(key => {
            let edge = this.scene.getEdge(key)

            if (!edge) return;

            if (edge?.getAttribute('isSelect')) {
                basicData[graphId].unSelectedEdges.add(key)
            }
            edge?.changeAttribute({
                isSelect: false,
            })

            let { source, target } = edge?.getAttribute(),
                soureceNode = this.scene.getNode(source),
                targetNode = this.scene.getNode(target)

            if (soureceNode?.getAttribute('isSelect')) {
                basicData[graphId].unSelectedNodes.add(source)
            }
            soureceNode.changeAttribute({
                isSelect: false,
            })

            if (targetNode?.getAttribute('isSelect')) {
                basicData[graphId].unSelectedNodes.add(target)
            }
            targetNode.changeAttribute({
                isSelect: false,
            })
            basicData[graphId].selectedNodes.delete(source)
            basicData[graphId].selectedNodes.delete(target)
        })
        basicData[graphId].selectedEdges = new Set()
    }
    /**
     * 给点添加或删除hover样式
     * @params nodeId:string
     * @params isAdd:boolean
     */
    private MouseAddOrRemoveNodeHoverStyle = (nodeId: string, isAdd: boolean) => {
        const graphId = this.scene.id
        if (!basicData[graphId].selectedNodes.has(nodeId)) {
            this.scene.getNode(nodeId)?.changeAttribute({
                isSelect: isAdd,
            })
        }
        basicData[graphId].selectedTable.add(nodeId)
        let funcName = isAdd ? 'addClass' : 'removeClass'
        if (Object.keys(globalInfo[graphId].nodeHoverStyle).length) {
            let { rule } = globalInfo[graphId].nodeHoverStyle
            this.scene.getNode(nodeId)?.[funcName](rule, 2, false)
        }
    }
    /**
     * 给边添加hover样式
     * @params edgeId:string
     * @params isAdd:boolean
     */
    private MouseAddOrRemoveEdgeHoverStyle = (edgeId: string, isAdd: boolean) => {
        const graphId = this.scene.id
        if (!basicData[graphId].selectedEdges.has(edgeId)) {
            this.scene.getEdge(edgeId)?.changeAttribute({
                isSelect: isAdd,
            })
        }
        basicData[graphId].selectedEdgeTable.add(edgeId)
        let funcName = isAdd ? 'addClass' : 'removeClass',
            edge = this.scene.getEdge(edgeId)
        if (!edge) return
        let { source, target } = edge.getAttribute()
        if (Object.keys(globalInfo[graphId].edgeHoverStyle).length) {
            let { rule } = globalInfo[graphId].edgeHoverStyle
            edge?.[funcName](rule, 2, false)
        }
        this.MouseAddOrRemoveNodeHoverStyle(source, isAdd)
        this.MouseAddOrRemoveNodeHoverStyle(target, isAdd)
    }
    /**
     * 判断是否选中
     * @param x
     * @param y
     * @returns
     */
    private checkNode = (x: number, y: number) => {
        const graphId = this.scene.id
        let width = 0.1,
            height = 0.1,
            position = this.camera.position,
            map = this.checkQuad(x + position[0], y + position[1], true, width, height),
            items = [...map.values()];
        let sel: { [key: string]: any } = { area: -1, index: -1, id: null }
        let nodeList = basicData[graphId].nodeList
        let oldId = this.oldHoverTarget?.getId()
        for (let item of items) {
            let node = nodeList.get(item.id)
            if (node?.getAttribute('opacity') == 0.0 || !node?.getAttribute('isVisible'))
                continue
            // 计算碰撞
            let area = computeArea(
                x - width / 2 + position[0],
                y + height / 2 + position[1],
                x + width / 2 + position[0],
                y - height / 2 + position[1],

                item.x - item.width / 2,
                item.y + item.height / 2,
                item.x + item.width / 2,
                item.y - item.height / 2,
            )
            // 碰撞大于0说明碰撞的盒子碰到了
            if (area > 0 && node) {
                // 获取当前点的顺序
                let index = node.value.num;
                if (sel.area < area) {
                    let flag = this.shapeChek(x + position[0], y + position[1], item)
                    if (flag) sel = { area, index, id: item.id }
                } else if (sel.area == area && sel.index < index) {
                    let flag = this.shapeChek(x + position[0], y + position[1], item)
                    if (flag) sel = { area, index, id: item.id }
                }
            }
        }
        if (!sel.id && (!map.size || oldId)) {
            let boundBox = basicData[graphId].boundBox
            let position = this.camera.position
            let strategies: { [key: string]: Function } = {
                circle: (
                    key: string,
                    xmin: number,
                    xmax: number,
                    ymin: number,
                    ymax: number,
                    midx: number,
                    midy: number,
                    radius: number,
                ) => {
                    if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) {
                        if (disPoint(x, y, midx, midy) <= radius) {
                            sel.id = key
                        }
                    }
                },
                square: (key: string, xmin: number, xmax: number, ymin: number, ymax: number) => {
                    if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) {
                        sel.id = key
                    }
                },
                triangle: (
                    key: string,
                    xmin: number,
                    xmax: number,
                    ymin: number,
                    ymax: number,
                    midx: number,
                ) => {
                    if (
                        isInside(
                            xmin,
                            ymin * 0.9 + 0.1 * ymax,
                            xmax,
                            ymin * 0.9 + 0.1 * ymax,
                            midx,
                            ymax * 0.95,
                            x,
                            y,
                        )
                    ) {
                        sel.id = key
                    }
                },
                rhombus: (
                    key: string,
                    xmin: number,
                    xmax: number,
                    ymin: number,
                    ymax: number,
                    midx: number,
                    midy: number,
                ) => {
                    if (
                        isInside(xmin, midy, xmax, midy, midx, ymin, x, y) ||
                        isInside(xmin, midy, xmax, midy, midx, ymax, x, y)
                    ) {
                        sel.id = key
                    }
                },
            }
            // 遍历包围盒
            for (let [key, val] of boundBox) {
                let { xmax, xmin, ymax, ymin, radius, shape } = val

                xmax -= position[0]
                xmin -= position[0]
                ymax -= position[1]
                ymin -= position[1]

                let midx = (xmax + xmin) / 2
                let midy = (ymax + ymin) / 2

                if (basicData[graphId].nodeList.get(key)?.getAttribute('opacity') == 0.0) continue
                strategies[shape](key, xmin, xmax, ymin, ymax, midx, midy, radius)
                if (sel.id) return sel.id
            }
        }
        return sel.id
    }
    /**
     * 判断是否选中边
     * @param x
     * @param y
     * @returns
     */
    private checkEdge = (x: number, y: number) => {
        const graphId = this.scene.id
        let width = 0.1,
            height = 0.1,
            position = this.camera.position,
            map = this.checkQuad(x + position[0], y + position[1], false, width, height),
            items = [...map.values()]
        let edgeSel = { area: -1, index: -1, id: null }
        let edgeList = basicData[graphId].edgeList
        for (let item of items) {
            let edge = edgeList.get(item.id)
            if (edge?.getAttribute('opacity') == 0.0 || !edge?.getAttribute('isVisible'))
                continue
            // 计算碰撞
            let area = computeArea(
                x - width / 2 + position[0],
                y + height / 2 + position[1],
                x + width / 2 + position[0],
                y - height / 2 + position[1],

                item.x - item.width / 2,
                item.y + item.height / 2,
                item.x + item.width / 2,
                item.y - item.height / 2,
            )
            // 碰撞面积大于0等于盒子碰撞了
            if (area > 0 && edge) {
                let index = edge.value.num;
                if (edgeSel.area < area) {
                    let flag = this.shapeEdgeChek(x, y, item)
                    if (flag) edgeSel = { area, index, id: item.id }
                } else if (edgeSel.area == area && edgeSel.index < index) {
                    let flag = this.shapeEdgeChek(x, y, item)
                    if (flag) edgeSel = { area, index, id: item.id }
                }
            }
        }

        // if (!edgeSel.id) {
        //     let edgeBoundBox = basicData[graphId].edgeBoundBox
        //     let position = this.camera.position
        //     for (let [key, val] of edgeBoundBox) {
        //         if (map.has(key)) continue;
        //         let { xmax, xmin, ymax, ymin, points } = val

        //         xmax -= position[0]
        //         xmin -= position[0]
        //         ymax -= position[1]
        //         ymin -= position[1]

        //         if (basicData[graphId].edgeList.get(key)?.getAttribute('opacity') == 0.0) continue
        //         if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) {
        //             let boundPoints = []
        //             for (let i = 0; i < points.length; i += 2) {
        //                 boundPoints[i] = points[i] - position[0]
        //                 boundPoints[i + 1] = points[i + 1] - position[1]
        //             }
        //             for (let i = 0; i < boundPoints.length; i += 2) {
        //                 if (
        //                     isInside(
        //                         boundPoints[i],
        //                         boundPoints[i + 1],
        //                         boundPoints[i + 2],
        //                         boundPoints[i + 3],
        //                         boundPoints[i + 4],
        //                         boundPoints[i + 5],
        //                         x,
        //                         y,
        //                     )
        //                 ) {
        //                     edgeSel.id = key
        //                     break
        //                 }
        //             }
        //         }
        //     }
        // }

        return edgeSel.id
    }

    private checkQuad = (x: number, y: number, type: boolean = true, height: number = 40, width: number = 40) => {
        let camera = this.camera
        // 检测那块区域的四叉树
        var items = camera.quad.retrieve({ x, y, height, width })
        // item去重
        let map = new Map()
        for (let item of items) {
            if (!map.has(item.id) && item.isNode && type) {
                map.set(item.id, item)
            } else if (!map.has(item.id) && !item.isNode && !type) {
                map.set(item.id, item)
            }
        }
        return map
    }

    /**
     * 判断是否选中点canvas
     * @param x
     * @param y
     * @returns
     */
    private checkNodeCanvas = (x: number, y: number) => {
        const graphId = this.scene.id
        let scale = (globalProp.globalScale / this.camera.ratio)
        let width = 40 * scale,
            height = 40 * scale,
            map = this.checkQuad(x, y, true, width, height),
            items = [...map.values()]
        // 获取node的绘制顺序
        let noderOrder = [...globalInfo[graphId].nodeOrder]
        let nodeList = basicData[graphId].nodeList
        let sel = { area: -1, index: -1, id: null }
        for (let item of items) {
            let node = nodeList.get(item.id)
            if (node?.getAttribute('opacity') == 0.0 ||
                !node?.getAttribute('isVisible')
            )
                continue
            // 计算碰撞
            let area = computeArea(
                x - width / 2,
                y + height / 2,
                x + width / 2,
                y - height / 2,

                item.x - item.width / 2,
                item.y + item.height / 2,
                item.x + item.width / 2,
                item.y - item.height / 2,
            )
            // 碰撞大于0说明碰撞的盒子碰到了
            if (area > 0 && node) {
                // 获取当前点的顺序
                let index = noderOrder.indexOf(item.id)
                if (sel.area < area) {
                    let flag = this.shapeChek(x, y, item)
                    if (flag) sel = { area, index, id: item.id }
                } else if (sel.area == area && sel.index < index) {
                    let flag = this.shapeChek(x, y, item)
                    if (flag) sel = { area, index, id: item.id }
                }
            }
        }


        if (sel.id) {
            let id = sel.id
            let nodeOrder = globalInfo[graphId].nodeOrder
            if (nodeOrder.has(id)) {
                nodeOrder.delete(id)
                nodeOrder.add(id)
            }
            return id
        } else {
            return null
        }
    }
    /**
     * 判断是否选中边canvas
     * @param x
     * @param y
     * @returns
     */
    private checkEdgeCanvas = (x: number, y: number) => {
        const graphId = this.scene.id
        let scale = (globalProp.globalScale / this.camera.ratio)
        let width = 40 * scale,
            height = 40 * scale,
            map = this.checkQuad(x, y, false, width, height),
            items = [...map.values()]
        let edgeSel = { area: -1, index: -1, id: null }
        let edgeOrder = [...globalInfo[graphId].edgeOrder]
        let edgeList = basicData[graphId].edgeList
        for (let item of items) {
            let edge = edgeList.get(item.id)
            if (edge?.getAttribute('opacity') == 0.0 ||
                !edge?.getAttribute('isVisible')
            )
                continue
            // 计算碰撞
            let area = computeArea(
                x - width / 2,
                y + height / 2,
                x + width / 2,
                y - height / 2,

                item.x - item.width / 2,
                item.y + item.height / 2,
                item.x + item.width / 2,
                item.y - item.height / 2,
            )
            // 碰撞面积大于0等于盒子碰撞了
            if (area > 0 && edge) {
                let index = edgeOrder.indexOf(item.id)
                if (edgeSel.area < area) {
                    let flag = this.shapeEdgeChek(x, y, item)
                    if (flag) edgeSel = { area, index, id: item.id }
                } else if (edgeSel.area == area && edgeSel.index < index) {
                    let flag = this.shapeEdgeChek(x, y, item)
                    if (flag) edgeSel = { area, index, id: item.id }
                }
            }
        }

        if (edgeSel.id != null) {
            // @ts-ignore
            let id: string = edgeSel.id
            let edgeOrder = globalInfo[graphId].edgeOrder
            if (edgeOrder.has(id)) {
                let edgeList = basicData[graphId].edgeList
                let edge = edgeList.get(id)
                if (!edge) return null;
                let { source, target } = edge.value
                let nodeOrder = globalInfo[graphId].nodeOrder
                if (nodeOrder.has(source)) {
                    nodeOrder.delete(source)
                    nodeOrder.add(source)
                }

                if (nodeOrder.has(target)) {
                    nodeOrder.delete(target)
                    nodeOrder.add(target)
                }
            }

            return id
        } else {
            return null
        }
    }
    /**
     * 点相撞
     * @param pointX
     * @param pointY
     * @param item
     * @returns
     */
    private shapeChek = (pointX: number, pointY: number, item: any) => {
        let { x, y, width, shape } = item
        let flag = false
        let radius = width / 2
        switch (Number(typeShape[shape])) {
            case 1:
                radius = width / 2
                // 圆
                if (disPoint(x, y, pointX, pointY) <= radius) {
                    flag = true
                }
                break
            case 2:
                radius = this.renderType === "canvas" ? width / (2 * Math.sqrt(2)) : width / 2
                // 正方形
                if (
                    pointX >= x - radius &&
                    pointX <= x + radius &&
                    pointY >= y - radius &&
                    pointY <= y + radius
                ) {
                    flag = true
                }
                break
            case 3:
                radius = width / 2
                var forward = this.renderType === "canvas" ? 1 : -1
                var rotate = (Math.PI * 0) / 180
                var webglArea = this.renderType === "canvas" ? 0 : 0.1 * width * forward
                let x1 = x + radius * Math.sin(rotate),
                    y1 = y - radius * Math.cos(rotate) * forward,
                    x2 = x + Math.sin(rotate + (2 * Math.PI * 1) / 3) * radius,
                    y2 = y - Math.cos(rotate + (2 * Math.PI * 1) / 3) * radius * forward - webglArea,
                    x3 = x + Math.sin(rotate + (2 * Math.PI * 2) / 3) * radius,
                    y3 = y - Math.cos(rotate + (2 * Math.PI * 2) / 3) * radius * forward - webglArea

                // 三角形
                if (isInside(x1, y1, x2, y2, x3, y3, pointX, pointY)) {
                    flag = true
                }
                break
            case 4:
                // 菱形
                radius = width / 2

                var rotate = (Math.PI * 0) / 180
                    ; (x1 = x + radius * Math.sin(rotate)),
                        (y1 = y - radius * Math.cos(rotate)),
                        (x2 = x + Math.sin(rotate + (2 * Math.PI * 1) / 4) * radius),
                        (y2 = y - Math.cos(rotate + (2 * Math.PI * 1) / 4) * radius),
                        (x3 = x + Math.sin(rotate + (2 * Math.PI * 2) / 4) * radius),
                        (y3 = y - Math.cos(rotate + (2 * Math.PI * 2) / 4) * radius)

                let x4 = x + Math.sin(rotate + (2 * Math.PI * 3) / 4) * radius,
                    y4 = y - Math.cos(rotate + (2 * Math.PI * 3) / 4) * radius

                if (
                    isInside(x1, y1, x2, y2, x3, y3, pointX, pointY) ||
                    isInside(x1, y1, x3, y3, x4, y4, pointX, pointY)
                ) {
                    flag = true
                }
                break
            default:
                break
        }
        return flag
    }
    /**
     * 边选中
     * @param pointX
     * @param pointY
     * @param item
     * @returns
     */
    private shapeEdgeChek = (pointX: number, pointY: number, item: any) => {
        const graphId = this.scene.id
        let flag = false
        let { id } = item,
            position = this.camera.position;

        let edgeBoundBox = this.renderType === "webgl"
            ? basicData[graphId].edgeBoundBox
            : basicData[graphId].edgeCanvasBoundBox
        if (edgeBoundBox.has(id)) {
            let item = edgeBoundBox.get(id)
            let points = item.point || item.points
            if (this.renderType === "canvas") {
                for (let i = 0; i < points.length; i += 2) {
                    if (
                        isInside(
                            points[i],
                            points[i + 1],
                            points[i + 2],
                            points[i + 3],
                            points[i + 4],
                            points[i + 5],
                            pointX,
                            pointY,
                        )
                    ) {
                        flag = true
                        break
                    }
                }
            } else {
                for (let i = 0; i < points.length; i += 2) {
                    if (
                        isInside(
                            points[i] - position[0],
                            points[i + 1] - position[1],
                            points[i + 2] - position[0],
                            points[i + 3] - position[1],
                            points[i + 4] - position[0],
                            points[i + 5] - position[1],
                            pointX,
                            pointY,
                        )
                    ) {
                        flag = true
                        break
                    }
                }
            }
        }

        return flag
    }
}

export default CaptorsMouse
