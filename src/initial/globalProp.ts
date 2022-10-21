import { basicDataType, globalInfoData, globalPropType } from '../types'

export const globalProp: globalPropType = {
    textureCtx: null,
    standardRadius: 10, //缩放的标准半径r
    cameraPosition: [0, 0, 3], //相机初始位置
    atlas: 32, //纹理最大集
    fastAtlas: 8,
    textSet: new Set(), //文字Set
    iconMap: new Map([
        [
            '',
            {
                num: 0,
                style: 'normal',
                scale: 0.5,
            },
        ],
    ]), // icon和image的仓库
    useIniticon: 0,
    labelStore: {}, //文字仓库
    globalScale: 6 * Math.tan((70 * Math.PI) / 360), //默认缩放
    defaultZoom: 70, //默认zoom
    maxZoom: 160, //最大zoom
    minZoom: 20, //最小zoom
    direction: {
        bottomRight: [1, 1],
        bottomLeft: [-1, 1],
        topLeft: [-1, -1],
        topRight: [1, -1],
    }, //badge位置
    edgeGroups: 41, //绘制一个曲线需要多少控制点
}

export const ANIMATE_DEFAULTS = {
    easing: 'quadraticInOut',
    duration: 500,
    padding: 5,
}

export const basicData: basicDataType = {}

export const globalInfo: globalInfoData = {}

export const thumbnailInfo: any = {}

export const instancesGL: any = {}
