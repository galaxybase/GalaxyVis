// @ts-nocheck
/**
 * 组织结构布局
 * @param nodes 
 * @param links 
 */
var HierarchicalLayout: any = function (nodes, links) {
    this.nodes = nodes;
    this.links = links;

    this.layerDistance = 100;   // 层间距
    this.nodeDistance = 60;   // 点间距
    this.treeSpacing = 0;    
    this.direction = "UD";   // 排列方向 UD,DU,LR,RL
    this.sortMethod = "directed"; // 排列方式 hubsize， directed， selected
    this.treeIndex = -1;
    this.continueOrBreak = 0;

    this.boolTransition = true;
    this.inited = false;
};

HierarchicalLayout.prototype.resetConfig = function (layoutConfig) {
    var self = this;
    if (layoutConfig) {
        self.layerDistance = Number(layoutConfig['layerDistance']) || 100;
        self.nodeDistance = Number(layoutConfig['nodeDistance']) || 80;
        self.sortMethod = layoutConfig['sortMethod'] || 'hubsize';
        self.direction = layoutConfig['direction'] || 'UD';
    }
    self.initAlgo();
};

HierarchicalLayout.prototype.newLayoutData = function () {
    var layoutData = {
        finishx: 0.0,
        finishy: 0.0,
        xdistance: 0.0,
        ydistance: 0.0
    };
    return layoutData;
};

HierarchicalLayout.prototype.initAlgo = function () {
    var self = this;
    self.treeIndex = -1;
    self.continueOrBreak = 0;
    self.nodeIdList = [];
    self.selectedNodeIds = null;
    self.positionedNodes = {};
    self.hierarchicalLevels = {};
    self.hierarchicalTrees = {};
    self.lastNodeOnLevel = {};
    self.hierarchicalChildrenReference = {};
    self.hierarchicalParentReference = {};
    self.distributionIndex = {};
    self.distributionOrdering = {};
    self.distributionOrderingPresence = {};
    self.nodesIdMap = {};
    self.edges = {};

    self.setData();
    self.setupHierarchicalLayout();

    self.nodes.forEach(function (node) {
        var nodeId = String(node.id);
        var nodeLocal = self.nodesIdMap[nodeId];
        var x = 0,
            y = 0;
        if (self.direction == 'DU') {
            x = nodeLocal.x;
            y = -nodeLocal.y;
        } else if (self.direction == 'RL') {
            x = -nodeLocal.x;
            y = nodeLocal.y;
        } else {
            x = nodeLocal.x;
            y = nodeLocal.y;
        }

        var posData = self.newLayoutData();
        posData.finishx = x;
        posData.finishy = y;
        posData.xdistance = (1.0 / 50) * (x - node.x);
        posData.ydistance = (1.0 / 50) * (y - node.y);
        node.layoutData = posData;
    });
    self.inited = true;
};

HierarchicalLayout.prototype.setData = function (selectedNodeId) {
    var self = this;
    self.nodes.forEach(function (node) {
        var nodeId = String(node.id);
        var nodeTemp = self.NodeLocal(nodeId);

        self.nodesIdMap[nodeId] = nodeTemp;
        self.nodeIdList.push(nodeId);
    });

    self.links.forEach(function (edge, i) {
        var id = String(i + 1);
        var edgeLocal = self.Edge(edge.source.id, edge.target.id, id);
        self.edges[id] = edgeLocal;
        var fromId = edgeLocal.fromId;
        var toId = edgeLocal.toId;

        var fromNode = self.nodesIdMap[fromId];
        if (fromNode.edgesIds.indexOf(id) == -1) {
            fromNode.edgesIds.push(id);
        }
        var toNode = self.nodesIdMap[toId];
        if (toNode.edgesIds.indexOf(id) == -1) {
            toNode.edgesIds.push(id);
        }
    });

    if (self.sortMethod == 'selected') {
        var selectedNodes = self.nodes.filter(function (n) {
            return n.selected == true;
        });
        var _selectedNodeIds = [];
        selectedNodes.forEach(function (n) {
            _selectedNodeIds.push(String(n.id));
        });
        self.selectedNodeIds = _selectedNodeIds;
    }
};

HierarchicalLayout.prototype.setupHierarchicalLayout = function () {
    var self = this;
    if (self.sortMethod == 'hubsize') {
        self.determineLevelsByHubsize();
    } else if (self.sortMethod == 'directed') {
        self.determineLevelsByDirected();
    } else if (self.sortMethod == 'selected') {
        self.determineLevelsBySelected();
    }

    self.nodeIdList.forEach(function (nodeId) {
        if (self.hierarchicalLevels[nodeId] == null) {
            self.hierarchicalLevels[nodeId] = 0;
        }
    });

    var distribution = self.getDistribution();
    self.crawlNetwork("generateMap", -1);
    self.placeNodesByHierarchy(distribution);
    self.condenseHierarchy();
};

HierarchicalLayout.prototype.determineLevelsByDirected = function () {
    var self = this;
    self.crawlNetwork("determineLevelsByDirected", -1);
    var minLevel = 1000000000;
    self.nodeIdList.forEach(function (nodeId) {
        if (self.hierarchicalLevels[nodeId] != null) {
            minLevel = Math.min(self.hierarchicalLevels[nodeId], minLevel);
        }
    });

    self.nodeIdList.forEach(function (nodeId) {
        if (self.hierarchicalLevels[nodeId] != null) {
            self.hierarchicalLevels[nodeId] = self.hierarchicalLevels[nodeId] - minLevel;
        }
    });
};

HierarchicalLayout.prototype.determineLevelsBySelected = function () {
    var self = this;
    if (self.selectedNodeIds == null) {
        self.determineLevelsByHubsize();
    } else {
        self.selectedNodeIds.forEach(function (nodeId) {
            self.hierarchicalLevels[nodeId] = 0;
        });

        self.selectedNodeIds.forEach(function (nodeId) {
            if (self.nodesIdMap[nodeId] != null) {
                self.crawlNetwork("determineLevelsByHubsize", nodeId);
            }
        });
        self.determineLevelsByHubsize();
    }
};

HierarchicalLayout.prototype.NodeLocal = function (nodeId) {
    return {
        id: String(nodeId),
        edgesIds: [],
        x: 0,
        y: 0
    };
};

HierarchicalLayout.prototype.Edge = function (fromId, toId, id) {
    return {
        id: String(id),
        fromId: String(fromId),
        toId: String(toId)
    };
};

HierarchicalLayout.prototype.determineLevelsByHubsize = function () {
    var self = this;
    var hubSize = 1;
    while (hubSize > 0) {
        var _hubSize = 0;
        self.nodeIdList.forEach(function (nodeId) {
            var node = self.nodesIdMap[nodeId];
            if (self.hierarchicalLevels[node.id] == null) {
                _hubSize = node.edgesIds.length < _hubSize ? _hubSize : node.edgesIds.length;
            }
        });

        hubSize = _hubSize;
        if (hubSize == 0) {
            return;
        }

        self.nodeIdList.forEach(function (nodeId) {
            var node = self.nodesIdMap[nodeId];
            if (node.edgesIds.length == hubSize) {
                self.crawlNetwork("determineLevelsByHubsize", node.id);
            }
        });
    }
};

HierarchicalLayout.prototype.condenseHierarchy = function () {
    var self = this;
    var minPre = 1000000000,
        maxPre = -1000000000;
    var minAfter = 1000000000,
        maxAfter = -1000000000;
    for (var i = 0; i < self.treeIndex; i++) {
        for (var nodeId in self.hierarchicalTrees) {
            if (i == 0 && self.hierarchicalTrees[nodeId] == i) {
                var pos = self.getPositionForHierarchy(self.nodesIdMap[nodeId]);
                minPre = Math.min(pos, minPre);
                maxPre = Math.max(pos, maxPre);
            }
            if (self.hierarchicalTrees[nodeId] == i + 1) {
                var pos = self.getPositionForHierarchy(self.nodesIdMap[nodeId]);
                minAfter = Math.min(pos, minAfter);
                maxAfter = Math.max(pos, maxAfter);
            }
        }
        var diff = 0;
        for (var nodeId in self.hierarchicalTrees) {
            if (self.hierarchicalTrees[nodeId] == i + 1) {
                var node = self.nodesIdMap[nodeId];
                var pos = self.getPositionForHierarchy(node);
                self.setPositionForHierarchy(node, pos + diff + self.treeSpacing, -1);
            }
        }
        minPre = minAfter + diff + self.treeSpacing;
        maxPre = maxAfter + diff + self.treeSpacing;
    }
};

HierarchicalLayout.prototype.shiftToCenter = function () {
    var self = this;
    var minY = 1000000000,
        maxY = -1000000000;
    var minX = 1000000000,
        maxX = -1000000000;

    self.nodeIdList.forEach(function (nodeId) {
        var node = self.nodesIdMap[nodeId];
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);

        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
    });
    var width = maxX - minX;
    var height = maxY - minY;
    var ratioW = 1,
        ratioH = 1;
    var standardW = 5000,
        standardH = 3000;
    if (width > standardW) {
        ratioW = standardW / width;
    }
    if (height > standardH) {
        ratioH = standardH / height;
    }

    self.nodeIdList.forEach(function (nodeId) {
        var node = self.nodesIdMap[nodeId];
        var nodeX = node.x;
        node.x = Math.round((nodeX - minX) * ratioW);
        var nodeY = node.y;
        node.y = Math.round((nodeY - minY) * ratioH);
    });
};

HierarchicalLayout.prototype.getDistribution = function () {
    var self = this;
    var distribution = {};
    self.nodeIdList.forEach(function (nodeId) {
        var node = self.nodesIdMap[nodeId];
        var level = self.hierarchicalLevels[nodeId] == null ? 0 : self.hierarchicalLevels[nodeId];
        if (self.direction == 'UD' || self.direction == 'DU') {
            node.y = self.layerDistance * level;
        } else {
            node.x = self.layerDistance * level;
        }
        var temp = distribution[String(level)];
        if (temp == null) {
            temp = [];
        }
        temp.push(node);
        distribution[String(level)] = temp;
    });
    return distribution;
};

HierarchicalLayout.prototype.crawlNetwork = function (callbackFlag, nodeId) {
    var self = this;
    var startingNodeId = nodeId;
    var progress = {};
    var _treeIndex = 0;
    if (startingNodeId == -1) {
        self.nodeIdList.forEach(function (id) {
            var node = self.nodesIdMap[id];
            if (progress[id] == null) {
                progress = self.crawler(progress, node, callbackFlag, _treeIndex);
                _treeIndex++;
            }
        });
    } else {
        var node = self.nodesIdMap[startingNodeId];
        progress = self.crawler(progress, node, callbackFlag, -111);
    }
};

HierarchicalLayout.prototype.crawler = function (progress, node, callbackFlag, _treeIndex) {
    var self = this;
    if (progress[node.id] == null) {
        if (_treeIndex != -111) {
            if (self.hierarchicalTrees[node.id] == null) {
                self.hierarchicalTrees[node.id] = _treeIndex;
                self.treeIndex = Math.max(_treeIndex, self.treeIndex);
            }
        }
        progress[node.id] = true;
        var edgesIdsLength = node.edgesIds.length;
        for (var i = 0; i < edgesIdsLength; i++) {
            var edgeId = node.edgesIds[i];
            var edge = self.edges[edgeId];
            var childNode = self.NodeLocal();
            if (edge.toId == node.id) {
                childNode = self.nodesIdMap[edge.fromId];
            } else {
                childNode = self.nodesIdMap[edge.toId];
            }

            if (node.id != childNode.id) {
                if (callbackFlag == 'determineLevelsByHubsize') {
                    self.levelDownstream(node, childNode);
                } else if (callbackFlag == 'determineLevelsByDirected') {
                    self.levelByDirection(node, childNode, edge);
                } else if (callbackFlag == 'generateMap') {
                    self.fillInRelations(node, childNode);
                }
                self.crawler(progress, childNode, callbackFlag, _treeIndex);
            }
        }
    }
    return progress;
};

HierarchicalLayout.prototype.levelDownstream = function (source, nodeB) {
    var self = this;
    if (self.hierarchicalLevels[nodeB.id] == null) {
        if (self.hierarchicalLevels[source.id] == null) {
            self.hierarchicalLevels[source.id] = 0;
        }
        self.hierarchicalLevels[nodeB.id] = self.hierarchicalLevels[source.id] + 1;
    }
};

HierarchicalLayout.prototype.levelByDirection = function (source, nodeB, edge) {
    var self = this;
    var minLevel = 10000;
    if (self.hierarchicalLevels[source.id] == null) {
        self.hierarchicalLevels[source.id] = minLevel;
    }
    if (edge.toId == nodeB.id) {
        self.hierarchicalLevels[nodeB.id] = self.hierarchicalLevels[source.id] + 1;
    } else {
        self.hierarchicalLevels[nodeB.id] = self.hierarchicalLevels[source.id] - 1;
    }
};

HierarchicalLayout.prototype.fillInRelations = function (parentNode, childNode) {
    var self = this;
    if (self.hierarchicalLevels[childNode.id] > self.hierarchicalLevels[parentNode.id]) {
        if (self.hierarchicalChildrenReference[parentNode.id] == null) {
            self.hierarchicalChildrenReference[parentNode.id] = [];
        }
        self.hierarchicalChildrenReference[parentNode.id].push(childNode.id);
        if (self.hierarchicalParentReference[childNode.id] == null) {
            self.hierarchicalParentReference[childNode.id] = [];
        }
        self.hierarchicalParentReference[childNode.id].push(parentNode.id);
    }
};

HierarchicalLayout.prototype.placeNodesByHierarchy = function (distribution) {
    var self = this;
    for (var nodeId in distribution) {
        var nodesList = distribution[nodeId];
        var handledNodeCount = 0;
        var nodesListLength = nodesList.length;
        for (var i = 0; i < nodesListLength; i++) {
            var node = nodesList[i];
            if (self.positionedNodes[node.id] == null) {
                var pos = self.nodeDistance * handledNodeCount;
                if (handledNodeCount > 0) {
                    pos = self.getPositionForHierarchy(nodesList[i - 1]) + self.nodeDistance;
                }
                self.setPositionForHierarchy(node, pos, nodeId);
                self.validataPositionAndContinue(node, nodeId, pos);
                handledNodeCount++;
            }
        }
    }
};

HierarchicalLayout.prototype.getPositionForHierarchy = function (node) {
    var self = this;
    if (self.direction == 'UD' || self.direction == 'DU') {
        return node.x;
    }
    return node.y;
};

HierarchicalLayout.prototype.setPositionForHierarchy = function (node, position, level) {
    var self = this;
    if (level != -1) {
        level = String(level);
        if (self.distributionOrdering[level] == null) {
            self.distributionOrdering[level] = [];
            self.distributionOrderingPresence[level] = {};
        }
        if (self.distributionOrderingPresence[level][node.id] == null) {
            self.distributionOrdering[level].push(node);
            self.distributionIndex[node.id] = self.distributionOrdering[level].length - 1;
        }
        self.distributionOrderingPresence[level][node.id] = true;
    }

    if (self.direction == 'UD' || self.direction == 'DU') {
        node.x = position;
    } else {
        node.y = position;
    }
};

HierarchicalLayout.prototype.validataPositionAndContinue = function (node, level, pos) {
    var self = this;
    level = String(level);
    if (self.lastNodeOnLevel[level] != null) {
        var previousPos = self.getPositionForHierarchy(self.nodesIdMap[self.lastNodeOnLevel[level]]);
        if (pos - previousPos < self.nodeDistance) {
            var diff = previousPos + self.nodeDistance - pos;
            self.shiftBlock(node.id, diff);
        }
    }
    self.lastNodeOnLevel[level] = node.id;
    self.positionedNodes[node.id] = true;
    self.placeBranchNodes(node, level);
};

HierarchicalLayout.prototype.shiftBlock = function (parentId, diff) {
    var self = this;
    if (self.direction == 'UD' || self.direction == 'DU') {
        var _x = self.nodesIdMap[parentId].x;
        self.nodesIdMap[parentId].x = _x + diff;
    } else {
        var _y = self.nodesIdMap[parentId].y;
        self.nodesIdMap[parentId].y = _y + diff;
    }
};

HierarchicalLayout.prototype.placeBranchNodes = function (parentNode, parentLevel) {
    var self = this;
    if (self.hierarchicalChildrenReference[parentNode.id] == null) {
        return;
    }
    var childNodes = [];
    var length = self.hierarchicalChildrenReference[parentNode.id].length;
    for (var i = 0; i < length; i++) {
        childNodes.push(self.nodesIdMap[self.hierarchicalChildrenReference[parentNode.id][i]]);
    }
    var childNodesLength = childNodes.length;
    for (var i = 0; i < childNodesLength; i++) {
        var childNode = childNodes[i];
        var childNodeLevel = self.hierarchicalLevels[childNode.id];
        if ((childNodeLevel > parentLevel) && (self.positionedNodes[childNode.id] == null)) {
            var pos = 0;
            if (i == 0) {
                pos = self.getPositionForHierarchy(self.nodesIdMap[parentNode.id]);
            } else {
                pos = self.getPositionForHierarchy(childNodes[i - 1]) + self.nodeDistance;
            }
            self.setPositionForHierarchy(childNode, pos, childNodeLevel);
            self.validataPositionAndContinue(childNode, childNodeLevel, pos);
        } else if (self.continueOrBreak != 0) {
            return;
        }
    }
    var minPos = 1000000000,
        maxPos = -1000000000;
    for (var i = 0; i < childNodesLength; i++) {
        var childNode = childNodes[i];
        minPos = Math.min(minPos, self.getPositionForHierarchy(childNode));
        maxPos = Math.max(maxPos, self.getPositionForHierarchy(childNode));
    }
    var _pos = (minPos + maxPos) / 2;
    self.setPositionForHierarchy(parentNode, _pos, parentLevel);
};

HierarchicalLayout.prototype.runLayout = function () {
    if (this.inited) {
        this.goAlgo();
    }
    let nodes = this.nodes;
    let layoutNodes: { [key: string]: any } = {}
    for (let i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        layoutNodes[n.id] = {
            x: n.x * 223,
            y: n.y * 223,
            id: n.id
        }
    }
    return layoutNodes;
};

HierarchicalLayout.prototype.goAlgo = function () {
    var self = this;
    var position = null;
    var nodes = self.nodes;
    var length = nodes.length;

    for (var i = 0; i < length; i++) {
        var n = nodes[i];
        position = n.layoutData;
        if (position == null) {
            continue;
        }

        if (self.boolTransition) {
            var currentDistance = Math.abs(n.x - position.finishx);
            var nextDistance = Math.abs((n.x + position.xdistance) - position.finishx);
            if (nextDistance < currentDistance) {
                n.x += position.xdistance;
            } else {
                n.x = position.finishx;
            }

            currentDistance = Math.abs(n.y - position.finishy);
            nextDistance = Math.abs((n.y + position.ydistance) - position.finishy);
            if (nextDistance < currentDistance) {
                n.y += position.ydistance;
            } else {
                n.y = position.finishy;
            }

            if (n.x == position.finishx && n.y == position.finishy) {
                n.layoutData = null;
            }
        } else {
            n.x = position.finishx;
            n.y = position.finishy;
            n.layoutData = null;
        }
    }
};

export default HierarchicalLayout