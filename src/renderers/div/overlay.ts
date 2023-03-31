import { clone } from "lodash";
import { basicData, globalInfo, globalProp } from "../../initial/globalProp";
import { cancelFrame, getContainerHeight, requestFrame, transformCanvasCoord } from "../../utils";

export default class overLay {

    private graph: any;
    public frameId: number | null = null;
    public overlayPass: any;

    constructor(graph: any) {
        this.graph = graph;
        const id = graph.id

    }

    render() {
        const self = this;
        const graph = self.graph
        const graphId = graph.id;
        const camera = graph.camera;
        const overlayPass = this.overlayPass = document.getElementById("overlayPass_" + graphId) as HTMLCanvasElement;
        // 更新比例
        camera.updateTransform()

        const transform = basicData[graphId]?.transform || 223
        const { nodeList } = basicData[graphId]
        let renderType = graph.getRenderType();

        let overlayList = globalInfo[graphId].overlay
        // 如果不存在该图层则return
        if (!overlayPass) return;
        // arf
        function tickFrame() {
            if (Object.keys(overlayList)) {
                for (let key in overlayList) {
                    let item = overlayList[key]
                    let node = nodeList.get(key);
                    if (!node) continue;
                    let element = item.element;
                    let id = "overlay_" + key;
                    let isVisible = node.getAttribute("isVisible")
                    let position = clone(camera.position);
                    let ratio = camera.ratio;
                    let scale = (globalProp.globalScale / ratio) * 2.0

                    if (renderType === "webgl") {
                        position[0] *= -transform;
                        position[1] *= transform;
                    }

                    // 如果被销毁但点可见则视为新增
                    if (item.type == "destroy") {
                        if (node && isVisible) {
                            item.type = "add"
                        }
                    }
                    // 新增数据
                    if (item.type == "add") {
                        element.id = id
                        if (node && isVisible) {
                            let radius = item.baseRadius || 25
                            let height = radius * scale * 2;
                            element.firstChild.style.height = height + 'px'
                            element.firstChild.style["padding-left"] = height / 2 + 'px'
                        }
                        overlayPass.appendChild(element)
                        item.type = "added"
                    }
                    // 点存在并可见
                    if (node && isVisible && item.type == "added") {
                        let divHight = getContainerHeight(element);

                        let { x, y } = node.getPosition()

                        y -= divHight / 2

                        let coord = transformCanvasCoord(graphId, x, y, position, scale)
                        x = coord.x;
                        y = coord.y;

                        element.style["transform-origin"] = "left top"

                        element.style.transform = `
                            translate(${x}px, ${y}px) 
                            rotate(0rad) 
                            translate(${0}px, ${0}px) 
                            scale(${scale / 2}, ${scale / 2})
                            `;
                    }
                    // 点存在不可见
                    if (node && !isVisible && item.type != "destroy") {
                        item.type = "destroy";
                        let childNodes = overlayPass.childNodes;
                        let index;
                        for (let i = 0, len = childNodes.length; i < len; i++) {
                            // @ts-ignore
                            if (childNodes[i].id == id) {
                                index = i;
                                break;
                            }
                        }
                        if (index != undefined)
                            overlayPass.removeChild(childNodes[index])
                    }
                }
            }
            self.frameId = requestFrame(tickFrame)
        }
        self.frameId = requestFrame(tickFrame)
    }

    /**
     * 清除
     */
    clear() {
        const graphId = this.graph.id;
        let overlayList = globalInfo[graphId].overlay
        if (Object.keys(overlayList)) {
            for (let key in overlayList) {
                let item = overlayList[key]
                let overlayPass = this.overlayPass
                item.type = "destroy";
                let childNodes = overlayPass.childNodes;
                for (let i = childNodes.length - 1; i >= 0; i--) {
                    overlayPass.removeChild(childNodes[i])
                }
            }
        }
        globalInfo[graphId].overlay = {}
        this.stop()
        this.render()
    }
    /**
     * 暂停
     */
    stop() {
        if (this.frameId) {
            cancelFrame(this.frameId);
            this.frameId = null;
        }
    }
    /**
     * 销毁
     */
    destory() {
        const graphId = this.graph.id;
        globalInfo[graphId].overlay = {};

        this.stop();
        const overlayPass = document.getElementById("overlayPass_" + this.graph.id) as HTMLCanvasElement;
        overlayPass.remove()
    }

}