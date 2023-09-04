import { cancelFrame, requestFrame } from './index'
import { AnimateOptions } from '../types'
import { ANIMATE_DEFAULTS } from '../initial/globalProp'
import easings from './easings'


/**
 * 动画的过度效果
 * @param graph 指向整个camera
 * @param targets
 * @param opts 时间延迟等配置
 * @param callback 回调
 * @returns
 */
export function animateCamera(
    graph: any,
    targets: any,
    opts: {
        duration?: number
        easing?: string
    } | AnimateOptions,
    callback: () => void,
): () => void {
    
    if (graph.cameraFram){
        cancelFrame(graph.cameraFram)
    }

    let { duration, easing } = ANIMATE_DEFAULTS
    let camera = graph.camera
    opts.duration = opts.duration || duration
    opts.easing = opts.easing || easing
    // 动画缓动方式和延时
    const options: AnimateOptions = {
        duration: opts.duration <= 0 ? 1 : opts.duration,
        easing: opts.easing,
    }
    // 动画缓动方式
    const easingFunc: (k: number) => number =
        typeof options.easing === 'function' ? options.easing : easings[options.easing]

    const start = Date.now()

    const startPositions = {
        zoom: camera.zoom,
        position: camera.position,
    }

    graph.cameraFram = null;

    const step = () => {
        let p = (Date.now() - start) / options.duration

        // 回归
        if (p >= 1) {
            camera.zoom = targets.zoom

            camera.position = targets.position

            camera.ratio = 2 * (targets.position[2] * Math.tan((targets.zoom * Math.PI) / 360))

            graph.camerarefresh(true)
            graph.cameraFram = null;
            
            if (typeof callback === 'function') callback()

            return
        }

        p = easingFunc(p)
        // 收敛

        camera.zoom = targets.zoom * p + startPositions.zoom * (1 - p)

        for (let i = 0; i <= 1; i++) {
            camera.position[i] = targets.position[i] * p + startPositions.position[i] * (1 - p)
        }

        camera.ratio = 2 * (camera.position[2] * Math.tan((camera.zoom * Math.PI) / 360))

        graph.camerarefresh(true)
        // 执行下一帧动画
        graph.cameraFram = requestFrame(step)
    }

    step()

    return () => {
        if (graph.cameraFram) cancelFrame(graph.cameraFram)
    }
}
