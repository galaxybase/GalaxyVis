// 线性动画
export const linear = (k: number): number => k
// 平方级缓入
export const quadraticIn = (k: number): number => k * k
// 平方级缓出
export const quadraticOut = (k: number): number => k * (2 - k)
// 平方级缓入缓出
export const quadraticInOut = (k: number): number => {
    if ((k *= 2) < 1) return 0.5 * k * k
    return -0.5 * (--k * (k - 2) - 1)
}
// 立方级缓入
export const cubicIn = (k: number): number => k * k * k
// 立方级缓出
export const cubicOut = (k: number): number => --k * k * k + 1
// 立方级缓入缓出
export const cubicInOut = (k: number): number => {
    if ((k *= 2) < 1) return 0.5 * k * k * k
    return 0.5 * ((k -= 2) * k * k + 2)
}

const easings: { [key: string]: (k: number) => number } = {
    linear,
    quadraticIn,
    quadraticOut,
    quadraticInOut,
    cubicIn,
    cubicOut,
    cubicInOut,
}
export default easings
