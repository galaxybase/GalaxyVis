import { globalProp, basicData, globalInfo } from '../../initial/globalProp'
import { PlainObject } from '../../types'
import { coordTransformation } from '../../utils'
import NodeList from '../nodeList'
/**
 * @class lasso 套索工具
 * @constructor
 * @param {value<any>} 初始化
 */
export class lasso<T, K> {
    private galaxyvis: any //galaxyvis对象
    private camera: any //相机对象
    private isActive: boolean //是否弃用
    private divContainer!: HTMLElement //生成的父级容器
    private drawingCanvas!: HTMLCanvasElement | undefined//绘制的canvas
    private drawingContext!: CanvasRenderingContext2D | undefined //绘制的canvas2d
    private isDrawing: boolean //是否正在拖动
    private drewPoints: Array<{ x: number, y: number }> //画线的点
    private selectedNodes: any[] //选中的点
    private callback: any // 回调函数

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        this.camera = this.galaxyvis.camera
        this.isActive = false
        this.isDrawing = false
        this.drewPoints = []
        this.selectedNodes = []
    }
    /**
     * 是否开启lasso
     * @returns
     */
    enabled() {
        return this.isActive
    }

    /**
     * 开启套索
     * @param param0
     */
    enable({ callback }: PlainObject<any>) {
        if (callback) {
            this.callback = callback
        }
        this.activate()
    }
    /**
     * 关闭套索
     */
    disable() {
        this.deactivate()
    }

    deactivate() {
        if (this.isActive) {
            this.isActive = false
            this.isDrawing = false

            if (this.galaxyvis.geo.enabled()) {
                let geomap = this.galaxyvis.geo.getMap()
                geomap.dragging['enable']()
            }

            // 监听鼠标点击事件
            this.drawingCanvas!.removeEventListener('mousedown', (e: MouseEvent) => {
                this.onDrawingStart(e)
            })
            // 监听鼠标移动事件
            this.drawingCanvas!.removeEventListener('mousemove', (e: MouseEvent) => {
                this.onDrawing(e)
            })
            // 监听鼠标抬起事件
            this.drawingCanvas!.removeEventListener('mouseup', (e: MouseEvent) => {
                this.onDrawingEnd(e)
            })
            // 查找lasso对象是否存在
            if (document.getElementById('lasso')) {
                // 删除lasso的画布
                this.divContainer.removeChild(document.getElementById('lasso') as HTMLElement)
                this.drawingCanvas!.style.cursor = ''
                this.drawingCanvas = undefined
                this.drawingContext = undefined
                this.drewPoints = []
            }
        }
    }

    activate() {
        if (this.galaxyvis.renderer == 'webgl')
            this.divContainer = this.galaxyvis.gl.canvas.parentNode
        else this.divContainer = this.galaxyvis.ctx.canvas.parentNode
        if (!this.isActive) {
            this.isActive = true
            if (!document.getElementById('lasso')) {
                // 创建lasso的画布
                this.initDOM('canvas', 'lasso')
                this.drawingContext = (this.drawingCanvas as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
                this.drawingCanvas!.style.cursor = 'cursor'
            }
        }

        if (this.galaxyvis.geo.enabled()) {
            let geomap = this.galaxyvis.geo.getMap()
            geomap.dragging['disable']()
        }

        // 监听鼠标点击事件
        this.drawingCanvas!.addEventListener('mousedown', (e: MouseEvent) => {
            this.onDrawingStart(e)
        })
        // 监听鼠标移动事件
        this.drawingCanvas!.addEventListener('mousemove', (e: MouseEvent) => {
            this.onDrawing(e)
        })
        // 监听鼠标抬起事件
        this.drawingCanvas!.addEventListener('mouseup', (e: MouseEvent) => {
            this.onDrawingEnd(e)
        })
    }

    /**
     * 创建dom节点
     * @param tag
     * @param id
     */
    private initDOM(tag: string, id: string) {
        // 创建dom对象
        let dom = document.createElement(tag)
        // 添加style
        dom.style.position = 'absolute'
        dom.style.left = '0px'
        dom.style.top = '0px'
        dom.id = id
        let width = globalInfo[this.galaxyvis.id].BoxCanvas.getWidth
        let height = globalInfo[this.galaxyvis.id].BoxCanvas.getHeight

        // 设置宽高
        if (window.devicePixelRatio) {
            dom.style.width = width + 'px'
            dom.style.height = height + 'px'
            // @ts-ignore
            dom.height = height
            // @ts-ignore
            dom.width = width
        }
        this.divContainer.appendChild(dom)

        this.drawingCanvas = dom as HTMLCanvasElement
    }

    onDrawingStart(event: MouseEvent) {
        let drawingRectangle = this.drawingCanvas!.getBoundingClientRect()
        // 开始绘制
        if (this.isActive) {
            this.isDrawing = true
            this.drewPoints = []
            this.selectedNodes = []

            this.drewPoints.push({
                x: event.clientX - drawingRectangle.left,
                y: event.clientY - drawingRectangle.top,
            })
            // 改变鼠标形状
            this.drawingCanvas!.style.cursor = 'cell'
            // 阻止默认事件发生
            event.stopPropagation()
        }
    }

    onDrawing(event: MouseEvent) {
        // 绘制线
        if (this.isActive && this.isDrawing) {
            let x = 0,
                y = 0,
                drawingRectangle = this.drawingCanvas!.getBoundingClientRect()

            x = event.clientX
            y = event.clientY

            this.drewPoints.push({
                x: x - drawingRectangle.left,
                y: y - drawingRectangle.top,
            })
            // 生成绘制的属性
            this.drawingContext!.lineWidth = 2
            this.drawingContext!.strokeStyle = 'rgba(57,207,255,1.0)'
            this.drawingContext!.fillStyle = 'rgba(224, 245, 255, 0.25)'
            this.drawingContext!.lineJoin = 'round'
            this.drawingContext!.lineCap = 'round'
            // 清空画布
            this.drawingContext!.clearRect(
                0,
                0,
                this.drawingContext!.canvas.width,
                this.drawingContext!.canvas.height,
            )

            let sourcePoint = this.drewPoints[0],
                destinationPoint = this.drewPoints[1],
                pointsLength = this.drewPoints.length,
                // 获取绘制的曲线的控制点
                getMiddlePointCoordinates = function (
                    startPoint: { x: number; y: number },
                    endPoint: { x: number; y: number },
                ) {
                    return {
                        x: startPoint.x + (endPoint.x - startPoint.x) / 2,
                        y: startPoint.y + (endPoint.y - startPoint.y) / 2,
                    }
                }
            // 开始绘制
            this.drawingContext!.beginPath()
            this.drawingContext!.moveTo(sourcePoint.x, sourcePoint.y)

            for (let i = 1; i < pointsLength; i++) {
                let middlePoint = getMiddlePointCoordinates(sourcePoint, destinationPoint)
                this.drawingContext!.quadraticCurveTo(
                    sourcePoint.x,
                    sourcePoint.y,
                    middlePoint.x,
                    middlePoint.y,
                )
                sourcePoint = this.drewPoints[i]
                destinationPoint = this.drewPoints[i + 1]
            }

            this.drawingContext!.lineTo(sourcePoint.x, sourcePoint.y)
            this.drawingContext!.stroke()
            // 填充
            this.drawingContext!.fill()
            // 阻止默认事件发生
            event.stopPropagation()
        }
    }

    onDrawingEnd(e: MouseEvent) {
        if (this.isActive && this.isDrawing) {
            this.isDrawing = false

            let nodes = this.galaxyvis.getFilterNode(),
                renderType = this.galaxyvis.renderer,
                BoxCanvas = globalInfo[this.galaxyvis.id].BoxCanvas,
                width = BoxCanvas.getWidth,
                height = BoxCanvas.getHeight

            this.camera = this.galaxyvis.camera

            // 获取当前缩放
            let ratio = this.camera.ratio
            // 获取相机当前位置
            let position = this.camera.position

            if (renderType === 'canvas') {
                // 获取缩放比
                let scale = (globalProp.globalScale / ratio) * 2.0
                for (let [key, value] of nodes) {
                    let attributes = value.getAttribute()
                    let { x, y } = attributes
                        // 根据相机位置更改点的初始位置
                        ; (x += position[0]), (y += position[1])

                    x *= scale / 2.0
                    y *= scale / 2.0
                    x += width / 2
                    y += height / 2

                    // 先判断是不是在屏幕内
                    if (x >= 0 && x <= width && y >= 0 && y <= height)
                        if (this.drawingContext!.isPointInPath(x, y)) {
                            basicData[this.galaxyvis.id].selectedNodes.add(key)
                            this.selectedNodes.push(key)
                        }
                }
            } else {
                let unitWidth = width / ratio
                let unitHeight = height / ratio
                let aspectRatio = width / height
                for (let [key, value] of nodes) {
                    let attributes = value.getAttribute()
                    let { x, y } = attributes

                    let offset = coordTransformation(this.galaxyvis.id, x, y)
                    x = offset[0] - position[0]
                    y = offset[1] - position[1]

                    // 先判断是不是在屏幕内
                    x = (x / aspectRatio + ratio / 2) * unitWidth
                    y = (-y + ratio / 2) * unitHeight

                    if (x >= 0 && x <= width && y >= 0 && y <= height)
                        if (this.drawingContext!.isPointInPath(x, y)) {
                            basicData[this.galaxyvis.id].selectedNodes.add(key)
                            this.selectedNodes.push(key)
                        }
                }
            }
            let nodeList: any = []
            if (this.selectedNodes.length) {
                nodeList = new NodeList(this.galaxyvis, this.selectedNodes)
                nodeList.setSelected(true)
            }

            this.callback &&
                this.callback({
                    nodes: nodeList,
                })

            // this.galaxyvis.events.emit('nodesSelected', nodeList)

            this.drawingContext!.clearRect(0, 0, this.drawingCanvas!.width, this.drawingCanvas!.height)
            this.drawingCanvas!.style.cursor = 'default'
            e.stopPropagation()

            this.disable()
        }
    }
}
