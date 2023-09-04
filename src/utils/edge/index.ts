import cloneDeep from 'lodash/cloneDeep'
import defaultsDeep from 'lodash/defaultsDeep'
import clone from 'lodash/clone'
import merge from 'lodash/merge'
import { basicData, globalProp } from '../../initial/globalProp'
import { originInfo } from '../../initial/originInitial'
import { TEPLATE } from '../../initial/settings'
import { drawText } from '../tinySdf/sdfDrawText'
import { hashNumber, initText, switchSelfLinePostion, updateSDFTextData } from '../../utils'
import { mouseAddEdgeClass, mouseRemoveEdgeClass } from '../mouse'
import { Bezier } from './bezier'
import { bezier3 } from '../../renderers/canvas/edgeCanvas/commom'
import exportList from '../../classes/edgeList'

/**
 * 边设置选中或者未选中
 * @param that
 * @param active ture/false
 */
export const edgeSetSelected = (
    that: any,
    active: boolean,
    update = true,
    edgeLsit: boolean = false,
) => {
    let isSelect = that.getAttribute('isSelect')
    let sucess = 0
    let GraphId = that.id
    let { selectedEdges, selectedEdgeTable, selectedTable } = basicData[GraphId]
    if (isSelect !== active) {
        let { id } = that.value,
            targetNode = that.getTarget(),
            sourceNode = that.getSource()
        if (active) {
            selectedEdges.add(id)
            selectedEdgeTable.add(id)
            targetNode.setSelected(true, false, true)
            sourceNode.setSelected(true, false, true)
            sucess = 1
            mouseAddEdgeClass(GraphId, id)
            if (!edgeLsit) {
                let scene = that.__proto__
                let edgeList = new exportList(scene, [id])
                that.events.emit('edgesSelected', edgeList)
            }
        } else {
            if (selectedEdges.has(id)) {
                mouseRemoveEdgeClass(GraphId, id)
                selectedEdges.delete(id)
                selectedEdgeTable.delete(id)
                targetNode.setSelected(false, false, true)
                sourceNode.setSelected(false, false, true)
                sucess = 2
                if (!edgeLsit) {
                    let scene = that.__proto__
                    let edgeList = new exportList(scene, [id])
                    that.events.emit('edgesUnselected', edgeList)
                }
            }
        }
        that.changeAttribute({ isSelect: active })
        sourceNode.changeAttribute({ isSelect: active })
        targetNode.changeAttribute({ isSelect: active })

        if (update) {
            selectedTable.add(that.getId())
            that.selectMovefresh()
        }
        return sucess
    }
}

/**
 * 改变边上的属性和set不同的是这个不调用render
 * @param that
 * @param attribute 属性
 * @param useSet 是否为setAttribute
 * @returns
 */
export const edgeChangeAttribute = (that: any, attribute: any, useSet: boolean = false) => {
    try {
        attribute = defaultsDeep(that.initAttribute(attribute, useSet))
        let attributes = clone(that.value.attribute)
        that.value.attribute = merge(attributes, attribute)

        let originEdge = clone(originInfo[that.id].edgeList.get(that.value.id))
        originEdge = merge(originEdge, attribute)

        originInfo[that.id].edgeList.set(that.value.id, originEdge)

        return true
    } catch (error) {
        console.warn(error)
        return false
    }
}

export const edgeChangeAttributes = (that: any, attribute: any) =>{
    try {
        attribute = defaultsDeep(that.initAttribute(attribute, false))
        let attributes = cloneDeep(that.value.attribute)
        that.value.attribute = merge(attributes, attribute)

        let originEdge = cloneDeep(originInfo[that.id].edgeList.get(that.value.id))
        originEdge = merge(originEdge, attribute)

        originInfo[that.id].edgeList.set(that.value.id, originEdge)

        return true
    } catch (error) {
        console.warn(error)
        return false
    }
}
/**
 * 格式化边上的属性
 * @param that
 * @param attribute 属性
 * @param useSet 是否是setAttribute
 * @returns
 */
export const edgeInitAttribute = (that: any, attribute: any, useSet: boolean = false) => {
    let attributes
    if (useSet) attributes = cloneDeep(that.value.attribute)
    if (attribute?.text) {
        if (typeof attribute.text == 'string') {
            attribute.text = {
                content: attribute.text,
            }
        }
        if (!useSet) {
            attribute.text = {
                ...TEPLATE.textTemplate,
                position: 'top',
                ...attribute.text,
            }
        } else {
            attribute.text = {
                ...attributes.text,
                ...attribute.text,
            }
        }
        let thumbnail = that instanceof String || that == null ? that : that.thumbnail
        if (that.renderer === 'webgl' && !thumbnail) {
            let flag = updateSDFTextData(attribute?.text, that.id)
            if (flag) initText(that)
            drawText(
                attribute.text.fontSize,
                attribute.text.content,
                attribute.text.maxLength,
                attribute.text.style,
            )
        }
    }
    if (attribute?.shape) {
        if (typeof attribute.shape == 'string') {
            attribute.shape = {
                head: attribute.shape,
            }
        }
    }
    return attribute
}

/**
 * 获取source点
 * @param that
 * @returns
 */
export const edgeGetSource = (that: any) => {
    let source = that.value.source
    return basicData[that.id].nodeList.get(source) || source
}
/**
 * 获取target点
 * @param that
 * @returns
 */
export const edgeGetTarget = (that: any) => {
    let target = that.value.target
    return basicData[that.id].nodeList.get(target) || target
}
/**
 * 获取两点之间的中间控制点
 * @param that
 * @returns
 */
export const edgeGetMiddlePoint = (that: any, withOutInit = false, InitAttribute?: any) => {
    var source,
        target,
        size,
        lineNumber: any,
        bezierX,
        bezierY,
        sourceX,
        sourceY,
        targetX,
        targetY,
        forward: any
    // 获取两边之间的类型
    if (!withOutInit) {
        var { baseTypeHash } = that.getEdgeType(),
            source = edgeGetSource(that), //起始点
            target = edgeGetTarget(that), //终止点
            sourceNumber = source.value.num,
            targetNumber = target.value.num,
            hash = hashNumber(sourceNumber, targetNumber), //两点之间的hash值
            hashSet = baseTypeHash.get(hash), //两点之间hash表
            size = hashSet?.num,
            lineNumber = [...hashSet.total].indexOf(that.getId()) as any,
            forwardSource =
                lineNumber != 0
                    ? basicData[that.id].edgeList.get([...hashSet.total][lineNumber - 1]).value
                        .source
                    : undefined,
            forward = (
                size % 2 == 0
                    ? lineNumber % 2 == 1 && source.getId() != forwardSource
                        ? 1
                        : -1
                    : lineNumber % 2 == 0 && source.getId() != forwardSource
                        ? 1
                        : -1
            ) as any,
            { x: sourceX, y: sourceY, radius } = source.getAttribute(),
            { x: targetX, y: targetY } = target.getAttribute()
    } else {
        var { size, lineNumber, sourceX, sourceY, targetX, targetY, forward } = InitAttribute
        source = edgeGetSource(that) //起始点
        target = edgeGetTarget(that) //终止点
        if (source === target) {
            radius = source.getAttribute('radius')
        }
    }

    let cn1 = {
        x: 0,
        y: 0,
    },
        cn2;
    // 非自环边
    if (source.getId() != target.getId()) {
        size > 1 && size % 2 == 0 && lineNumber++
        let po = 5,
            midx = (sourceX + targetX) / 2,
            midy = (sourceY + targetY) / 2, //计算中心点
            distanceX = (targetX - sourceX) * forward,
            distanceY = (targetY - sourceY) * forward,
            XYdistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY),
            moveX = distanceY,
            moveY = -distanceX,
            // 判断是不是中心条
            numOfLine = lineNumber == 0 ? 0 : Math.ceil(lineNumber / 2) * Math.pow(-1, lineNumber),
            // 计算贝塞尔曲线的控制点
            c = -numOfLine / po
        if (XYdistance == 0) {
            cn1.x = midx
            cn1.y = midy
        }
        cn1.x = midx + moveX * c
        cn1.y = midy + moveY * c

        bezierX = Bezier(sourceX, cn1.x, targetX, 0.5)
        bezierY = Bezier(sourceY, cn1.y, targetY, 0.5)
    } else {
        // 自环边
        if (that.renderer === 'canvas') {
            const ratio =  6 * Math.tan((70 * Math.PI) / 360)
            let scale = (globalProp.globalScale / ratio) * 2.0
            radius = scale * ((lineNumber) * 40 + radius * 5)
        } else {
            const transform = (basicData[that.id]?.transform || 223)
            radius = ((lineNumber) * 60 + (radius + 2) * 6) * (transform / 150)
        }
        let { location } = that.getAttribute(),
            { controlCoordOne: pot1, controlCoordTwo: pot2 } = switchSelfLinePostion(
                that.renderer,
                location,
                sourceX,
                sourceY,
                radius,
                false,
            );
        cn1 = { x: pot1[0], y: pot1[1] };
        cn2 = { x: pot2[0], y: pot2[1] };
        let bezierMid = bezier3(
            0.5,
            { x: sourceX, y: sourceY },
            { x: pot1[0], y: pot1[1] },
            { x: pot2[0], y: pot2[1] },
            { x: sourceX, y: sourceY },
        );

        bezierX = bezierMid.x;
        bezierY = bezierMid.y;
    }

    return {
        x: bezierX,
        y: bezierY,
        controlNodes: {
            cn1,
            cn2
        }
    }
}
