import { globalInfo } from "../initial/globalProp"

/**
 * @class enbaled
 * @constructor
 * @param {value<any>} 初始化
 */
export class enabled<T, K> {
    private galaxyvis: any //galaxyvis对象
    private id: string

    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        this.id = this.galaxyvis.id
    }

    /**
     * 开启StraightLine
     * @param param0
     */
    enableNoStraightLine() {
        const id = this.id = this.galaxyvis.id
        if(!globalInfo[id].enabledNoStraightLine){
            globalInfo[id].enabledNoStraightLine = true;
            this.galaxyvis.render();
        }
    }
    /**
     * 关闭StraightLine
     */
    disableNoStraightLine() {
        const id = this.id = this.galaxyvis.id
        if(globalInfo[id].enabledNoStraightLine){
            globalInfo[id].enabledNoStraightLine = false;
            this.galaxyvis.render();
        }
    }

}
