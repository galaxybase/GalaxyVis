import { Settings } from '../types'

export const TEPLATE = {
    textTemplate: {
        color: '#000000', //文字颜色
        background: 'rgba(255,255,255,0)', //背景色
        fontSize: '24', //字体大小
        position: 'bottom', //文字位置
        content: '', //文字内容
        maxLength: 99, //文字最长换行
        minVisibleSize: 6, //文字最小可见范围
    }, //文字模板
    iconTemplate: {
        font: 'iconfont', //字体类型
        color: '#ffffff', //icon颜色
        style: 'normal', //粗细
        content: '', //主要内容
        scale: 0.5, //缩放
    }, //icon模板
    imageTemplate: {
        url: '', //image地址
        scale: 1.0, //缩放
    }, //图片模板
    innerTemplate: {
        width: 2, //环宽
        color: '#fff', //颜色
        selectedColor: '#f00', //选中颜色
    }, //inner 模板
    gradientTemplate: {
        isGradient: false, //是否使用渐变色
        position: 'left', //渐变开始方向  left right top bottom
    }, //渐变色模板
    haloTemplate: {
        color: '#fff',
        width: 0,
    }, //halo模板
    shapeTemplate: {
        head: undefined, //arrow
        style: undefined, //dash
    }, //线类型模板
}

export const DEFAULT_SETTINGS: Settings = {
    vertex: [0.1, -0.1, 0.1, 0.1, -0.1, 0.1, -0.1, 0.1, 0.1, -0.1, -0.1, -0.1], //基础的0.1*0.1的块
    uvtex: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0], //铺满一个纹理坐标系的块
    nodeAttribute: {
        x: 0, //坐标
        y: 0,
        radius: 20, //半径
        color: '#888888', //默认颜色
        isNode: true, //是否为点
        innerStroke: TEPLATE.innerTemplate,
        shape: 'circle', //点类型
        isSelect: false, //是否选中
        isVisible: true, //是否显示
        draggable: true, //能否拖动
        opacity: 1.0, //透明度
        gradient: TEPLATE.gradientTemplate,
        text: TEPLATE.textTemplate,
        icon: TEPLATE.iconTemplate,
        image: TEPLATE.imageTemplate,
        halo: TEPLATE.haloTemplate,
        badges: null,
    },
    edgeAttribute: {
        color: '#888888', //颜色
        width: 0.5, //宽度
        isNode: false, //是否为点
        isSelect: false, //是否选中
        isVisible: true, //是否显示
        opacity: 1.0, //透明度
        text: { ...TEPLATE.textTemplate, position: 'top' },
        shape: TEPLATE.shapeTemplate,
        selectedColor: '#f00', //选中颜色
        target: null, //目标点
        source: null, //起始点
        type: 'basic', //线类型 basic parallel
        location: 'lowerLeft', // lowerLeft upperLeft  lowerRight  upperRight
        halo: TEPLATE.haloTemplate,
    },
}

export const basieciDataSetting = {
    transform: 223, // 默认缩放比
    nodeList: new Map(), //点列表
    edgeList: new Map(), //边列表
    boundBox: new Map(), //点包围盒列表
    edgeBoundBox: new Map(), //边包围盒列表
    edgeCanvasBoundBox: new Map(), //边包围盒列表
    thumbnailEdgeBoundBox: new Map(), //边包围盒列表
    drawEdgeList: new Map(), //绘制边列表
    drawNodeList: new Map(), //绘制点列表
    drawNodeLableList: new Map(), //绘制点文字列表
    drawEdgeLableList: new Map(), //绘制边文字列表
    drawEdgeCount: new Map(),
    relationTable: {} as { [key: string]: any }, // 点关联的边
    selectedTable: new Set() as Set<any>, //需要更新的点列表
    selectedEdgeTable: new Set() as Set<any>, //需要更新的边列表
    selectedNodes: new Set() as Set<any>, //选中的点
    selectedEdges: new Set() as Set<any>, //选中的边
    unSelectedNodes: new Set() as Set<any>, //相继上次选择取消选中的点
    unSelectedEdges: new Set() as Set<any>, //相继上次选择取消选中的边
    informationNewEdge: new Map(),
}
export const originInfoSetting = {
    nodeList: new Map(),
    edgeList: new Map(),
}

// 布局用的Canvas
class BoxCanvas {
    canvasWidth: number = 800
    canvasHeight: number = 800
    // 设置宽
    public set setWidth(v: number) {
        this.canvasWidth = v
    }
    // 获取宽
    public get getWidth(): number {
        return this.canvasWidth
    }
    // 设置高
    public set setHeight(v: number) {
        this.canvasHeight = v
    }
    // 获取高
    public get getHeight(): number {
        return this.canvasHeight
    }
}

const boxCanvas = new BoxCanvas()

export const globalInfoSetting = {
    nodeOrder: new Set(), //点绘制顺序
    edgeOrder: new Set(), //边绘制顺序
    ruleList: new Map(), //规则列表
    nodeHoverStyle: {}, //点hover规则
    edgeHoverStyle: {}, //边hover规则
    nodeSelectStyle: {}, //点选中规则
    edgeSelectStyle: {}, //边选中规则
    mergeEdgesTransformat: null, //合并边
    mergeNodesTransformat: new Map(), //合并点
    filterNodesTransformat: new Map(), //过滤点
    filterEdgesTransformat: new Map(), //过滤边
    backgroundColor: {
        floatColor: 16777215,
        color: '#fff',
    }, //optical背景色默认值
    thumbnail: null, //缩略图
    isSafari: false,
    BoxCanvas: boxCanvas, //布局的画布
    canvasBox: document.createElement('canvas'), //整个canvas对象
    edgeType: null,
}
