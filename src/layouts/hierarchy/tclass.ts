
export let tNodeList: { [key: string]: tNode } = {}

export const cleartNodeList = () => {
    tNodeList = {}
}

export type PlainObject<T = any> = { [k: string]: T }

var initialRadius = 50,
    initialAngle = Math.PI * (3 - Math.sqrt(5));

export class tNode {
    [key: string]: any
    id: string
    x: number = 0
    y: number = 0
    inLinks: PlainObject<any>[] = []
    outLinks: PlainObject<any>[] = []
    scaleX: number = 1
    radius: number = 25
    visible: boolean = true

    constructor(id: string, attributes: PlainObject<any>) {
        this.id = id;
        let { radius, isVisible } = attributes
        this.radius = radius;
        this.visible = isVisible;
    }

    updateLinks(inLinks: PlainObject<any>[], outLinks: PlainObject<any>[]) {
        this.inLinks = inLinks;
        this.outLinks = outLinks;
    }

    updatePos(i?: number) {
        if (i) {
            var radius = initialRadius * Math.sqrt(0.5 + i),
                angle = i * initialAngle;
            this.x = radius * Math.cos(angle) * 2
            this.y = radius * Math.sin(angle) * 2
        } else {
            this.x = Math.random() * 2 - 1;
            this.y = Math.random() * 2 - 1;
        }
    }
}
