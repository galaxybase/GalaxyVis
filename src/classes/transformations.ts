import { globalInfo } from '../initial/globalProp'
import { edgeOptions, nodeOptions } from '../types'
import {
    transformatAddEdgeFilter,
    transformatAddNodeFilter,
    transformatEdgeGroup,
    transformatNodeGroup,
} from '../utils/transformations'

/**
 * @class transformations
 * @constructor
 * @param {value<any>} 初始化
 */
export default class transformations<T, K> {
    private galaxyvis: any

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
    }

    /**
     * 添加点的过滤
     * @param criteria
     * @returns
     */
    public addNodeFilter = (criteria: Function, isRender: boolean = true) => {
        let transformResult = transformatAddNodeFilter(this.galaxyvis, criteria, isRender)
        if (transformResult)
            globalInfo[this.galaxyvis.id].filterNodesTransformat!.set(transformResult.id, {
                transformat: transformResult,
                options: criteria,
            })
        return transformResult
    }

    /**
     * 添加边的过滤
     * @param criteria
     * @returns
     */
    public addEdgeFilter = (criteria: Function, isRender: boolean = true) => {
        let transformResult = transformatAddEdgeFilter(this.galaxyvis, criteria, isRender)
        if (transformResult)
            globalInfo[this.galaxyvis.id].filterEdgesTransformat!.set(transformResult.id, {
                transformat: transformResult,
                options: criteria,
            })
        return transformResult
    }

    /**
     * 合并点
     * @param opts
     */
    public addNodeGrouping = (opts: nodeOptions): any => {
        let transformResult = transformatNodeGroup(this.galaxyvis, opts)

        transformResult.then((data: any) => {
            globalInfo[this.galaxyvis.id].mergeNodesTransformat.set(data.id, {
                transformat: data,
                options: opts,
            })
        })

        return transformResult
    }

    /**
     * 合并边
     * @param opts
     */
    public addEdgeGrouping = (opts: edgeOptions, isRender = true, isMerge = false) => {
        let transformResult = transformatEdgeGroup(this.galaxyvis, opts, isRender, isMerge)

        transformResult.then((data: any) => {
            globalInfo[this.galaxyvis.id].mergeEdgesTransformat = {
                transformat: data,
                options: opts,
            }
        })
        return transformResult
    }
    /**
     * 获取转变的列表
     * @returns
     */
    public getList = () => {
        let transforrmationArray: any[] = []

        if (globalInfo[this.galaxyvis.id].filterNodesTransformat?.size) {
            globalInfo[this.galaxyvis.id].filterNodesTransformat!.forEach(item => {
                transforrmationArray.push(item.transformat)
            })
        }

        if (globalInfo[this.galaxyvis.id].filterEdgesTransformat?.size) {
            globalInfo[this.galaxyvis.id].filterEdgesTransformat!.forEach(item => {
                transforrmationArray.push(item.transformat)
            })
        }

        if (globalInfo[this.galaxyvis.id].mergeNodesTransformat?.size) {
            globalInfo[this.galaxyvis.id].mergeNodesTransformat.forEach((item: any) => {
                transforrmationArray.push(item.transformat)
            })
        }

        if (globalInfo[this.galaxyvis.id].mergeEdgesTransformat) {
            transforrmationArray.push(
                globalInfo[this.galaxyvis.id].mergeEdgesTransformat.transformat,
            )
        }

        return transforrmationArray
    }
}
