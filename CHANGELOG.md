# GalaxyVis - changelog:

## 1.0.0

### Feat:

- Publish Library


## 1.0.1

### Feat:

- fast模式添加
- canvas的缓存机制
- webgl的缓存机制
- 四叉树的优化


## 1.0.2

### Feat:
- 新增Fast模式，通过初始化实例的fast属性设置
- 新增地图模式居中方法
- 新增右键旋转画布功能
- 圆形深度布局支持增量
- export导出cvs支持通过nodes和edges参数自定义导出点边集合
### Perf:
- 四叉树检测逻辑更新，对边缘部分检测优化


## 1.0.3

### Feat:

- 新增布局：
    - hive放射性布局
    - dualCircle双圆环布局
    - layerCircle多层圆布局
    - radiatree径向布局
    - bfa球面布局
    - kk网络布局
    - hubsize组织结构布局
    - balloon圆形树状布局
    - frDirected力导向布局FR算法
    - chronological时序布局
    - comboDagre层次布局combo类型
    - fr经典网络布局
    - spring2弹性布局
    - gather群体分组布局
    - sphere球形布局
    - fruchtermanReingold力导向布局
    - topoCircle对称树形布局
    - noverlap节点不重叠布局

- 导出csv、xlsx新增参数
  - skipHeader：是否开启自定义表头
  - customisedHeader：自定义表头
- 新增tools工具类 enabled
- 合并边新增selection属性
- Edge类新增getParallelEdges方法


### Fix:
- 修复导出png和jpg的alpha属性不生效
- 修复Edge的getMiddlePoint位置准确
- 修复Geo模式下不能使用lasso工具类
- 修复Pluse在更改浏览器大小后显示位置不准确
- 修复无法在IE11环境下渲染
- 修复icon属性为非svg字体时字体位置偏下


## 1.0.4

### Feat:

- 新增布局：
    - nebural 神经网络布局


### Fix:
- 修复在大数据情况下缩略图显示过于小的问题
- 修复geo模式下如果没有显示点但使用node/nodelist的local方法的时候会抛出异常的问题
- 修复geo模式的样式和style样式冲突的问题
- 修复noverlap布局在非webworker环境下回执行两遍布局的问题

## 1.0.5

### Feat:

- 修改打包脚本，默认引入打包后的文件
- 修改woker-loader的inline内联方式支持webworker的布局


### Fix:
- 修复webgl的halo显示问题
- 修复初始化相机zoom的min和max值混乱

## 1.0.6


### Feat：

- 新增updateZoom方法。该方法是为了解决在初始化后无法修改相机最大最小值提供的方法
- 圆形深度布局新增 fixRadius `boolen`的属性。当该值为true的时候圆形深度每一圈的大小将会严格按照circleHopRatio属性的值
- 在geo模式新增文字降噪
- 优化四叉树的选中逻辑

### Fix：

- 修复合并边如果填写generator，多次合并两点的多边会导致生成的合并边的id相同的bug
- 修复webgl在低配置环境下上下文丢失后浏览器疯狂爆警告的问题
- 修复webgl在不同的环境大小下可能导致文字显示不正常的bug
- 优化webgl一下子绘制大量的中文文字导致崩溃的问题
- 修复balloon布局在都是Loop的数据里，布局后所有的点都会叠在一起的问题




   