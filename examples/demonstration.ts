
import galaxyvis from "../src/galaxyVis";
import * as dat from 'dat.gui';

let galaxyVis = new galaxyvis({
    container: 'container',
})

let testObj = {
    "布局方式": '力导向',
    "是否视图居中": true,
};

let typeObject = {
    "渲染类型": "webgl"
}

let layoutObject = {
    "迭代次数": 150,
    "斥力": 900,
    "碰撞力": 40,
    "边的理想长度": 300,
    "x轴方向力": 0.04,
    "y轴方向力": 0.03,
}

let gui = new dat.GUI();
let oldLayout = "力导向"

// @ts-ignore
let layoutController = gui.addFolder('布局控制器'),
    layouts = layoutController.add(testObj, "布局方式", ['力导向', '树形', '圆形', '网格', '圆形深度', '层次', '辐射']),
    isCenter = layoutController.add(testObj, "是否视图居中");
layoutController.open();

let control = gui.addFolder(`${layouts.getValue()}布局属性控制器`),
    tickNum = control.add(layoutObject, "迭代次数", 100, 300, 10).step(10),
    strength = control.add(layoutObject, "斥力", 200, 2500, 100).step(100),
    repulsion = control.add(layoutObject, "碰撞力", 10, 150, 10).step(10),
    distance = control.add(layoutObject, "边的理想长度", 100, 1000, 100).step(100),
    forceY = control.add(layoutObject, "x轴方向力", 0, 0.1, 0.01).step(0.01),
    forceX = control.add(layoutObject, "y轴方向力", 0, 0.1, 0.01).step(0.01);
control.open();

let treeObject = {
    "树形布局宽度": 1200,
    "树形布局高度": 600
}, treeWidth, treeHeight;

let circleObject = {
    "缩放": 1.8,
    // "中心": 1.0
}, scale, center;

let gridObject = {
    "行": 3,
    "列": 5
}, rows, cols;

let concentricObject = {
    "中心点": "0",
    "每层的大小": 5
}, circleHopRatio, centralNode;

let dagreObject = {
    "点横向间距": 50,
    "点高度间距": 50,
    "布局方向": 'TB'
}, nodesep, ranksep, rankdir

let nodes = new Array();
let edges = new Array();
const demonstration = () => {
    nodes = new Array();
    edges = new Array();
    let colors = [
        '#965E04',
        '#C89435',
        '#F7A456',
        '#AFCF8A',
        '#7B39DE',
        '#B095C0',
    ];
    const addSmallComponents = (n, m) => {
        for (let i = 0; i < n; i++) {
            const baseId = nodes.length;
            for (let j = 0; j < m + 1; j++) {
                nodes.push({
                    id: baseId + j + '',
                    attribute: {
                        color: colors[Math.floor(colors.length * Math.random())],
                        text: `点${baseId + j}`,
                        icon: "N",
                    }
                });
            }
            for (let k = 1; k < m + 1; k++) {
                edges.push({
                    source: baseId + '', target: baseId + k + '',
                    attribute: {
                        shape: {
                            head: "arrow"
                        }
                    }
                });
            }
            if (i <= n - 2) {
                edges.push({
                    source: i * (m + 1) + '',
                    target: (i + 1) * (m + 1) + '',
                    attribute: {
                        shape: {
                            head: "arrow"
                        }
                    }
                });
            }

        }
    }

    addSmallComponents(2, 4);
    galaxyVis.addNodes(nodes)
    galaxyVis.addEdges(edges)

    let graphLayouts = layouts.getValue();
    let graphCenter = isCenter.getValue();

    let type = { '树形': "tree", '力导向': "force", '圆形': "circular", "网格": "grid", "圆形深度": "concentric", '层次': "dagre", '辐射': "radial" }

    galaxyVis.layouts[type[graphLayouts]]({
        duration: 1000,
        strength: strength?.getValue(),
        repulsion: repulsion?.getValue(),
        tickNum: tickNum?.getValue(),
        distance: distance?.getValue(),
        forceY: forceY?.getValue(),
        forceX: forceX?.getValue(),
        treeWidth: treeWidth?.getValue(),
        treeHeight: treeHeight?.getValue(),
        scale: scale?.getValue(),
        center: center?.getValue(),
        cols: cols?.getValue(),
        rows: rows?.getValue(),
        circleHopRatio: circleHopRatio?.getValue(),
        centralNode: centralNode?.getValue(),
        nodesep: nodesep?.getValue(),
        ranksep: ranksep?.getValue(),
        rankdir: rankdir?.getValue(),
        // useWebWorker: false,
        // startRadius: 0,
        // endRadius: 1000
        // divisions: 3
    }).then(() => {
        graphCenter ? galaxyVis.view.locateGraph({}) : () => { }
    })
};

demonstration();
let nodeList = [];
for (let i = 0, len = layoutController.__controllers.length; i < len; i++) {
    layoutController.__controllers[i].onChange(() => {
        if (oldLayout != layouts.getValue()) {
            gui.removeFolder(control)
            control = gui.addFolder(`${layouts.getValue()}布局属性控制器`)

            switch (layouts.getValue()) {
                case "力导向": {
                    tickNum = control.add(layoutObject, "迭代次数", 100, 300, 10).step(10),
                        strength = control.add(layoutObject, "斥力", 200, 2500, 100).step(100),
                        repulsion = control.add(layoutObject, "碰撞力", 10, 150, 10).step(10),
                        distance = control.add(layoutObject, "边的理想长度", 100, 1000, 100).step(100),
                        forceY = control.add(layoutObject, "x轴方向力", 0, 0.1, 0.01).step(0.01),
                        forceX = control.add(layoutObject, "y轴方向力", 0, 0.1, 0.01).step(0.01);
                    control.open();
                    break;
                }
                case "树形": {
                    treeWidth = control.add(treeObject, "树形布局宽度", 100, 2400, 100).step(100),
                        treeHeight = control.add(treeObject, "树形布局高度", 100, 2400, 100).step(100);
                    control.open();
                    break;
                }
                case "圆形": {
                    scale = control.add(circleObject, "缩放", 0, 5, 0.1).step(0.1);
                    // center = control.add(circleObject, "中心", -3, 3, 0.1).step(0.1);
                    control.open();
                    break;
                }
                case "网格": {
                    rows = control.add(gridObject, "行", 1, 10, 1).step(1);
                    cols = control.add(gridObject, "列", 1, 10, 1).step(1);
                    control.open();
                    break;
                }
                case "圆形深度": {
                    nodes.forEach(item => {
                        nodeList.push(item.id);
                    });
                    circleHopRatio = control.add(concentricObject, "每层的大小", 5, 30, 5).step(5);
                    centralNode = control.add(concentricObject, "中心点", nodeList);
                    control.open();
                    break;
                }
                case "层次": {
                    nodesep = control.add(dagreObject, "点横向间距", 5, 100, 50).step(5);
                    ranksep = control.add(dagreObject, "点高度间距", 5, 100, 50).step(5);
                    rankdir = control.add(dagreObject, "布局方向", ["TB", "BT", "LR", "RL"]);
                    control.open();
                }

                default:
                    break;
            }

            for (let i = 0, len = control.__controllers.length; i < len; i++) {
                control.__controllers[i].onChange(() => {
                    galaxyVis.clear();
                    galaxyVis.clearGraph();
                    demonstration()
                })
            }
            oldLayout = layouts.getValue()

            galaxyVis.clear();
            galaxyVis.clearGraph();
            demonstration()
            nodeList = [];
        }
    })
}

for (let i = 0, len = control.__controllers.length; i < len; i++) {
    control.__controllers[i].onChange(() => {
        galaxyVis.clear();
        galaxyVis.clearGraph();
        demonstration()
    })
}

export default demonstration;