export default function (this: any) {
    var size = 0
    this.visit(function (node: any) {
        if (!node.length)
            do ++size
            while ((node = node.next))
    })
    return size
}
