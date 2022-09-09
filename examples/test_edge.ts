import galaxyvis from "../src/galaxyVis";
import * as dat from 'dat.gui';

let galaxyVis = new galaxyvis({
    container: 'container',
    renderer: "canvas",
    options: {
        backgroundColor: "#F9FBFF",
    }
})

let gui = new dat.GUI();

let testObj = {
    "颜色": "#888",
    "宽度": 0.5,
    "选中颜色": "#f00"
}

let typeObject = {
    "渲染类型": "webgl"
}

let textObject = {
    "文字内容": "我是边",
    "颜色": "#fff",
    "背景颜色": [255, 0, 0, 1.0],
    "字体大小": 18,
    "文字最长换行": 99,
    "边缘距离x": 0,
    "边缘距离y": 0,
}

let shapeObj = {
    "箭头": true,
    "虚线": false,
}

let selfLoop = {
    "线的方向": "lowerLeft",
}

let typeLineObject = {
    "线类型": "basic",
}

// @ts-ignore
let baseController = gui.addFolder('基础属性控制器'),
    width = baseController.add(testObj, "宽度", 0.1, 1.5, 0.1),
    color = baseController.addColor(testObj, "颜色"),
    selectColor = baseController.addColor(testObj, "选中颜色");
baseController.open();

// @ts-ignore
let labelController = gui.addFolder('文字控制器'),
    textContent = labelController.add(textObject, "文字内容"),
    textFontSize = labelController.add(textObject, "字体大小", 12, 64, 1).step(1),
    maxLength = labelController.add(textObject, "文字最长换行", 1, 99, 1).step(1),
    marginx = labelController.add(textObject, "边缘距离x", -5, 5, 0.1).step(0.1),
    marginy = labelController.add(textObject, "边缘距离y", -5, 5, 0.1).step(0.1),
    textColor = labelController.addColor(textObject, '颜色'),
    textBackgroundColor = labelController.addColor(textObject, '背景颜色');
labelController.open()

// @ts-ignore
let lineStyleController = gui.addFolder('形状属性控制器'),
    isArray = lineStyleController.add(shapeObj, "箭头"),
    isDash = lineStyleController.add(shapeObj, "虚线");
lineStyleController.open()

// @ts-ignore
let selfLineController = gui.addFolder('自环边控制器'),
    selfLocation = selfLineController.add(selfLoop, "线的方向", ['lowerLeft', 'upperLeft', 'lowerRight', 'upperRight'])
selfLocation.onChange(() => {
    galaxyVis.getEdges().forEach((item) => {
        item.setAttributes({
            location: selfLocation.getValue(),
        })
    })

})
selfLineController.open()

// @ts-ignore
let lineTypeController = gui.addFolder('线类型控制器'),
    type = lineTypeController.add(typeLineObject, "线类型", ['basic', 'parallel'])
type.onChange(() => {
    galaxyVis.clear();
    galaxyVis.clearGraph();
    edgeTest()
})
lineTypeController.open()

const edgeTest = () => {

    let edges = [];
    let bgColor = textBackgroundColor.getValue()

    for (let i = 0; i < 3; i++) {
        edges.push({
            id: `e${i}`,
            source: `n${(i + 1) % 2 + 1}`,
            target: `n${(i) % 2 + 1}`,
            attribute: {
                color: color.getValue(),
                width: width.getValue(),
                text: {
                    content: textContent.getValue(),
                    fontSize: textFontSize.getValue(),
                    color: textColor.getValue(),
                    background: `rgba(${Math.ceil(bgColor[0])},${Math.ceil(bgColor[1])},${Math.ceil(bgColor[2])},${(bgColor[3])})`,
                    maxLength: maxLength.getValue(),
                    margin: [Number(marginx.getValue()), Number(marginy.getValue())],
                    // isInLine: isInline.getValue()
                    // position:"top"
                },
                stroke: {
                    selectedColor: selectColor.getValue()
                },
                shape: {
                    head: isArray.getValue() ? "arrow" : "",
                    style: isDash.getValue() ? "dash" : "",
                },
                type: type.getValue(),
                // opacity: 0.5
            }
        })
    }

    edges.push({
        id: `e5`,
        source: "n3",
        target: "n3",
        attribute: {
            color: color.getValue(),
            width: width.getValue(),
            text: {
                content: textContent.getValue(),
                fontSize: textFontSize.getValue(),
                color: textColor.getValue(),
                background: `rgba(${Math.ceil(bgColor[0])},${Math.ceil(bgColor[1])},${Math.ceil(bgColor[2])},${(bgColor[3])})`,
                maxLength: maxLength.getValue(),
                margin: [Number(marginx.getValue()), Number(marginy.getValue())],
                // isInLine: isInline.getValue()
                position:"bottom"
                
            },
            stroke: {
                selectedColor: selectColor.getValue()
            },
            shape: {
                head: isArray.getValue() ? "arrow" : "",
                style: isDash.getValue() ? "dash" : "",
            },
            location: selfLocation.getValue(),
            opacity: 0.5
        }
    })

    let graph = {
        nodes: [{
            id: "n1",
            attribute: {
                x: -300,
                text: "n1",
                color: "#81d",
                icon: "N"
            }
        }, {
            id: "n2",
            attribute: {
                x: 300,
                y: 200,
                text: "n2",
                color: "#f50",
                icon: "\ue773"
            }
        }, {
            id: "n3",
            attribute: {
                x: 450, y: -350,
                text: "n3",
                color: "#890",
                icon: "\ue772"
            }
        }],
        edges: edges
    }

    galaxyVis.addGraph(graph);

    // let tryNodes = new Float32Array(2) 
    // tryNodes.set([12,5])
    // console.log(tryNodes)

    // galaxyVis.view.locateGraph()
};

edgeTest();

for (let i = 0, len = baseController.__controllers.length; i < len; i++) {
    baseController.__controllers[i].onChange(() => {
        galaxyVis.getEdges().forEach((item) => {
            item.setAttributes({
                color: color.getValue(),
                width: width.getValue(),
                stroke: {
                    selectedColor: selectColor.getValue()
                },
            })
        })
    })
}

for (let i = 0, len = labelController.__controllers.length; i < len; i++) {
    labelController.__controllers[i].onChange(() => {
        galaxyVis.getEdges().forEach((item) => {
            let bgColor = textBackgroundColor.getValue()
            item.setAttributes({
                text: {
                    content: textContent.getValue(),
                    fontSize: textFontSize.getValue(),
                    color: textColor.getValue(),
                    background: `rgba(${Math.ceil(bgColor[0])},${Math.ceil(bgColor[1])},${Math.ceil(bgColor[2])},${(bgColor[3])})`,
                    maxLength: maxLength.getValue(),
                    margin: [Number(marginx.getValue()), Number(marginy.getValue())],
                    // isInLine: isInline.getValue()
                },
            })
        })
    })
}

for (let i = 0, len = lineStyleController.__controllers.length; i < len; i++) {
    lineStyleController.__controllers[i].onChange(() => {
        galaxyVis.getEdges().forEach((item) => {
            item.setAttributes({
                shape: {
                    head: isArray.getValue() ? "arrow" : "",
                    style: isDash.getValue() ? "dash" : "",
                },
            })
        })
    })
}

export default edgeTest;