import galaxyvis from "../src/galaxyVis";
import * as dat from 'dat.gui';
let galaxyVis;

var divBox = document.getElementById("container");
var script = document.createElement("script");
script.src = "../public/javascript/xlsx.min.js";
divBox.appendChild(script);

let gui = new dat.GUI();
// @ts-ignore
let pngController = gui.addFolder('导出png控制器');
pngController.open()
let pngObj = {
    "是否开启水印": true,
    "水印内容": "GALAXYBASE",
    "字体": "20",
    "字间距": 250,
    "字体倾斜角度": -35,
    "导出png": () => { },
    "水印是否铺满": true,
    "导出jpg": () => { }
},
    isPng = pngController.add(pngObj, "是否开启水印"),
    contentPng = pngController.add(pngObj, "水印内容"),
    fontSizePng = pngController.add(pngObj, "字体"),
    spacePng = pngController.add(pngObj, "字间距", 100, 500, 10),
    anglePng = pngController.add(pngObj, "字体倾斜角度", -90, 90, 5),
    repeatPng = pngController.add(pngObj, "水印是否铺满"),
    pngExport = pngController.add(pngObj, "导出png")

pngExport.onChange(() => {
    galaxyVis.export.png({
        download: true,
        filename: `test1.png`,
        textWatermark:
            isPng.getValue() ?
                {
                    alpha: 0.3,
                    content: contentPng.getValue(),
                    style: "bold",
                    fontSize: fontSizePng.getValue(),
                    angle: anglePng.getValue(),
                    repeat: repeatPng.getValue(),
                    space: spacePng.getValue(),
                } : {
                },
    })
})
// @ts-ignore
let jpgController = gui.addFolder('导出jpg控制器'),
    isJPG = jpgController.add(pngObj, "是否开启水印"),
    contentJPG = jpgController.add(pngObj, "水印内容"),
    fontSizeJPG = jpgController.add(pngObj, "字体"),
    spaceJPG = jpgController.add(pngObj, "字间距", 100, 500, 10),
    angleJPG = jpgController.add(pngObj, "字体倾斜角度", -90, 90, 5),
    repeatJPG = jpgController.add(pngObj, "水印是否铺满"),
    jpgExport = jpgController.add(pngObj, "导出jpg");
jpgController.open()
jpgExport.onChange(() => {
    galaxyVis.export.png({
        download: true,
        filename: `test1.jpg`,
        textWatermark:
            isJPG.getValue() ?
                {
                    alpha: 0.3,
                    content: contentJPG.getValue(),
                    style: "bold",
                    fontSize: fontSizeJPG.getValue(),
                    angle: angleJPG.getValue(),
                    repeat: repeatJPG.getValue(),
                    space: spaceJPG.getValue(),
                } : {
                },
    })
})

// @ts-ignore
let jsonController = gui.addFolder('导出json控制器'),
    jsonObj = {
        "导出json": () => { },
    },
    jsonExport = jsonController.add(jsonObj, "导出json")
jsonController.open()
const jsonFilter = (data) => {
    const result = {};
    Object.keys(data).forEach((key) => {
        result[key] = data[key];
    });
    return result;
};

jsonExport.onChange(() => {
    galaxyVis.export.json({
        download: true,
        filename: `test1.json`,
        nodeData(data) {
            return jsonFilter(data);
        },
        edgeData(data) {
            return jsonFilter(data);
        },
    })
})

// @ts-ignore
let csvController = gui.addFolder('导出csv控制器'),
    csvObj = {
        "导出点csv": () => { },
        "导出边csv": () => { },
    },
    csvExport = csvController.add(csvObj, "导出点csv"),
    csvEdgeExport = csvController.add(csvObj, "导出边csv")
csvController.open()
csvExport.onChange(() => {
    galaxyVis.export.csv({
        what: "nodes",
        nodeData(data) {
            return jsonFilter(data);
        },
        edgeData(data) {
            return jsonFilter(data);
        },
        download: true,
        filename: "点csv.csv",
    })
})

csvEdgeExport.onChange(() => {
    galaxyVis.export.csv({
        what: "edges",
        nodeData(data) {
            return jsonFilter(data);
        },
        edgeData(data) {
            return jsonFilter(data);
        },
        download: true,
        filename: "边csv.csv",
    })
})


// @ts-ignore
let xlsxController = gui.addFolder('导出xlsx控制器'),
    xlsxObj = {
        "导出xlsx": () => { },
    },
    xlsxExport = xlsxController.add(xlsxObj, "导出xlsx")
xlsxController.open()
xlsxExport.onChange(() => {
    galaxyVis.export.xlsx({
        tab: {
            nodes(node) {
                return node.getData("a");
            },
            edges(edge) {
                return edge.getData("property");
            },
        },
        nodeData(data) {
            return jsonFilter(data);
        },
        edgeData(data) {
            return jsonFilter(data);
        },
        download: true,
        filename: "导出xlsx.xlsx",
    })
})
// @ts-ignore
let svgController = gui.addFolder('导出svg控制器'),
    svgObj = {
        "导出svg": () => { },
    },
    svgExport = svgController.add(svgObj, "导出svg")
svgController.open()
svgExport.onChange(() => {
    galaxyVis.export.svg({})
})

const textExport = () => {
    galaxyVis = new galaxyvis({
        container: "container",
    });
    galaxyVis.addGraph(
        {
            nodes: [
                {
                    id: "n1", attribute: { color: "#199", x: 500, y: -300, text: "data({ a:1 b:15})" },
                    data: { a: 1, b: 15 }
                },
                {
                    id: "n2", attribute: { color: "#456", x: -600, text: "data:({a:1})" },
                    data: { a: 1 }
                },
                {
                    id: "n3", attribute: { color: "#7a9", x: 600, y: 300, text: "data:({a:0})" },
                    data: { a: 0 }
                },
                {
                    id: "n4", attribute: { color: "#b56", x: -400, y: 300, text: "data:({c:1})", shape: "square" },
                    data: { a: 5, c: 1 }
                },

            ],
            edges: [

                {
                    id: "e2", source: "n1", target: "n2",
                    data: { property: "key" },
                    attribute: { text: "data:({property: key})", shape: { head: "arrow" } },
                },

                {
                    id: "e1", source: "n2", target: "n1",
                    data: { property: "value" },
                    attribute: {
                        text: "data:({property: value})", shape: { head: "arrow" }, color: "#546f02",
                    },
                },
            ]
        }
    ).then(() => {
    })

};


textExport();
export default textExport;
