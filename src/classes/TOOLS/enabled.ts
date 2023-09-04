import { globalInfo } from "../../initial/globalProp"
import overLay from "../../renderers/div/overlay"
import { genID } from "../../utils"

/**
 * @class enbaled
 * @constructor
 * @param {value<any>} 初始化
 */
export class enabled<T, K> {
    private galaxyvis: any //galaxyvis对象
    private id: string
    private isActive: boolean = false

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        this.id = this.galaxyvis.id
    }

    /**
     * 开启StraightLine
     * @param param0
     */
    enableNoStraightLine() {
        const id = this.id = this.galaxyvis.id
        if (!globalInfo[id].enabledNoStraightLine) {
            globalInfo[id].enabledNoStraightLine = true;
            this.galaxyvis.render();
        }
    }
    /**
     * 关闭StraightLine
     */
    disableNoStraightLine() {
        const id = this.id = this.galaxyvis.id
        if (globalInfo[id].enabledNoStraightLine) {
            globalInfo[id].enabledNoStraightLine = false;
            this.galaxyvis.render();
        }
    }
    /**
     * 开启自定义HTML
     */
    enableInplaceHTML() {
        if (!this.isActive) {
            const id = this.galaxyvis.id;
            const dom = this.galaxyvis.divContainer;
            let width = dom.clientWidth || dom.offsetWidth,
                height = dom.clientHeight || dom.offsetHeight;
            const overlayPass = document.createElement('div')
            overlayPass.style.position = "absolute";
            overlayPass.style.left = "0px"
            overlayPass.style.top = "0px"
            overlayPass.style.width = width + 'px'
            overlayPass.style.height = height + 'px'
            overlayPass.style.overflow = "hidden"
            overlayPass.id = "overlayPass_" + id;
            this.isActive = true;
            if (!this.galaxyvis.geo.enabled()) {
                dom.insertBefore(overlayPass, dom.firstChild);
            } else {
                console.warn("geo can't use overlay")
                this.isActive = false;
                return;
            }
            const overLayPass = this.galaxyvis.overLay = new overLay(this.galaxyvis);
            overLayPass.render()
        }
    }

    /**
     * 创建overlay
     * @param element 
     * @param bind
     * @param position 
     */
    addOverlay(options: {
        element: string,
        bind?: string,
        baseRadius?: number,
        position?: { x: string, y: string },
    }) {
        const id = this.galaxyvis.id;

        let { element, bind, position, baseRadius } = options

        let overlayId = bind ? bind : 'overlay' + genID(8)

        let div = document.createElement('div')
        div.style.position = "absolute"
        div.style.left = position?.x || "0" + "px"
        div.style.top = position?.y || "0" + "px"
        div.innerHTML = element

        globalInfo[id].overlay[overlayId] = {
            element: div,
            type: "add",
            baseRadius: baseRadius || 25
        }

        return div;
    }

    /**
     * 关闭自定义HTML
     */
    disableInplaceHTML() {
        if (this.isActive) {
            this.isActive = false;
            this.galaxyvis.overLay.destory()
        }
    }
}
