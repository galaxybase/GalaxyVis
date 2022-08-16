import { lcg } from './util'

import dispatch from '../../dispatch'
import { timer } from '../../timer'

export function x(d: any) {
    return d.x
}

export function y(d: any) {
    return d.y
}

var initialRadius = 0,
    initialAngle = Math.PI * (3 - Math.sqrt(5))

export default function forceSimulation(nodes?: any) {
    var simulation: any,
        alpha = 1.0,
        alphaMin = 0.001,
        // alpha衰减率
        alphaDecay = 0.0228,
        alphaTarget = 0,
        // 速度衰减
        // 较低的衰减系数可以使得迭代次数更多，其布局结果也会更理性，
        // 但是可能会引起数值不稳定从而导致震荡
        velocityDecay = 0.81,
        forces = new Map(),
        // @ts-ignore
        stepper = timer(step),
        // tick事件与end事件
        // @ts-ignore
        event = dispatch('tick', 'end'),
        random = lcg()

    if (nodes == null) nodes = []

    function step() {
        tick()
        event.call('tick', simulation)
        if (alpha < alphaMin) {
            stepper.stop()
            event.call('end', simulation)
        }
    }

    function tick(iterations?: any) {
        var i,
            n = nodes.length,
            node

        if (iterations === undefined) {
            iterations = 1
            stepper.stop()
            event.call('end', simulation)
            return
        }
        for (var k = 0; k < iterations; ++k) {
            // alpha不断衰减
            alpha += (alphaTarget - alpha) * alphaDecay

            //  不停迭代
            forces.forEach(function (force) {
                force(alpha)
            })
            // 速度转化为距离改变
            for (i = 0; i < n; ++i) {
                node = nodes[i]
                if (node.fx == null) node.x += node.vx *= velocityDecay
                // 具有fx，说明当前节点被控制，不需要受到力的影响，速度置为0
                else (node.x = node.fx), (node.vx = 0)
                if (node.fy == null) node.y += node.vy *= velocityDecay
                else (node.y = node.fy), (node.vy = 0)
            }
        }

        return simulation
    }

    // 初始化导入节点
    // 对于每一个节点进行预处理，节点按一定的半径和旋转角度环绕起来，
    // vx 与 vy 分别表示节点在 x 轴和 y 轴方向上的速度分量
    function initializeNodes() {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
            ;(node = nodes[i]), (node.index = i)
            if (node.fx != null) node.x = node.fx
            if (node.fy != null) node.y = node.fy
            if (isNaN(node.x) || isNaN(node.y)) {
                var radius = initialRadius * Math.sqrt(0.5 + i),
                    angle = i * initialAngle
                node.x = radius * Math.cos(angle)
                node.y = radius * Math.sin(angle)
            }
            if (isNaN(node.vx) || isNaN(node.vy)) {
                node.vx = node.vy = 0
            }
        }
    }

    function initializeForce(force: any) {
        if (force.initialize) force.initialize(nodes, random)
        return force
    }

    initializeNodes()

    return (simulation = {
        tick: tick,
        // 重启力模拟
        restart: function () {
            return stepper.restart(step), simulation
        },
        // 暂停力模拟
        stop: function () {
            return stepper.stop(), simulation
        },
        // 设置力模拟的节点
        nodes: function (_: any) {
            return arguments.length
                ? ((nodes = _), initializeNodes(), forces.forEach(initializeForce), simulation)
                : nodes
        },
        // 添加或移除力
        force: function (name: any, _: any) {
            return arguments.length > 1
                ? (_ == null ? forces.delete(name) : forces.set(name, initializeForce(_)),
                  simulation)
                : forces.get(name)
        },
        // 添加或移除事件监听器
        on: function (name: any, _: any) {
            return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name)
        },
        // 查找给定位置最近的节点
        find: function (x: any, y: any, radius: any) {
            var i = 0,
                n = nodes.length,
                dx,
                dy,
                d2,
                node,
                closest

            if (radius == null) radius = Infinity
            else radius *= radius

            for (i = 0; i < n; ++i) {
                node = nodes[i]
                dx = x - node.x
                dy = y - node.y
                d2 = dx * dx + dy * dy
                if (d2 < radius) (closest = node), (radius = d2)
            }

            return closest
        },
        // 设置当前艾尔法的值
        alpha: function (_: any) {
            return arguments.length ? ((alpha = +_), simulation) : alpha
        },
        // 设置艾尔法最小阈值
        alphaMin: function (_: any) {
            return arguments.length ? ((alphaMin = +_), simulation) : alphaMin
        },
        // 设置艾尔法值衰减速率
        alphaDecay: function (_: any) {
            return arguments.length ? ((alphaDecay = +_), simulation) : +alphaDecay
        },
        // 设置目标艾尔法
        alphaTarget: function (_: any) {
            return arguments.length ? ((alphaTarget = +_), simulation) : alphaTarget
        },
    })
}
