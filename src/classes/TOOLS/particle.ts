import particleCanvas from "../../renderers/canvas/particle";

/**
 * @class 粒子类
 * @constructor
 * @param {value<any>} 初始化
 */
export class particle<T, K> {
    private galaxyvis: any //galaxyvis对象
    private isActive: boolean = false

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        this.isActive = galaxyvis.particle;
    }

    /**
     * 是否开启particle
     * @returns
     */
    enabled() {
        return this.isActive
    }

    /**
     * 开启particle
     * @param param0
     */
    enable() {
        this.activate()
    }
    /**
     * 关闭particle
     */
    disable() {
        this.deactivate()
    }

    deactivate() {
        if (this.isActive) {
            this.isActive = false;
            this.galaxyvis.particle = false;
            this.galaxyvis.particleCanvas.destory();
        }
    }

    activate() {
        if (!this.isActive) {
            // particle
            const id = this.galaxyvis.id;
            const dom = this.galaxyvis.divContainer;
            let width = dom.clientWidth || dom.offsetWidth,
                height = dom.clientHeight || dom.offsetHeight;
            const particlePass = document.createElement('canvas')
            particlePass.width = width;
            particlePass.height = height;
            particlePass.style.position = "absolute";
            particlePass.style.width = width + 'px'
            particlePass.style.height = height + 'px'
            particlePass.id = "particle_" + id;
            this.isActive = true;
            this.galaxyvis.particle = true;

            if (!this.galaxyvis.geo.enabled()) {
                dom.insertBefore(particlePass, dom.firstChild);
            } else {
                const graphContainer = this.galaxyvis.geo.graphContainer;
                this.galaxyvis.geo.particlePass = particlePass
                graphContainer.insertBefore(particlePass, graphContainer.childNodes[0]);
            }

            const particleCtx = this.galaxyvis.particleCanvas = new particleCanvas(this.galaxyvis);
            particleCtx.render()

        }
    }
}