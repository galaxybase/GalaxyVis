import { genID } from '..'
import { ClassOptions, PlainObject, RuleOptions } from '../../types'
import { basicData, globalInfo } from '../../initial/globalProp'
import { StyleRule } from '../../classes/styleRule'
import { merge } from 'lodash'
import { StyleClass } from '../../classes/styleClass'

let classList: { [key: string]: any } = {}
/**
 * 添加规则
 * @param options
 * @param name
 * @returns
 */
export const stylesAddRule = (galaxyvis: any, options: RuleOptions) => {
    let { edgeAttributes, nodeAttributes, edgeSelector, nodeSelector, name } = options

    let nodeList = basicData[galaxyvis.id].nodeList

    let ruleName = name || `rule_${genID(8)}`
    options.name = ruleName
    globalInfo[galaxyvis.id].ruleList.set(ruleName, options)
    stylesCreateClass(
        galaxyvis,
        {
            name: ruleName,
            edgeAttributes,
            nodeAttributes,
        },
        true,
    )

    nodeList.forEach((item: any, key: string) => {
        if (nodeSelector && nodeSelector(item)) {
            item.addClass(ruleName, 2, false)
        }
        if (!nodeSelector && nodeAttributes) {
            item.addClass(ruleName, 2, false)
        }
    })

    let edgeList = basicData[galaxyvis.id].edgeList

    edgeList.forEach((item: any, key: string) => {
        if (edgeSelector && edgeSelector(item)) {
            item.addClass(ruleName, 2, false)
        }
        if (!edgeSelector && edgeAttributes) {
            item.addClass(ruleName, 2, false)
        }
    })

    if (ruleName && ruleName !== "geo-class") {
        if(nodeAttributes && nodeAttributes.radius)
            galaxyvis.geo.enabled() && galaxyvis.geo.updateGeoClass()
        !galaxyvis.geo.enabled() && galaxyvis.render()
    } else {
        galaxyvis.render()
    }
    return new StyleRule(galaxyvis, ruleName, options, stylesAddRule, 2)
}
/**
 * 创建class
 * @param options
 * @returns
 */
export const stylesCreateClass = (galaxyvis: any, options: ClassOptions, useRule = false) => {
    let { name, edgeAttributes, nodeAttributes } = options
    !name && (options.name = name = `class_${genID(8)}`)
    classList[name] = { edgeAttributes, nodeAttributes }
    if (!useRule) {
        let nodeList = basicData[galaxyvis.id].nodeList
        nodeList.forEach((item: any) => {
            item.addClass(name, 1, false)
        })
        let edgeList = basicData[galaxyvis.id].edgeList
        edgeList.forEach((item: any) => {
            item.addClass(name, 1, false)
        })

        if (name && name !== "geo-class") {
            if(nodeAttributes && nodeAttributes.radius)
                galaxyvis.geo.enabled() && galaxyvis.geo.updateGeoClass()
            !galaxyvis.geo.enabled() && galaxyvis.render()
        } else {
            galaxyvis.render()
        }
    } else {
        return
    }

    return new StyleClass(galaxyvis, name, options, stylesCreateClass, 1)
}
/**
 * 获取classlist
 * @returns
 */
export const stylesGetClassList = () => {
    return classList
}
/**
 * 获取单独的class
 * @param className
 * @returns
 */
export const stylesGetClass = (className: string) => {
    return classList[className] || null
}
/**
 * 设置hover点样式
 * @param nodeAttributes
 */
 export const stylesSetHoveredNodeAttributes = (
    galaxyvis: any,
    nodeAttributes: PlainObject<any>,
) => {

    let id = galaxyvis.id

    let rule = '$rule$_galaxyvis_hovered_node_style_' + id; 

    let hoveNodeAttribute = globalInfo[id].nodeHoverStyle

    hoveNodeAttribute['rule'] = rule

    hoveNodeAttribute['nodeAttributes'] = merge(hoveNodeAttribute['nodeAttributes'], nodeAttributes)

    globalInfo[id].nodeHoverStyle = hoveNodeAttribute

    classList[rule] = { nodeAttributes: hoveNodeAttribute.nodeAttributes }
}
/**
 * 设置边hover样式
 * @param edgeAttributes
 */
export const stylesSetHoveredEdgeAttributes = (
    galaxyvis: any,
    edgeAttributes: PlainObject<any>,
) => {

    let id = galaxyvis.id

    let rule = '$rule$_galaxyvis_hovered_edge_style_' + id;

    let hoveEdgeAttribute = globalInfo[id].edgeHoverStyle

    hoveEdgeAttribute['rule'] = rule

    hoveEdgeAttribute['edgeAttributes'] = merge(hoveEdgeAttribute['edgeAttributes'], edgeAttributes)

    globalInfo[id].edgeHoverStyle = hoveEdgeAttribute

    classList[rule] = { edgeAttributes: hoveEdgeAttribute.edgeAttributes }
}
/**
 * 设置点select样式
 * @param nodeAttributes
 */
export const stylesSetSelectedNodeAttributes = (
    galaxyvis: any,
    nodeAttributes: PlainObject<any>,
) => {
    let id = galaxyvis.id

    let rule = '$rule$_galaxyvis_selected_node_style_' + id;

    let selectNodeAttribute = globalInfo[id].nodeSelectStyle

    selectNodeAttribute['rule'] = rule

    selectNodeAttribute['nodeAttributes'] = merge(
        selectNodeAttribute['nodeAttributes'],
        nodeAttributes,
    )

    globalInfo[id].nodeSelectStyle = selectNodeAttribute

    classList[rule] = { nodeAttributes: selectNodeAttribute.nodeAttributes }
}
/**
 * 设置边select样式
 * @param edgeAttributes
 */
export const stylesSetSelectedEdgeAttributes = (
    galaxyvis: any,
    edgeAttributes: PlainObject<any>,
) => {

    let id = galaxyvis.id

    let rule = '$rule$_galaxyvis_selected_edge_style_' + id

    let selectEdgeAttribute = globalInfo[id].edgeSelectStyle

    selectEdgeAttribute['rule'] = rule

    selectEdgeAttribute['edgeAttributes'] = merge(
        selectEdgeAttribute['edgeAttributes'],
        edgeAttributes,
    )

    globalInfo[id].edgeSelectStyle = selectEdgeAttribute

    classList[rule] = { edgeAttributes: selectEdgeAttribute.edgeAttributes }
}
