const a = 1664525
const c = 1013904223
const m = 4294967296 // 2^32

export const lcg = () => {
    let s = 1
    return () => (s = (a * s + c) % m) / m
}

export const jiggle = (random: any) => {
    return (random() - 0.5) * 1e-6
}
