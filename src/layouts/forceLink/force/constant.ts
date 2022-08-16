export default function constant(x: any) {
    return function () {
        return x
    }
}
