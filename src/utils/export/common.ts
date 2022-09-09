import { PlainObject } from '../../types'

var isSvg: PlainObject<any> = {
    'embedded-opentype': !0,
    svg: !0,
}

function svgCreateNS() {
    // @ts-ignore
    return document || DOMImplementation.createDocument()
}

function hrefGet(svgNS: any) {
    if (svgNS.baseURI) return svgNS.baseURI
    var base = svgNS.getElementsByTagName('base')
    return 0 < base.length ? base[0].href : svgNS.URL || svgNS.location.href
}

function getLocation(href: any) {
    if (0 === href.indexOf('http://') || 0 === href.indexOf('https://')) return href
    var origin = window.location.origin,
        pathname = window.location.pathname,
        splitPath = pathname.lastIndexOf('/')
    return -1 === splitPath
        ? origin + '/' + href
        : origin + pathname.substr(0, splitPath) + '/' + href
}

function requestHttp(href: any) {
    return new Promise(function (resolve, reject) {
        var xmlRequest = new XMLHttpRequest()
        xmlRequest.open('GET', getLocation(href), !0),
            (xmlRequest.onreadystatechange = function () {
                var status
                4 === xmlRequest.readyState &&
                    (200 === (status = xmlRequest.status)
                        ? resolve(xmlRequest.responseText)
                        : reject(
                              0 !== status
                                  ? new Error(
                                        'cannot retrieve file at url "' +
                                            href +
                                            '"; the server responded with status code ' +
                                            status +
                                            '.',
                                    )
                                  : new Error(
                                        'cannot send XMLHttpRequest to url "' +
                                            href +
                                            '"; if you\'re using the local file protocol this is most likely the cause.',
                                    ),
                          ))
            }),
            (xmlRequest.onerror = function () {
                reject(
                    new Error(
                        'cannot retrieve file at url "' + href + '"; the XMLHttpRequest failed.',
                    ),
                )
            }),
            xmlRequest.send()
    })
}

function httpRuleTest(fontFile: any, src: any) {
    if (/^http(s)?:/.test(fontFile)) return fontFile
    if ('/' === fontFile[0] && '/' === fontFile[1]) {
        var i = src.match(/((\w+:\/\/)([^/] + )) /)
        return i ? i[1] + fontFile : fontFile
    }
    var file = fontFile.split('/'),
        n = src.split('/')
    for ('/' !== src[src.length - 1] && n.pop(); '..' === file[0]; ) file.shift(), n.pop()

    if ('/' === fontFile[0] && n.length > 3) {
        var i: any = n[0] + n[1] + '//' + n[2]
        return i + fontFile
    }

    return n
        .concat(file)
        .join('/')
        .replace(/[\w](\/{2,})/g, function (t: string[]) {
            return t[0] + '/'
        })
}
/**
 * 提取document.styleSheets中的csstyle的属性
 * @returns
 */
export function getFontFamil() {
    for (
        var svgNS = svgCreateNS(),
            styleSheets = document.styleSheets,
            href = hrefGet(svgNS),
            styleSheetContent: any[] = [],
            styleSheetHref: any[] = [],
            num = 0;
        num < styleSheets.length;
        num++
    ) {
        var styleSheet = styleSheets[num]
        null == styleSheet.href
            ? styleSheetContent.push({
                  href,
                  content: styleSheet.ownerNode?.textContent,
              })
            : styleSheetHref.push(styleSheet.href)
    }
    var regex = /@font-face\s*\{[^}]+\}/g
    return Promise.all(
        styleSheetHref.map(function (href) {
            // 获取http的头
            return requestHttp(href)
                .then(function (content) {
                    return {
                        href,
                        content,
                    }
                })
                .catch(function () {
                    return null
                })
        }),
    )
        .then(function (contents) {
            return contents.concat(styleSheetContent)
        })
        .then(function (contents) {
            for (var proiseList: any[] | PromiseLike<any[]> = [], i = 0; i < contents.length; i++) {
                var href,
                    styleSheetContent: any = contents[i]
                null !== styleSheetContent &&
                    ((href = styleSheetContent.href),
                    (styleSheetContent = styleSheetContent.content.match(regex)) &&
                        ((href = (function (iconArray, src) {
                            for (
                                var regxURL =
                                        /url\(['"]?([^'")]+)['"]?\)\s+format\(['"]?([^'")]+)['"]?\)/g,
                                    regxFontFamily = /font-family\s*:\s*['"]?([^;'"]+)['"]?;/,
                                    n = [],
                                    i = 0;
                                i < iconArray.length;
                                i++
                            ) {
                                var originalRule = iconArray[i],
                                    fontInfo = originalRule.match(regxFontFamily)
                                if (fontInfo) {
                                    for (
                                        var info = fontInfo[1], formats = [], url: any = void 0;
                                        (url = regxURL.exec(originalRule));

                                    ) {
                                        var fontFile = url[1],
                                            format = url[2]
                                        isSvg[format.toLowerCase()] ||
                                            formats.push({
                                                format: format,
                                                url: httpRuleTest(fontFile, src),
                                            })
                                    }
                                    n.push({
                                        name: info,
                                        formats,
                                        originalRule,
                                    })
                                }
                            }
                            return n
                        })(styleSheetContent, href)),
                        proiseList.push.apply(proiseList, href)))
            }
            return proiseList
        })
}

function getBase64Image(img: any) {
    var canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    var ctx: any = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, img.width, img.height)
    var dataURL = canvas.toDataURL('image/jpg') // 可选其他值 image/jpeg
    return dataURL
}
/**
 * 转换image到base64
 * @param src
 * @param cb
 */
export function startTrans(src: string, cb: any) {
    var image = new Image()
    image.crossOrigin = 'anonymous' // 支持跨域图片
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = src // 处理缓存
    image.onload = function () {
        var base64 = getBase64Image(image)
        cb && cb(base64)
    }
}

export function drawNodeSvg(shape: string, x: any, y: any, r: any): string {
    if (shape == 'circle')
        return (
            'M ' +
            (x - r) +
            ', ' +
            y +
            ' a ' +
            r +
            ', ' +
            r +
            ' 0 1, 0 ' +
            r * 2 +
            ', 0 ' +
            'a ' +
            r +
            ', ' +
            r +
            ' 0 1, 0 ' +
            -(r * 2) +
            ', 0'
        )
    else if (shape == 'square')
        return (
            'M ' +
            (x - r) +
            ' ' +
            (y - r) +
            ' H ' +
            (x + r) +
            ' V ' +
            (y + r) +
            ' H ' +
            (x - r) +
            ' Z'
        )
    else if (shape == 'triangle')
        return (
            'M ' +
            x +
            ' ' +
            (y - r) +
            ' L ' +
            (x + r) +
            ' ' +
            (y + 0.25 * r + (Math.sqrt(3) / 3) * r) +
            ' L ' +
            (x - r) +
            ' ' +
            (y + 0.25 * r + (Math.sqrt(3) / 3) * r) +
            ' Z'
        )
    else
        return (
            'M ' +
            x +
            ' ' +
            (y - r) +
            ' L ' +
            (x - r) +
            ' ' +
            y +
            ' L ' +
            x +
            ' ' +
            (y + r) +
            ' L ' +
            (x + r) +
            ' ' +
            y +
            ' Z'
        )
}

export function drawQuardBezier(sX: any, sY: any, cp: { x: any; y: any }, tX: any, tY: any) {
    return 'M' + sX + ',' + sY + ' ' + 'Q' + cp.x + ',' + cp.y + ' ' + tX + ',' + tY
}

export function drawSelfBezier(
    sX: any,
    sY: any,
    cp: { x: any; y: any },
    cp2: { x: any; y: any },
    tX: any,
    tY: any,
) {
    return (
        'M' +
        sX +
        ',' +
        sY +
        ' ' +
        'C' +
        cp.x +
        ',' +
        cp.y +
        ' ' +
        cp2.x +
        ',' +
        cp2.y +
        ' ' +
        tX +
        ',' +
        tY
    )
}

/**
 * 上传附件转base64
 * @param {File} file 文件流
 */
export const fileByBase64 = (file: any, callback: any) => {
    var reader = new FileReader()
    // 传入一个参数对象即可得到基于该参数对象的文本内容
    reader.readAsDataURL(file)
    reader.onload = function (e: any) {
        // target.result 该属性表示目标对象的DataURL
        callback(e.target.result)
    }
}
/**
 * base64转Blob
 * @param {*} data
 */
export const base64ByBlob = (base64: any, callback: any) => {
    var arr = base64.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    callback(new Blob([u8arr], { type: mime }))
}
/**
 * DataUrl转为File
 * @param {String} dataUrl - dataUrl地址
 * @param {String} fileName - file文件名
 */
export const dataURLtoFile = (dataUrl: any, fileName: any) => {
    // data:text/xml;base64,
    var arr = dataUrl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = window.atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], fileName, { type: mime })
}

function Dt(t: any) {
    if (0 === t.indexOf('http://') || 0 === t.indexOf('https://')) return t
    var e = window.location.origin,
        i = window.location.pathname,
        r = i.lastIndexOf('/')
    return -1 === r ? e + '/' + t : e + i.substr(0, r) + '/' + t
}

const fetchBinary = (r: any) => {
    return new Promise(function (t, e) {
        var i = new XMLHttpRequest()
        ;(i.responseType = 'blob'),
            i.open('GET', Dt(r), !0),
            (i.onreadystatechange = function () {
                4 === i.readyState && (200 === i.status ? t(i.response) : e(i.status))
            }),
            (i.onerror = function (t) {
                return e(t)
            }),
            i.send()
    })
}

export const fetchBinaryAsBase64 = (t: any) => {
    return fetchBinary(t).then(function (url: any) {
        return new Promise(function (resolve, reject) {
            var fileReader = new FileReader()
            ;(fileReader.onerror = reject),
                (fileReader.onload = function () {
                    return resolve(fileReader.result)
                }),
                fileReader.readAsDataURL(url)
        })
    })
}

export const imageSvgSetAttribute = (
    x: string | number,
    y: string | number,
    width: string | number,
    height: string | number,
) => {
    let imageSvg = document.createElementNS('xmlns', 'image')
    imageSvg.setAttributeNS(null, 'x', x + '')
    imageSvg.setAttributeNS(null, 'y', y + '')
    imageSvg.setAttributeNS(null, 'width', width + '')
    imageSvg.setAttributeNS(null, 'height', height + '')
    return imageSvg
}

export const iconSvgSetAttribute = (icon: any, size: number, x: number, y: number) => {
    // 添加icon
    var font = icon.font || 'Arial',
        fgColor = icon.color || '#F00',
        content = icon.content || '?',
        height = size
    // icon的缩放
    var fontSizeRatio = 0.7
    if (typeof icon.scale === 'number') {
        fontSizeRatio = Math.abs(Math.max(0.01, icon.scale * 2))
    }
    var fontSize = Math.round(fontSizeRatio * height)

    var g = document.createElementNS('xmlns', 'g')
    var textSvg = document.createElementNS('xmls', 'text')

    g.setAttributeNS(null, 'font-family', font)
    g.setAttributeNS(null, 'font-size', fontSize + '')
    g.setAttributeNS(null, 'font-weight', 'normal')
    g.setAttributeNS(null, 'fill', fgColor)
    g.setAttributeNS(null, 'text-anchor', 'middle')

    textSvg.setAttributeNS(null, 'x', x + '')
    textSvg.setAttributeNS(null, 'y', y + fontSize / 3 + '')
    textSvg.innerHTML = content
    g.appendChild(textSvg)

    return g
}

export const textBaseSvgSetAttribute = (
    fontFamily: string,
    textFontSize: string,
    style: string,
    textColor: string,
    background: string,
) => {
    let textG = document.createElementNS('xmlns', 'g')
    textG.setAttributeNS(null, 'font-family', fontFamily)
    textG.setAttributeNS(null, 'font-size', textFontSize)
    textG.setAttributeNS(null, 'font-style', style)
    textG.setAttributeNS(null, 'fill', textColor)
    textG.setAttributeNS(null, 'text-anchor', 'middle')
    textG.setAttributeNS(null, 'background', background)
    return textG
}

export const clipPathSvg = (key: string, pathSvg: string, color: string) => {
    let clipPath = document.createElementNS('xmlns', 'clipPath')
    clipPath.setAttributeNS(null, 'id', 'clip-path-' + key)
    let path = document.createElementNS('xmlns', 'path')
    // 生成切割环
    path.setAttributeNS(null, 'd', pathSvg)
    path.setAttributeNS(null, 'fill', color)
    path.setAttributeNS(null, 'data-element-id', key)
    path.setAttributeNS(null, 'fill-opacity', '1')
    clipPath.appendChild(path)
    return clipPath
}

export const nodeStrokePathSvg = (
    nodePath: string,
    storkeWidth: string,
    unSelectedColor: string,
) => {
    let nodeStokePath = document.createElementNS('xmlns', 'path')
    nodeStokePath.setAttributeNS(null, 'd', nodePath)
    nodeStokePath.setAttributeNS(null, 'fill', 'none')
    nodeStokePath.setAttributeNS(null, 'stroke-width', storkeWidth)
    nodeStokePath.setAttributeNS(null, 'stroke', unSelectedColor)
    nodeStokePath.setAttributeNS(null, 'stroke-opacity', '1')

    return nodeStokePath
}

export const svgLinePath = (p: string, width: string | number, color: string) => {
    let path = document.createElementNS('xmlns', 'path')
    path.setAttributeNS(null, 'd', p)
    path.setAttributeNS(null, 'fill', 'none')
    path.setAttributeNS(null, 'stroke-width', width + '')
    path.setAttributeNS(null, 'stroke', color)
    return path
}
