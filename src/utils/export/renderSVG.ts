import { cloneDeep } from 'lodash'
import { hashNumber, isIE, transformCanvasCoord } from '..'
import { globalInfo, globalProp } from '../../initial/globalProp'
import { getLines } from '../../renderers/canvas/labelCanvas/common'
import {
    clipPathSvg,
    drawNodeSvg,
    fetchBinaryAsBase64,
    getFontFamil,
    iconSvgSetAttribute,
    imageSvgSetAttribute,
    nodeStrokePathSvg,
    startTrans,
    svgInnerHTML,
    textBaseSvgSetAttribute,
} from './common'
import { svgEdgeDef, svgEdgeParallel, svgEdgeSelf } from './edge'

var svgGraph: any = null
var ratio: any = 0
var position: any = [0, 0, 3]
var scale: any = 0
var thumbnail = false
let imageNumer: number = 0
let nodeRender: number = 0
let svgContent: any = null;
let svgRender: any
let defsStyle: any

var xmlns = isIE() ? 'http://www.w3.org/2000/svg' : 'xmlns'

export const renderSVG = (graph: any, svg: any) => {
    xmlns = isIE() ? 'http://www.w3.org/2000/svg' : 'xmlns'
    svgRender = svg
    imageNumer = 0
    nodeRender = 0
    svgGraph = graph
    // 获取当前缩放
    ratio = graph.camera.ratio
    // 获取相机当前位置
    position = cloneDeep(graph.camera.position)
    // 适配postion和zoom
    if (graph.renderer === 'webgl') {
        let width = globalInfo[graph.id].BoxCanvas.getWidth,
            height = globalInfo[graph.id].BoxCanvas.getHeight,
            unitWidth = width / ratio,
            unitHeight = height / ratio,
            aspectRatio = width / height
        position[0] = (-position[0] / aspectRatio) * unitWidth
        position[1] = position[1] * unitHeight

        let svgCanvas = document.createElement('canvas')
        svgCanvas.style.width = width + 'px'
        svgCanvas.style.height = height + 'px'
        svgCanvas.height = height
        svgCanvas.width = width
        svgContent = svgCanvas.getContext('2d')
    } else {
        svgContent = svgGraph?.ctx
    }
    // 获取相机缩放比
    scale = (globalProp.globalScale / ratio) * 2.0
    thumbnail = graph.thumbnail
    // svg.setAttributeNS('http://www.w3.org/2000/xmlns/', xmlns, 'http://www.w3.org/2000/svg');
    // svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    // 点集合
    let nodeGroup = document.createElementNS(xmlns, 'g')
    nodeGroup.setAttributeNS(null, 'id', 'cl-nodes')
    // 点halo集合
    let nodeHaloGroup = document.createElementNS(xmlns, 'g')
    nodeHaloGroup.setAttributeNS(null, 'id', 'cl-nodehalos')
    // 边集合
    let edgeGroup = document.createElementNS(xmlns, 'g')
    edgeGroup.setAttributeNS(null, 'id', 'cl-edges')
    // 样式集合 + 切割环
    defsStyle = document.createElementNS(xmlns, 'defs')
    svg.appendChild(defsStyle)

    return new Promise((reslove, reject) => {
        // 获取icon的url地址
        getFontFamil()
            .then(val => {
                return Promise.all(
                    val.map(function (val: any) {
                        var formats = val.formats,
                            originalRule = val.originalRule
                        return Promise.all(
                            formats.map(function (str: any) {
                                var format = str.format,
                                    url = str.url
                                if (0 === url.indexOf('http://') || 0 === url.indexOf('https://')) {
                                    return fetchBinaryAsBase64(url)
                                        .then(function (src) {
                                            return {
                                                format,
                                                src,
                                            }
                                        })
                                        .catch(function () {
                                            return null
                                        })
                                } else {
                                    return {
                                        format,
                                        src: url,
                                    }
                                }
                            }),
                        ).then(function (val) {
                            for (var srcArray = [], i = 0; i < val.length; i++) {
                                var thisVal: any = val[i]
                                null !== thisVal &&
                                    srcArray.push(
                                        "url('" +
                                        thisVal.src +
                                        "') format('" +
                                        thisVal.format +
                                        "')",
                                    )
                            }
                            if (0 === srcArray.length) return originalRule
                            var src = 'src: ' + srcArray.join(',') + ';'
                            return originalRule.replace(/src\s*:[^;]+;/g, src)
                        })
                    }),
                )
            })
            .then(function (val) {
                if (0 !== val.length) {
                    for (var i = 0; i < val.length; i++) {
                        let style = document.createElementNS(xmlns, 'style')
                        // style.innerHTML = val[i]
                        svgInnerHTML(style, val[i])
                        defsStyle.appendChild(style)
                    }
                }
            })
            .then(() => {
                // halo
                renderNodeHalo(graph.id, nodeHaloGroup)
                svg.appendChild(nodeHaloGroup)
                // edge
                renderEdge(graph.id, edgeGroup)
                svg.appendChild(edgeGroup)
                // node
                renderNode(graph.id, nodeGroup)
                // 轮询 解决图片异步的问题
                let interval = setInterval(() => {
                    if (nodeRender === imageNumer) {
                        svg.appendChild(nodeGroup)
                        clearInterval(interval)
                        reslove(true)
                    }
                }, 100)
            })
    })
}

const renderNode = (graphId: any, nodeGroup: any) => {
    let nodesList = svgGraph.getFilterNode()

    let clipG = document.createElementNS(xmlns, 'g')
    defsStyle.appendChild(clipG)

    for (let [key, item] of nodesList) {
        let node = document.createElementNS(xmlns, 'g')
        node.setAttributeNS(null, 'data-node-id', key)
        // 获取点属性
        let attributes = item.getAttribute()
        let {
            color,
            x,
            y,
            radius: size,
            innerStroke,
            shape,
            icon,
            image,
            text,
            badges,
            opacity,
        } = attributes

        let { color: unSelectedColor, width: borderSize } = innerStroke

        if (opacity == 0.0) continue

        borderSize /= 100
        // 根据默认比例缩放当前点的大小
        size = size * scale
        // 根据相机位置更改点的初始位置
        let coord = transformCanvasCoord(graphId, x, y, position, scale, thumbnail)
            ; (x = coord.x), (y = coord.y)

        let clipPath = clipPathSvg(
            key,
            drawNodeSvg(shape, x, y, size - (borderSize / 0.8) * size),
            color,
        )

        defsStyle.appendChild(clipPath)

        let nodePath = document.createElementNS(xmlns, 'path')
        nodePath.setAttributeNS(null, 'd', drawNodeSvg(shape, x, y, size))
        nodePath.setAttributeNS(null, 'fill', color)
        nodePath.setAttributeNS(null, 'fill-opacity', '1')

        node.appendChild(nodePath)

        // 图片地址
        if (image.url != '') {
            imageNumer++
            let imageSvg = imageSvgSetAttribute(
                x - (size + (borderSize / 0.2) * size),
                y - (size + (borderSize / 0.2) * size),
                (size + (borderSize / 0.2) * size) * 2,
                (size + (borderSize / 0.2) * size) * 2,
            )

            var imageCreated = new Image()
            // 跨域
            imageCreated.setAttribute('crossOrigin', 'anonymous')
            imageCreated.onload = () => {
                // 将图片地址转换为base64
                startTrans(image.url, function (base64: any) {
                    imageSvg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', base64)
                    nodeRender++
                })
                // 使用clip-path
                imageSvg.setAttributeNS(null, 'clip-path', 'url(#clip-path-' + key + ')')
            }
            imageCreated.src = image.url

            node.appendChild(imageSvg)
        } else if (icon.content != '') {
            let g = iconSvgSetAttribute(icon, size, x, y)
            node.appendChild(g)
        }
        // 创建点
        let nodeStokePath = nodeStrokePathSvg(
            drawNodeSvg(shape, x, y, size),
            (borderSize / 0.4) * size + '',
            unSelectedColor,
        )

        node.appendChild(nodeStokePath)
        // 创建badges
        if (badges) {
            let badgesArray = Object.keys(badges)
            for (let i = 0; i < badgesArray.length; i++) {
                let badgesG = document.createElementNS(xmlns, 'g')
                let { color: badgesColor, scale: badgesScale, text, stroke, image } = badges[badgesArray[i]];
                badgesScale = badgesScale || 0.35
                // 点大小
                let radius = size * badgesScale
                // 颜色
                badgesColor = badgesColor == 'inherit' ? color : badgesColor ? badgesColor : '#fff'
                // 旋转
                let rotate = (Math.PI * 45) / 180
                // 默认位置
                let postion = badgesArray[i] || 'bottomRight'
                // 不同位置
                let direction = globalProp.direction
                // badges的中心坐标
                let newX = x + direction[postion][0] * (size - 2) * Math.sin(rotate)
                let newY = y + direction[postion][1] * (size - 2) * Math.cos(rotate)
                // 外环
                let { color: strokeColor, width: storkeWidth } = stroke

                let nodePath = document.createElementNS(xmlns, 'path')
                nodePath.setAttributeNS(null, 'd', drawNodeSvg('circle', newX, newY, radius))
                nodePath.setAttributeNS(null, 'fill', badgesColor)
                nodePath.setAttributeNS(null, 'fill-opacity', '1')
                badgesG.appendChild(nodePath)
                // badges的图片加载
                if (image) {
                    imageNumer++
                    let clipPath = clipPathSvg(
                        key,
                        drawNodeSvg('circle', newX, newY, radius + (storkeWidth * size) / 40),
                        color,
                    )

                    defsStyle.appendChild(clipPath)

                    let imageSvg = imageSvgSetAttribute(
                        newX - (radius - (storkeWidth * size) / 40),
                        newY - (radius - (storkeWidth * size) / 40),
                        (radius - (storkeWidth * size) / 40) * 2,
                        (radius - (storkeWidth * size) / 40) * 2,
                    )

                    var imageCreated = new Image()
                    imageCreated.setAttribute('crossOrigin', 'anonymous')
                    imageCreated.onload = () => {
                        nodeRender++
                        startTrans(image, function (base64: any) {
                            imageSvg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', base64)
                        })
                        imageSvg.setAttributeNS(null, 'clip-path', 'url(#clip-path-badges-' + key + ')')
                    }
                    imageCreated.src = image
                    badgesG.appendChild(imageSvg)
                } else if (text?.content) {
                    let g = iconSvgSetAttribute(text, radius - (storkeWidth * size) / 20, newX, newY)
                    badgesG.appendChild(g)
                }

                let nodeStokePath = nodeStrokePathSvg(
                    drawNodeSvg('circle', newX, newY, radius),
                    (storkeWidth * size) / 20 + '',
                    strokeColor,
                )
                badgesG.appendChild(nodeStokePath)
                node.appendChild(badgesG)
            }
        }

        // 加载文字
        let {
            color: textColor,
            position: textPosition,
            margin = [0, 0],
            fontSize: textFontSize,
            maxLength,
            background,
            content: textLabel,
            style = 'normal',
            fontFamily = 'Arial',
        } = text

        if (textLabel && textLabel != '') {
            // 字体的偏移量
            let labelOffsetX, labelOffsetY

            labelOffsetX = 0
            labelOffsetY = textFontSize / 3

            textFontSize = Math.ceil(textFontSize * (scale / 2))

            let textG = textBaseSvgSetAttribute(
                fontFamily,
                textFontSize,
                style,
                textColor,
                background,
            )
            // 位置偏移量
            switch (textPosition) {
                case 'bottom':
                    labelOffsetY = +size + textFontSize + 3
                    break
                case 'center':
                    break
                case 'left':
                    labelOffsetX = -size - 3
                    break
                case 'top':
                    labelOffsetY = -size - textFontSize / 4
                    break
                case 'right':
                    labelOffsetX = +size + 3
                    break
                default:
                    break
            }
            // 文字换行
            var lines = getLines(textLabel, maxLength),
                baseX = x + labelOffsetX + margin[0] * 100,
                baseY = Math.round(y + labelOffsetY + margin[1] * 100)
            if (textPosition == 'left' || textPosition == 'right') {
                let context = svgContent
                context.textAlign = 'left'
                context.font = `${textFontSize / 2}px ${fontFamily}`
                let width = context?.measureText(lines[0]).width || 0
                baseX = textPosition == 'left' ? baseX - width : baseX + width
            }
            for (var i = 0; i < lines.length; ++i) {
                var textSvg = document.createElementNS(xmlns, 'text')
                textSvg.setAttributeNS(null, 'x', baseX)
                textSvg.setAttributeNS(null, 'y', baseY + i * (textFontSize + 1) + '')
                // textSvg.innerHTML = lines[i]
                svgInnerHTML(textSvg, lines[i])

                textG.appendChild(textSvg)
            }

            node.appendChild(textG)
        }

        nodeGroup.appendChild(node)
    }
}
// 加载halo
const renderNodeHalo = (graphId: any, nodeHaloGroup: any) => {
    let nodesList = svgGraph.getFilterNode()
    nodesList.forEach((item: any, key: string) => {
        let attribute = item.getAttribute()
        if (attribute.halo?.width != 0) {
            let { x, y, radius: size, halo } = attribute
            let { color, width } = halo
            // 根据默认比例缩放当前点的大小
            let haloWidth = (Number(size) + width / 2) * scale
            // 根据相机位置更改点的初始位置
            let coord = transformCanvasCoord(graphId, x, y, position, scale, thumbnail)
                ; (x = coord.x), (y = coord.y)
            let g = document.createElementNS(xmlns, 'g')
            g.setAttributeNS(null, 'data-node-id', 'halo-node-' + key)
            let nodePath = document.createElementNS(xmlns, 'path')
            nodePath.setAttributeNS(null, 'd', drawNodeSvg('circle', x, y, haloWidth))
            nodePath.setAttributeNS(null, 'fill', color)
            nodePath.setAttributeNS(null, 'fill-opacity', '1')
            g.appendChild(nodePath)
            nodeHaloGroup.appendChild(g)
        }
    })
}
//加载边
const renderEdge = (graphId: any, edgeGroup: any) => {
    let edgesList = svgGraph.getFilterEdges()
    let nodeList = svgGraph.getFilterNode()
    // 获取个边的类型
    let edgeType = svgGraph.getEdgeType()

    let {
        typeHash, //parallel类型的hash表
        baseTypeHash, //basic类型的hash表
    } = edgeType

    var strategies: { [key: string]: Function } = {
        // 绘制基础边
        basic: (
            g: any,
            source: string,
            target: string,
            data: any,
            sourceX: number,
            sourceY: number,
            targetX: number,
            targetY: number,
            num: number,
            forward: number,
            sourceSize: number,
            targetSize: number,
        ) => {
            if (source !== target) {
                // 非自环边
                return svgEdgeDef(
                    graphId,
                    g,
                    ratio,
                    position,
                    data,
                    sourceX,
                    sourceY,
                    targetX,
                    targetY,
                    targetSize,
                    num,
                    forward,
                    thumbnail,
                )
            } else {
                // 自环边
                return svgEdgeSelf(
                    graphId,
                    g,
                    ratio,
                    position,
                    data,
                    sourceX,
                    sourceY,
                    sourceSize,
                    num,
                    thumbnail,
                )
            }
        },
        // 绘制进阶的边
        parallel: (
            g: any,
            source: string,
            target: string,
            data: any,
            sourceX: number,
            sourceY: number,
            targetX: number,
            targetY: number,
            num: number,
            forward: number,
            sourceSize: number,
            targetSize: number,
        ) => {
            if (source === target) {
                throw new Error('parallel类型的线不支持自环边')
            } else {
                // parallel的边
                return svgEdgeParallel(
                    graphId,
                    g,
                    ratio,
                    position,
                    data,
                    sourceX,
                    sourceY,
                    targetX,
                    targetY,
                    num,
                    forward,
                    sourceSize,
                    targetSize,
                    thumbnail,
                )
            }
        },
    }

    let forwadHashTable: any = new Map()
    for (let [key, item] of edgesList) {
        let value = item.value,
            source = value.source,
            target = value.target,
            attribute = item.getAttribute()
        // 如果被隐藏则跳过
        if (!attribute.isVisible || attribute.opacity == 0.0) continue
        let { type, halo, location } = attribute,
            { attribute: souce_attribute, num: sourceNumber } = nodeList.get(source).value,
            { attribute: target_attribute, num: targetNumber } = nodeList.get(target).value,
            hash = hashNumber(sourceNumber, targetNumber), //两点之间的hash值
            forwardSource = forwadHashTable?.get(hash)?.sourceNumber,
            hashSet = type == 'basic' ? baseTypeHash.get(hash) : typeHash.get(hash), //两点之间hash表
            size = hashSet?.num
        if (!size) continue
        let lineNumber = [...hashSet.total].indexOf(key);

        if (globalInfo[graphId].enabledNoStraightLine) {
            size == 1 && size++
            size % 2 !== 0 && lineNumber++
        }

        let forward =
            lineNumber == 0
                ? 1
                : size % 2 == 0
                    ? lineNumber % 2 == 1 && sourceNumber != forwardSource
                        ? -1
                        : 1
                    : lineNumber % 2 == 0 && sourceNumber != forwardSource
                        ? -1
                        : 1,
            { x: targetX, y: targetY, radius: targetSize } = target_attribute,
            { x: sourceX, y: sourceY, radius: sourceSize } = souce_attribute
        // 这条边 如果起始点和终止点有一个不存在则直接跳过
        if (!(target_attribute.isVisible && souce_attribute.isVisible)) {
            item.changeAttribute({ isVisible: false })
            continue
        }
        if (type == 'basic') {
            if (source != target) {
                size > 1 && size % 2 == 0 && lineNumber++
            } else lineNumber++
        } else {
            size > 1 && size % 2 == 0 && lineNumber++
        }
        forwadHashTable?.set(hash, { sourceNumber, targetNumber })
        if (halo.width != 0) {
            let g = document.createElementNS(xmlns, 'g')
            g.setAttributeNS(null, 'data-edge-id', key)
            halo.opacity = 1
            halo.shape = null
            halo.location = location
            strategies[type](
                g,
                source,
                target,
                halo,
                sourceX,
                sourceY,
                targetX,
                targetY,
                lineNumber,
                forward,
                sourceSize,
                targetSize,
            )
            edgeGroup.appendChild(g)
        }
        let g = document.createElementNS(xmlns, 'g')
        g.setAttributeNS(null, 'data-edge-id', key)
        strategies[type](
            g,
            source,
            target,
            attribute,
            sourceX,
            sourceY,
            targetX,
            targetY,
            lineNumber,
            forward,
            sourceSize,
            targetSize,
        )
        edgeGroup.appendChild(g)
    }
    forwadHashTable = null
}
