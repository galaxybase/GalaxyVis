import { AnimateType, LAYOUT_MESSAGE } from "../../types";
import BaseLayout from "../baseLayout";
import dagrelLayout from "./dagreTree/dagre";
import { animation } from "../animation";
import forIn from 'lodash/forIn'
import isArray from 'lodash/isArray'
import { getContainerWidth } from "../../utils";
import { EventType } from "../../utils/events";

const HOUR = 3.6 * 1e6

class ChronologicallLayout extends BaseLayout {
    private layoutNodesMap: Map<string, any>;

    constructor(galaxyvis: any, options: AnimateType) {
        super(galaxyvis, options)
        this.layoutNodesMap = new Map()
    }

    /**
     * 初始化
     */
    async init() {
        let { chronologic } = this.options;
        let edgeType = chronologic?.edgeType as Function;
        let edgeProperty = chronologic?.edgeProperty
        let edgeList = this.galaxyvis.getFilterEdges()
        let layoutEdges: any[] = []
        let layoutMapNodes: Map<string, any> = new Map()
        let layoutNodes: any[] = [], nodes: any[], sortNodes: string[] = [];
        let width = getContainerWidth(this.galaxyvis.divContainer) * 0.25;

        // 获取点边列表
        edgeList.forEach((item: any, key: string) => {
            if (edgeType(item) && item.getAttribute('isVisible')) {
                let sourceId = item.getSource().getId(),
                    targetId = item.getTarget().getId();
                layoutEdges.push({
                    source: { id: sourceId },
                    target: { id: targetId }
                });
                // 如果起始点不存在则存入, 存在不更新
                if (!layoutMapNodes.has(sourceId))
                    layoutMapNodes.set(sourceId, {
                        time: 0,
                        level: 0
                    });
                // 如果起始点不存在则存入, 存在的话则更新成值比较小的那个
                if (!layoutMapNodes.has(targetId))
                    layoutMapNodes.set(targetId, {
                        time: new Date(
                            item.getData(edgeProperty)
                        ).getTime(),
                        level: 0
                    });
                else {
                    let oldDate = layoutMapNodes.get(targetId).time;
                    let newDate = new Date(
                        item.getData(edgeProperty)
                    ).getTime();
                    if (newDate < oldDate || oldDate == 0)
                        layoutMapNodes.set(targetId, {
                            time: newDate,
                            level: 0
                        });
                }
            }
        })
        this.layoutNodesMap = layoutMapNodes

        layoutMapNodes.forEach((item, key) => {
            layoutNodes.push({ id: key, time: item.time });
            sortNodes.push(key)
        })

        nodes = [...layoutNodes];

        if (!nodes.length) {
            let nodeList = this.galaxyvis.getFilterNode()
            layoutNodes.push({
                id: "unVisible_chronlogical_Node", x: 0, y: 0
            })
            nodeList.forEach((item: any, key: string) => {
                layoutNodes.push({
                    id: key, x: 0, y: 0
                })
                layoutEdges.push({
                    source: key,
                    target: layoutNodes[0].id
                })
            })
            this.data = await dagrelLayout(layoutNodes, layoutEdges, {
                rankdir: "LR",
            })
            this.data.shift()
            return { nodes, callbackNodes: sortNodes }
        }

        let hierarchicalShip: any[][] = [[]];
        let level = 0;

        let neighbors = this.sortNeighbor(
            sortNodes,
            layoutMapNodes
        )

        hierarchicalShip[0][0] = (neighbors[0])
        for (let i = 1, len = neighbors.length; i < len; i++) {

            let a = layoutMapNodes.get(neighbors[i]).time;
            let b = layoutMapNodes.get(neighbors[i - 1]).time;
            if (a != b)
                level++;
            !hierarchicalShip[level] && (hierarchicalShip[level] = []);
            hierarchicalShip[level].push(neighbors[i]);
            layoutMapNodes.set(neighbors[i], {
                time: a,
                level
            })
        }

        let timeDistance = [0], totalDistance = 0;
        let newLayoutEdges = []
        for (let i = 1, len = hierarchicalShip.length; i < len; i++) {

            if (layoutMapNodes.get(hierarchicalShip[i - 1][0]).time)
                timeDistance.push(
                    (layoutMapNodes.get(hierarchicalShip[i][0]).time -
                        layoutMapNodes.get(hierarchicalShip[i - 1][0]).time) / HOUR
                )
            else
                timeDistance.push(0)
            totalDistance += timeDistance[i]
            for (let j = 0; j < hierarchicalShip[i].length; j++) {
                let randomLen = j % (hierarchicalShip[i - 1].length)
                newLayoutEdges.push({
                    source: { id: hierarchicalShip[i - 1][randomLen] },
                    target: { id: hierarchicalShip[i][j] }
                })
            }
        }

        for (let i = 0, len = layoutNodes.length; i < len; i++) {
            let item = layoutNodes[i];
            let mapItem = layoutMapNodes.get(item.id);
            let distance = Math.min(timeDistance[mapItem.level], timeDistance[mapItem.level + 1]);
            distance && (item.comboWidth = Math.log(distance + 1) / Math.log(totalDistance + 1) * width) && (item.comboHeight = 1);
            if (mapItem.level == 1) {
                let avgDistance = 0
                let dislen = timeDistance.length;
                for (let j = 0; j < dislen && hierarchicalShip.length > 2; j++) {
                    avgDistance += (Math.log(timeDistance[j] + 1) / Math.log(totalDistance + 1) * width)
                }

                item.comboWidth = hierarchicalShip.length <= 2 ?
                    width / 2 :
                    avgDistance / (dislen - 2)
                
                item.comboHeight = 1;
            }
        }

        // 执行布局
        this.data = await dagrelLayout(layoutNodes, newLayoutEdges, {
            rankdir: "LR",
            nodeSize: 2,
            ranker: "tight-tree"
        })


        let { arr, data } = await this.execute(layoutMapNodes)
        this.data = await this.data.concat(data)

        this.galaxyvis.events.emit(
            LAYOUT_MESSAGE.START,
            EventType.layoutStart({
                ids: nodes.concat(arr),
                name: 'chronological',
                type: LAYOUT_MESSAGE.START,
            }),
        )

        return {
            nodes: nodes.concat(arr),
            callbackNodes: sortNodes
        };

    }

    sortNeighbor(arr: string[], layoutMapNodes: Map<string, any>): any {
        if (arr.length <= 1) return arr
        var arr1 = [], arr2 = []
        for (var i = 1; i < arr.length; i++) {
            if (
                layoutMapNodes.get(arr[i]).time <
                layoutMapNodes.get(arr[0]).time
            ) {
                arr1.push(arr[i])
            } else {
                arr2.push(arr[i])
            }
        }
        arr1 = this.sortNeighbor(arr1, layoutMapNodes)
        arr2 = this.sortNeighbor(arr2, layoutMapNodes)
        arr1.push(arr[0])
        return arr1.concat(arr2)
    }

    getBoundingBox(data: any) {
        let maxX = -Infinity,
            minX = Infinity,
            maxY = -Infinity,
            minY = Infinity;
        for (let i = 0, len = data.length; i < len; i++) {
            let { x, y } = data[i]
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
        }
        return {
            maxX,
            minX,
            maxY,
            minY,
            width: maxX - minX,
            height: maxY - minY,
            cx: minX + (maxX - minX) / 2,
            cy: minY + (maxY - minY) / 2,
        }
    }

    /**
     * 执行
     */
    async execute(layoutMapNodes: Map<string, any>) {
        let nodeList = this.galaxyvis.getFilterNode();
        let arr: any = [], forceArray: any[] = []
        nodeList.forEach((item: any, key: string) => {
            if (!layoutMapNodes.has(key)) {
                arr.push({ id: key });
                forceArray.push(key)
            }
        })

        let boundingBox = this.getBoundingBox(this.data)

        if (forceArray.length) {
            let datas
            await this.galaxyvis.layouts.force({
                nodes: forceArray,
                useWebWorker: false,
                useAnimation: false,
                withoutCenter: true
            }).then(async (data: any) => {
                if (!isArray(data)) {
                    let forceData: any = []
                    forIn(data, (value, key) => {
                        forceData.push({
                            id: key,
                            ...value
                        })
                    })
                    data = forceData
                }
                let dataBox = this.getBoundingBox(data)
                for (let i = 0, len = data.length; i < len; i++) {
                    data[i].x += (dataBox.width / 2);
                    data[i].y += boundingBox.maxY + dataBox.height / 2 + 100
                }
                datas = data
            })
            return {
                arr, data: datas
            }
        }
        return { arr, data: [] };
    }
    /**
     * 布局
     */
    layout() {

        if (!this.options.chronologic) {
            console.warn("Missing parameters for timing designation")
            return this.galaxyvis.layouts.dagre({
                rankdir: "LR"
            });
        } else {
            let { chronologic } = this.options;
            let edgeType = chronologic?.edgeType;
            let edgeProperty = chronologic?.edgeProperty
            if (!edgeType || !edgeProperty) {
                console.warn("Missing parameters for timing designation")
                return this.galaxyvis.layouts.dagre({
                    rankdir: "LR"
                });
            }
        }

        return new Promise(async (resolve, reject) => {

            if (this.galaxyvis.geo.enabled()) {
                console.warn("Geo mode does not allow the use of layouts")
                return resolve(void 0)
            }

            try {
                let { nodes: layoutsNode, callbackNodes } = await this.init()
                animation(this, null, layoutsNode, 'chronological').then((data) => {
                    resolve(callbackNodes)
                })
            } catch (err) {
                console.warn(err)
                reject(LAYOUT_MESSAGE.ERROR)
            }
        })
    }
}

export default ChronologicallLayout