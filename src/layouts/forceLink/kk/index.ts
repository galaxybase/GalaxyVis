// @ts-nocheck
import { tNode } from "../../hierarchy/tclass";
/**
 * 网格布局kk。 
 * 依赖于每个顶点之间弹簧的模拟，其强度由两个顶点之间的最短路径的长度决定。
 * 然后计算每个顶点的势能，即所有弹簧的能量总和。目标是减少布局的全局能量，
 * 使用 Newton-Raphson 算法逐步移动每个顶点，直到其势能被认为足够低。
 * https://citeseer.ist.psu.edu/viewdoc/download?doi=10.1.1.13.8444&rep=rep1&type=pdf
 * @param _nodes 
 * @param _links 
 * @param _options 
 */
var KKLayout: any = function (_nodes: tNode[], _links: any[], _options) {
    this.nodes = _nodes;
    this.links = _links;
    this.nodeIds = [];
    this.VECTOR_D1 = [];
    this.VECTOR_D2 = [];
    this.lij = [];
    this.kij = [];
    this.tempNodes = [];
    this.realSize = 3000.0;
    this.tempSize = 5.0;
    this.inited = false;
    this.options = _options;
    this.tickNum = 300
};

KKLayout.prototype.getConfig = function () {
    var canvasWidth = this.setCanvasSize(this.nodes.length);
    return {
        'realSize': canvasWidth
    };
};

KKLayout.prototype.resetConfig = function (layoutConfig: { [x: string]: any; }) {
    if (layoutConfig) {
        this.realSize = Number(layoutConfig['realSize']) || 1000;
        let num = this.nodes.length;
        this.tickNum =
            num < 50 ?
                this.tickNum : num < 500 ?
                    num * 15 : num * 30;
        this.initAlgo();
    }
};

KKLayout.prototype.runLayout = function () {
    var i = 0;
    while (i++ < this.tickNum && this.inited) {
        this.goAlgo();
    }
    var nodes = this.nodes;
    let layoutNodes: { [key: string]: any } = {}
    for (let i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        layoutNodes[n.id] = {
            x: n.x,
            y: n.y,
            id: n.id
        }
    }

    return layoutNodes;
};

KKLayout.prototype.initAlgo = function () {
    var _self = this;
    var nodes = _self.nodes;
    var nodeCount = nodes.length;
    this.inited = true;
    var L0 = _self.tempSize;
    _self.nodeIds = [];
    _self.tempNodes = [];
    _self.VECTOR_D1 = [];
    _self.VECTOR_D2 = [];
    _self.lij = [];
    _self.kij = [];
    nodes.forEach(function (node: { id: any; x: number; y: number; }) {
        _self.nodeIds.push(node.id);
        _self.tempNodes.push({
            id: node.id,
            x: node.x / (_self.realSize / _self.tempSize),
            y: node.y / (_self.realSize / _self.tempSize)
        });
    });

    var lij = [nodeCount];
    var kij = [nodeCount];
    // 计算最短路径
    var dij = _self.shortPath(nodeCount);
    // 获取最短路劲
    var max_dij = _self.getMaxDij(nodeCount, dij);

    _self.getKijLij(L0, max_dij, dij, kij, lij);

    var _VECTOR_D1 = [nodeCount];
    var _VECTOR_D2 = [nodeCount];

    _self.tempNodes.forEach(function (nodeM: { x: number; y: number; }, i: string | number) {
        var myD1 = 0.0,
            myD2 = 0.0;

        _self.tempNodes.forEach(function (nodeN: { x: number; y: number; }, j: string | number) {
            if (i != j) {
                var dx = nodeM.x - nodeN.x;
                var dy = nodeM.y - nodeN.y;

                var mi_dist = Math.sqrt(dx * dx + dy * dy);

                myD1 += kij[i][j] * (dx - lij[i][j] * dx / mi_dist);
                myD2 += kij[i][j] * (dy - lij[i][j] * dy / mi_dist);
            }
        });

        _VECTOR_D1[i] = myD1;
        _VECTOR_D2[i] = myD2;
    });

    _self.VECTOR_D1 = _VECTOR_D1;
    _self.VECTOR_D2 = _VECTOR_D2;

    _self.lij = lij;
    _self.kij = kij;
};

KKLayout.prototype.goAlgo = function () {
    var _self = this;
    var nodeCount = _self.tempNodes.length;

    var epsilon = 1e-5;
    var myD1 = 0.0,
        myD2 = 0.0;
    var A = 0.0,
        B = 0.0,
        C = 0.0;
    var delta_x, delta_y;
    var old_x, old_y, new_x, new_y;
    // 找到具有最大势能的并返回
    var m = 0;
    var max_delta = -1;
    for (var i = 0; i < nodeCount; i++) {
        var delta = (_self.VECTOR_D1[i] * _self.VECTOR_D1[i] + _self.VECTOR_D2[i] * _self.VECTOR_D2[i]);
        if (delta > max_delta) {
            m = i;
            max_delta = delta;
        }
    }

    if (max_delta < epsilon) {
        return;
    }

    var nodeM = _self.tempNodes[m];
    old_x = nodeM.x;
    old_y = nodeM.y;

    for (var i = 0; i < nodeCount; i++) {
        if (i == m) {
            continue;
        }
        var nodeI = _self.tempNodes[i];
        var dx = old_x - nodeI.x;
        var dy = old_y - nodeI.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var den = dist * (dx * dx + dy * dy);
        A += _self.kij[m][i] * (1.0 - _self.lij[m][i] * dy * dy / den);
        B += _self.kij[m][i] * (_self.lij[m][i] * dx * dy / den);
        C += _self.kij[m][i] * (1.0 - _self.lij[m][i] * dx * dx / den);
    }

    myD1 = _self.VECTOR_D1[m];
    myD2 = _self.VECTOR_D2[m];

    delta_y = (B * myD1 - myD2 * A) / (C * A - B * B);
    delta_x = -(myD1 + B * delta_y) / A;

    new_x = old_x + delta_x;
    new_y = old_y + delta_y;

    _self.VECTOR_D1[m] = _self.VECTOR_D2[m] = 0.0;
    // 即整个图形中的能量 由其位置引起的
    // 位置的delta取决于K
    for (var i = 0; i < nodeCount; i++) {
        if (i == m) {
            continue;
        }
        var nodeI = _self.tempNodes[i];
        var old_dx = old_x - nodeI.x;
        var old_dy = old_y - nodeI.y;
        var old_mi_dist = Math.sqrt(old_dx * old_dx + old_dy * old_dy);
        var new_dx = new_x - nodeI.x;
        var new_dy = new_y - nodeI.y;
        var new_mi_dist = Math.sqrt(new_dx * new_dx + new_dy * new_dy);

        _self.VECTOR_D1[i] -= _self.kij[m][i] * (-old_dx + _self.lij[m][i] * old_dx / old_mi_dist);
        _self.VECTOR_D2[i] -= _self.kij[m][i] * (-old_dy + _self.lij[m][i] * old_dy / old_mi_dist);
        _self.VECTOR_D1[i] += _self.kij[m][i] * (-new_dx + _self.lij[m][i] * new_dx / new_mi_dist);
        _self.VECTOR_D2[i] += _self.kij[m][i] * (-new_dy + _self.lij[m][i] * new_dy / new_mi_dist);

        _self.VECTOR_D1[m] += _self.kij[m][i] * (new_dx - _self.lij[m][i] * new_dx / new_mi_dist);
        _self.VECTOR_D2[m] += _self.kij[m][i] * (new_dy - _self.lij[m][i] * new_dy / new_mi_dist);
    }
    nodeM.x = new_x;
    nodeM.y = new_y;

    var index = _self.nodeIds.indexOf(nodeM.id);
    var node = _self.nodes[index];
    node.x = new_x * (_self.realSize / _self.tempSize);
    node.y = new_y * (_self.realSize / _self.tempSize);
};

KKLayout.prototype.getMaxDij = function (nodeCount: number, dij: number[][]) {
    var max_dij = 0;
    for (var i = 0; i < nodeCount; i++) {
        for (var j = i + 1; j < nodeCount; j++) {
            if (dij[i][j] == Infinity) {
                continue;
            }
            if (dij[i][j] > max_dij) {
                max_dij = dij[i][j];
            }
        }
    }
    for (var i = 0; i < nodeCount; i++) {
        for (var j = 0; j < nodeCount; j++) {
            if (dij[i][j] == Infinity) {
                dij[i][j] = max_dij;
            }
        }
    }
    return max_dij;
};

KKLayout.prototype.getKijLij = function (L0: number, max_dij: number, dij: number[][], kij: number[][], lij: number[][]) {
    var L = L0 / max_dij;
    var nodeCount = this.tempNodes.length;

    for (var i = 0; i < nodeCount; i++) {
        kij[i] = [nodeCount];
        lij[i] = [nodeCount];

        for (var j = 0; j < nodeCount; j++) {
            var tmp = dij[i][j] * dij[i][j];
            if (i == j) {
                continue;
            }
            kij[i][j] = Math.pow(nodeCount, 2) * 1.0 / tmp;
            lij[i][j] = L * dij[i][j];
        }
    }
};

KKLayout.prototype.shortPath = function (nodeCount: number) {
    var _self = this;
    var dij = [nodeCount];
    // 创建一个邻接矩阵 (infinity = no edge, 1 = edge)
    for (var i = 0; i < nodeCount; i++) {
        dij[i] = [nodeCount];

        for (var j = 0; j < nodeCount; j++) {
            if (i == j) {
                dij[i][j] = 0;
                continue;
            }
            dij[i][j] = Infinity;
        }
    }

    _self.links.forEach(function (link: { source: { id: any; }; target: { id: any; }; }) {
        var i = _self.nodeIds.indexOf(link.source.id);
        var j = _self.nodeIds.indexOf(link.target.id);

        dij[i][j] = 1;
        dij[j][i] = 1;
    });
    // Floyd算法 找到每对顶点的最短路径的长度
    for (var k = 0; k < nodeCount; k++) {
        for (var i = 0; i < nodeCount; i++) {
            for (var j = i + 1; j < nodeCount; j++) {
                var temp = dij[i][k] + dij[k][j];
                if (temp < dij[i][j]) {
                    dij[i][j] = temp;
                    dij[j][i] = temp;
                }
            }
        }
    }
    return dij;
};

KKLayout.prototype.setCanvasSize = function (nodeCount: number) {
    var maxWidth = 8000;
    var minWidth = 1500;
    var widthRange = maxWidth - minWidth;

    var shiftLog = 5;
    var maxLog = Math.log(800 + shiftLog);
    var minLog = Math.log(shiftLog);
    var logRange = maxLog - minLog;

    var canvasWidth = Math.round(((Math.log((Math.min(nodeCount, 8000) / 10) + shiftLog) - minLog) * widthRange /
        logRange + minWidth));
    return canvasWidth;
};

export default KKLayout