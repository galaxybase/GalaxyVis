import { lasso } from './lasso'

/**
 * @class tool 工具
 * @constructor
 * @param {value<any>} 初始化
 */
export default class tools<T, K> {
    private galaxyvis: any
    public lasso: any

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        // 套索类
        this.lasso = new lasso(this.galaxyvis)
    }
}
