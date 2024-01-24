import { PlainObject } from '../types'
import { cancelFrame, requestFrame } from './index'
import { AnimateOptions } from '../types'
import { ANIMATE_DEFAULTS, basicData } from '../initial/globalProp'
import isArray from 'lodash/isArray'
import easings from './easings'

/**
 * 动画的过度效果
 * @param graph 指向整个galaxyvis
 * @param targets 最后的坐标
 * @param opts 时间延迟等配置
 * @param callback 回调
 * @returns
 */
export function animateNodes(
    graph: any,
    targets: PlainObject<PlainObject<any>>,
    opts: {
        duration?: number,
        easing?: string
    },
    callback: () => void,
    isInLayout: boolean = true,
): () => void {

    if (!basicData[graph.id]) {
        return () => void 0;
    }

    if (graph.animateFram){
        cancelFrame(graph.animateFram)
    }

    // 动画缓动方式和延时
    let { duration, easing } = ANIMATE_DEFAULTS
    opts.duration = opts.duration != undefined ? opts.duration : duration
    opts.easing = opts.easing || easing
    const options: AnimateOptions = {
        duration: opts.duration,
        easing: opts.easing,
    }
    // 动画缓动方式
    const easingFunc: (k: number) => number =
        typeof options.easing === 'function' ? options.easing : easings[options.easing]

    const start = Date.now()
    // 存放开始点的坐标
    const startPositions: PlainObject<PlainObject<number>> = {}

    let targetsIsArray = false

    if (isArray(targets)) {
        targetsIsArray = true
    }

    for (let node in targets) {
        const attrs = targets[node]
        const id = targetsIsArray ? attrs.id : node
        startPositions[id] = {}
        for (const k in attrs) {
            startPositions[id][k] = basicData[graph.id].nodeList.get(id)?.getAttribute(k)
        }
    }

    graph.animateFram = null

    const step = () => {
        
        if (!basicData[graph.id]) {
            return () => void 0;
        }

        if (options.duration == 0) {
            for (const node in targets) {
                const attrs = targets[node]
                const id = targetsIsArray ? attrs.id : node
                basicData[graph.id].nodeList.get(id)?.changeAttribute(attrs)
            }
            if (isInLayout) graph.textStatus = true
            graph.render()
            graph.animateFram = null
            if (typeof callback === 'function') callback()

            return
        }

        let p = (Date.now() - start) / options.duration

        // 回归
        if (p >= 1) {
            for (const node in targets) {
                const attrs = targets[node]
                const id = targetsIsArray ? attrs.id : node
                basicData[graph.id].nodeList.get(id)?.changeAttribute(attrs)
            }
            if (isInLayout) graph.textStatus = true
            graph.render()
            graph.animateFram = null
            if (typeof callback === 'function') callback()
            return
        }

        p = easingFunc(p)
        // 收敛
        for (const node in targets) {
            const attrs = targets[node]
            const id = targetsIsArray ? attrs.id : node
            const s = startPositions[id]
            const NodeValue = basicData[graph.id].nodeList.get(id).value
            NodeValue.attribute.x = attrs.x * p + (s.x || 0) * (1 - p)
            NodeValue.attribute.y = attrs.y * p + (s.y || 0) * (1 - p)
            // ({
            //     x: attrs.x * p + (s.x || 0) * (1 - p),
            //     y: attrs.y * p + (s.y || 0) * (1 - p),
            // })
        }
        if (isInLayout) graph.textStatus = false
        graph.render()
        // 执行下一帧动画
        graph.animateFram = requestFrame(step)
    }

    step()

    return () => {
        if (graph.animateFram) {
            cancelFrame(graph.animateFram)
        }
    }
}
