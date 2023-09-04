import { PlainObject } from '../../../types'

const NODE_SIZE = 30
/**
 * 神经网络布局
 * @param assign 
 * @param rDegree 
 * @param tagList 
 * @param maxTagLen 
 * @returns 
 */
function genericNeuralLayout(assign: any,rDegree: string[], tagList: { [key: string]: any }, maxTagLen: number) {
    const NODE_SIZE = 30
    const n = maxTagLen * NODE_SIZE * 5 / 2;
    let i = 0;
    let neural: PlainObject<any> = {}
    for (const e of rDegree) {
        const {
            arr
        } = tagList[e], r = n - arr.length * NODE_SIZE * 5 / 2;
        arr.forEach(((e: any, t: number) => {
            neural[e.id] = {
                x: 5 * t * NODE_SIZE + r,
                y: neural[e.id]= 10 * i * NODE_SIZE
            };
        })); 
        i++;
    }
    return neural
}

var neuralLayout = genericNeuralLayout.bind(null, false)

export default neuralLayout
