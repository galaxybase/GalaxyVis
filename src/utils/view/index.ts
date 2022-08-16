import { coordTransformation } from '..'
import { basicData, globalInfo } from '../../initial/globalProp'
import { AnimateOptions } from '../../types'
import { animateCamera } from '../cameraAnimate'

export const viewZoomChange = (
    type: number, //1 in ,-1 out
    galaxyvis: any,
    scale?: number, // 缩放比
    opts?: AnimateOptions,
) => {
    return new Promise((resolve, reject) => {
        try {
            let camera = galaxyvis.camera
            scale = scale || 1
            let nowZoom = camera.zoom - type * 5 * scale, //获取当前相机zoom - 5 * scale * type
                nowPosition = camera.position //获取当前相机位置
            if (nowZoom < camera.minZoom && type == 1) nowZoom = camera.minZoom
            if (nowZoom > camera.maxZoom && type == -1) nowZoom = camera.maxZoom
            // 相机动画
            animateCamera(galaxyvis, { zoom: nowZoom, position: nowPosition }, opts, () => {
                resolve((): void => {})
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
        { zoom, position, ratio } = camera
    return {
        angle: 0, //暂不支持
        height: galaxyvis.thumbnail
            ? globalInfo[galaxyvis.id].thumbnail?.height
            : globalInfo[galaxyvis.id].BoxCanvas.getHeight,
        width: galaxyvis.thumbnail
            ? globalInfo[galaxyvis.id].thumbnail?.width
            : globalInfo[galaxyvis.id].BoxCanvas.getWidth,
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
export const viewLocateGraph = (galaxyvis: any, options?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        let { thumbnail, BoxCanvas } = globalInfo[galaxyvis.id]

        let renderType = galaxyvis.renderer

        let coordRight: number = -Infinity, //右边界
            coordLeft: number = Infinity, //左边界
            coordTop: number = -Infinity, //上边界
            coordBottom: number = Infinity, //下边界
            nodeList = galaxyvis.getFilterNode(),
            camera = galaxyvis.camera,
            padding = (renderType === 'webgl' ? options?.padding / 3 : options?.padding * 5) || 0 //padding效果的适配
        for (let [key, value] of nodeList) {
            let x = value.getAttribute('x'),
                y = value.getAttribute('y')
            if (renderType == 'webgl') {
                let offset = coordTransformation(galaxyvis.id, x, y)
                ;(x = offset[0]), (y = offset[1])
            }
            // 计算最大最小边界
            coordRight = Math.max(coordRight, x)
            coordTop = Math.max(coordTop, y)
            coordLeft = Math.min(coordLeft, x)
            coordBottom = Math.min(coordBottom, y)
        }
        // 相机偏移量
        let coordMid_x = (coordRight + coordLeft) / 2,
            coordMid_y = (coordTop + coordBottom) / 2,
            nowPosition = [-coordMid_x, -coordMid_y, 3]

        let viewHeight = Math.ceil((coordTop - coordBottom + padding * 2.0) * 1e3) / 1e3,
            viewWidth = Math.ceil((coordRight - coordLeft + padding * 2.0) * 1e3) / 1e3,
            useMatrix = viewHeight / BoxCanvas.getHeight > viewWidth / BoxCanvas.getWidth,
            maxratio = useMatrix ? viewHeight : viewWidth,
            zoomratio

        if (renderType == 'webgl') {
            nowPosition = [coordMid_x, coordMid_y, 3]
            maxratio = useMatrix ? viewHeight : viewWidth
        }

        zoomratio =
            renderType === 'webgl' && !galaxyvis.thumbnail
                ? (useMatrix ? BoxCanvas.getHeight : BoxCanvas.getWidth) /
                      basicData[galaxyvis.id].transform +
                  6
                : renderType === 'webgl' && galaxyvis.thumbnail
                ? (useMatrix ? thumbnail?.height : thumbnail?.width) / 110 + 6
                : thumbnail && galaxyvis.thumbnail
                ? useMatrix
                    ? thumbnail?.height
                    : thumbnail?.width
                : (useMatrix ? BoxCanvas.getHeight : BoxCanvas.getWidth) +
                  basicData[galaxyvis.id].transform

        let zoom = Math.ceil(((Math.atan2(maxratio, zoomratio) * 360) / Math.PI) * 1e3) / 1e3

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
                resolve((): void => {})
            },
        )
    })
}
