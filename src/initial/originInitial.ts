import { OriginInfo } from '../types'
/**
 * 用于存放ORIGIN_INFO的数据
 */
export const originInitial: any = {
    graphIndex: 0, //第几个数据
    options: {
        alpha: true, //表示canvas包含一个alpha缓冲区
        antialias: true, //表示是否开启抗锯齿
        // @ts-ignore
        failIfMajorPerformanceCaveat: !('undefined' != typeof window && window.FORCE_WEBGL), //表明在一个系统性能低的环境是否创建该上下文
        // failIfMajorPerformanceCaveat: false,
        premultipliedAlpha: true, //表明排版引擎将绘制缓冲区包含预设混合alpha通道
        stencil: true, // 模板缓冲区
        /* 
            preserveDrawingBuffer
            如果这个值为true缓冲区将不会被清除，会保存下来，直到被清除或被使用者覆盖。  
        */
        preserveDrawingBuffer: true,
    },
}

export const originInfo: OriginInfo = {}
