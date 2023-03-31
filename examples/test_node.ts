import galaxyvis from "../src/galaxyVis";
import * as dat from 'dat.gui';

let iconStore = {
    "icon1": "\ue789",
    "icon2": "\ue791",
    "icon3": "\ue795"
}

let imageStore = {
    "image1": "/public/img/sky.jpg",
    "image2": "/public/img/car.jpg",
    "image3": "/public/img/jinji.jpg"
}
let baseObject = {
    "x": 0,
    "y": 0,
    "大小": 25,
    "形状": "circle",
    "颜色": "#ffae23",
    "是否开启渐变": false,
};

let innerObject = {
    "宽": 2,
    "颜色": "#fff",
    "选中颜色": "#f00"
}

let gradientObject = {
    "开启渐变色": false,
    "渐变方向": "left",
}

let textObject = {
    "文字内容": "我是点",
    "颜色": "#000",
    "背景颜色": [255, 0, 0, .5],
    "字体大小": 24,
    "文字位置": "bottom",
    "文字最长换行": 99,
    "边缘距离x": 0,
    "边缘距离y": 0,
    "字体样式": "normal"
}

let iconObject = {
    "开启icon": false,
    "icon": "icon1",
}

let imageObject = {
    "开启image": false,
    "image": "image1",
}

let typeObject = {
    "渲染类型": "webgl"
}

let haloObject = {
    "颜色": "#f2ecec",
    "宽": 0
}

let badgesObject = {
    "开启徽章": false,
    "颜色": '#f00',
    "徽章颜色": '#fff',
    "徽章内容": "icon1",
}

let galaxyVis = new galaxyvis({
    container: 'container',
    renderer: "canvas"
})

let galaxyVis2 = new galaxyvis({
    container: 'container2',
})

let gui = new dat.GUI();
//@ts-ignore
// let typeController = gui.addFolder('渲染类型控制器'),
//     renderType = typeController.add(typeObject, "渲染类型", ["webgl", "canvas"])

// renderType.onChange(() => {
//     galaxyVis.destroy();
//     galaxyVis = new galaxyVis({
//         container: 'container',
//         renderer: renderType.getValue()
//     })
//     nodeTest()
// })

// @ts-ignore
let baseController = gui.addFolder('基础属性控制器'),
    x = baseController.add(baseObject, "x", -800, 800, 10).step(10),
    y = baseController.add(baseObject, "y", -800, 800, 10).step(10),
    radius = baseController.add(baseObject, "大小", 5, 50, 5).step(5),
    shape = baseController.add(baseObject, "形状", ["circle", "square", "triangle", "rhombus"]),
    color = baseController.addColor(baseObject, '颜色');
baseController.open();

// @ts-ignore
let innerController = gui.addFolder('外环控制器'),
    innerWidth = innerController.add(innerObject, "宽", 1, 5, 0.5),
    innnerColor = innerController.addColor(innerObject, "颜色",),
    innerSelectColor = innerController.addColor(innerObject, "选中颜色")
innerController.open()

// @ts-ignore
let gradientController = gui.addFolder('渐变控制器'),
    useGradient = gradientController.add(gradientObject, "开启渐变色"),
    position = gradientController.add(gradientObject, "渐变方向", ["left", "right", "top", "bottom"])
gradientController.open()

// @ts-ignore
let labelController = gui.addFolder('文字控制器'),
    textContent = labelController.add(textObject, "文字内容"),
    textFontSize = labelController.add(textObject, "字体大小", 12, 64, 1).step(1),
    maxLength = labelController.add(textObject, "文字最长换行", 1, 99, 1).step(1),
    marginx = labelController.add(textObject, "边缘距离x", -5, 5, 0.1).step(0.1),
    marginy = labelController.add(textObject, "边缘距离y", -5, 5, 0.1).step(0.1),
    textPostion = labelController.add(textObject, "文字位置", ["left", "right", "top", "bottom", "center"]),
    textColor = labelController.addColor(textObject, '颜色'),
    textBackgroundColor = labelController.addColor(textObject, '背景颜色'),
    fontStyle = labelController.add(textObject, "字体样式", ["normal", "bold", "italic"])
labelController.open()

// @ts-ignore
let iconController = gui.addFolder('icon控制器'),
    useIcon = iconController.add(iconObject, "开启icon"),
    icon = iconController.add(iconObject, "icon", ["icon1", "icon2", "icon3"]);
iconController.open()
//@ts-ignore
let imageController = gui.addFolder('image控制器'),
    useImage = imageController.add(imageObject, "开启image"),
    image = imageController.add(imageObject, "image", ["image1", "image2", "image3"]);
imageController.open()
//@ts-ignore
let haloController = gui.addFolder('halo控制器'),
    haloColor = haloController.addColor(haloObject, "颜色"),
    haloWidth = haloController.add(haloObject, "宽", 0, 5, 0.5);
haloController.open()
//@ts-ignore
let badgesController = gui.addFolder('badge控制器'),
    usebadge = badgesController.add(badgesObject, "开启徽章"),
    badgeColor = badgesController.addColor(badgesObject, "颜色"),
    badgeTextColor = badgesController.addColor(badgesObject, "徽章颜色"),
    badgeIcon = badgesController.add(badgesObject, "徽章内容", ["icon1", "icon2", "icon3"]);
badgesController.open()

const nodeTest = () => {
    let bgColor = textBackgroundColor.getValue()
    let nodes = [
        {
            id: "n1",
            attribute: {
                x: Number(x.getValue()),
                y: Number(y.getValue()),
                radius: radius.getValue(),
                shape: shape.getValue(),
                color: color.getValue(),
                gradient: {
                    isGradient: useGradient.getValue(),
                    position: position.getValue(),
                },
                text: {
                    content: textContent.getValue(),
                    fontSize: textFontSize.getValue(),
                    position: textPostion.getValue(),
                    color: textColor.getValue(),
                    background: `rgba(${Math.ceil(bgColor[0])},${Math.ceil(bgColor[1])},${Math.ceil(bgColor[2])},${(bgColor[3])})`,
                    maxLength: maxLength.getValue(),
                    margin: [Number(marginx.getValue()), Number(marginy.getValue())],
                    fontStyle: 'normal'
                },
                icon: {
                    content: useIcon.getValue() ? iconStore[icon.getValue()] : "",
                    font: 'iconfont'
                },
                image: {
                    url: useImage.getValue() ? imageStore[image.getValue()] : "",
                },
                innerStroke: {
                    width: innerWidth.getValue(),
                    color: innnerColor.getValue(),
                    selectedColor: innerSelectColor.getValue()
                },
                halo: {
                    width: haloWidth.getValue(),
                    color: haloColor.getValue(),
                },
                badges:
                    usebadge.getValue() ?
                        {
                            topRight: {
                                color: badgeColor.getValue(),
                                text: {
                                    font: 'iconfont',
                                    color: badgeTextColor.getValue(),
                                    content: iconStore[badgeIcon.getValue()],
                                    scale: .6
                                },
                                stroke: {
                                    color: '#fff',
                                    width: 1
                                }
                            }
                        } : null,
            }
        }
    ]
    galaxyVis.addNodes(nodes)

};
nodeTest();

for (let i = 0, len = baseController.__controllers.length; i < len; i++) {
    baseController.__controllers[i].onChange(() => {
        galaxyVis.getNode('n1').setAttributes({
            x: x.getValue(),
            y: y.getValue(),
            radius: radius.getValue(),
            shape: shape.getValue(),
            color: color.getValue(),
        })
    })
}

for (let i = 0, len = innerController.__controllers.length; i < len; i++) {
    innerController.__controllers[i].onChange(() => {
        galaxyVis.getNode('n1').setAttributes({
            innerStroke: {
                color: innnerColor.getValue(),
                width: innerWidth.getValue(),
                selectedColor: innerSelectColor.getValue()
            }
        })
    })
}

for (let i = 0, len = gradientController.__controllers.length; i < len; i++) {
    gradientController.__controllers[i].onChange(() => {
        galaxyVis.getNode('n1').setAttributes({
            gradient: {
                isGradient: useGradient.getValue(),
                position: position.getValue(),
            },
        })
    })
}

for (let i = 0, len = labelController.__controllers.length; i < len; i++) {
    labelController.__controllers[i].onChange(() => {
        let bgColor = textBackgroundColor.getValue()
        galaxyVis.getNode('n1').setAttributes({
            text: {
                content: textContent.getValue(),
                fontSize: textFontSize.getValue(),
                position: textPostion.getValue(),
                color: textColor.getValue(),
                background: `rgba(${Math.ceil(bgColor[0])},${Math.ceil(bgColor[1])},${Math.ceil(bgColor[2])},${(bgColor[3])})`,
                maxLength: maxLength.getValue(),
                margin: [Number(marginx.getValue()), Number(marginy.getValue())],
                style: fontStyle.getValue()
            },
        })
    })
}

for (let i = 0, len = iconController.__controllers.length; i < len; i++) {
    iconController.__controllers[i].onChange(() => {
        galaxyVis.clear();
        galaxyVis.clearGraph();
        nodeTest()
    })
}

for (let i = 0, len = imageController.__controllers.length; i < len; i++) {
    imageController.__controllers[i].onChange(() => {
        galaxyVis.clear();
        galaxyVis.clearGraph();
        nodeTest()
    })
}

for (let i = 0, len = haloController.__controllers.length; i < len; i++) {
    haloController.__controllers[i].onChange(() => {
        galaxyVis.getNode('n1').setAttributes({
            halo: {
                width: haloWidth.getValue(),
                color: haloColor.getValue(),
            },
        })
    })
}

for (let i = 0, len = badgesController.__controllers.length; i < len; i++) {
    badgesController.__controllers[i].onChange(() => {
        galaxyVis.clear();
        galaxyVis.clearGraph();
        nodeTest()
    })
}

export default nodeTest;