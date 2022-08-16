import galaxyvis from "../src/galaxyVis";
import * as dat from 'dat.gui';

const galaxyVis = new galaxyvis({
    container: 'container',
    // renderer:"canvas",
    options: {
        backgroundColor: "#e6eeee"
    }
})

var testObj = {
    "点个数": "2500",
    "边个数": "500",
    "显示点文字": false,
    "显示边文字": false,
};

var gui = new dat.GUI();
// @ts-ignore
var f = gui.addFolder('控制器');
let nodeNum = f.add(testObj, "点个数");
let edgeNum = f.add(testObj, "边个数");

let nodeLable = f.add(testObj, "显示点文字");
let edgeLable = f.add(testObj, "显示边文字");
f.open();

nodeNum.onFinishChange(() => {
    galaxyVis.clear();
    galaxyVis.clearGraph();
    performance()
})

edgeNum.onFinishChange(() => {
    galaxyVis.clear();
    galaxyVis.clearGraph();
    performance()
})

nodeLable.onChange(() => {
    galaxyVis.clear();
    galaxyVis.clearGraph();
    performance()
})

edgeLable.onChange(() => {
    galaxyVis.clear();
    galaxyVis.clearGraph();
    performance()
})

const performance = () => {
    let colors = [
        '#965E04',
        '#C89435',
        '#F7A456',
        '#AFCF8A',
        '#7B39DE',
        '#B095C0',
        '#D24556',
        '#93C2FA',
        '#9DB09E',
        '#F8C821'
    ];

    let widths = [
        0.02,
        0.04,
        0.06
    ]

    let typeShape = ['circle']


    const drawNum = nodeNum.getValue()

    if (Number(drawNum) > 0) {
        let arr = new Array();
        let num = Math.floor(Math.sqrt(drawNum) + 0.5)
        for (let i = 0; i < drawNum; i++) {
            arr[i] = {
                id: `n${i}`,
                attribute: {
                    x: i % num * 100, y: Math.floor(i / num) * 100,
                    color: colors[Math.floor(Math.random() * colors.length) || 0],
                    shape: typeShape[Math.floor(Math.random() * typeShape.length) || 0],
                    text: {
                        content: nodeLable.getValue() ? `${i}` : "",
                        fontSize: Math.floor(Math.random() * 20) + 15 || 14
                    },
                    innerStroke: {
                        color: colors[Math.floor(Math.random() * colors.length) || 0],
                    }
                }
            }
        }

        let line = new Array();

        const drawEdgeNum = edgeNum.getValue()
        for (let i = 0; i < drawEdgeNum; i++) {
            line[i] = {
                id: `e${i}`,
                source: 'n' + Math.floor(Math.random() * (drawNum)),
                target: 'n' + Math.floor(Math.random() * (drawNum)),
                attribute: {
                    color: colors[Math.floor(Math.random() * colors.length) || 0],
                    text: {
                        content: edgeLable.getValue() ? `边${i}` : "",
                    },
                    shape: {
                        head: "arrow"
                    }
                }
            }
        }
        galaxyVis.addGraph({
            nodes: arr,
            edges: line
        }).then(() => {
            galaxyVis.view.locateGraph({ padding: 30 })
        })
    }

};
performance();
export default performance;