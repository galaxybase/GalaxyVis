
export let tNodeList: { [key: string]: tNode } = {}

export const cleartNodeList = () => {
    tNodeList = {}
}



var initialRadius = 50,
    initialAngle = Math.PI * (3 - Math.sqrt(5));

export class tNode {
    [key: string]: any
    id: string
    x: number = 0
    y: number = 0
    inLinks: { [key: string]: any }[] = []
    outLinks: { [key: string]: any }[] = []
    scaleX: number = 1
    radius: number = 25
    visible: boolean = true

    constructor(id: string, attributes: { [key: string]: any }) {
        this.id = id;
        let { radius, isVisible } = attributes
        this.radius = radius;
        this.visible = isVisible;
    }

    updateLinks(inLinks: { [key: string]: any }[], outLinks: { [key: string]: any }[]) {
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
