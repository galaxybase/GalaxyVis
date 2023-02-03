import { animateNodes } from '../utils/graphAnimate'
import { enabled } from './enabled'
import { lasso } from './lasso'
import { pulse } from './pulse'

/**
 * @class tool 工具
 * @constructor
 * @param {value<any>} 初始化
 */
export default class tools<T, K> {
    private galaxyvis: any
    public lasso: any
    public pulse: any
    public enabled: any
    public animation: Function

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        // 套索类
        this.lasso = new lasso(this.galaxyvis)
        // 波动类
        this.pulse = new pulse(this.galaxyvis)
        // 指定类
        this.enabled = new enabled(this.galaxyvis)
        // 动画类
        this.animation = animateNodes
    }
}
