import { animateNodes } from '../utils/graphAnimate'
import { enabled } from './TOOLS/enabled'
import { lasso } from './TOOLS/lasso'
import { fisheye } from './TOOLS/fisheye'
import { pulse } from './TOOLS/pulse'
import { particle } from './TOOLS/particle'

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
    public fisheye: any
    public particle: any
    public animation: Function

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        // 套索类
        this.lasso = new lasso(this.galaxyvis)
        // fisheye
        this.fisheye = new fisheye(this.galaxyvis)
        // 波动类
        this.pulse = new pulse(this.galaxyvis)
        // 粒子类   
        this.particle = new particle(this.galaxyvis)
        // 指定类
        this.enabled = new enabled(this.galaxyvis)
        // 动画类
        this.animation = animateNodes
    }
}
