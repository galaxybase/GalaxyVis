import { PlainObject } from "../../../types"

const nodeSize = 100

function genericGridLayout(assign: any, nodes: any, options: any) {
    var positions: PlainObject<any> = {}

    let cells = nodes.length
    let box = options.box
    let bb = {
        h: Math.max(box.height || 800, Math.floor(Math.sqrt(cells) * nodeSize)),
        w: Math.max(box.width || 800, Math.floor(Math.sqrt(cells) * nodeSize)),
    }

    let splits = Math.sqrt((cells * bb.h) / bb.w)
    let rows = Math.round(splits)
    let cols = Math.round((bb.w / bb.h) * splits)

    let small = function (val?: any) {
        if (val == null) {
            return Math.min(rows, cols)
        } else {
            let min = Math.min(rows, cols)
            if (min == rows) {
                rows = val
            } else {
                cols = val
            }
        }
    }

    let large = function (val?: any) {
        if (val == null) {
            return Math.max(rows, cols)
        } else {
            let max = Math.max(rows, cols)
            if (max == rows) {
                rows = val
            } else {
                cols = val
            }
        }
    }

    let oRows = options.rows
    let oCols = options.cols != null ? options.cols : options.columns

    if (oRows != null && oCols != null) {
        rows = oRows
        cols = oCols
    } else if (oRows != null && oCols == null) {
        rows = oRows
        cols = Math.ceil(cells / rows)
    } else if (oRows == null && oCols != null) {
        cols = oCols
        rows = Math.ceil(cells / cols)
    } else if (cols * rows > cells) {
        let sm: any = small()
        let lg: any = large()

        if ((sm - 1) * lg >= cells) {
            small(sm - 1)
        } else if ((lg - 1) * sm >= cells) {
            large(lg - 1)
        }
    } else {
        while (cols * rows < cells) {
            let sm: any = small()
            let lg: any = large()
            if ((lg + 1) * sm >= cells) {
                large(lg + 1)
            } else {
                small(sm + 1)
            }
        }
    }

    let cellWidth = bb.w / cols

    let cellHeight = bb.h / rows

    let row = 0
    let col = 0
    let moveToNextCell = function () {
        col++
        if (col >= cols) {
            col = 0
            row++
        }
    }

    for (let i = 0; i < nodes.length; i++) {
        let node: string = nodes[i]

        let x = col * cellWidth + cellWidth / 2
        let y = row * cellHeight + cellHeight / 2

        positions[node] = {
            x: x,
            y: y,
        }
        moveToNextCell()
    }

    return positions
}

var gridLayout = genericGridLayout.bind(null, false)

export default gridLayout
