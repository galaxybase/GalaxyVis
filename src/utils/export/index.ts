import isString from 'lodash/isString'
import { isIE } from '..'
import { basicData, globalInfo } from '../../initial/globalProp'
import { CsvExportOptions, ImageExportOptions, JsonExportOptions, PlainObject, SvgExportOptions, XlsxExportOptions } from '../../types'
import { renderSVG } from './renderSVG'

/**
 * @function exportHandler
 * @constructor
 * @param {type<string>} 导出的类型
 * @param {graph} 画布
 * @param {options<any | undefined>} 配置参数
 */
export function exportImageHandler(type: string, graph: any, options?: ImageExportOptions) {
    return new Promise(async (resolve, reject) => {
        try {
            let canvas = graph.renderer === 'webgl' ? graph.gl.canvas : graph.ctx.canvas
            // 初始参数
            let filename = options?.filename || `graph.${type}`
            let textWatermark = options?.textWatermark || undefined
            let background = options?.background || undefined
            let scale = options?.scale || 1
            let download = true
            if (options && options.hasOwnProperty('download')) {
                download = options.download as boolean
            }
            // 获取原始画布
            let originalCanvas = canvas

            let src;

            if (graph.geo.enabled() && window.domtoimage) {
                let mapElement = graph.geo.mapContainer
                src = await domtoimage.toPng(mapElement)
            } else {
                src = originalCanvas.toDataURL()
            }

            if (download) {
                downloadImage(originalCanvas, src, filename, `image/jpeg`, scale, background, textWatermark)
            } else {
                let image = new Image()
                let url
                // 解决跨域 Canvas 污染问题
                image.setAttribute('crossOrigin', 'anonymous')
                image.onload = function () {
                    let canvas = document.createElement('canvas')
                    canvas.width = originalCanvas.width
                    canvas.height = originalCanvas.height
                    let context: any = canvas.getContext('2d')
                    // 绘制前给背景添加白底，解决描边问题
                    context.fillStyle = background || '#fff'
                    context.fillRect(0, 0, image.width, image.height)
                    context.drawImage(image, 0, 0, image.width, image.height)
                    url = canvas.toDataURL(`image/jpeg`, scale) //得到图片的base64编码数据
                    resolve(url)
                }
                image.src = src
            }
        } catch (error: any) {
            reject(error.message)
        }
    })
}
/**
 * @function exportHandler
 * @constructor
 * @param {imgsrc<string>} 图片的base64地址
 * @param {name<string>} 图片名称
 * @param {type<string>} 图片类型
 * @param {textWatermark<any | undefined>} 水印的参数
 */
function downloadImage(
    originalCanvas: any,
    imgsrc: string,
    name: string,
    type: string,
    scale: number,
    background?: string,
    textWatermark?: any,
) {
    //下载图片地址和图片名
    let image = new Image()
    // 解决跨域 Canvas 污染问题
    image.setAttribute('crossOrigin', 'anonymous')
    image.onload = function () {
        let canvas = document.createElement('canvas')
        canvas.width = originalCanvas.width
        canvas.height = originalCanvas.height
        let context: any = canvas.getContext('2d')
        // 绘制前给背景添加白底，解决描边问题
        context.fillStyle = background || '#fff'
        context.fillRect(0, 0, image.width, image.height)
        context.drawImage(image, 0, 0, image.width, image.height)
        // 绘制水印
        if (textWatermark) {
            let { content, style, fontSize, angle, repeat, space, color, alpha } = textWatermark

            var { width: wText } = context.measureText(content)
            context.globalAlpha = alpha || 1.0
            context.fillStyle = color || 'black'
            context.textBaseline = 'middle'
            context.textAlign = 'left'
            context.font = `${style} ${fontSize}px Arial`
            // 循环绘制
            if (repeat) {
                let heightNumber = Math.ceil(image.height / space) + 10
                let widthNumber = Math.ceil(image.width / space) + 10
                for (let i = 0; i < heightNumber; i++) {
                    for (let w = 0; w < widthNumber; w++) {
                        context.save()
                        context.translate(w * space, i * space)
                        context.rotate((angle * Math.PI) / 180)
                        context.fillText(content, -wText / 2, fontSize / 2)
                        context.restore()
                    }
                }
            } else {
                context.translate(image.width / 2, image.height / 2)
                context.rotate((angle * Math.PI) / 180)
                context.fillText(content, -wText / 2, fontSize / 2)
            }
            context.globalAlpha = 1.0
        }
        let url = canvas.toDataURL(type, scale) //得到图片的base64编码数据
        let a = document.createElement('a') // 生成一个a元素
        let event;
        // 适配ie11
        if (isIE()) {
            // @ts-ignore
            var imgData = canvas.msToBlob();
            var blobObj = new Blob([imgData]);
            // @ts-ignore
            window.navigator.msSaveOrOpenBlob(blobObj, name);
        }
        else {
            event = new MouseEvent('click') // 创建一个单击事件
            a.download = name // 设置图片名称
            a.href = url // 将生成的URL设置为a.href属性
            a.dispatchEvent(event) // 触发a的单击事件
        }

    }
    image.src = imgsrc
}

/**
 * @function exportJsonHandler
 * @constructor
 * @param {graph<any>} 图上的点边数据
 * @param {options<any | undefined>} 配置参数
 */
export function exportJsonHandler(graph: any, options?: JsonExportOptions) {
    return new Promise((resolve, reject) => {
        try {
            // 初始参数
            let filename = options?.filename || `graph.json`
            let download = true
            if (options && options.hasOwnProperty('download')) {
                download = options.download as boolean
            }
            let { edgeList, nodeList } = basicData[graph.id]
            let graphData: any = {
                nodes: [],
                edges: [],
            }

            let IdColumnName = options?.IdColumnName || `id`
            let nodeAttributes = options?.nodeAttributes || null
            nodeList.forEach((node: any) => {
                let attributeObj: { [key: string]: any } = {}

                if (nodeAttributes) {
                    if (isString(nodeAttributes) && nodeAttributes == "all") {
                        attributeObj = node.getAttribute()
                    }
                    else {
                        for (let i = 0, len = nodeAttributes.length; i < len; i++) {
                            let attr = nodeAttributes[i]
                            attributeObj[attr] = node.getAttribute(attr)
                        }
                    }
                }

                graphData.nodes.push({
                    attribute: attributeObj,
                    data:
                        options?.nodeData && node.value.data
                            ? options.nodeData(node.value.data)
                            : node.value.data,
                    [IdColumnName]: node.value?.id,
                })
            })

            let edgeAttributes = options?.edgeAttributes || null

            edgeList.forEach((edge: any) => {

                let attributeObj: { [key: string]: any } = {}

                if (edgeAttributes) {
                    if (isString(edgeAttributes) && edgeAttributes == "all") {
                        attributeObj = edge.getAttribute()
                    }
                    else {
                        for (let i = 0, len = edgeAttributes.length; i < len; i++) {
                            let attr = edgeAttributes[i]
                            attributeObj[attr] = edge.getAttribute(attr)
                        }
                    }
                }

                graphData.edges.push({
                    attribute: attributeObj,
                    data:
                        options?.edgeData && edge.value.data
                            ? options.edgeData(edge.value.data)
                            : edge.value.data,
                    [IdColumnName]: edge.value?.id,
                    source: edge.value?.source,
                    target: edge.value?.target,
                })
            })
            if (download) {
                downloadJson(graphData, filename)
            }
            resolve(graphData)
        } catch (error: any) {
            reject(error.message)
        }
    })
}

/**
 * @function downloadJson
 * @constructor
 * @param {data<any>} 图上的点边数据
 * @param {filename<string>} 文件名称
 */
function downloadJson(data: any, filename: string) {
    if (!filename) filename = 'graph.json'
    if (typeof data === 'object') {
        data = JSON.stringify(data, undefined, 4)
    }
    var blob = new Blob([data], { type: 'text/json' });

    if (isIE()) {
        // @ts-ignore
        window.navigator.msSaveBlob(blob, filename)
    } else {
        var e = new MouseEvent('click'), // 创建一个单击事件,
            a = document.createElement('a')
        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
        a.dispatchEvent(e)
    }
}

/**
 * @function exportExcelHandler
 * @constructor
 * @param {graph<any>} 图上的点边数据
 * @param {options<any | undefined>} 配置参数
 */
export function exportExcelHandler(graph: any, options?: any) {
    return new Promise((resolve, reject) => {
        try {
            // 初始参数
            let filename = options?.filename || `graph.xlsx`
            let skipHeader = options?.skipHeader || false
            let download = true
            if (options && options.hasOwnProperty('download')) {
                download = options.download as boolean
            }
            let { edgeList, nodeList } = basicData[graph.id]
            let sheetDataList: any = [],
                sheet: any = []
            let IdColumnName = options?.IdColumnName || `id`
            nodeList.forEach((node: any) => {
                let sheetName = options.tab.nodes(node) + ''
                let data = options?.nodeData
                    ? {
                        [IdColumnName]: node.value.id,
                        ...options.nodeData(node.value.data),
                    }
                    : { [IdColumnName]: node.value.id, ...node.value.data }
                let sheetIndex = sheet.indexOf(sheetName)
                if (sheetIndex === -1) {
                    sheet.push(sheetName)
                    sheetDataList[sheet.length - 1] = {
                        name: sheetName,
                        list: [data],
                    }
                } else {
                    sheetDataList[sheetIndex].list.push(data)
                }
            })
            edgeList.forEach((edge: any) => {
                let sheetName = options.tab.edges(edge) + ''
                let { id, source, target } = edge.value
                let data = options?.edgeData
                    ? {
                        [IdColumnName]: id,
                        source,
                        target,
                        ...options.edgeData(edge.value.data),
                    }
                    : {
                        [IdColumnName]: id,
                        source,
                        target,
                        ...edge.value.data,
                    }

                let sheetIndex = sheet.indexOf(sheetName)
                if (sheetIndex === -1) {
                    sheet.push(sheetName)
                    sheetDataList[sheet.length - 1] = {
                        name: sheetName,
                        list: [data],
                    }
                } else {
                    sheetDataList[sheetIndex].list.push(data)
                }
            })
            /* create a new blank workbook */
            var wb = window.XLSX.utils.book_new()
            sheetDataList.forEach((item: any) => {

                let header: any[] = [];
                let headerDisplay: any = {}

                if (skipHeader) {
                    header = Object.keys(item.list[0]);

                    for (let i = 0; i < header.length; i++) {
                        headerDisplay[header[i]] = header[i]
                    }
                    let customisedHeader = options?.customisedHeader || {}
                    headerDisplay = {
                        ...headerDisplay,
                        ...customisedHeader
                    }
                    item.list = [headerDisplay, ...item.list]
                }

                let sheetData = window.XLSX.utils.json_to_sheet(item.list, {
                    header, skipHeader
                })
                window.XLSX.utils.book_append_sheet(wb, sheetData, item.name)
            })
            const workbookBlob = workbook2blob(wb, 'xlsx')
            if (download) {
                downloadExcel(workbookBlob, filename)
            }
            resolve(workbookBlob)
        } catch (error: any) {
            reject(error.message)
        }
    })
}

/**将workbook装化成blob对象
 * @function workbook2blob
 * @constructor
 * @param {workbook<any>} xlsx生成的人物对象
 * @param {type<string>} 类型
 */
function workbook2blob(workbook: any, type: string) {
    // 生成excel的配置项
    var wopts = {
        // 要生成的文件类型
        bookType: type,
        // // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
        bookSST: false,
        type: 'binary',
    }
    var wbout = window.XLSX.write(workbook, wopts)
    // 将字符串转ArrayBuffer
    function s2ab(s: any) {
        var buf = new ArrayBuffer(s.length)
        var view = new Uint8Array(buf)
        for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff
        return buf
    }
    var blob = new Blob([s2ab(wbout)], {
        type: 'application/octet-stream',
    })
    return blob
}

/**
 * @function downloadExcel
 * @constructor
 * @param {blob<any>} 图上的点边数据的bolb
 * @param {filename<string>} 文件名称
 */
function downloadExcel(blob: any, fileName: string) {
    if (isIE()) {
        // @ts-ignore
        window.navigator.msSaveOrOpenBlob(blob, fileName)
    } else {
        if (typeof blob == 'object' && blob instanceof Blob) {
            blob = URL.createObjectURL(blob) // 创建blob地址
        }
        var aLink = document.createElement('a')
        aLink.href = blob
        // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，有时候 file:///模式下不会生效
        aLink.download = fileName
        var event = new MouseEvent('click')
        aLink.dispatchEvent(event)
    }
}

/**
 * @function exportCsvHandler
 * @constructor
 * @param {graph<any>} 图上的点边数据
 * @param {options<any | undefined>} 配置参数
 */
export function exportCsvHandler(graph: any, options?: CsvExportOptions) {
    return new Promise((resolve, reject) => {
        try {
            // 初始参数
            let filename = options?.filename || `graph.csv`
            let separator = options?.separator || `,`
            let skipHeader = options?.skipHeader || false
            let download = true
            if (options && options.hasOwnProperty('download')) {
                download = options.download as boolean
            }

            let nodeList = options?.nodes || basicData[graph.id].nodeList
            let edgeList = options?.edges || basicData[graph.id].edgeList

            let list: any = []
            let IdColumnName = options?.IdColumnName || `id`

            if (options?.what === 'nodes') {
                nodeList.forEach((node: any) => {
                    if (typeof node === "string") {
                        node = basicData[graph.id].nodeList.get(node)
                    }
                    if (options.nodeData)
                        list.push({
                            [IdColumnName]: node.value.id,
                            ...options.nodeData(node.value.data),
                        })
                    else
                        list.push({
                            [IdColumnName]: node.value.id
                        })
                })
            } else if (options?.what === 'edges') {
                edgeList.forEach((edge: any) => {
                    if (typeof edge === "string") {
                        edge = basicData[graph.id].edgeList.get(edge)
                    }
                    let { id, source, target } = edge.value
                    if (options.edgeData)
                        list.push({
                            [IdColumnName]: id,
                            source,
                            target,
                            ...options.edgeData(edge.value.data),
                        })
                    else
                        list.push({
                            [IdColumnName]: id,
                            source,
                            target
                        })
                })
            }
            let header: any[] = [];
            let headerDisplay: any = {}

            if (skipHeader) {
                header = Object.keys(list[0]);

                for (let i = 0; i < header.length; i++) {
                    headerDisplay[header[i]] = header[i]
                }
                let customisedHeader = options?.customisedHeader || {}
                headerDisplay = {
                    ...headerDisplay,
                    ...customisedHeader
                }
                list = [headerDisplay, ...list]
            }

            let sheetData = window.XLSX.utils.json_to_sheet(list, {
                header, skipHeader
            })
            let result = window.XLSX.utils.sheet_to_csv(sheetData, {
                FS: separator,
                RS: '\n',
            })
            if (download) {
                downloadCsv(result, filename)
            }
            resolve(result)
        } catch (error: any) {
            reject(error.message)
        }
    })
}

/**
 * @function downloadCsv
 * @constructor
 * @param {data<any>} 图上的点边数据
 * @param {filename<string>} 文件名称
 */
function downloadCsv(data: any, filename: string) {
    let type = '' //头部数据类型
    var blob = new Blob(['\ufeff' + data], { type: type });
    if (isIE()) {
        // @ts-ignore
        window.navigator.msSaveBlob(blob, filename)
    } else {
        let e = new MouseEvent('click'),
            a = document.createElement('a')
        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl = ['text/csv', a.download, a.href].join(':')
        a.dispatchEvent(e)
    }
}

var XMLNS = 'http://www.w3.org/2000/svg'
/**
 * 导出SVG
 * @param type
 * @param graph
 * @param options
 * @returns
 */
export const exportSVGHandler = (type: string, graph: any, options?: SvgExportOptions) => {
    return new Promise(async (resolve, reject) => {
        try {
            let canvas = graph.renderer === 'webgl' ? graph.gl.canvas : graph.ctx.canvas
            // 初始参数
            let filename = options?.filename || `graph.${type}`
            let download = true
            if (options && options.hasOwnProperty('download')) {
                download = options.download as boolean
            }

            let width = options?.width || canvas?.width || 1000
            let height = options?.height || canvas?.height || 1000

            let output = toSVG(graph, {
                width,
                height,
                margin: options?.margin || 0.05,
                filename,
                download,
            })
            resolve(output)
        } catch (error: any) {
            reject(error.message)
        }
    })
}

const DEFAULTS = {
    size: '1000',
    width: '1000',
    height: '1000',
    margin: 0.05,
    labels: true,
    data: false,
    download: true,
    filename: 'graph.svg',
}

function toSVG(graph: any, params: PlainObject<any>) {
    params = params || {}

    var width = params.width || DEFAULTS.size,
        height = params.height || DEFAULTS.size
    // svg的外层必须要包围一层div
    var container: any = document.createElement('div')
    container.setAttribute('width', width)
    container.setAttribute('height', height)
    container.setAttribute(
        'style',
        'position:absolute; top: 0px; left:0px; width: ' + width + 'px; height: ' + height + 'px;',
    )
    // 创建svg对象
    var svgContainer = document.createElementNS(XMLNS, 'svg')

    container.appendChild(svgContainer)
    var svg = container.querySelector('svg')
    svg.removeAttribute('style')
    svg.setAttribute('width', width + 'px')
    svg.setAttribute('height', height + 'px')

    if (!isIE()) {
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    } else {
        svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
        // http://www.w3.org/XML/2008/xsdl-exx/ns1
    }

    if (globalInfo[graph.id].backgroundColor.color != '#fff') {
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('width', width + 'px')
        rect.setAttribute('height', height + 'px')
        rect.setAttribute('fill', globalInfo[graph.id].backgroundColor.color)
        svg.appendChild(rect)
    }

    // 渲染图形并导出
    renderSVG(graph, svg).then(() => {
        var svgString = svg?.outerHTML || new XMLSerializer().serializeToString(svg),
            out = '<?xml version="1.0" encoding="utf-8"?>'

        svgString = out + svgString

        container = null

        if (params.download) Download(svgString, params.filename || DEFAULTS.filename)

        return svgString
    })
}

function Download(fileEntry: string, filename: string, isDataUrl?: string) {
    var blob = null,
        objectUrl: string | null = null,
        dataUrl = null
    if (window.Blob) {
        blob = isDataUrl ? dataURLToBlob(fileEntry) : new Blob([fileEntry], { type: 'text/xml' })
        objectUrl = window.URL.createObjectURL(blob)
    } else {
        dataUrl =
            'data:text/xml;charset=UTF-8,' +
            encodeURIComponent('<?xml version="1.0" encoding="UTF-8"?>') +
            encodeURIComponent(fileEntry)
    }
    // @ts-ignore
    if (navigator.msSaveBlob) {
        // @ts-ignore
        navigator.msSaveBlob(blob, filename)
        // @ts-ignore
    } else if (navigator.msSaveOrOpenBlob) {
        // @ts-ignore
        navigator.msSaveOrOpenBlob(blob, filename)
    } else {
        var anchor = document.createElement('a')
        anchor.setAttribute('href', (window.Blob ? objectUrl : dataUrl) as string)
        anchor.setAttribute('download', filename)
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
    }

    if (objectUrl) {
        setTimeout(function () {
            window.URL.revokeObjectURL(objectUrl as string)
        }, 0)
    }
}

function dataURLToBlob(dataURL: string) {
    var BASE64_MARKER = ';base64,'
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        return new Blob([dataURL], { type: 'text/xml' })
    }

    var parts = dataURL.split(BASE64_MARKER)
    var contentType = parts[0].split(':')[1]
    var raw = window.atob(parts[1])
    var rawLength = raw.length

    var uInt8Array = new Uint8Array(rawLength)

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i)
    }

    return new Blob([uInt8Array], { type: contentType })
}
