import {
    AnimateType, ballloonType, bfaType,
    chronologicalType, circleType,
    comboDagreType,
    concentricType, dagreType, dualCirlceType,
    forceDirectedType,
    forceType, frType, fruchtermanReingoldType,
    gatherType, gridType, hiveType,
    hubsizeType, kkType, layerCircleType,
    noverlapType,
    radialType, radiatreeType, sphereType, srpingType, topoCircleType, treeType
} from '../types'
import ConcentricLayout from '../layouts/hierarchy/ConcentricLayout'
import ForceLayout from '../layouts/forceLink/ForceLayout'
import TreeLayout from '../layouts/hierarchy/TreeLayout'
import RadialLayout from '../layouts/hierarchy/RadialLayout'
import DagrelLayout from '../layouts/hierarchy/dagreLayout'
import ComboDagrelLayout from '../layouts/hierarchy/comboDagre'
import HiveLayout from '../layouts/Geometrical/HiveLayout'
import DualCirlceLayout from '../layouts/Geometrical/DualCircleLayout'
import LayerCircleLayout from '../layouts/Geometrical/LayerCircleLayout'
import CircularLayout from '../layouts/Geometrical/CircularLayout'
import GridsLayout from '../layouts/Geometrical/GridsLayout'
import RadiaTreeLayout from '../layouts/hierarchy/radiatreeLayout'
import BFALayout from '../layouts/hierarchy/bfaLayout'
import kkLayout from '../layouts/forceLink/kkLayout'
import HubSizeLayout from '../layouts/hierarchy/hubsizeLayout'
import BalloonLayout from '../layouts/Geometrical/balloonLayout'
import frDirectLayout from '../layouts/forceLink/frDirect'
import ChronologicallLayout from '../layouts/hierarchy/chronologicalLayout'
import frLayout from '../layouts/forceLink/frLayout'
import springLayout from '../layouts/forceLink/springLayout'
import GatherLayout from '../layouts/other/gatherLayout'
import SphereLayout from '../layouts/Geometrical/SphereLayout'
import FruchtermanReingoldLayout from '../layouts/forceLink/FruchtermanReingoldLayoutLayout'
import topoCircleLayout from '../layouts/hierarchy/topoCircleLayout'
import AvoidOverlapLayout from '../layouts/other/avoidOverlapLayout'

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
    public circular = (opts: circleType) => {
        return new CircularLayout(this.galaxyvis, opts).layout()
    }

    /**
     * 圆形深度布局
     * @param opts
     * @returns
     */
    public concentric = (opts: concentricType) => {
        return new ConcentricLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 力导向布局
     * @param opts
     * @returns
     */
    public force = (opts: forceType) => {
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
    public tree = (opts: treeType) => {
        return new TreeLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 网格布局
     * @param opts
     * @returns
     */
    public grid = (opts: gridType) => {
        return new GridsLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 辐射布局
     * @param opts
     * @returns
     */
    public radial = (opts: radialType) => {
        return new RadialLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 层次布局
     * @param opts
     * @returns
     */
    public dagre = (opts: dagreType) => {
        return new DagrelLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 层次布局的变形
     * @param opts 
     * @returns 
     */
    public comboDagre = (opts: comboDagreType) => {
        return new ComboDagrelLayout(this.galaxyvis, opts).layout()
    }
    /**
     * hive布局
     * @param opts 
     * @returns 
     */
    public hive = (opts: hiveType) => {
        return new HiveLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 双圆环布局
     * @param opts 
     * @returns 
     */
    public dualCircle = (opts: dualCirlceType) => {
        return new DualCirlceLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 多层圆形布局
     * @param opts 
     * @returns 
     */
    public layerCircle = (opts: layerCircleType) => {
        return new LayerCircleLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 径向布局
     * @param opts 
     * @returns 
     */
    public radiatree = (opts: radiatreeType) => {
        return new RadiaTreeLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 球面布局
     * @param opts 
     * @returns 
     */
    public bfa = (opts: bfaType) => {
        return new BFALayout(this.galaxyvis, opts).layout()
    }
    /**
     * kk网络布局
     * @param opts 
     * @returns 
     */
    public kk = (opts: kkType) => {
        return new kkLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 组织结构hubsize
     * @param opts 
     * @returns 
     */
    public hubsize = (opts: hubsizeType) => {
        return new HubSizeLayout(this.galaxyvis, opts).layout()
    }

    /**
     * 圆形树状布局balloon
     * @param opts 
     * @returns 
     */
    public balloon = (opts: ballloonType) => {
        return new BalloonLayout(this.galaxyvis, opts).layout()
    }

    /**
     * 力导向布局fr
     * @param opts 
     * @returns 
     */
    public frDirected = (opts: forceDirectedType) => {
        return new frDirectLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 时序布局
     * @param opts 
     * @returns 
     */
    public chronological = (opts: chronologicalType) => {
        return new ChronologicallLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 经典网络布局fr
     * @param opts 
     * @returns 
     */
    public fr = (opts: frType) => {
        return new frLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 弹性布局spring
     * @param opts 
     * @returns 
     */
    public spring2 = (opts: srpingType) => {
        return new springLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 群体分组布局gather
     * @param opts 
     * @returns 
     */
    public gather = (opts: gatherType) => {
        return new GatherLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 球形sphere
     * @param opts 
     * @returns 
     */
    public sphere = (opts: sphereType) => {
        return new SphereLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 力导向布局fruchtermanReingold
     * @param opts 
     * @returns 
     */
    public fruchtermanReingold = (opts: fruchtermanReingoldType) => {
        return new FruchtermanReingoldLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 对称树形布局topoCircle
     * @param opts 
     * @returns 
     */
    public topoCircle = (opts: topoCircleType) => {
        return new topoCircleLayout(this.galaxyvis, opts).layout()
    }
    /**
     * 节点不重叠布局noverlap
     * @param opts 
     * @returns 
     */
    public noverlap = (opts: noverlapType) => {
        return new AvoidOverlapLayout(this.galaxyvis, opts).layout()
    }
}
