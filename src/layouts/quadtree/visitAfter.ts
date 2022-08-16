import Quad from './quad'

export default function (this: any, callback: any) {
    var quads = [],
        next = [],
        q
    // @ts-ignore
    if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1))
    while ((q = quads.pop())) {
        var node: any = q.node
        if (node.length) {
            var child,
                x0: any = q.x0,
                y0: any = q.y0,
                x1: any = q.x1,
                y1: any = q.y1,
                xm = (x0 + x1) / 2,
                ym = (y0 + y1) / 2
            //@ts-ignore
            if ((child = node[0])) quads.push(new Quad(child, x0, y0, xm, ym))
            //@ts-ignore
            if ((child = node[1])) quads.push(new Quad(child, xm, y0, x1, ym))
            //@ts-ignore
            if ((child = node[2])) quads.push(new Quad(child, x0, ym, xm, y1))
            //@ts-ignore
            if ((child = node[3])) quads.push(new Quad(child, xm, ym, x1, y1))
        }
        next.push(q)
    }
    while ((q = next.pop())) {
        callback(q.node, q.x0, q.y0, q.x1, q.y1)
    }
    return this
}
