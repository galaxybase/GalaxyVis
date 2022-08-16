export default function (this: any, callback: any, that: any) {
    let index = -1
    for (const node of this) {
        if (callback.call(that, node, ++index, this)) {
            return node
        }
    }
}
