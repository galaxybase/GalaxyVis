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

