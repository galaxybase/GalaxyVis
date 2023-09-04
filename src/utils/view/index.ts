import cloneDeep from 'lodash/cloneDeep'
import { coordTransformation, roundedNum } from '..'
import { basicData, globalInfo, globalProp } from '../../initial/globalProp'
import { animateCamera } from '../cameraAnimate'

export const GraphToScreenCoordinates = (
    that: any,
    evt: any
) => {
    let graph = that
    let graphId = graph.id;
    let camera = graph.camera;
    let position = cloneDeep(camera.position);
    let ratio = camera.ratio;
    let scale = (globalProp.globalScale / ratio) * 2.0
    let renderType = graph.getRenderType();
    let transform = 1
    let width = globalInfo[graphId].BoxCanvas.getWidth,
        height = globalInfo[graphId].BoxCanvas.getHeight;
    if (renderType === "webgl") {
        scale *= height / window.outerHeight;
        // graph.camera.updateTransform()
        // 更新比例
        if (graph.geo.enabled())
            graph.geo.getGeoTransform()
        else
            camera.updateTransform()
        transform = basicData[graphId]?.transform || 223
        position[0] *= -transform;
        position[1] *= transform;
    }
    let { x, y } = evt;

    x += position[0];
    y += position[1];

    x *= scale / 2.0
    y *= scale / 2.0

    x = roundedNum((x += width / 2))
    y = roundedNum((y += height / 2))
    return {
        x,
        y,
    }
}

export const ScreenToGraphCoordinates = (
    that: any,
    evt: any
) => {
    let graph = that
    let camera = graph.camera
    // 获取当前缩放
    let ratio = camera.ratio
    // 获取相机当前位置
    let position = cloneDeep(camera.position)

    let graphId = graph.id;

    let scale = (globalProp.globalScale / ratio) * 2.0

    let width = globalInfo[graphId].BoxCanvas.getWidth,
        height = globalInfo[graphId].BoxCanvas.getHeight;

    let { x, y } = evt;

    let renderType = graph.getRenderType();
    let transform = 1
    if (renderType === "webgl") {

        scale *= height / window.outerHeight;

        // graph.camera.updateTransform()
        if (graph.geo.enabled())
            graph.geo.getGeoTransform()
        else
            camera.updateTransform()

        transform = basicData[graphId]?.transform || 223

        position[0] *= -transform;
        position[1] *= transform;
    }

    x = roundedNum(x -= width / 2)
    y = roundedNum(y -= height / 2)

    x /= scale / 2.0;
    y /= scale / 2.0;

    x -= position[0];
    y -= position[1];

    return {
        x, y
    }
}

export const viewZoomChange = (
    type: number, //1 in ,-1 out
    galaxyvis: any,
    scale?: number, // 缩放比
    opts?: any,
) => {
    return new Promise((resolve, reject) => {
        try {
            let camera = galaxyvis.camera
            scale = scale || 1
            let nowZoom = camera.zoom - type * 5 * scale, //获取当前相机zoom - 5 * scale * type
                nowPosition = camera.position //获取当前相机位置
            if (nowZoom < camera.minZoom && type == 1) nowZoom = camera.minZoom
            if (nowZoom > camera.maxZoom && type == -1) nowZoom = camera.maxZoom
            if (!opts) opts = {}
            // 相机动画
            animateCamera(galaxyvis, { zoom: nowZoom, position: nowPosition }, opts, () => {
                resolve((): void => { })
            })
        } catch {
            reject('ZoomChange Fail')
        }
    })
}

/**
 * view的return
 * @param galaxyvis
 * @returns
 */
export const viewGet = (galaxyvis: any) => {
    let camera = galaxyvis.camera,
        { zoom, position, ratio } = camera;
    let GraphId = galaxyvis.id;
    return {
        angle: 0, //暂不支持
        height: galaxyvis.thumbnail
            ? globalInfo[GraphId].thumbnail?.height
            : globalInfo[GraphId].BoxCanvas.getHeight,
        width: galaxyvis.thumbnail
            ? globalInfo[GraphId].thumbnail?.width
            : globalInfo[GraphId].BoxCanvas.getWidth,
        x: position[0],
        y: position[1],
        zoom,
        ratio,
    }
}

export const viewSet = (galaxyvis: any, options: any) => {
    let { zoom, x, y } = options,
        camera = galaxyvis.camera

    zoom && (camera.zoom = zoom)
    x != undefined && y != undefined && (camera.position = [x, y, 3])
    zoom && (camera.ratio = 6 * Math.tan((zoom * Math.PI) / 360))
}

/**
 * 获取zoom层级
 * @param camera
 * @returns
 */
export const viewGetZoom = (camera: any): number => {
    return camera.zoom
}
/**
 * 视图剧中
 * @param galaxyvis
 * @param options
 * @returns
 */
export const viewLocateGraph = (galaxyvis: any, options?: any) => {
    return new Promise((resolve, reject) => {
        let GraphId = galaxyvis.id;
        let { thumbnail, BoxCanvas } = globalInfo[GraphId]

        let renderType = galaxyvis.renderer

        let coordRight: number = -Infinity, //右边界
            coordLeft: number = Infinity, //左边界
            coordTop: number = -Infinity, //上边界
            coordBottom: number = Infinity, //下边界
            nodeList = galaxyvis.getFilterNode(),
            camera = galaxyvis.camera,
            padding = options?.padding || 0; //padding效果的适配
        padding *= 10;
        for (let [key, value] of nodeList) {
            let x = value.getAttribute('x'),
                y = value.getAttribute('y')
            // 计算最大最小边界
            coordRight = Math.max(coordRight, x)
            coordTop = Math.max(coordTop, y)
            coordLeft = Math.min(coordLeft, x)
            coordBottom = Math.min(coordBottom, y)
        }

        coordRight += padding;
        coordTop += padding;
        coordLeft -= padding;
        coordBottom -= padding;

        // 相机偏移量
        let coordMid_x = (coordRight + coordLeft) / 2,
            coordMid_y = (coordTop + coordBottom) / 2,
            nowPosition = [-coordMid_x, -coordMid_y, 3]
        let transform = basicData[GraphId].transform,
            viewHeight = Math.ceil((coordTop - coordBottom)),
            viewWidth = Math.ceil((coordRight - coordLeft)),
            useMatrix = viewHeight / BoxCanvas.getHeight > viewWidth / BoxCanvas.getWidth,
            maxratio = useMatrix ? viewHeight : viewWidth,
            zoomratio,
            zoomBasic = useMatrix ? BoxCanvas.getHeight : BoxCanvas.getWidth,
            thubnailBasic;

        if (renderType == 'webgl') {

            const innerWidth = window.outerWidth
            const innerHeight = window.outerHeight
            const dsr = (BoxCanvas.getWidth / BoxCanvas.getHeight) / (innerWidth / innerHeight)

            useMatrix = viewHeight / innerHeight > viewWidth / innerWidth;
            maxratio = useMatrix ? viewHeight : viewWidth;
            zoomBasic = (useMatrix ? innerHeight : innerWidth);

            if (!galaxyvis.thumbnail && useMatrix && dsr <= 1.0) {
                zoomBasic *= dsr;
            } else if (dsr <= 1.0 && !useMatrix) {
                zoomBasic *= dsr
            } else if (dsr > 1) {
                transform *= dsr
            }

            let offset = coordTransformation(GraphId, coordMid_x, coordMid_y)
            nowPosition = [offset[0], offset[1], 3];
        }

        thumbnail && galaxyvis.thumbnail && (
            thubnailBasic = useMatrix
                ? thumbnail?.height
                : thumbnail?.width
        );

        zoomratio = (thumbnail && galaxyvis.thumbnail) ?
            (renderType == "webgl" ? zoomBasic : (1 - transform / 2 / zoomBasic) * thubnailBasic) :
            zoomBasic + transform

        let zoom = Math.ceil(((Math.atan2(maxratio, zoomratio) * 360) / Math.PI))

        if (options?.viewZoom && zoom < options.viewZoom) {
            zoom = options.viewZoom
        }

        if (renderType == 'canvas' && thumbnail && galaxyvis.thumbnail && zoom < camera.maxZoom)
            zoom = camera.maxZoom

        // 计算zoom的大小 缩略图取消保护机制
        if (zoom > camera.maxZoom && !galaxyvis.thumbnail) zoom = camera.maxZoom
        if (zoom < camera.minZoom && !galaxyvis.thumbnail) zoom = camera.minZoom
        camera.ratio = 6 * Math.tan((zoom * Math.PI) / 360)

        // 动画
        animateCamera(
            galaxyvis,
            { zoom, position: nowPosition },
            { duration: options.duration, easing: options.easing },
            () => {
                resolve((): void => { })
            },
        )
    })
}
