import Quad from './quad'

export default function (this: any, callback: any) {
    var quads = [],
        q,
        node = this._root,
        child,
        x0,
        y0,
        x1,
        y1
    // @ts-ignore
    if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1))
    while ((q = quads.pop())) {
        if (
            !callback((node = q.node), (x0 = q.x0), (y0 = q.y0), (x1 = q.x1), (y1 = q.y1)) &&
            node.length
        ) {
            var xm: any = (x0 + x1) / 2,
                ym: any = (y0 + y1) / 2
            // @ts-ignore
            if ((child = node[3])) quads.push(new Quad(child, xm, ym, x1, y1))
            // @ts-ignore
            if ((child = node[2])) quads.push(new Quad(child, x0, ym, xm, y1))
            // @ts-ignore
            if ((child = node[1])) quads.push(new Quad(child, xm, y0, x1, ym))
            // @ts-ignore
            if ((child = node[0])) quads.push(new Quad(child, x0, y0, xm, ym))
        }
    }
    return this
}
