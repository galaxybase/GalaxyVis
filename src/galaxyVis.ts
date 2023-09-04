import CaptorsMouse from './captors/mouse'
import Camera from './classes/camera'
import Graph from './classes/graph'
import edgeProgram from './renderers/webgl/programs/edge'
import nodeProgram from './renderers/webgl/programs/node'
import sdfTextProgram from './renderers/webgl/programs/lable'
import haloProgram from './renderers/webgl/programs/halo'
import fastnodeProgram from './renderers/webgl/programs/fastnode'
import nodeCanvas from './renderers/canvas/node'
import lableCanvas from './renderers/canvas/lable'
import edgeCanvas from './renderers/canvas/edge'
import haloCanvas from './renderers/canvas/halo'
import event from './utils/event'
import { drawText, sdfCreate } from './utils/tinySdf/sdfDrawText'
import { globalProp, basicData, globalInfo, thumbnailInfo, instancesGL } from './initial/globalProp'
import { originInfo, originInitial } from './initial/originInitial'
import { basieciDataSetting, globalInfoSetting, originInfoSetting } from './initial/settings'
import { Options } from './types'
import {
    cancelFrame,
    doubleClickFunction,
    floatColor,
    genID,
    getContainerHeight,
    getContainerWidth,
    initIconOrImage,
    isDom,
    isWebGLSupported,
    mousedownFunction,
    reBindTexture,
    requestFrame,
    wheelFunction,
} from './utils'

import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import debounce from 'lodash/debounce'
import merge from 'lodash/merge'

import pulseCanvas from './renderers/canvas/pulse'
import particleCanvas from './renderers/canvas/particle'

export default class galaxyvis extends Graph {
    public gl!: WebGLRenderingContext // webgl上下文
    public ctx!: CanvasRenderingContext2D // canvas上下文
    public thumbnail: boolean = false //是否用于缩略图
    public renderer: string = "webgl"
    public id: string
    private camera: Camera | null //相机
    private mouseCaptor: CaptorsMouse | null //鼠标事件
    private nodeProgram!: nodeProgram | nodeCanvas | fastnodeProgram //点渲染器
    private textProgram!: sdfTextProgram | lableCanvas  //文字渲染器
    private edgeProgram!: edgeProgram | edgeCanvas  //边渲染器
    private haloProgram!: haloProgram | haloCanvas  //光环渲染器
    private debounce!: Function // 防抖函数
    private localUpdate: boolean = true //开启局部更新
    private textStatus: boolean = true //是否渲染文字
    private divContainer: HTMLElement | null | undefined
    private pulse: boolean = false //是否开启pulse模式
    private pulseCanvas: pulseCanvas | undefined;
    private particle: boolean = false //是否开启particle模式
    private particleCanvas: particleCanvas | undefined;

    constructor(args: {
        container: string | HTMLElement //容器 如果是dom节点就直接用没有的话生成
        graph?: Graph
        options?: Options // 配置项
        renderer?: string // 渲染类型
    }) {
        super()
        let id = this.id = 'graph' + genID(0)
        // option下args属性拆分加载
        const canvasBox = this.initArgs(args)
        if (this.renderer === 'webgl') {
            // 获取webgl上下文
            this.createWebGLContext(canvasBox, args.options as Options)
            // 加载相机
            this.camera = new Camera(id, this.gl, this.events, this.thumbnail, {
                minValue: this.minValue,
                maxValue: this.maxValue,
                defaultValue: this.defaultValue
            })
            if (!this.thumbnail) instancesGL[id] = this
            // 加载Programs
            this.initPrograms()
        } else {
            // 获取2d画布
            this.createCanvasContext(canvasBox, args.options as Options)
            // 加载相机
            this.camera = new Camera(id, this.ctx, this.events, this.thumbnail, {
                minValue: this.minValue,
                maxValue: this.maxValue,
                defaultValue: this.defaultValue
            })
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
            globalInfo[id].canvasBox = canvasBox
        } else {
            this.mouseCaptor = null
            thumbnailInfo[this.id] = this
            this.render()
        }

        // 初始调整大小
        this.resize()
        // 订阅发布-> 监听
        this.initListener()
        // 重新加载iconMap下的所有数据
        if (this.renderer === 'webgl' && this.thumbnail) {
            reBindTexture(this)
        }
        // 初始化pulse并开启自循环
        if (this.pulse) {
            const pulseCtx = this.pulseCanvas = new pulseCanvas(this)
            pulseCtx.render()
        }
        if (this.particle) {
            const particleCtx = this.particleCanvas = new particleCanvas(this)
            particleCtx.render()
        }
    }
    // 初始化Option.args的属性
    private initArgs(args: any) {
        // 获取当前的render类型 默认为webgl
        this.renderer = args.renderer || 'webgl'
        // 是否支持webgl
        let supported;
        if (this.renderer === 'webgl') {
            supported = isWebGLSupported()
            supported ? (this.renderer = 'webgl') : (this.renderer = 'canvas')

            if (Object.keys(instancesGL).length >= 8) {
                this.renderer = 'canvas';
                console.warn("Too many active WebGL contexts. Will use Canvas context")
            }

        }
        // 缩略图
        if (get(args, 'options.thumbnail', undefined) == true) {
            if (Object.keys(basicData).length !== 0 && !has(args, 'options.thumbnailId')) {
                this.id = Object.keys(basicData)[0]
            } else if (has(args, 'options.thumbnailId')) {
                this.id = get(args, 'options.thumbnailId');
            }
            this.thumbnail = true
            globalInfo[this.id].thumbnail = {
                width: 0,
                height: 0,
            }
        } else {
            this.thumbnail = false;
            let id = this.id;
            basicData[id] = cloneDeep(basieciDataSetting)
            originInfo[id] = cloneDeep(originInfoSetting)
            globalInfo[id] = cloneDeep(globalInfoSetting)
        }
        // zoom层级
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
                console.warn('zoom init happened maxValue < minValue')
            }
            if (maxValue < 0 || maxValue > 180) {
                flag = false
                console.warn('zoom maxValue should in 0 to 180')
            }
            if (minValue < 0 || minValue > 180) {
                flag = false
                console.warn('zoom minValue should in 0 to 180')
            }
            if (defaultValue < minValue || defaultValue > maxValue) {
                defaultValue = (maxValue + minValue) / 2
                console.warn('zoom minValue should in minValue to maxValue')
            }
            if (flag) {
                globalProp.maxZoom = this.maxValue = maxValue
                globalProp.minZoom = this.minValue = minValue
                globalProp.defaultZoom = this.defaultValue = defaultValue
            }
        }
        // 局部跟新
        if (get(args, 'options.useLocalUpdate', undefined) == false) {
            this.localUpdate = false
        }
        // fast模式
        if (get(args, 'options.fast') == true) {
            this.fast = true
        } else {
            this.fast = false
        }
        // safari文字
        if (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
            globalInfo[this.id].isSafari = true
        } else {
            globalInfo[this.id].isSafari = false
        }
        // pulse
        if (get(args, 'options.interactions.pulse', undefined) == true) {
            this.pulse = true
        }
        if (get(args, 'options.interactions.particle', undefined) == true) {
            this.particle = true
        }
        // 判断是否存在canvas的父级div 并生成canvas
        const canvasBox = this.setContainer(args.container, this.pulse, this.particle)
        return canvasBox
    }

    public setBackground = (backgroundColor: string) => {
        globalInfo[this.id].backgroundColor = {
            floatColor: floatColor(backgroundColor).rgb,
            color: backgroundColor,
        }
        this.divContainer!.style.backgroundColor = backgroundColor
        this.render()
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
            this.divContainer!.style.backgroundColor = options.backgroundColor
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
        let canvas: HTMLCanvasElement = this.gl.canvas as HTMLCanvasElement,
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
            this.divContainer!.style.backgroundColor = options.backgroundColor
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
    private setContainer(container: string | HTMLElement, pulse: boolean, particle: boolean): HTMLCanvasElement {
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
        const canvasBox = document.createElement('canvas');
        canvasBox.width = width;
        canvasBox.height = height;
        canvasBox.style.position = "absolute";

        // pulse
        if (pulse) {
            const pulsePass = document.createElement('canvas')
            pulsePass.width = width;
            pulsePass.height = height;
            pulsePass.style.position = "absolute";
            pulsePass.id = "pulse_" + this.id;
            divContainer.appendChild(pulsePass);
        }
        if (particle) {
            const particlePass = document.createElement('canvas')
            particlePass.width = width;
            particlePass.height = height;
            particlePass.style.position = "absolute";
            particlePass.id = "particle_" + this.id;
            divContainer.appendChild(particlePass);
        }
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
        this.DoubleClickFunction = doubleClickFunction.bind(this)
        canvasBox.addEventListener('dblclick', this.DoubleClickFunction)
        this.MousedownFunction = mousedownFunction.bind(this)
        // 监听鼠标点击事件
        canvasBox.addEventListener('mousedown', this.MousedownFunction)
        // 监听鼠标移出事件
        canvasBox.addEventListener('mouseup', event => {
            this.mouseCaptor!.MouseOutListener(event)
            this.camera!.processMouseUp(event)
        })
        // 监听鼠标移动事件
        canvasBox.addEventListener('mousemove', event => {
            let r = this.mouseCaptor!.MouseMoveListener(event)
            if (r) this.camera!.processMouseMove(event)
        })
        // 鼠标点击事件移除
        canvasBox.onmousedown = () => {
            return false
        }
    }
    // 加载浏览器监听事件
    private initContainerListener(): void {
        // 当浏览器大小发生改变应发重绘
        const listener = this.resizeFuc = () => {
            this.resize()
            this.render()
        }
        window.addEventListener('resize', listener);
    }
    // 订阅发布
    private initListener(): void {
        this.events.on('camerarefresh', (viewChange: boolean = false, refesh: boolean = false) => {
            if (refesh)
                this.render()
            else
                this.camerarefresh(viewChange)
        })
        event.listen('renderCanvas', (GraphId: string) => {
            if (GraphId == this.id) {
                this.renderCanvas()
            }
        })
        // 节流函数
        this.debounce = debounce(() => 
            this.events && this.events.emit('viewChanged', { type: 'zoom' })
        , 200)
    }
    // 返回div对象
    public getDivContainer(): HTMLElement {
        return this.divContainer as HTMLElement
    }

    public webGLChangeLabel(reLableTick: boolean) {
        instancesGL[this.id].reLableTick = reLableTick
    }

    // 画布大小变化，重置视图
    public resize(): void {
        try {
            let gl = this.gl
            let canvas: HTMLCanvasElement = (this.renderer === 'webgl' ? gl.canvas : this.ctx.canvas) as HTMLCanvasElement,
                container: HTMLElement = this.divContainer as HTMLElement,
                width = getContainerWidth(container),
                height = getContainerHeight(container)
            let id = this.id;
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
                    basicData[id].transform =
                        window.outerHeight / globalProp.globalScale
                if (this.geo.enabled())
                    basicData[id].transform = width / globalProp.globalScale / this.camera!.aspectRatio

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

            if (globalInfo[id].thumbnail && this.thumbnail) {
                globalInfo[id].thumbnail!.width = width
                globalInfo[id].thumbnail!.height = height
            } else {
                globalInfo[id].BoxCanvas.setWidth = width
                globalInfo[id].BoxCanvas.setHeight = height
            }
            // 重新渲染pulse
            if (this.pulse) {
                this.resizeLayers(
                    width, height,
                    "pulse_" + id, "pulse"
                )
            }
            if (this.particle) {
                this.resizeLayers(
                    width, height,
                    "particle_" + id, "particle"
                )
            }
            if (this.overLay) {
                this.resizeLayers(
                    width, height,
                    "overlayPass_" + id, "overlay"
                )
            }
        } catch { }
    }

    private resizeLayers(
        width: number, height: number, id: string, type: string
    ) {
        const pass = document.getElementById(id) as HTMLCanvasElement;
        pass.width = width;
        pass.height = height;
        pass.style.width = width + 'px'
        pass.style.height = height + 'px'

        let Canvas: any = {
            pulse: this.pulseCanvas,
            overlay: this.overLay,
            particle: this.particleCanvas
        }
        Canvas[type].stop();
        Canvas[type].render();

    }

    // 初始化着色器
    private initPrograms(): void {
        this.nodeProgram = this.fast ? new fastnodeProgram(this.gl) : new nodeProgram(this.gl)
        this.textProgram = new sdfTextProgram(this.gl)
        this.edgeProgram = new edgeProgram(this.gl)
        this.haloProgram = new haloProgram(this.gl)
        // 初始化指向
        this.nodeProgram.initData(this)
        this.textProgram.initData(this)
        this.edgeProgram.initData(this)
        this.haloProgram.initData(this)
    }
    // 初始化canvas画布
    private initCanvasRender(): void {
        this.nodeProgram = new nodeCanvas(this)
        this.textProgram = new lableCanvas(this)
        this.edgeProgram = new edgeCanvas(this)
        this.haloProgram = new haloCanvas(this)
    }

    // 清理缓冲区和图片缓存
    public clear(): void {
        if (this.renderer == 'webgl') {
            // const textureCtx = globalProp.textureCtx as CanvasRenderingContext2D
            // textureCtx && textureCtx.clearRect(0, 0, textureCtx.canvas.width, textureCtx.canvas.height)
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
            if (thumbnailInfo[this.id]) {
                thumbnailInfo[this.id].gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
            }
            ; (this.nodeProgram as nodeProgram).clear()
                ; (this.textProgram as sdfTextProgram).clear()
                ; (this.edgeProgram as edgeProgram).clear()
                ; (this.haloProgram as haloProgram).clear()
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
        let GraphId = this.id;
        if (!basicData[GraphId]) {
            return void 0
        }
        if (this.renderer !== 'webgl') {
            return this.renderCanvas(true, viewChange)
        }

        if (thumbnailInfo[GraphId] && !this.thumbnail) {
            thumbnailInfo[GraphId].camerarefresh(viewChange)
        }

        const gl = this.gl
        const that = this
        const showText = this.textStatus

        if (this.frameId && this.renderMod == "camera") {
            cancelFrame(this.frameId);
            this.frameId = null;
        }
        this.frameId = requestFrame(tickFrame)

        var strategies: { [key: string]: Function } = {
            0: () => {
                if (!that.fast)
                    (that.haloProgram as haloProgram).refreshProcess();
            },
            1: () => {
                (that.edgeProgram as edgeProgram).refreshProcess();
            },
            2: () => {
                if (showText && !this.thumbnail)
                    (that.textProgram as sdfTextProgram).refreshProcessEdge();
            },
            3: () => {
                (that.nodeProgram as nodeProgram).refreshProcess();
            },
            4: () => {
                if (showText && !this.thumbnail)
                    (that.textProgram as sdfTextProgram).refreshProcess();
            },
        }
        let i = 0
        function tickFrame() {
            if (!basicData[GraphId]) {
                cancelFrame(that.frameId);
                that.frameId = null;
                return void 0
            }
            gl.clear(gl.COLOR_BUFFER_BIT)
            do {
                strategies[i++]()
                if (i == 4) that.renderMod = "camera"
            } while (i < 5)
            if (i === 5 && viewChange) that.debounce()
        }
    }

    // 单个或者少许更新
    public selectMovefresh = (async (boolean: boolean = false) => {
        let GraphId = this.id;
        if (!basicData[GraphId]) {
            return void 0
        }
        if (this.renderer !== 'webgl') return this.renderCanvas(boolean)
        if (this.thumbnail || globalInfo[GraphId].thumbnail) return this.render()
        if (!this.localUpdate || !this.textStatus) return this.render()

        if (thumbnailInfo[GraphId] && !this.thumbnail) {
            thumbnailInfo[GraphId].selectMovefresh(boolean)
        }

        const gl = this.gl
        const that = this
        const showText = this.textStatus

        if (showText && !this.thumbnail) {
            this.camera?.quad.clear()
        }

        if (this.frameId) {
            cancelFrame(this.frameId);
            this.frameId = null;
        }
        this.frameId = await requestFrame(tickFrame)
        var strategies: { [key: string]: Function } = {
            0: () => {
                if (!that.fast)
                    (that.haloProgram as haloProgram).moveProcess();
            },
            1: () => {
                (that.edgeProgram as edgeProgram).process(true);
            },
            2: () => {
                if (showText && !this.thumbnail)
                    (that.textProgram as sdfTextProgram).moveProcessEdge();
            },
            3: () => {
                (that.nodeProgram as nodeProgram).process();
            },
            4: () => {
                if (showText && !this.thumbnail)
                    (that.textProgram as sdfTextProgram).moveProcessNode();
            },
        }

        let i = 0
        function tickFrame() {
            if (!basicData[GraphId]) {
                cancelFrame(that.frameId);
                that.frameId = null;
                return void 0
            }
            gl.clear(gl.COLOR_BUFFER_BIT)
            do {
                try {
                    strategies[i++]()
                    if (i == 4) that.renderMod = "partial"
                } catch { }
            } while (i < 5)
        }
    })
    
    // 渲染
    public render = (async () => {
        let GraphId = this.id;
        if (!basicData[this.id]) {
            return void 0
        }
        if (this.renderer !== 'webgl') {
            return this.renderCanvas(true, true)
        }

        if (thumbnailInfo[GraphId] && !this.thumbnail) {
            thumbnailInfo[GraphId].render()
        }

        const showText = this.textStatus
        const gl = this.gl
        const that = this

        if (showText && !this.thumbnail) {
            this.camera?.quad.clear()
        }

        var strategies: { [key: string]: Function } = {
            0: () => {
                if (!that.fast)
                    (that.haloProgram as haloProgram).process();
            },
            1: () => {
                (that.edgeProgram as edgeProgram).process(false);
            },
            2: () => {
                if (showText && !this.thumbnail) (that.textProgram as sdfTextProgram).processEdge();
            },
            3: () => {
                (that.nodeProgram as nodeProgram).process();
            },
            4: () => {
                if (showText && !this.thumbnail) (that.textProgram as sdfTextProgram).processNode();
            },
        }
        if (this.frameId) {
            cancelFrame(this.frameId);
            this.frameId = null;
        }
        this.frameId = await requestFrame(processTask)
        let i = 0
        async function processTask(then: number) {
            if (!basicData[GraphId]) {
                cancelFrame(that.frameId);
                that.frameId = null;
                return void 0
            }
            gl.clear(gl.COLOR_BUFFER_BIT)
            do {
                strategies[i++]()
                if (i == 4) that.renderMod = "total"
            } while (i < 5)
        }
    })

    // 渲染
    public renderCanvas = (async (boolean: boolean = true, viewChange: boolean = false) => {
        let GraphId = this.id;
        if (!basicData[GraphId] || this.renderer == 'webgl') {
            return void 0
        }

        if (thumbnailInfo[GraphId] && !this.thumbnail) {
            thumbnailInfo[GraphId].renderCanvas(boolean, viewChange)
        }

        const showText = this.textStatus
        const that = this

        this.camera?.quad.clear()

        var strategies: { [key: string]: Function } = {
            0: () => {
                (that.haloProgram as haloCanvas).drawNodeHalo();
            },
            1: () => {
                (that.edgeProgram as edgeCanvas).drawEdge(boolean, viewChange);
            },
            2: () => {
                if (showText && !this.thumbnail) (that.textProgram as lableCanvas).drawEdgeLabel(viewChange);
            },
            3: () => {
                (that.nodeProgram as nodeCanvas).drawNode(boolean, viewChange);
            },
            4: () => {
                if (showText && !this.thumbnail) (that.textProgram as lableCanvas).drawNodeLabel(viewChange);
            },
        }

        let i = 0
        async function tickFrame(taskStartTime: number) {
            if (!basicData[GraphId]) {
                cancelFrame(that.frameId);
                that.frameId = null;
                return void 0
            }
            that.clearCanvas()
            do {
                await strategies[i++]()
                if (i == 4) that.renderMod = "canvastotal"
            } while (i < 5)
            if (i === 5 && viewChange) that.debounce()
        }
        if (this.frameId && that.renderMod === "canvastotal") {
            cancelFrame(this.frameId);
            this.frameId = null;
        }
        this.frameId = await requestFrame(tickFrame)
    })
}
