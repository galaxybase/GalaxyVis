import { merge } from 'lodash'
import { basicData, globalInfo } from '../initial/globalProp'
import { RuleOptions } from '../types'

/**
 * @class StyleRule
 * @constructor
 * @param galaxyvis
 * @param name
 * @param options
 * @param stylesAddRule
 * @param RuleOrClass
 */
export class StyleRule<T, K> {
    private name: string // 名字
    private options: RuleOptions // 配置
    private stylesAddRule: any // 添加新的style类
    private RuleOrClass: number // 是rule还是class
    private galaxyvis: any // graph对象

    constructor(
        galaxyvis: any,
        name: string,
        options: RuleOptions,
        stylesAddRule: any,
        RuleOrClass = 2,
    ) {
        this.name = name
        this.options = options
        this.stylesAddRule = stylesAddRule
        this.RuleOrClass = RuleOrClass
        this.galaxyvis = galaxyvis
    }
    /**
     * 销毁该rule对象
     * @param update 是否强刷
     * @returns
     */
    public destroy = (update: boolean = true) => {
        return new Promise<void>((resolve, reject) => {
            try {
                if (this.RuleOrClass == 2) globalInfo[this.galaxyvis.id].ruleList.delete(this.name)
                if (basicData[this.galaxyvis.id]) {
                    let { nodeList, edgeList } = basicData[this.galaxyvis.id]
                    nodeList.forEach((item: any) => {
                        item.removeClass(this.name, this.RuleOrClass, false)
                    })
                    edgeList.forEach((item: any) => {
                        item.removeClass(this.name, this.RuleOrClass, false)
                    })
                    if (update) this.galaxyvis.render()
                    resolve()
                } else {
                    reject("获取不到当前图的点边列表")
                }
            } catch (err) {
                reject(err)
            }
        })
    }
    /**
     * 更新style
     * @param options
     * @returns
     */
    public update = (options: RuleOptions) => {
        let newOptions: any = merge(this.options, options)
        newOptions.name = this.name
        this.destroy(false)
        return this.stylesAddRule(this.galaxyvis, newOptions)
    }
}
