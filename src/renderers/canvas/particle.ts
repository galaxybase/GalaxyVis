import clone from 'lodash/clone'
import { basicData, globalProp } from "../../initial/globalProp";
import { loopLineType } from "../../types";
import { cancelFrame, getContainerHeight, getContainerWidth, hashNumber, requestFrame, switchSelfLinePostion, transformCanvasCoord } from "../../utils";
import { create3DBezier, create4DBezier } from "../../utils/edge/bezier";
import { bezier3 } from "./edgeCanvas/commom";

export default class particleCanvas {

    private graph: any;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public particleFrameId: number | null = null;

    constructor(graph: any) {
        this.graph = graph;
        const id = graph.id
        const canvas = this.canvas = document.getElementById("particle_" + id) as HTMLCanvasElement
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    }

    render() {
        const self = this;
        const graph = self.graph
        const graphId = graph.id;
        const camera = graph.camera;
        const events = graph.events;

        let width = getContainerWidth(self.canvas),
            height = getContainerHeight(self.canvas);

        let renderType = graph.getRenderType();
        let particleSet: Set<string> = new Set();
        events.on('mouseunSelectEdges', (data: Set<string>) => {
            let { edgeList } = basicData[graphId]
            // 重置particle
            data.forEach((key: string) => {
                let edge = edgeList.get(key);
                if (edge) {
                    edge.changeAttribute({
                        particle: {
                            index: 0
                        }
                    })
                }
            })
        })

        function tickFrame() {
            // 更新比例
            if (graph.geo.enabled())
                graph.geo.getGeoTransform()
            else
                camera.updateTransform()

            const transform = basicData[graphId]?.transform || 223

            let { selectedEdges, edgeList } = basicData[graphId]
            // 清空当前画布
            self.ctx.clearRect(0, 0, width, height);

            if (selectedEdges.size) {
                // 拷贝一份数据防止污染
                let position = clone(camera.position);
                let ratio = camera.ratio;
                let scale = (globalProp.globalScale / ratio) * 2.0
                if (renderType === "webgl") {
                    if (!graph.geo.enabled())
                        scale *= height / window.outerHeight;
                    position[0] *= -transform;
                    position[1] *= transform;
                }

                selectedEdges.forEach((key: string) => {
                    // 获取edge
                    let edge = edgeList.get(key);
                    // 获取起始点和终止点坐标
                    let { x: sourceX, y: sourceY } = edge.getSource().getPosition()
                    let { x: targetX, y: targetY } = edge.getTarget().getPosition()
                    // 获取控制点
                    let controls = edge.getMiddlePoint().controlNodes;
                    // 是否为自环边
                    let loop = false;
                    controls.cn1 && controls.cn2 && (loop = true);
                    // 获取两点之间的bezier的线点
                    let bezierPoints: number[][] = [];

                    let { particle, location, selectedColor } = edge.getAttribute();
                    let { size, speed, index } = particle;

                    if (!loop) {
                        bezierPoints = create3DBezier(
                            { x: targetX, y: targetY },
                            controls.cn1,
                            { x: sourceX, y: sourceY },
                            speed,
                            1.0
                        )
                    } else {
                        if (renderType == "canvas") {
                            var { baseTypeHash } = graph.getEdgeType(),
                                source = edge.getSource(), //起始点
                                target = edge.getTarget(), //终止点
                                sourceNumber = source.value.num,
                                targetNumber = target.value.num,
                                hash = hashNumber(sourceNumber, targetNumber), //两点之间的hash值
                                hashSet = baseTypeHash.get(hash), //两点之间hash表
                                lineNumber = [...hashSet.total].indexOf(key) as any;
                            lineNumber = lineNumber + 1;
                            let coord = transformCanvasCoord(graphId, sourceX, sourceY, position, scale, false);
                            sourceX = coord.x;
                            sourceY = coord.y;
                            let sourceSize = source.getAttribute("radius");
                            let radius = scale * ((lineNumber - 1) * 100 + sourceSize * 5),
                                {
                                    controlCoordOne: pot1,
                                    controlCoordTwo: pot2,
                                } = switchSelfLinePostion('canvas', location, sourceX, sourceY, radius)

                            if (loopLineType[location] == '1' || loopLineType[location] == '2') {
                                [pot1[0], pot2[0]] = [pot2[0], pot1[0]];
                                [pot1[1], pot2[1]] = [pot2[1], pot1[1]];
                            }
                            for (var i = 0; i < 1; i += 1 / speed) {
                                var p = bezier3(
                                    i,
                                    { x: sourceX, y: sourceY },
                                    { x: pot1[0], y: pot1[1] },
                                    { x: pot2[0], y: pot2[1] },
                                    { x: sourceX, y: sourceY },
                                )
                                bezierPoints.push([p.x, p.y])
                            }
                            if (bezierPoints.length < speed) {
                                let len = bezierPoints.length
                                for (let i = len; i <= speed; i++) {
                                    bezierPoints.push([bezierPoints[len][0], bezierPoints[len][1]])
                                }
                            }
                        }
                        else
                            bezierPoints = create4DBezier(
                                { x: targetX, y: targetY },
                                controls.cn1,
                                controls.cn2,
                                { x: sourceX, y: sourceY },
                                speed,
                                1.0
                            )
                    };

                    let x, y;
                    let num = Math.floor(index)
                    if (renderType == "canvas" && loop) {
                        x = bezierPoints[num][0];
                        y = bezierPoints[num][1]
                    } else {
                        let transCoords = transformCanvasCoord(graphId, bezierPoints[num][0], bezierPoints[num][1], position, scale);
                        x = transCoords.x;
                        y = transCoords.y;
                    }

                    self.drawParticle(x, y, size * scale, selectedColor);

                    (index = index + 1) && (index %= speed);

                    edge.changeAttributes({
                        particle: {
                            index
                        }
                    })

                    particleSet.add(key)
                })
            } else if (particleSet.size) {
                particleSet.forEach(key => {
                    let edge = edgeList.get(key);
                    if (edge) {
                        edge.changeAttribute({
                            particle: {
                                index: 0
                            }
                        })
                    }
                })
                particleSet = new Set()
            }

            self.particleFrameId = requestFrame(tickFrame)
        }
        self.particleFrameId = requestFrame(tickFrame)
    }

    drawParticle(x: number, y: number, radius: number, selectedColor: string) {

        const graph = this.graph;
        if(graph.geo.enabled())                     
            radius /= graph.geo.getGeoDsr()

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.fillStyle = selectedColor;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    clear() {
        const self = this;
        let width = getContainerWidth(self.canvas),
            height = getContainerHeight(self.canvas);
        self.ctx.clearRect(0, 0, width, height);
        this.stop()
        this.render()
    }

    stop() {
        if (this.particleFrameId) {
            cancelFrame(this.particleFrameId);
            this.particleFrameId = null;
        }
    }

    destory() {
        const self = this;
        const graph = self.graph;
        const graphId = graph.id;

        this.stop();
        const particlePass = document.getElementById("particle_" + this.graph.id) as HTMLCanvasElement;
        particlePass.remove();
        let { selectedEdges, edgeList } = basicData[graphId];
        selectedEdges.forEach((key: string) => {
            // 获取edge
            let edge = edgeList.get(key);
            if (edge) {
                let particle = edge.getAttribute('particle');
                let { index } = particle;
                index = 0
                edge.changeAttribute({
                    particle: {
                        index
                    }
                })
            }
        })
    }
}