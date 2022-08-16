export function defaultX(d: any) {
    return d[0]
}

export default function (this: any, _: any) {
    return arguments.length ? ((this._x = _), this) : this._x
}
