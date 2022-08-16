import CaptorsMouse from './captors/mouse'
import Camera from './classes/camera'
import Graph from './classes/graph'
import edgeProgram from './renderers/webgl/programs/edge'
import nodeProgram from './renderers/webgl/programs/node'
import sdfTextProgram from './renderers/webgl/programs/lable'
import haloProgram from './renderers/webgl/programs/halo'
import nodeCanvas from './renderers/canvas/node'
import lableCanvas from './renderers/canvas/lable'
import edgeCanvas from './renderers/canvas/edge'
import haloCanvas from './renderers/canvas/halo'
import event from './utils/event'
import { getTextPixels } from './utils/piexelsCreat'
import { drawText, sdfCreate } from './utils/tinySdf/sdfDrawText'
import { globalProp, basicData, globalInfo, thumbnailInfo, instancesGL } from './initial/globalProp'
import { originInfo, originInitial } from './initial/originInitial'
import { basieciDataSetting, globalInfoSetting, originInfoSetting } from './initial/settings'
import { Options } from './types'
import {
    floatColor,
    genID,
    getContainerHeight,
    getContainerWidth,
    initGlTextureBind,
    isDom,
    isWebGLSupported,
    mousedownFunction,
    requestFrame,
    wheelFunction,
} from './utils'
import { cloneDeep, get, has, debounce, merge } from 'lodash'

export default class galaxyvis extends Graph {
    public gl!: WebGLRenderingContext // webgl上下文
    public ctx!: CanvasRenderingContext2D // canvas上下文
    public thumbnail: boolean = false //是否用于缩略图
    public renderer: string
    public id: string
    private camera: Camera | null //相机
    private mouseCaptor: CaptorsMouse | null //鼠标事件
    private nodeProgram: nodeProgram | nodeCanvas | undefined //点渲染器
    private textProgram: sdfTextProgram | lableCanvas | undefined //文字渲染器
    private edgeProgram: edgeProgram | edgeCanvas | undefined //边渲染器
    private haloProgram: haloProgram | haloCanvas | undefined //光环渲染器
    private debounce: any // 防抖函数
    private localUpdate: boolean = true //开启局部更新
    private textStatus: boolean = true //是否渲染文字
    private divContainer: any

    constructor(args: {
        container: string | HTMLElement //容器 如果是dom节点就直接用没有的话生成
        graph?: Graph
        options?: Options // 配置项
        renderer?: string // 渲染类型
    }) {
        super()
        // 判断是否存在canvas的父级div 并生成canvas
        const canvasBox = this.setContainer(args.container)
        this.id = 'graph' + genID(0)
        if (get(args, 'options.thumbnail', undefined) == true) {
            if (Object.keys(basicData).length !== 0) {
                this.id = Object.keys(basicData)[0]
            }
        } else {
            basicData[this.id] = cloneDeep(basieciDataSetting)
            originInfo[this.id] = cloneDeep(originInfoSetting)
            globalInfo[this.id] = cloneDeep(globalInfoSetting)
        }
        // 获取当前的render类型 默认为webgl
        this.renderer = args.renderer || 'webgl'
        // 是否支持webgl
        if (this.renderer === 'webgl')
            isWebGLSupported() ? (this.renderer = 'webgl') : (this.renderer = 'canvas')
        // option下args属性拆分加载
        this.initArgs(args)

        if (this.renderer === 'webgl') {
            // 获取webgl上下文
            this.createWebGLContext(canvasBox, args.options as Options)
            // 加载相机
            this.camera = new Camera(this.id, this.gl, this.thumbnail)
            if (!this.thumbnail) instancesGL[this.id] = this.gl
            // 加载Programs
            this.initPrograms()
        } else {
            // 获取2d画布
            this.createCanvasContext(canvasBox, args.options as Options)
            // 加载相机
            this.camera = new Camera(this.id, this.ctx, this.thumbnail)
            // 挂载
            this.initCanvasRender()
        }
        // 加载父级容器监听事件
        if (!this.thumbnail) {
            // 加载公用监听事件
            this.initEventListener(canvasBox)
            this.initContainerListener()
            // 加载captors_mouse;
            this.mouseCaptor = new CaptorsMouse(this, this.camera, canvasBox)
            globalInfo[this.id].canvasBox = canvasBox
        } else {
            this.mouseCaptor = null
            thumbnailInfo[this.id] = this
        }

        // 初始调整大小
        this.resize()
        // 订阅发布-> 监听
        this.initListener()
        // 订阅发布-> 监听
        this.initCanvasListener()
        // 重新加载iconMap下的所有数据
        if (this.renderer === 'webgl') {
            globalProp.iconMap.forEach((item, key) => {
                this.initIconOrImage({
                    key,
                    type: item.type,
                    num: item.num,
                    style: item?.style,
                    scale: item?.scale,
                    font: item?.font,
                })
            })
        }
    }
    // 初始化Option.args的属性
    private initArgs(args: any) {
        if (get(args, 'options.thumbnail', undefined) == true) {
            this.thumbnail = true
            globalInfo[this.id].thumbnail = {
                width: 0,
                height: 0,
            }
        } else {
            this.thumbnail = false
        }

        if (has(args, 'options.interactions.zoom')) {
            let zoomInit = get(args, 'options.interactions.zoom'),
                defaultZoom = {
                    maxValue: 160,
                    minValue: 20,
                    defaultValue: 70,
                },
                flag = true

            zoomInit = merge(defaultZoom, zoomInit)
            let { maxValue, minValue, defaultValue } = zoomInit
            if (maxValue < minValue) {
                flag = false
                console.log('zoom init happened maxValue < minValue')
            }
            if (maxValue < 0 && maxValue > 180) {
                flag = false
                console.log('zoom maxValue should in 0 to 180')
            }
            if (minValue < 0 && minValue > 180) {
                flag = false
                console.log('zoom minValue should in 0 to 180')
            }
            if (defaultValue < minValue && defaultValue > maxValue) {
                defaultValue = (maxValue + minValue) / 2
            }
            if (flag) {
                globalProp.maxZoom = maxValue
                globalProp.minZoom = minValue
                globalProp.defaultZoom = defaultValue
            }
        }

        if (get(args, 'options.useLocalUpdate', undefined) == false) {
            this.localUpdate = false
        }

        if (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
            globalInfo[this.id].isSafari = true
        } else {
            globalInfo[this.id].isSafari = false
        }
    }
    // 获取webgl上下文
    private createWebGLContext(
        canvasBox: HTMLCanvasElement,
        options: Options,
    ): WebGLRenderingContext {
        // 获取webgl
        this.gl =
            (canvasBox.getContext('webgl', originInitial.options) as WebGLRenderingContext) ||
            (canvasBox.getContext(
                'experimental-webgl',
                originInitial.options,
            ) as WebGLRenderingContext)

        // 清理画布
        if (options?.backgroundColor) {
            globalInfo[this.id].backgroundColor = {
                floatColor: floatColor(options.backgroundColor).rgb,
                color: options.backgroundColor,
            }
            this.divContainer.style.backgroundColor = options.backgroundColor
        }
        // 清除缓冲区
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        // 开启扩展
        this.gl.getExtension('OES_standard_derivatives')
        // 开启混合
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA,
            this.gl.ONE_MINUS_SRC_ALPHA,
            this.gl.ONE,
            this.gl.ONE_MINUS_SRC_ALPHA,
        )
        let canvas: any = this.gl.canvas,
            width = canvasBox.clientWidth || canvasBox.offsetWidth,
            height = canvasBox.clientHeight || canvasBox.offsetHeight
        // 设置宽高
        if (window.devicePixelRatio) {
            canvas.style.width = width + 'px'
            canvas.style.height = height + 'px'
            canvas.height = height * window.devicePixelRatio
            canvas.width = width * window.devicePixelRatio
        }
        // 获取图片的上下文
        if (!globalProp.textureCtx && !this.thumbnail) {
            globalProp.textureCtx = document
                .createElement('canvas')
                .getContext('2d') as CanvasRenderingContext2D
            let atlas = globalProp.atlas,
                spriteAtlasWidth = 128 * atlas,
                spriteAtlasHeight = 128 * atlas,
                textureCtx = globalProp.textureCtx
            textureCtx.canvas.width = spriteAtlasWidth
            textureCtx.canvas.height = spriteAtlasHeight
        }
        let textureCtx = globalProp.textureCtx
        if (!textureCtx) {
            throw new Error('初始化canvas失败')
        }
        return this.gl
    }
    // 生成canvas2d画布
    private createCanvasContext(
        canvasBox: HTMLCanvasElement,
        options: Options,
    ): CanvasRenderingContext2D {
        const contextOptions = {
            preserveDrawingBuffer: false,
            antialias: false,
        }
        // 创建2d画布
        this.ctx = canvasBox.getContext('2d', contextOptions) as CanvasRenderingContext2D

        if (options?.backgroundColor) {
            this.divContainer.style.backgroundColor = options.backgroundColor
            globalInfo[this.id].backgroundColor = {
                floatColor: floatColor(options.backgroundColor).rgb,
                color: options.backgroundColor,
            }
        }
        // 设置宽高
        if (window.devicePixelRatio) {
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        return this.ctx
    }
    // 生成canvas
    private setContainer(container: string | HTMLElement): HTMLCanvasElement {
        var divContainer
        if (isDom(container)) {
            divContainer = container as HTMLElement
        } else {
            // 创建dom节点
            divContainer = document.getElementById(container as string)
            if (!divContainer) {
                throw new Error(`不存在${container}这个dom节点`)
            }
        }
        this.divContainer = divContainer

        // 添加节点到dom
        let width = divContainer.clientWidth || divContainer.offsetWidth,
            height = divContainer.clientHeight || divContainer.offsetHeight
        const canvasBox = document.createElement('canvas')
        canvasBox.width = width
        canvasBox.height = height
        divContainer.appendChild(canvasBox)
        return canvasBox
    }
    // 加载公用监听事件
    private initEventListener(canvasBox: HTMLCanvasElement): void {
        // 监听滚动事件
        this.WheelFunction = wheelFunction.bind(this)

        canvasBox.addEventListener('wheel', this.WheelFunction)

        // 阻止默认textmenu事件
        canvasBox.oncontextmenu = function (e) {
            e.preventDefault()
        }
        // 监听双击事件
        canvasBox.addEventListener('dblclick', () => {
            this.mouseCaptor!.MouseDbClickListener()
        })

        this.MousedownFunction = mousedownFunction.bind(this)
        // 监听鼠标点击事件
        canvasBox.addEventListener('mousedown', this.MousedownFunction)
        //监听鼠标移出事件
        canvasBox.addEventListener('mouseup', event => {
            this.mouseCaptor!.MouseOutListener(event)
            this.camera!.processMouseUp(event)
        })
        // 监听鼠标移动事件
        canvasBox.addEventListener('mousemove', event => {
            let r = this.mouseCaptor!.MouseMoveListener(event)
            if (r) this.camera!.processMouseMove(event)
        })

        canvasBox.onmousedown = () => {
            return false
        }
    }
    // 加载浏览器监听事件
    private initContainerListener(): void {
        // 当浏览器大小发生改变应发重绘
        window.onresize = () => {
            this.resize()
            this.render()
        }
    }
    // 订阅发布
    private initListener(): void {
        event.listen('camerarefresh', (viewChange: boolean = false) => {
            this.camerarefresh(viewChange)
        })
    }
    // 订阅发布-> 监听
    private initCanvasListener(): void {
        event.listen('renderCanvas', () => {
            this.renderCanvas()
        })
        // 节流函数
        this.debounce = debounce(() => this.events.emit('viewChanged', { type: 'zoom' }), 200)
    }
    // 返回div对象
    public getDivContainer(): void {
        return this.divContainer
    }
    // 画布大小变化，重置视图
    public resize(): void {
        try {
            let gl = this.gl
            let canvas: any = this.renderer === 'webgl' ? gl.canvas : this.ctx.canvas,
                container: any = this.divContainer,
                width = getContainerWidth(container),
                height = getContainerHeight(container)

            if (!width || !height) return

            if (this.renderer === 'webgl') {
                if (canvas.width != width || canvas.height != height) {
                    canvas.height = height
                    canvas.width = width
                    canvas.style.width = width + 'px'
                    canvas.style.height = height + 'px'
                }
                // 跟新整个canvas的上下文视图
                gl.viewport(0, 0, canvas.width, canvas.height)
                this.camera!.aspectRatio = width / height
                if (!this.thumbnail)
                    basicData[this.id].transform =
                        width / globalProp.globalScale / this.camera!.aspectRatio
                if (globalProp.textSet.size) {
                    sdfCreate(this, globalProp.textSet, this.thumbnail)
                }
                if (Object.keys(globalProp.labelStore).length) {
                    for (let i in globalProp.labelStore) {
                        let { size, maxLength, str, style } = globalProp.labelStore[i]
                        drawText(size, str, maxLength, style)
                    }
                }
            } else {
                // 设置宽高
                if (window.devicePixelRatio && !this.thumbnail) {
                    canvas.style.width = width + 'px'
                    canvas.style.height = height + 'px'
                    canvas.height = height
                    canvas.width = width
                }
            }

            if (globalInfo[this.id].thumbnail && this.thumbnail) {
                globalInfo[this.id].thumbnail!.width = width
                globalInfo[this.id].thumbnail!.height = height
            } else {
                globalInfo[this.id].BoxCanvas.setWidth = width
                globalInfo[this.id].BoxCanvas.setHeight = height
            }
        } catch {}
    }
    // 初始化着色器
    private initPrograms(): void {
        this.nodeProgram = new nodeProgram(this.gl)
        this.textProgram = new sdfTextProgram(this.gl)
        this.edgeProgram = new edgeProgram(this.gl)
        this.haloProgram = new haloProgram(this.gl)
        // 初始化指向
        this.nodeProgram.initData(this)
        this.textProgram.initData(this)
        this.edgeProgram.initData(this)
        this.haloProgram.initData(this)
    }

    // 文字集
    public initText(): void {
        if (this.renderer !== 'webgl') return
        const textSet = globalProp.textSet
        if (textSet.size) {
            sdfCreate(this, textSet, this.thumbnail)
        }
    }
    // icon和image
    public initIconOrImage = async (data: any) => {
        if (this.renderer !== 'webgl') return
        globalProp.useIniticon++
        const atlas = globalProp.atlas,
            textureCtx = globalProp.textureCtx as CanvasRenderingContext2D
        // icon类型
        if (data.type == 'icon') {
            // 等待字体加载
            let pix = await getTextPixels(3, data.key, data.font, data.style, 128, data.scale)
            let newPix = {
                pixels: pix.pixels,
                x: 128 * (data.num % atlas),
                y: 128 * Math.floor(data.num / atlas),
            }
            textureCtx.putImageData(newPix.pixels, newPix.x, newPix.y)
        }
        // image类型
        else if (data.type == 'image') {
            const url = data.key,
                count = data.num,
                imageCanvas = document.createElement('canvas'),
                imageCanvasContext = imageCanvas.getContext('2d') as CanvasRenderingContext2D
            imageCanvas.height = 128
            imageCanvas.width = 128
            imageCanvasContext.fillStyle = '#fff'
            imageCanvasContext.fillRect(0, 0, 128, 128)
            // 图片信息
            var textureInfo = {
                x: 128 * (count % atlas),
                y: 128 * Math.floor(count / atlas),
                pixels: imageCanvasContext.getImageData(0, 0, 128, 128),
            }
            var img = new Image()
            var that = this
            img.crossOrigin = 'anonymous'
            // 当加载完图片再重新render
            img.addEventListener('load', function () {
                try {
                    imageCanvasContext.drawImage(img, 0, 0, 128, 128)
                    textureInfo.pixels = imageCanvasContext.getImageData(0, 0, 128, 128)
                    textureCtx?.putImageData(textureInfo.pixels, textureInfo.x, textureInfo.y)
                    if (Object.keys(instancesGL).length > 0) {
                        for (let i in instancesGL) {
                            let gl = instancesGL[i]
                            initGlTextureBind(gl, gl.TEXTURE0, gl.createTexture(), textureCtx)
                        }
                    }
                    that.render()
                } catch (err) {
                    console.log(err, 'err')
                }
            })
            img.src = url
        }
        if (Object.keys(instancesGL).length > 0) {
            for (let i in instancesGL) {
                let gl = instancesGL[i]
                initGlTextureBind(gl, gl.TEXTURE0, gl.createTexture(), textureCtx)
            }
        }
        if (this.thumbnail === false) this.render()
    }

    // 清理缓冲区和图片缓存
    public clear(): void {
        if (this.renderer == 'webgl') {
            const textureCtx = globalProp.textureCtx as CanvasRenderingContext2D
            textureCtx.clearRect(0, 0, textureCtx.canvas.width, textureCtx.canvas.height)
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
            if (thumbnailInfo[this.id]) {
                thumbnailInfo[this.id].gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
            }
            ;(this.nodeProgram as nodeProgram).clear()
            ;(this.textProgram as sdfTextProgram).clear()
            ;(this.edgeProgram as edgeProgram).clear()
            ;(this.haloProgram as haloProgram).clear()
        } else {
            this.clearCanvas()
        }
    }

    private clearCanvas(): void {
        if (this.ctx) {
            let width = this.ctx.canvas.width
            let height = this.ctx.canvas.height
            // to do list: 使用双缓存
            this.ctx.clearRect(0, 0, width, height)
        }
    }

    // 更新渲染
    public async camerarefresh(viewChange: boolean = false): Promise<void> {
        if (!basicData[this.id]) {
            return void 0
        }
        if (this.renderer !== 'webgl') {
            return this.renderCanvas(true, viewChange)
        }

        if (thumbnailInfo[this.id] && !this.thumbnail) {
            thumbnailInfo[this.id].camerarefresh(viewChange)
        }

        const gl = this.gl
        const that = this
        const showText = this.textStatus
        requestFrame(tick)

        var strategies: { [key: string]: Function } = {
            0: () => {
                ;(that.haloProgram as haloProgram).refreshProcess()
            },
            1: () => {
                ;(that.edgeProgram as edgeProgram).refreshProcess()
            },
            2: () => {
                if (showText && !this.thumbnail)
                    (that.textProgram as sdfTextProgram).refreshProcessEdge()
            },
            3: () => {
                ;(that.nodeProgram as nodeProgram).refreshProcess()
            },
            4: () => {
                if (showText && !this.thumbnail)
                    (that.textProgram as sdfTextProgram).refreshProcess()
            },
        }
        let i = 0
        function tick() {
            gl.clear(gl.COLOR_BUFFER_BIT)
            do {
                strategies[i++]()
            } while (i < 5)
            if (i === 5 && viewChange) that.debounce()
        }
    }
    // 单个或者少许更新
    public async selectMovefresh(boolean: boolean = false): Promise<void> {
        if (!basicData[this.id]) {
            return void 0
        }
        if (this.renderer !== 'webgl') return this.renderCanvas(boolean)
        if (this.thumbnail || globalInfo[this.id].thumbnail) return this.render(boolean)
        if (!this.localUpdate || !this.textStatus) return this.render(boolean)

        if (thumbnailInfo[this.id] && !this.thumbnail) {
            thumbnailInfo[this.id].selectMovefresh(boolean)
        }

        const gl = this.gl
        const that = this
        const showText = this.textStatus
        requestFrame(tick)
        var strategies: { [key: string]: Function } = {
            0: () => {
                ;(that.haloProgram as haloProgram).moveProcess()
            },
            1: () => {
                ;(that.edgeProgram as edgeProgram).process(true)
            },
            2: () => {
                if (showText && !this.thumbnail)
                    (that.textProgram as sdfTextProgram).moveProcessEdge()
            },
            3: () => {
                ;(that.nodeProgram as nodeProgram).process()
            },
            4: () => {
                if (showText && !this.thumbnail)
                    (that.textProgram as sdfTextProgram).moveProcessNode()
            },
        }

        let i = 0
        function tick() {
            gl.clear(gl.COLOR_BUFFER_BIT)
            do {
                try {
                    strategies[i++]()
                } catch {}
            } while (i < 5)
        }
    }
    // 渲染
    public async render(boolean: boolean = true): Promise<any> {
        if (!basicData[this.id]) {
            return void 0
        }
        if (this.renderer !== 'webgl') {
            return this.renderCanvas(true, false)
        }

        if (thumbnailInfo[this.id] && !this.thumbnail) {
            thumbnailInfo[this.id].render(boolean)
        }

        const showText = this.textStatus
        const gl = this.gl
        const that = this

        var strategies: { [key: string]: Function } = {
            0: () => {
                ;(that.haloProgram as haloProgram).process()
            },
            1: () => {
                ;(that.edgeProgram as edgeProgram).process(false)
            },
            2: () => {
                if (showText && !this.thumbnail) (that.textProgram as sdfTextProgram).processEdge()
            },
            3: () => {
                ;(that.nodeProgram as nodeProgram).process()
            },
            4: () => {
                if (showText && !this.thumbnail) (that.textProgram as sdfTextProgram).processNode()
            },
        }

        if (boolean == false || basicData[this.id].edgeList.size < 2500000) {
            requestFrame(processTask)
        } else {
            requestFrame(tick)
            gl.clear(gl.COLOR_BUFFER_BIT)
        }
        let i = 0
        function tick(taskStartTime: number) {
            var taskFinishTime: number
            do {
                strategies[i++]()
                taskFinishTime = window.performance.now()
            } while (taskFinishTime - taskStartTime < 5 && i < 5)
            if (i <= 4) requestFrame(tick)
        }
        function processTask(then: number) {
            gl.clear(gl.COLOR_BUFFER_BIT)
            do {
                strategies[i++]()
            } while (i < 5)
        }
    }

    public initCanvasRender(): void {
        this.nodeProgram = new nodeCanvas(this)
        this.textProgram = new lableCanvas(this)
        this.edgeProgram = new edgeCanvas(this)
        this.haloProgram = new haloCanvas(this)
    }

    public async renderCanvas(boolean: boolean = true, viewChange: boolean = false): Promise<any> {
        if (!basicData[this.id]) {
            return void 0
        }
        if (this.renderer == 'webgl') {
            return
        }

        if (thumbnailInfo[this.id] && !this.thumbnail) {
            thumbnailInfo[this.id].renderCanvas(boolean, viewChange)
        }

        const showText = this.textStatus
        const that = this

        if (boolean) {
            this.camera?.quad.clear()
        }

        var strategies: { [key: string]: Function } = {
            0: () => {
                ;(that.haloProgram as haloCanvas).drawNodeHalo()
            },
            1: () => {
                ;(that.edgeProgram as edgeCanvas).drawEdge(boolean)
            },
            2: () => {
                if (showText && !this.thumbnail) (that.textProgram as lableCanvas).drawEdgeLabel()
            },
            3: () => {
                ;(that.nodeProgram as nodeCanvas).drawNode(boolean)
            },
            4: () => {
                if (showText && !this.thumbnail) (that.textProgram as lableCanvas).drawNodeLabel()
            },
        }

        let i = 0
        async function tick(taskStartTime: number) {
            that.clearCanvas()
            do {
                await strategies[i++]()
            } while (i < 5)

            if (i === 5 && viewChange) that.debounce()
        }
        requestFrame(tick)
    }
}