import { AnimateType } from "../types"
import { isIE } from "../utils"

class BaseLayout {
    public galaxyvis: any
    public options: AnimateType
    public data: any
    public ids: any
    public positions: any
    
    constructor(galaxyvis: any, options: AnimateType) {
        this.galaxyvis = galaxyvis
        this.options = options
        // ie不允许使用webworker
        isIE() && (this.options.useWebWorker = false)
    }
    // 初始化
    init() { }
    // 在非webwork环境下执行布局
    execute(...args: any) { }
    // 执行布局
    layout() { }
    // 销毁布局
    destroy() {
        const self = this;
        self.positions = null;
        self.data = null;
        self.ids = null;
      }
}

export default BaseLayout