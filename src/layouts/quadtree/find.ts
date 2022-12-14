import Quad from './quad'

export default function (this: any, x: any, y: any, radius: any) {
    var data,
        x0 = this._x0,
        y0 = this._y0,
        x1,
        y1,
        x2,
        y2,
        x3 = this._x1,
        y3 = this._y1,
        quads = [],
        node = this._root,
        q,
        i
    // @ts-ignore
    if (node) quads.push(new Quad(node, x0, y0, x3, y3))
    if (radius == null) radius = Infinity
    else {
        ;(x0 = x - radius), (y0 = y - radius)
        ;(x3 = x + radius), (y3 = y + radius)
        radius *= radius
    }

    while ((q = quads.pop())) {
        // Stop searching if this quadrant can’t contain a closer node.
        if (
            !(node = q.node) ||
            (x1 = q.x0) > x3 ||
            (y1 = q.y0) > y3 ||
            (x2 = q.x1) < x0 ||
            (y2 = q.y1) < y0
        )
            continue

        // Bisect the current quadrant.
        if (node.length) {
            var xm: any = (x1 + x2) / 2,
                ym: any = (y1 + y2) / 2

            quads.push(
                // @ts-ignore
                new Quad(node[3], xm, ym, x2, y2),
                // @ts-ignore
                new Quad(node[2], x1, ym, xm, y2),
                // @ts-ignore
                new Quad(node[1], xm, y1, x2, ym),
                // @ts-ignore
                new Quad(node[0], x1, y1, xm, ym),
            )

            // Visit the closest quadrant first.
            // @ts-ignore
            if ((i = ((y >= ym) << 1) | (x >= xm))) {
                q = quads[quads.length - 1]
                quads[quads.length - 1] = quads[quads.length - 1 - i]
                quads[quads.length - 1 - i] = q
            }
        }

        // Visit this point. (Visiting coincident points isn’t necessary!)
        else {
            var dx = x - +this._x.call(null, node.data),
                dy = y - +this._y.call(null, node.data),
                d2 = dx * dx + dy * dy
            if (d2 < radius) {
                var d = Math.sqrt((radius = d2))
                ;(x0 = x - d), (y0 = y - d)
                ;(x3 = x + d), (y3 = y + d)
                data = node.data
            }
        }
    }

    return data
}
