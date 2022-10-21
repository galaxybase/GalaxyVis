import { AnimateType } from '../types'
import CircularLayout from '../layouts/circle/CircularLayout'
import ConcentricLayout from '../layouts/hierarchy/ConcentricLayout'
import ForceLayout from '../layouts/forceLink/ForceLayout'
import TreeLayout from '../layouts/hierarchy/TreeLayout'
import GridsLayout from '../layouts/grid/GridsLayout'
import RadialLayout from '../layouts/hierarchy/RadialLayout'
import DagrelLayout from '../layouts/hierarchy/dagreLayout'

/**
 * @class Layout
 * @constructor
 * @param {galaxyvis<any>} 初始化
 */
export default class Layout<T, K> {
    private galaxyvis: any

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
    }

    /**
     * 圆形布局
     * @param opts
     * @returns
     */
    public circular = (opts: AnimateType) => {
        return new CircularLayout(this.galaxyvis, opts).layout()
    }

    /**
     * 圆形深度布局
     * @param opts
     * @returns
     */
    public concentric = (opts: AnimateType) => {
        return new ConcentricLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 力导向布局
     * @param opts
     * @returns
     */
    public force = (opts: AnimateType) => {
        const id = this.galaxyvis.id;
        if (
            opts?.nodes?.length > 5e3 &&
            opts?.incremental
        ) {
            opts.nodes = []
        }
        return new ForceLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 树型布局
     * @param opts
     * @returns
     */
    public tree = (opts: AnimateType) => {
        return new TreeLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 网格布局
     * @param opts
     * @returns
     */
    public grid = (opts: AnimateType) => {
        return new GridsLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 辐射布局
     * @param opts
     * @returns
     */
    public radial = (opts: AnimateType) => {
        return new RadialLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 层次布局
     * @param opts
     * @returns
     */
    public dagre = (opts: AnimateType) => {
        return new DagrelLayout(this.galaxyvis, opts).layout()
    }
}
