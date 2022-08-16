export default function (this: any) {
    var data: any[] = []
    this.visit(function (node: any) {
        if (!node.length)
            do data.push(node.data)
            while ((node = node.next))
    })
    return data
}
