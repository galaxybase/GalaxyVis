<p>
    <p align="center">
        <a href="">
            <img alt="GalaxyVis" src="https://www.galaxybase.com/public/galaxyvis-logo-big.png">
        </a>
    </p>
</p>

![typescript](https://img.shields.io/badge/language-typescript-red.svg) ![MIT](https://img.shields.io/badge/license-Apache2-000000.svg) [![npm package](https://img.shields.io/npm/v/@galaxybase/galaxyvis.svg)](https://www.npmjs.com/package/@galaxybase/galaxyvis) [![NPM downloads](https://img.shields.io/npm/dm/@galaxybase/galaxyvis.svg)](https://npmjs.org/package/@galaxybase/galaxyvis) [![Percentage of issues still open](https://isitmaintained.com/badge/open/galaxybase/galaxyvis.svg)](http://isitmaintained.com/project/galaxybase/galaxyvis)

## 什么是GalaxyVis？

[GalaxyVis](https://galaxyvis.com/) 是由[创邻科技](https://www.galaxybase.com/)自主研发的图可视化框架，目前已应用于图平台产品Galaxybase的可视化前端中，Galaxybase是国内首款全自主知识产权的超大规模分布式并行原生图平台产品，拥有优异的数据读写查询性能、强⼤的可视化分析能⼒、丰富的可编程接⼝和开箱即用的图算法引擎，是集存储、计算、分析于一体的图数据全⽣命周期⼀站式管理平台，免费版可以[点此](https://www.galaxybase.com/download)获取。

它使用纯原生WebGL和Canvas作为底层绘图协议，不依赖任何第三方框架，自主可控，安全保障。

它提供了图的绘制、布局、分析、交互、动画等图可视化的基础能力，还提供了一组在 Web 应用程序中显示、探索和与图形数据交互所需的功能；包括智能布局算法、丰富的用户交互以及完全可定制的视觉样式。

它默认使用 **WebGL** 来呈现，这使得它擅长在网页中呈现中等到较大的图形（数万个节点和边或更多）。如当前环境不支持 **WebGL** 绘图协议，则自动选择 **Canvas** 来呈现图形。

<img src="https://galaxyvis.com/assets/example.png" height="400"/>

基于 GalaxyVis，用户可以快速搭建自己的 **图相关** 应用。

如果您还没有使用过 GalaxyVis， 建议通过 [快速入门](https://galaxyvis.com/Quickstart) 体验 GalaxyVis 的魅力。

<img src="https://galaxyvis.com/assets/布局.gif" height="105"/>
<img src="https://galaxyvis.com/assets/增量布局.gif" height="105"/>
<img src="https://galaxyvis.com/assets/地图.gif" height="105"/>

<br >

<img src="https://galaxyvis.com/assets/多选-合并点.gif" height="105"/>
<img src="https://galaxyvis.com/assets/一度高亮.gif" height="105"/>

>  强大的布局、功能、动画和交互。

## 特征
作为一款专业的图可视化框架，GalaxyVis 具有以下特征：

- **性能：** 支持百万级点边渲染，使用webgl绘图协议；
- **布局：** 支持力导向、树形、层次、网格、环形、圆形深度、辐射7种布局，布局参数自由定义，并且每个布局都支持增量布局；
- **分析：** 内置图分析算法；
- **地图：** 集成了地图模式，更好地结合图可视化场景；
- **转换：** 通过对节点和边过滤、分组，动态调整数据的方式来满足您的需求；
- **样式：** 内置丰富的节点样式和边样式，可供用户自由配置；
- **互动：** 移动和重新排列节点，以突出显示和调查连接的模式；

## 适合人群
GalaxyVis 旨在打造一个简单、易用、功能丰富、高性能的图可视化框架，适合对可视化不了解并且想要快速开发出一个酷炫可视化工具的开发者们，通过简单的API能够制作出各种复杂的应用。

## 价值

GalaxyVis 作为市面上极少数使用原生webgl为开发语言的图可视化框架，在性能方面优于大部分框架，能为大家带来更为流畅的体验效果；考虑webgl兼容性的同时，框架可以自动识别低版本浏览器并使用canvas进行绘制，友好地支持低版本浏览器；框架持续迭代和优化，能够让使用者轻松地开发出复杂的企业级应用。


## 例子
[`examples`](./examples) 文件夹包含一系列独立的 TypeScript 项目，您可以在本地进行安装：

```bash
git clone https://github.com/galaxybase/GalaxyVis.git
cd GalaxyVis
npm install
npm run examples  // 默认端口为8086
```

此外，还提供了2个更真实的基于 GalaxyVis 的 Web 应用程序demo。它旨在展示一个真实的用例。

- [了解 GalaxyVis 如何处理较大的数据场景](https://galaxyvis.com/demo/)
- [图结合地图模式的可视化效果](https://galaxyvis.com/demo/geo)

## 安装

您可以使用 `npm` 在 JavaScript 或 TypeScript 项目中安装 `galaxyvis`：

```bash
npm install @galaxybase/galaxyvis
```

## 使用

```javascript
const data = {
    nodes: [{
        id: 'n1',
        attribute: {
            x: 100,
            y: 200,
            color: '#965E04',
            text: {
                content: 'n1'
            }
        }
    },{
        id: 'n2',
        attribute: {
            x: 300,
            y: 200,
            color: '#C89435',
            text: {
                content: 'n2'
            }
        }
    }],
    edges: [{
        id:'e1',
        source: 'n1',
        target: 'n2',
        attribute: {
            color: '#F7A456',
            text: {
                content: 'e1',
            }
        }
    }]
}
const graph = new galaxyvis({
  container: 'container'
});
graph.addGraph(data)
```

## 文档

- [快速入门](https://galaxyvis.com/Quickstart)
- [API](https://galaxyvis.com/Graph)


## GalaxyVis 图可视化交流群

欢迎 GalaxyVis 使用者、图可视化爱好者加入我们的交流群进行讨论与交流。

微信号（加好友入交流群）: CLKJ-2016

## 贡献

感谢您为我们的项目提出宝贵的建议或意见，欢迎提交[issue](https://github.com/galaxybase/GalaxyVis/issues)。

## License
[Apache2 license](./LICENSE)。


    