import { globalProp } from "../../initial/globalProp";
import { getContainerHeight, getContainerWidth } from "../../utils";

interface Options {
    radius?: number;
    k?: number;
    strokeColor?: string;
    strokeWidth?: number;
}

/**
 * @class fisheye
 * @constructor
 * @param {value<any>} 初始化
 */
export class fisheye<T, K> {

    private graph: any
    private divContainer: any;
    private isActive: boolean = false //是否弃用
    private drawingCanvas!: HTMLCanvasElement;
    private drawingContext!: CanvasRenderingContext2D;
    private moveFunc: ((e: MouseEvent) => any) | undefined;
    private cached: any;
    private positions: any;
    private framId: any = null;

    constructor(graph: any) {
        this.graph = graph
    }

    /**
    * 是否开启fisheye
    * @returns
    */
    enabled() {
        return this.isActive;
    }

    /**
     * 开启fisheye
     * @param param0
     */
    enable({
        k = 1.5,
        radius = 200,
        strokeColor = '#247BA0',
        strokeWidth = 2
    }: Options = {}) {

        this.divContainer = this.graph.divContainer
        let graph = this.graph;
        // 获取当前缩放
        let ratio = this.graph.camera.ratio
        let scale = Math.max(ratio / globalProp.globalScale / 1.5, 1.5) 

        if (graph.geo.enabled()) {
            console.warn("fisheye can't used in geo mod")
            return false;
        }

        let width = getContainerWidth(this.divContainer);
        let height = getContainerHeight(this.divContainer);

        this.cached = graph.getNodes().getPosition();
        this.positions = graph.getNodes().getPosition();

        // 新建2D的图层
        if (!this.isActive) {
            this.isActive = true
            if (!document.getElementById('fisheye')) {
                // 创建fisheye的画布
                this.initDOM('canvas', 'fisheye')
                this.drawingContext = (this.drawingCanvas as HTMLCanvasElement).getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
            }
        }

        let that = this;
        let ctx = this.drawingContext;

        this.moveFunc = (e: MouseEvent) => {
            const tickFram = () => {
                // 清空画布
                that.drawingContext!.clearRect(
                    0,
                    0,
                    width,
                    height,
                )

                let x = e.clientX,
                    y = e.clientY;

                ctx.beginPath();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;

                ctx.arc(x, y, radius + strokeWidth / 2, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.closePath();

                const pos = graph.view.screenToGraphCoordinates(e);

                const cx = pos.x;
                const cy = pos.y;
                const cr = radius * scale;

                const p = (k + 1) * cr;

                let temp = this.positions;
                this.positions = this.cached;
                this.cached = temp;

                const r2 = cr * cr;

                this.positions.forEach((node: { x: number, y: number }, i: number) => {

                    const nx = node.x;
                    const ny = node.y;

                    const cachedNode = this.cached[i];
                    cachedNode.x = nx;
                    cachedNode.y = ny;

                    const dx = nx - cx;
                    const dy = ny - cy;

                    const distSq = dx * dx + dy * dy;

                    if (distSq > 0 && distSq <= r2) {
                        const dist = Math.sqrt(distSq);
                        const dm = (p * dist) / (k * dist + cr);
                        const cos = (nx - cx) / dist;
                        const sin = (ny - cy) / dist;

                        node.x = cos * dm + cx;
                        node.y = sin * dm + cy;
                    }
                });
                graph.getNodes().forEach((item: any, index: number) => {
                    item.changeAttribute(that.positions[index])
                });
                graph.render()
            }

            this.framId = requestAnimationFrame(tickFram)
        }

        this.moveFunc.bind(this)
        // 监听鼠标移动事件
        this.drawingCanvas!.addEventListener('mousemove', this.moveFunc);
    }

    /**
     * 关闭fisheye
     */
    disable() {
        this.isActive = false;
        cancelAnimationFrame(this.framId)
        // 监听鼠标点击事件
        if (this.moveFunc)
            this.drawingCanvas!.removeEventListener('mousemove', this.moveFunc)
        // 查找lasso对象是否存在
        if (document.getElementById('fisheye')) {
            // 删除lasso的画布
            this.divContainer.removeChild(document.getElementById('fisheye') as HTMLElement)
            // @ts-ignore
            this.drawingCanvas = null;
            // @ts-ignore
            this.drawingContext = null;
        }
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

        let width = getContainerWidth(this.divContainer);
        let height = getContainerHeight(this.divContainer);

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
}