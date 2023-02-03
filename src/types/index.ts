import Edge from '../classes/edge'
import Node from '../classes/node'
import easings from '../utils/easings'

export type GraphElement = Node | Edge

export interface NodeInformation {
    packedData: any[] //打包的部分数据
    colorsAndTypesArray: any[] //颜色
    offsetsArray: any[] //偏移量
    uvsArray: any[] //打包的纹理相关的数据
    count?: number //第几个
}

export interface EdgeInformation<T> {
    color: T //颜色
    width: T //矩阵第一列
    col14row2: T //矩阵第二列
    isArrow: T //箭头
}

export interface NodeLabelInformation<T> {
    arrsVer1: T //平移矩阵第一列
    arrsVer2: T //平移矩阵第二列
    arrsTex1: T //纹理矩阵第一列
    others: T //打包的几个相关属性
    fontSizes: T
}

export interface EdgeLabelInformation<T> extends NodeLabelInformation<any> { }

export interface CoordBezie {
    x: number
    y: number //贝塞尔用的坐标<x,y>
}

export type PlainObject<T = any> = { [k: string]: T }

export type Listener = (...args: any[]) => void

export interface baseLayoutType {
    duration?: number // 动画时间
    useAnimation?: boolean //是否有动画
    easing?: keyof typeof easings | ((k: number) => number) //动画渐变方式
    nodes?: any // 哪些点要操作
    useWebWorker?: boolean //是否使用webworker
    incremental?: boolean //增量
    incrementalNode?: string //增量的初始点
}

export interface circleType extends baseLayoutType {
    [x: string]: any
    center?: number[] // 中心
    startRadius?: number //开始圆大小
    endRadius?: number //结束圆大小
    divisions?: number //分隔环数
    radius?: number //圆的半径
    scale?: number //缩放
}

export interface concentricType extends baseLayoutType {
    [x: string]: any
    centralNode?: any //中心点
    circleHopRatio?: number //圆的大小
}

export interface forceType extends baseLayoutType {
    [x: string]: any
    tickNum?: number //迭代次数
    strength?: number //力强度
    edgeStrength?: number //边力强度
    repulsion?: number //碰撞力,点大小
    distance?: number //两点之间的距离
    forceY?: number //y轴方向力
    forceX?: number //x轴方向力
}

export interface gridType extends baseLayoutType {
    [x: string]: any
    cols?: number //列
    rows?: number //行
    sortBy?: any //排序顺序
    width?: number //宽
    height?: number //高
}

export interface treeType extends baseLayoutType {
    [x: string]: any
    treeWidth?: number //树型布局宽度
    treeHeight?: number //树型布局高度
}

export interface dagreType extends baseLayoutType {
    [x: string]: any
    nodeSize?: number //点大小
    nodesep?: number //点的横向距离
    ranksep?: number //点的高度距离
    rankdir?: string //根节点位置
    align?: string //节点对齐方向
    ranker?: string //分层算法选择
    layer?: string //指定层级
    owner?: string //划分树
    // nodesizeFunc?: Function //点Function
}

export interface radialType extends baseLayoutType {
    [x: string]: any
    angleRatio?: number //从第一个节点到最后节点之间相隔多少个 2*PI
    unitRadius?: number //每一圈距离上一圈的距离
    strictRadial?: boolean //是否严格按照圈排绕
    centralNode?: string // 中心点
    distance?: number // 边长度
    tickNum?: number// 迭代次数
}

export interface comboDagreType extends baseLayoutType {
    [x: string]: any
    nodes: any
    comboDagre?: dagreType
    nodeSize?: number //点大小
    nodesep?: number //点的横向距离
    ranksep?: number //点的高度距离
    rankdir?: string //根节点位置
    align?: string //节点对齐方向
    ranker?: string //分层算法选择
    owner?: string //划分树
}

export interface hiveType extends baseLayoutType {
    [x: string]: any
    radius?: number // 点大小
    margin?: number // 边距
    nlines?: number // 分支数
}

export interface dualCirlceType extends baseLayoutType {
    [x: string]: any
    position?: string //内环和外环
    secondarynodecount?: number //核心数
}

export interface layerCircleType extends baseLayoutType {
    [x: string]: any
    layerDistance?: number //层间距
    outCircleNodes?: number //点个数
}

export interface radiatreeType extends baseLayoutType {
    [x: string]: any
    distX?: number //水平距离
    distY?: number //垂直距离
}

export interface bfaType extends baseLayoutType {
    [x: string]: any
    neighborAttraction?: number // 邻点引力
    attraction?: number   // 引力
    forceScale?: number  // 力缩放系数
    tickNum?: number //迭代次数
}

export interface kkType extends baseLayoutType {
    [x: string]: any
}

export interface hubsizeType extends baseLayoutType {
    [x: string]: any
    layerDistance?: number   // 层间距
    nodeDistance?: number   // 点间距
    treeSpacing?: number
    direction?: string   // 排列方向 UD,DU,LR,RL
    sortMethod?: string // 排列方式 hubsize， directed， selected
}

export interface ballloonType extends baseLayoutType {
    [x: string]: any
    radius?: number   //区域大小
}

export interface forceDirectedType extends baseLayoutType {
    [x: string]: any
    attraction?: number //引力
    force?: number //斥力
    tickNum?: number //迭代次数
}

export interface chronologicalType extends baseLayoutType {
    [x: string]: any
    chronologic?: {
        edgeType: Function, // 边类型
        edgeProperty: string, // 边属性
        asc?: boolean,   //是否为升序
    },
}

export interface frType extends baseLayoutType {
    [x: string]: any
    area?: number  //区域大小
    gravity?: number //重力
    tickNum?: number //迭代次数
}

export interface srpingType extends baseLayoutType {
    [x: string]: any
    repulsion?: number //区域大小
    stretch?: number //边长度
    force?: number //收敛系数
    tickNum?: number //迭代次数
}

export interface gatherType extends baseLayoutType {
    [x: string]: any
    area?: number //间距
    speed?: number //移动速度
    tickNum?: number //迭代次数
}

export interface sphereType extends baseLayoutType {
    [x: string]: any
    radius?: number //半径
    tickNum?: number //迭代次数
}

export interface fruchtermanReingoldType extends baseLayoutType {
    [x: string]: any
    tickNum?: number //迭代次数
    gravity?: number //重力
    k?: number //边长度
    speed?: number //收敛速度
}

export interface topoCircleType extends baseLayoutType {
    [x: string]: any
    radius?: number //节点大小
}

export interface noverlapType extends baseLayoutType {
    [x: string]: any
    maxMove?: number //间距
    tickNum?: number //迭代次数
}

export interface AnimateType extends baseLayoutType {
    [x: string]: any
}

export interface Options {
    backgroundColor?: string //背景颜色
    interactions?: {
        zoom?: {
            //zoom
            maxValue?: string | number
            minValue?: string | number
            defaultValue?: string | number
        },
        pulse?: boolean,  //pulse交互模式
    }
    useLocalUpdate?: boolean //是否开启局部更新
    thumbnail?: boolean //缩略图
    fast?: boolean //快速模式
}

export interface strategiesFace {
    context: CanvasRenderingContext2D
    data: any
    ratio: number
    position: []
}

export interface AnimateOptions {
    easing: keyof typeof easings | ((k: number) => number) //缓动方式
    duration: number //缓动时间
}

export interface LayoutEvt {
    ids: Array<number | string> //哪些点
    name: string //布局类型
    type: string //layoutStart
}

export interface LayoutEndEve extends LayoutEvt {
    postions?: any[]
}

export const MouseType = ['left', 'middle', 'right']

export interface ClickEve {
    button: any //鼠标的键位
    domEvent: Event //返回整个MouseEvent
    source: any //事件来源
    target: any //是否选中
    x: number //webgl的坐标
    y: number
}

export interface DoubleClickEve extends ClickEve { }

export interface DragStartEve extends ClickEve { }

export interface AddNodesEve {
    nodes: any[] //点
}

export interface RemoveNodesEve extends AddNodesEve { }

export interface AddEdgesEve {
    edges: any[] //边
}

export interface RemoveEdgesEve extends AddEdgesEve { }

export interface MouseOverEve {
    domEvent: Event //返回整个MouseEvent
    source?: any //事件来源
    target?: any //是否选中
    x?: number //webgl的坐标
    y?: number
}

export interface MouseOutEve extends MouseOverEve { }

export interface NodeDragProgressEve {
    dx: number
    dy: number
    nodes: any[]
}

export interface NodesSelectedEve {
    nodes: any
}

export interface NodesUnselectedEve extends NodesSelectedEve { }

export interface EdgesSelectedEve {
    edges: any
}

export interface EdgesUnselectedEve extends EdgesSelectedEve { }

export interface nodeOptions {
    duration?: number //动画时间 默认为0
    edgeGenerator?: Function //给group的边属性
    nodeGenerator?: Function //给group的点属性
    selector?: Function //筛选符合条件的点  没值的话是全部的点
    groupIdFunction?: Function //返回的group的id
    reserve?: boolean  //预留边
    createSelfLoop?: boolean  //创建自环边
}

export interface edgeOptions {
    duration?: number //动画时间 默认为0
    selector?: Function //筛选符合条件的点  没值的话是全部的边
    groupIdFunction?: Function //返回的group的id
    generator?: Function //给group的边属性
}

export interface globalPropType {
    standardRadius: number //缩放的标准半径r
    cameraPosition: number[] //相机初始位置
    atlas: number //纹理最大集
    fastAtlas: number
    textSet: Set<string> // 文字集
    iconMap: Map<string | number, any> // icon集
    globalScale: number //默认缩放
    defaultZoom: number //默认zoom
    maxZoom: number //最大zoom
    minZoom: number //最小zoom
    useIniticon: number //计数器 用来判断initInconOrImage是否执行过
    labelStore: PlainObject<any> //文字仓库
    direction: { [ke: string]: number[] } //badge位置
    textureCtx: CanvasRenderingContext2D | null //纹理canvas
    edgeGroups: number
}

export interface globalInfoData {
    [key: string]: {
        nodeOrder: Set<any> //点顺序
        edgeOrder: Set<any> //边顺序
        ruleList: Map<any, any> //规则列表
        nodeHoverStyle: PlainObject<any> //hover点规则
        edgeHoverStyle: PlainObject<any> //hover边规则
        nodeSelectStyle: PlainObject<any> //选中点规则
        edgeSelectStyle: PlainObject<any> //选中边规则
        mergeEdgesTransformat: any //合并边
        mergeNodesTransformat: any //合并点
        filterNodesTransformat: Map<string, any> | null //过滤点
        filterEdgesTransformat: Map<string, any> | null //过滤边
        backgroundColor: PlainObject<any> //optical背景色默认值
        thumbnail: null | PlainObject<any> //缩略图
        BoxCanvas: any //布局用的    Canvas
        canvasBox: HTMLCanvasElement //整个canvas对象
        isSafari: boolean
        edgeType: any
        enabledNoStraightLine: boolean
    }
}

export interface ClassOptions {
    name: string //名字
    edgeAttributes?: PlainObject<any> //边属性
    nodeAttributes?: PlainObject<any> //点属性
    useRule?: any
}

export interface RuleOptions {
    name?: string
    edgeAttributes?: PlainObject<any> //边属性
    nodeAttributes?: PlainObject<any> //点属性
    edgeSelector?: any //选中边
    nodeSelector?: any //选中点
}

export interface AdjacencyOptions {
    direction?: string //("both"|"in"|"out")
    policy?: string //("include-sources"|"exclude-sources")
    hasFilter?: boolean
}

export interface baseExportOptions {
    download?: boolean //是否下载
    filename?: string //文件名称
    background?: string //背景颜色
}

export interface ImageExportOptions extends baseExportOptions {
    textWatermark?: {
        alpha?: number //文字透明度
        content?: string //文字内容
        fontStyle?: string //字体样式
        angle?: number //水印角度
        repeat?: boolean //水印是否重复
        space?: number //水印距离
        background?: string //背景颜色
        scale?: number //缩放比
    }
}

export interface SvgExportOptions extends baseExportOptions { }

export interface JsonExportOptions extends baseExportOptions {
    nodeData?: Function //给定输入节点数据
    edgeData?: Function //给定输入边数据
    skipHeader?: boolean //是否自定义表头
    customisedHeader?: {[key: string]: any} //自定义表头
}

export interface CsvExportOptions extends JsonExportOptions {
    what?: string //指示是否到节点或者边
    edges?: string[]  //指定的边列表
    nodes?: string[] //指定的点列表
}

export interface XlsxExportOptions extends JsonExportOptions {
    tab?: {
        edges?: Function //返回的字符串表示要用于边缘的有一个或者多个选项卡名称
        nodes?: Function //返回的字符串表示要用于边缘的有一个或者多个选项卡名称
    }
}

export interface imageTemplate {
    url?: string //图片地址
    scale?: string | number //缩放比
}

export interface iconTemplate {
    font?: string //字体
    color?: string //颜色
    style?: string //样式
    content?: string //主要内容
    scale?: number | string //缩放比
}

export interface textTemplate {
    color?: string //字体颜色
    background?: string //背景颜色
    fontSize?: number | string //字体的大小
    position?: string //文字的位置
    content?: string //文字的主要内容
    // isInLine?: boolean //这个属性是用来控制这个文字是否出现在线上面
    maxLength?: number //多少字换行
    margin?: number[] //margin的效果
    result?: any //文字纹理
    style?: ['normal' | 'bold' | 'italic'] //文字样式：正常、加粗、斜体
}

interface baseAttribute {
    x?: number
    y?: number // <x,y> 坐标
    isNode?: boolean //是否为点
    isSelect?: boolean //是否选中
    isVisible?: boolean //是否显示
    opacity?: number //透明度
    color?: string //颜色
    text?: textTemplate //文字
    halo?: {
        color?: string //halo颜色
        width?: number //halo宽度
    }
}

export interface NodeAttribute extends baseAttribute {
    [x: string]: any
    gradient?: {
        isGradient: boolean //是否使用渐变色
        position: string //位置
    } //渐变色
    radius?: number //半径
    innerStroke?: {
        //环
        width?: number //宽度
        color?: string //颜色
        selectedColor?: string //选中颜色
    },
    pulse?:{  //波动
        range?: number[] // 波的范围
        width?: number // 波的线宽
        duration?: number // 整个波时间
        interval?: number // 波与波之间的间距
        startColor?: any // 颜色
        scale?: number // 缩放级别
        startRatio?: number // 波开始的地方
    },
    shape?: string //点的形状
    draggable?: boolean //是否能拖动
    icon?: iconTemplate 
    image?: imageTemplate
    badges?: any //badges
}

export interface edgeAttribute extends baseAttribute {
    [x: string]: any
    width?: number //线宽
    shape?: {
        head?: string //头部形状
        style?: string //边类型
    }
    target?: string | number //终点
    source?: string | number //起点
    type?: string
    location?: string //自环边类型
    selectedColor?: string //选中颜色
}

export interface NodeAttributes {
    [x: string]: any
    id?: number | string //id
    num?: number
    attribute?: NodeAttribute //点属性
    data?: any
    classList?: any[]
}

export interface edgeAttributes {
    [x: string]: any
    id: string | number //id
    target: string | number //终点
    source: string | number //起点
    attribute?: edgeAttribute
    data?: any
    classList?: any[]
}

export interface Settings {
    vertex: number[] //基础的0.2*0.2的块
    uvtex: number[] //铺满一个纹理坐标系的块
    nodeAttribute: any //点的基础属性
    edgeAttribute: any //边的基础属性
}

export enum loopLineType {
    lowerLeft = 1, //自环边的方向
    upperLeft,
    lowerRight,
    upperRight,
}

export enum position {
    left = 1, //位置
    right,
    top,
    bottom,
}

export enum typeShape {
    circle = 1.0, //点类型
    square,
    triangle,
    rhombus,
}

export interface basicDataType {
    [key: string]: {
        transform: number //webgl -> canvas
        nodeList: Map<any, any> //点列表
        edgeList: Map<any, any> //边列表
        boundBox: Map<any, any> //点包围盒列表
        edgeBoundBox: Map<any, any> //边包围盒列表
        edgeCanvasBoundBox: Map<any, any> //边包围盒列表
        thumbnailEdgeBoundBox: Map<any, any> //边包围盒列表
        drawEdgeList: Map<any, any> //绘制边列表
        drawNodeList: Map<any, any> //绘制点列表
        drawNodeLableList: Map<any, any> //绘制点文字列表
        drawEdgeLableList: Map<any, any> //绘制边文字列表
        drawEdgeCount: Map<any, any>
        relationTable: { [key: string]: any } // 点关联的边
        selectedTable: Set<any> //需要更新的点列表
        selectedEdgeTable: Set<any> //需要更新的边列表
        selectedNodes: Set<any> //选中的点
        selectedEdges: Set<any> //选中的边
        unSelectedNodes: Set<any> //相继上次选择取消选中的点
        unSelectedEdges: Set<any> //相继上次选择取消选中的边
        informationNewEdge: Map<any, any>
        adjacentEdges: Array<string>
    }
}

export interface OriginInfo {
    [key: string]: {
        nodeList: Map<any, any> //未加规则的点
        edgeList: Map<any, any> //未加规则的边
    }
}

export interface GeoModeOptions {
    attribution?: string //将显示在角落的HTML字符串，表示来源。
    disableNodeDragging?: boolean //禁止节点拖动 [= true]
    duration?: number //动画事件 [= 0]
    maxZoomLevel?: number //geo最大层级 [= 20]
    minZoomLevel?: number //geo最小层级 [= 1]
    sizeRatio?: number //点边缩放比 [= 1.0]
    tiles?: {
        subdomains?: string //用来搜索瓦片的url格式 [= "abc"]
        url?: string //用来搜索瓦片的url格式
    }
    latitudePath?: string | Function //纬度
    longitudePath?: string | Function //经度
    crs?: any //crs
    allowdDclick?: boolean //是否允许双击
}

export interface NodeCollection {
    [key: string]: {
        packedData: any
    }
}

export interface EdgeCollection {
    [key: string]: {
        drawNum: any
        spInformation: Set<string>
        informationNewEdge: Map<string, any> | null
        color: any
        width: any
        col14row2: any
        plotTwoDrawNum: number
        plotsTwoColor: any
        plotsTwoWidth: any
        plotsTwoC42: any
        plotsInformation: Set<string>
    }
}

export interface EdgeHaloCollection {
    [key: string]: {
        drawNum: number
        color: any
        width: any
        col14row2: any
        isArrow: any
        haloInfo: Map<any, any>
        spInformation: Set<string>
    }
}

export interface NodeHaloCollection {
    [key: string]: {
        floatData: any
    }
}

export interface NodeLabelCollection {
    [key: string]: {
        labelFloat32Array: Float32Array,
    }
}

export interface EdgeLabelCollection {
    [key: string]: {
        labelFloat32Array: Float32Array,
    }
}

export const LAYOUT_MESSAGE = {
    // run layout
    START: 'layoutStart',
    // layout ended with success
    END: 'layoutEnd',
    // layout error
    ERROR: 'layoutError',
}