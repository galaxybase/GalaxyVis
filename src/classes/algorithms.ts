import { algorithmsShortestPath } from '../utils/algorithms'
/**
 * @class Algorithms
 * @constructor
 * @param {galaxyvis<any>} 初始化
 */
export default class Algorithms<T, K> {
    private galaxyvis: any
    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
    }
    /**
     *函数试图在两个路径之间的图形中查找最短路径
     *给定源和目标，如果不存在这样的路径，则为“null”。
     *
     * @param  {Graph}  Graph-目标图。
     * @param  {nodeId}  源-源节点。
     * @param  {nodeId}  目标-目标节点。
     * @return  {object | null}  -找到路径或'null'。
     */
    public shortestPath = ({ source, target }: { source: string; target: string }) => {
        return algorithmsShortestPath(this.galaxyvis, { source, target })
    }
}
