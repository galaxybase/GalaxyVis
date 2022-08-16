<p align="center">
  <a href="">
    <img alt="GalaxyVis" src="https://www.galaxybase.com/public/galaxyvis-logo.png" style="width:183px">
  </a>
</p>

<p align="center">
  一个高性能的图可视化 Javascript 渲染框架
</p>

## 概述

GalaxyVis 是一个图可视化框架。它使用纯原生WebGL和Canvas作为底层绘图协议，无使用任何第三方框架依赖，自主可控，安全保障。

它提供了图的绘制、布局、分析、交互、动画等图可视化的基础能力。GalaxyVis 提供了一组在 Web 应用程序中显示、探索和与图形数据交互所需的功能。这包括智能布局算法、丰富的用户交互以及完全可定制的视觉样式。

GalaxyVis 默认使用 **WebGL** 来呈现，如当前环境不支持 **WebGL** 或性能较差，则自动选择 **Canvas** 来呈现图形。这使得它擅长在网页中呈现中等到较大的图形（数万个节点和边或更多）。

<!-- ## 文档

- [快速入门]()
- [API]()

## 案例

- [在线案例]()
- [在线地图案例]() -->

## 特征
作为一款专业的图可视化框架，GalaxyVis 具有以下特征：

- **性能：** 支持百万级点边渲染，webgl框架；
- **布局：** 支持力导向、树形、层次、网格、环形、圆形深度、辐射7种布局，布局参数自由定义，并且每个布局都支持增量布局；
- **分析：** 内置图分析算法；
- **地图：** 集成了地图模式，对图可视化场景更好地结合；
- **转换：** 通过过滤、分组节点和边以及将属性转换为实体，动态调整数据的显示方式以满足您的需求；
- **样式：** 内置丰富的节点样式和边样式，可供用户自由配置；
- **互动：** 移动和重新排列节点和链接，选择并展开项目以突出显示和调查连接和模式；

## 适合谁
GalaxyVis 旨在打造一个简单、易用、功能丰富、高性能的一个图可视化框架，适合对可视化不了解并且想要快速开发出一个酷炫的可视化工具的开发者们，通过简单的API能够制作出各种复杂的应用。

## 价值

GalaxyVis 作为市面上极少数使用原生webgl为开发语言的图可视化框架，在性能方面优于大部分框架，能为大家带来更为流畅的体验效果；考虑在webgl兼容性的同时，框架可以自动识别低版本浏览器使用canvas进行绘制，友好地支持各种版本浏览器；框架持续迭代和优化，能够让使用者轻松地开发出复杂的企业级应用。

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

## 查看案例
[`examples`](./examples) 文件夹包含一系列独立的 TypeScript 项目，您可以在本地安装：

```bash
git clone https://github.com/galaxybase/GalaxyVis.git
cd GalaxyVis
npm install
npm run examples  // 默认端口为8086
```
具体实例请查看[`代码`](./examples)

## GalaxyVis 图可视化交流群

欢迎 GalaxyVis 使用者、图可视化爱好者加入我们的交流群进行讨论与交流。

微信号（加好友入交流群）: CLKJ-2016

## 贡献

感谢您为我们的项目提出宝贵的建议或意见，欢迎提交[issue](https://github.com/galaxybase/GalaxyVis/issues)。

## License
[Apache2 license](./LICENSE)。


    