import pulseCanvas from '../../renderers/canvas/pulse';

/**
 * @class pulse pulse工具
 * @constructor
 * @param {value<any>} 初始化
 */
export class pulse<T, K> {
    private galaxyvis: any //galaxyvis对象
    private isActive: boolean = false

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        this.isActive = galaxyvis.pulse;
    }
    /**
     * 是否开启pulse
     * @returns
     */
    enabled() {
        return this.isActive
    }

    /**
     * 开启pulse
     * @param param0
     */
    enable() {
        this.activate()
    }
    /**
     * 关闭pulse
     */
    disable() {
        this.deactivate()
    }

    reRender() {
        if(this.enabled()){
            this.disable();
            this.enable();
        }
    }

    deactivate() {
        if (this.isActive) {
            this.isActive = false;
            this.galaxyvis.pulse = false;
            this.galaxyvis.pulseCanvas.destory()
        }
    }

    activate() {
        if (!this.isActive) {
            // pulse
            const id = this.galaxyvis.id;
            const dom = this.galaxyvis.divContainer;
            let width = dom.clientWidth || dom.offsetWidth,
                height = dom.clientHeight || dom.offsetHeight;
            const pulsePass = document.createElement('canvas')
            pulsePass.width = width;
            pulsePass.height = height;
            pulsePass.style.position = "absolute";
            pulsePass.style.width = width + 'px'
            pulsePass.style.height = height + 'px'
            pulsePass.id = "pulse_" + id;
            this.isActive = true;
            this.galaxyvis.pulse = true;
            
            if(!this.galaxyvis.geo.enabled()){
                dom.insertBefore(pulsePass, dom.firstChild);
            }else{
                const graphContainer = this.galaxyvis.geo.graphContainer;
                this.galaxyvis.geo.pulsePass = pulsePass
                graphContainer.insertBefore(pulsePass, graphContainer.childNodes[0]);
            }      
            const pulseCtx = this.galaxyvis.pulseCanvas = new pulseCanvas(this.galaxyvis);
            pulseCtx.render()

        }
    }

}
