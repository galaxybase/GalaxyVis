import { mat4, vec3 } from 'gl-matrix'
import { basicData, globalInfo, globalProp } from '../initial/globalProp'
import { getX, getY, vectorAngle } from '../utils'
import { QuadTree } from '../utils/quadTree'
import Event from '../utils/event'
import { originInfo } from '../initial/originInitial'

class Camera {
    public gl: WebGLRenderingContext
    public position: vec3 //相机位置
    public Matrix: mat4 //矩阵
    public front: vec3 = [0, 0, -1] //视图方向
    public up: vec3 = [0, 1, 0] //相机y轴的正方向
    public right: vec3 = [1, 0, 0] //相机x轴的正方向
    public worldUp: vec3 //世界仰角
    public movementSpeed: number = 2.5 //相机移动速度
    public mouseSensitivity: number = 0.1
    public zoom: number = globalProp.defaultZoom //当前zoom的层级
    public minZoom: number = globalProp.minZoom //最小zoom
    public maxZoom: number = globalProp.maxZoom //最大zoom
    public hasDragged: boolean = false //开始拖动
    public startCameraX: number = 0 //相机开始位置
    public startCameraY: number = 0
    public lastCameraX: number = 0 //相机结束位置
    public lastCameraY: number = 0
    public startMouseX: number = 0 //鼠标开始位置
    public startMouseY: number = 0
    public isMouseDown: boolean = false //鼠标是否点击
    public isMoving: boolean = false
    public cameraChange: boolean = false //相机是否发啊生改变
    private mouseType: number = 0 //鼠标点击类型
    public ratio: number = 0 //缩放比例
    public aspectRatio: number = 0
    public quad: any //四叉树
    private thumbnail: boolean //缩略图模式
    private renderer: string //渲染类型
    private graphId: string

    /**
     * 创建一个相机
     * @param graphId 目标图id
     * @param gl 渲染类型
     * @param thumbnail 是否为缩略图
     * @param position 相机位置
     * @param worldUp 视角位置
     */
    constructor(
        graphId: string,
        gl: WebGLRenderingContext | CanvasRenderingContext2D,
        thumbnail: boolean,
        position: vec3 = [0, 0, 3],
        worldUp: vec3 = [0, 1, 0],
    ) {
        this.graphId = graphId
        this.renderer = gl instanceof CanvasRenderingContext2D ? 'canvas' : 'webgl'
        this.position = position
        this.thumbnail = thumbnail
        this.worldUp = worldUp
        // @ts-ignore
        this.gl = gl
        this.Matrix = mat4.create()
        this.updateCameraVectors()
        this.cameraChange = false
        this.ratio = 2 * (this.position[2] * Math.tan((this.zoom * Math.PI) / 360))
        let width = this.gl.canvas.width
        let height = this.gl.canvas.height
        this.aspectRatio = width / height
        this.quad = new QuadTree({ x: 0, y: 0, width, height }, false, 4, 4)
        if (!thumbnail)
            basicData[graphId].transform = width / globalProp.globalScale / this.aspectRatio
    }
    /**
     * 获得当前的观察矩阵
     */
    getViewMatrix() {
        const center = vec3.add(vec3.create(), this.position, this.front)
        const viewMatrix = mat4.lookAt(mat4.create(), this.position, center, this.up)
        return viewMatrix
    }

    isPositionNan() {
        if (isNaN(this.position[0]) || isNaN(this.position[1])) {
            this.position[0] = 0
            this.position[1] = 0
        }
    }

    updateTransform() {
        let graphId = this.graphId;
        let width = this.gl.canvas.width
        basicData[graphId].transform = width / globalProp.globalScale / this.aspectRatio
    }

    /**
     * 摄像机鼠标滚动事件
     * @param e
     * @returns
     */
    processMouseScroll(e: WheelEvent) {
        this.isPositionNan()
        let globalThumbnail = globalInfo[this.graphId].thumbnail
        let width = this.thumbnail ? globalThumbnail?.width : this.gl.canvas.width,
            height = this.thumbnail ? globalThumbnail?.height : this.gl.canvas.height
        let pointX = getX(e) - width / 2,
            pointY = getY(e) - height / 2
        let ratio = 2 * (this.position[2] * Math.tan((this.zoom * Math.PI) / 360))
        // 缩放层级 zoom越大图越小
        let deltaY = e.deltaY > 0 ? 5 : -5
        this.zoom += deltaY
        if (this.zoom < this.minZoom) this.zoom = this.minZoom
        if (this.zoom > this.maxZoom) this.zoom = this.maxZoom

        let newRatio = 2 * (this.position[2] * Math.tan((this.zoom * Math.PI) / 360))

        if (this.renderer === 'webgl') {
            let x = ((pointX * ratio) / width) * this.aspectRatio,
                y = (pointY * ratio) / height,
                offsetX = ((pointX * newRatio) / width) * this.aspectRatio,
                offsetY = (pointY * newRatio) / height
            vec3.sub(this.position, this.position, [offsetX - x, -offsetY + y, 0])
        } else if (this.renderer === 'canvas') {
            let scale = globalProp.globalScale / newRatio,
                x = pointX / scale,
                y = pointY / scale,
                offsetX = (x * (newRatio - ratio)) / newRatio,
                offsetY = (y * (newRatio - ratio)) / newRatio
            vec3.sub(this.position, this.position, [-offsetX, -offsetY, 0])
        }

        this.updateCameraVectors(true)
        // 阻止默认事件发生
        if (e.preventDefault) e.preventDefault()
        else e.returnValue = false
        e.stopPropagation()
        return false
    }

    /**
     * 摄像机鼠标移动点击事件
     * @param e
     */
    processMouseDown(e: MouseEvent) {
        this.isPositionNan()
        this.startMouseX = getX(e)
        this.startMouseY = getY(e)
        this.isMouseDown = true
        switch (e.button) {
            case 0:
                this.mouseType = 1
                break
            case 2:
                this.mouseType = 3
                break
            default:
                this.mouseType = 2
                console.log('mouse down')
        }
    }

    /**
     * 摄像机鼠标移动事件
     * @param e
     * @returns
     */
    processMouseMove(e: MouseEvent) {
        this.isPositionNan()
        let pointX,
            pointY,
            x,
            y,
            globalThumbnail = globalInfo[this.graphId].thumbnail,
            width = this.thumbnail ? globalThumbnail?.width : this.gl.canvas.width,
            height = this.thumbnail ? globalThumbnail?.height : this.gl.canvas.height;
        pointX = getX(e)
        pointY = getY(e)
        if (this.isMouseDown && this.renderer == 'webgl') {
            this.isMoving = true
            if (this.mouseType == 1) {
                // 拖动
                x = (((pointX - this.startMouseX) * this.ratio) / width) * this.aspectRatio
                y = ((pointY - this.startMouseY) * this.ratio) / height
                vec3.sub(this.position, this.position, [x, -y, 0])
                this.startMouseX = pointX
                this.startMouseY = pointY
                this.updateCameraVectors()
            }
            // to do list 鼠标右键旋转整个画布
        } else if (this.isMouseDown && this.renderer == 'canvas') {
            this.isMoving = true
            if (this.mouseType == 1) {
                let scale = globalProp.globalScale / this.ratio
                x = (pointX - this.startMouseX) / scale
                y = (pointY - this.startMouseY) / scale
                vec3.sub(this.position, this.position, [-x, -y, 0])
                this.startMouseX = pointX
                this.startMouseY = pointY
                this.updateCameraVectors()
            }
        }
        if (this.isMouseDown && this.mouseType == 3) {
            const RANGLE = vectorAngle([pointX, pointY], [this.startMouseX, this.startMouseY], [width / 2, height / 2]) * 6
            if (RANGLE !== 0) {
                let Matrix = mat4.create()
                mat4.rotateZ(Matrix, Matrix, RANGLE)

                // this.position = [
                //     (this.position[0]) * Matrix[0] + (this.position[1]) * Matrix[4], 
                //     (this.position[0]) * Matrix[1] + (this.position[1]) * Matrix[5], 
                //     0
                // ]
                // this.updateCameraVectors()

                let nodeList = basicData[this.graphId].nodeList
                nodeList.forEach((item, key) => {
                    let { isVisible, x, y } = item.getAttribute()
                    if (isVisible) {
                        item.changeAttribute({
                            x: (x) * Matrix[0] + (y) * Matrix[4],
                            y: (x) * Matrix[1] + (y) * Matrix[5]
                        })
                    }
                })
                Event.trigger('camerarefresh', false, true)
            }
            this.startMouseX = pointX
            this.startMouseY = pointY
        }


        if (e.preventDefault) e.preventDefault()
        else e.returnValue = false
        e.stopPropagation()
        return false
    }
    /**
     * 摄像机鼠标放开事件
     * @param e
     */
    processMouseUp(e: MouseEvent) {
        this.isPositionNan()
        this.isMouseDown = false
        this.isMoving = false
    }

    /**
     * 更新相机
     * @param viewChange 是否刷新视图
     */
    updateCameraVectors(viewChange: boolean = false) {
        this.cameraChange = true
        this.ratio = 2 * (this.position[2] * Math.tan((this.zoom * Math.PI) / 360))
        Event.trigger('camerarefresh', viewChange)
    }
}

export default Camera
