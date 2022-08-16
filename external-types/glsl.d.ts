declare module '*.glsl' {
    const value: string;
    export default value;
}

interface Window {
    XLSX: any;
    L: any;
    domtoimage: any
}

declare const windos: Window & typeof globalThis;

declare const L: any
declare const domtoimage: any

