import { ANIMATE_DEFAULTS } from '../initial/globalProp'
import { AnimateOptions } from '../types'
import { GraphToScreenCoordinates, ScreenToGraphCoordinates, viewGet, viewGetZoom, viewLocateGraph, viewSet, viewZoomChange } from '../utils/view'

/**
 * @class view 样式
 * @constructor
 * @param {value<any>} 初始化
 */
export default class view<T, K> {
    private galaxyvis: any
    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
    }

    public setView = (options: any) => {
        return viewSet(this.galaxyvis, options)
    }

    /**
     * 返回view数据
     * @returns
     */
    public get = () => {
        return viewGet(this.galaxyvis)
    }

    /**
     * 视图放大
     * @param opts
     */
    public zoomIn = (scale?: number, opts?: AnimateOptions) => {
        if(this.galaxyvis.geo.enabled()){
            let zoom = this.galaxyvis.geo.getZoom()
            return this.galaxyvis.geo.setZoom(zoom + 1)
        }
        return viewZoomChange(1, this.galaxyvis, scale, opts)
    }

    /**
     * 视图缩小
     * @param opts
     */
    public zoomOut = (scale?: number, opts?: AnimateOptions) => {
        if(this.galaxyvis.geo.enabled()){
            let zoom = this.galaxyvis.geo.getZoom()
            return this.galaxyvis.geo.setZoom(zoom - 1)
        }
        return viewZoomChange(-1, this.galaxyvis, scale, opts)
    }

    /**
     * 返回现在的zoom层级
     * @returns
     */
    public getZoom = () => {
        return viewGetZoom(this.galaxyvis.camera)
    }
    /**
     * 视图居中
     * @param options
     *   duration,
     *   easing,
     *   padding,
     *   maxNodeSizeOnScreen
     * @returns
     */
    public locateGraph = (options?: any) => {
        options = Object.assign({}, ANIMATE_DEFAULTS, options)
        if(this.galaxyvis.geo.enabled()){
            return this.galaxyvis.geo.locate()
        }
        return viewLocateGraph(this.galaxyvis, options)
    }

    /**
     * 强制画布根据容器重新调整大小。当容器的可见性发生变化时，通知它必须刷新场景
     */
    public forceResize = () => {
        this.galaxyvis.resize()
        this.galaxyvis.render()
    }

    public screenToGraphCoordinates = (evt: any) =>{
        return ScreenToGraphCoordinates(this.galaxyvis, evt)
    }

    public graphToScreenCoordinates = (evt: any) =>{
        return GraphToScreenCoordinates(this.galaxyvis, evt)
    }
}
