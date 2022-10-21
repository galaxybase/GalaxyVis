import NodeList from "../classes/nodeList"
import { LAYOUT_MESSAGE } from "../types"
import { EventType } from "../utils/events"
import { animateNodes } from "../utils/graphAnimate"
import { incrementalLayout } from "./incremental"

export function animation(that: any, event: any, layoutsNodes: any, layoutName: string) {
    return new Promise((resolve, reject) => {
        const options = that.options;
        const { duration, easing, incremental } = options
        if (incremental)
            that.data = incrementalLayout(
                that.galaxyvis.id,
                !that.positions && event ? event.data.positions : that.positions,
                new NodeList(that.galaxyvis, !that.ids && event ? event.data.ids : that.ids),
                options,
            )
        animateNodes(
            that.galaxyvis,
            that.data,
            {
                duration,
                easing,
            },
            () => {
                that.galaxyvis.events.emit(
                    LAYOUT_MESSAGE.END,
                    EventType.layoutEnd({
                        ids: layoutsNodes,
                        name: layoutName,
                        type: LAYOUT_MESSAGE.END,
                        postions:
                            layoutsNodes.map((item: string | number, index: number) => {
                                let datas = that.data[item]
                                !datas && (datas = that.data[index])
                                if (datas)
                                    return { x: datas.x, y: datas.y }
                            }),
                    }),
                )
                resolve(true)
            },
            incremental ? false : true,
        )
    })

}