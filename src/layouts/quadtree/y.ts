export function defaultY(d: any) {
    return d[1]
}

export default function tree_y(this: any, _: any) {
    return arguments.length ? ((this._y = _), this) : this._y
}
