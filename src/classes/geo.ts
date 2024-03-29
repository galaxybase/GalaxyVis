import { basicData, globalInfo, globalProp } from '../initial/globalProp'
import { originInfo } from '../initial/originInitial'
import { GeoModeOptions, MouseType, PlainObject } from '../types'
import { animateNodes } from '../utils/graphAnimate'
import throttle from 'lodash/throttle'
import cloneDeep from 'lodash/cloneDeep'

import { quadtree } from 'd3-quadtree'

const L = window.L //解决未引入leaflet导致编译失败
const standards = 1.5
let geoClass: PlainObject<any> = {}
L && (L.CanvasLayer = L.Layer.extend({
    options: {
        pane: 'overlayPane',
        padding: 0,
        onUpdate: function () { },
    },

    initialize: function (e: any) {
        var n = e.container
        L.Util.setOptions(this, e), (this._container = n)
    },

    setLocked: function (value: any) {
        return (this._locked = value), this
    },

    onAdd: function (n: any) {
        ; (this._map = n),
            this.getPane().appendChild(this._container),
            (this._wgsOrigin = L.latLng([0, 0])),
            (this._wgsInitialShift = n.project(this._wgsOrigin, this._initialZoom)),
            L.DomUtil.addClass(this._container, 'leaflet-layer'),
            this._zoomAnimated &&
            (L.DomUtil.addClass(this._container, 'leaflet-zoom-animated'),
                (this._container.style.position = 'absolute'),
                (this._container.style.zIndex = 9999)),
            (this._initialZoom = (this._map.getMaxZoom() + this._map.getMinZoom()) / 2),
            (this._mapInitialZoom = this._map.getZoom()),
            this._updateBounds(),
            this._update({})
    },

    _updateBounds: function () {
        var e = this.options.padding,
            n = this._map.getSize(),
            i = this._map.containerPointToLayerPoint(n.multiplyBy(-e))
            ; (this._bounds = new L.Bounds(i, i.add(n.multiplyBy(1 + 2 * e)))),
                (this._center = this._map.getCenter()),
                (this._zoom = this._map.getZoom())
    },

    _update: function (e: any) {
        var n = this
        this._updateBounds(),
            this._redraw(this._bounds.min, e),
            (this._positionTimer = L.Util.requestAnimFrame(function () {
                n._container && L.DomUtil.setPosition(n._container, n._bounds.min)
            }))
    },

    _redraw: function () {
        this.options.onUpdate()
    },

    _updateTransform: function (e: any, n: any) {
        if (!this._locked) {
            var i = this._map.getZoomScale(n, this._zoom),
                r = this._map.getSize().multiplyBy(0.5 + this.options.padding),
                o = this._map.project(this._center, n),
                s = r.multiplyBy(-i).add(o).subtract(this._map._getNewPixelOrigin(e, n))
            L.Browser.any3d
                ? L.DomUtil.setTransform(this._container, s, i)
                : L.DomUtil.setPosition(this._container, s)
        }
    },

    _onZoom: function () {
        this._updateTransform(this._map.getCenter(), this._map.getZoom())
    },

    _onMoveEnd: function (t: any) {
        this._update(t)
    },

    _onAnimZoom: function (t: any) {
        var e = t.center,
            n = t.zoom
        this._updateTransform(e, n)
    },

    bringToFront: function () {
        L.DomUtil.toFront(this._container)
    },

    getEvents: function () {
        return {
            zoom: this._onZoom,
            moveend: this._onMoveEnd,
            zoomanim: this._onAnimZoom,
            layeradd: this.bringToFront,
            zoomend: this.options.onUpdate,
        }
    },

    onRemove: function () {
        L.DomUtil.removeClass(this._container, 'leaflet-zoom-animated')
        var n = this._container
            ;[
                'transform',
                'webkitTransform',
                'OTransform',
                'MozTransform',
                'msTransform',
                'zIndex',
                'position',
            ].forEach(function (t) {
                return (n.style[t] = null)
            }),
                L.Util.cancelAnimFrame(this._positionTimer),
                (this._container = null)
    },
}))

const DEFAULT_TITLE = {
    subdomains: 'abc',
    url: 'https://{s}.tile.osm.org/{z}/{x}/{y}.png',
}

/**
 * @class geo
 * @constructor
 * @param {galaxyvis<any>} 初始化
 */
export default class geo<T, K> {
    private galaxyvis: any
    private pulsePass: any
    private particlePass: any
    private graphContainer: HTMLDivElement | null = null;
    private quadTree: any

    public map: any
    public layer: any
    public mapContainer: HTMLElement | undefined
    public loadingGeoMode: boolean = true
    public geoVisibleFilter: any
    public options: GeoModeOptions | undefined
    public moving: boolean = false
    public minZoomLevel: number
    public maxZoomLevel: number
    public dsr: number = 1
    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
        this.minZoomLevel = 0
        this.maxZoomLevel = 0
    }
    /**
     * 开启geo模式
     * @param options
     * @returns
     */
    enable = (options?: GeoModeOptions) => {
        return new Promise((resolve, reject) => {
            let id = this.galaxyvis.id
            let divContainer
            let o = options
            let originNodes = originInfo[id].nodeList
            let minZoomLevel = this.minZoomLevel = o?.minZoomLevel || 1,
                maxZoomLevel = this.maxZoomLevel = o?.maxZoomLevel || 20,
                sizeRatio = o?.sizeRatio || 1.0,
                attribution = o?.attribution,
                tiles = o?.tiles || DEFAULT_TITLE,
                latitudePath: any = o?.latitudePath || 'lat',
                longitudePath: any = o?.longitudePath || 'lng',
                duration = o?.duration || 0,
                disableNodeDragging =
                    Number(o?.disableNodeDragging) == 0 ? o?.disableNodeDragging : true,
                crs = o?.crs || L?.CRS.EPSG3857,
                allowdDclick = o?.allowdDclick || false;
            this.options = options
            tiles = Object.assign(DEFAULT_TITLE, tiles)

            const ISLATFUNCTION = typeof (latitudePath) == "function" ? true : false
            const ISLONGFUNCTION = typeof (longitudePath) == "function" ? true : false

            // 去除canvas的wheel和mousedown的事件
            let canvas = this.galaxyvis.gl?.canvas || this.galaxyvis.ctx?.canvas
            canvas.removeEventListener('wheel', this.galaxyvis.WheelFunction)
            canvas.removeEventListener('mousedown', this.galaxyvis.MousedownFunction)
            !allowdDclick && canvas.removeEventListener('dblclick', this.galaxyvis.DoubleClickFunction)

            // fixTransfrom
            this.getGeoTransform()

            let dsr = this.dsr = 1
            if (this.galaxyvis.renderer !== "canvas") {
                dsr = this.dsr = window.outerHeight * this.galaxyvis.camera.aspectRatio / canvas.width;
            }

            // 创建geo的容器和图层
            if (!document.getElementById(`galaxyvis-geo-map-${id}`)) {
                divContainer =
                    this.galaxyvis.ctx?.canvas.parentNode || this.galaxyvis.gl?.canvas.parentNode
                this.mapContainer = this.initDOM(divContainer, 'div', `galaxyvis-geo-map-${id}`)
            } else {
                return reject("The map has already been used")
            }

            this.map = new L.Map(this.mapContainer, {
                attributionControl: attribution ? true : false, //右下角的copyright
                zoomControl: false, //左上角缩放
                maxBoundsViscosity: 1, //使界外完全稳固，防止用户在界外拖动
                worldCopyJump: true, //当你平移到世界的另一个 "副本 "时，地图会跟踪并无缝跳转到原来的副本
                minZoom: minZoomLevel, //最小缩放
                maxZoom: maxZoomLevel, //最大缩放
                crs, ///crs
            })

            if (!this.map) {
                return reject(void 0)
            }
            // 移除地图的双击事件
            this.map.off('dblclick')
            // 获取Data能支持Path的点信息
            this.geoVisibleFilter = this.galaxyvis.transformations.addNodeFilter((node: any) => {
                let lat = ISLATFUNCTION ? latitudePath(node) : node.getData(latitudePath)
                let long = ISLONGFUNCTION ? longitudePath(node) : node.getData(longitudePath)
                return lat && long
            })
            // 拖动图层还是拖点 需要设置disableNodeDragging为false
            var draggable = true,
                startLat = 0,
                startLng = 0,
                endLat = 0,
                endLng = 0

            if (!disableNodeDragging) {
                this.map.on('mousemove', (e: any) => {
                    let node = this.galaxyvis.mouseCaptor.hoverTatget
                    var useLasso = this.galaxyvis.tools.lasso.enabled();
                    if (node) {
                        draggable = true
                        this.map.dragging['disable']()
                        canvas.addEventListener('mousedown', this.galaxyvis.MousedownFunction)
                    } else if (!this.map.dragging._enable && draggable) {
                        draggable = false
                        !useLasso && this.map.dragging['enable']()
                        canvas.removeEventListener('mousedown', this.galaxyvis.MousedownFunction)
                    }
                    this.moving = true
                }) &&
                    this.map.on('mousedown', (e: any) => {
                        let node = this.galaxyvis.mouseCaptor.hoverTatget
                        if (node?.isNode()) {
                            startLat = e.latlng.lat
                            startLng = e.latlng.lng
                        }
                        this.moving = false
                    }) &&
                    this.map.on('mouseup', (e: any) => {
                        let node = this.galaxyvis.mouseCaptor.hoverTatget
                        if (node?.isNode() && node.getAttribute('draggable')) {
                            endLat = e.latlng.lat
                            endLng = e.latlng.lng
                            let nodeId = node.getId()
                            let originNode = originNodes.get(nodeId)
                            let data = node.getData()
                            let lats = ISLATFUNCTION ? latitudePath(node) : data?.[latitudePath]
                            let longs = ISLONGFUNCTION ? longitudePath(node) : data?.[longitudePath]
                            if (originNode.lat && originNode.lng) {
                                originNode.lat += endLat - startLat
                                originNode.lng += endLng - startLng
                            } else {
                                let lat = Number(lats),
                                    lng = Number(longs)
                                originNode.lat = lat + (endLat - startLat)
                                originNode.lng = lng + (endLng - startLng)
                            }
                        }
                        if (!node && !this.moving) {
                            let selectedNodes = this.galaxyvis.getSelectedNodes()
                            if (selectedNodes.size) selectedNodes.setSelected(false)
                            let selectedEdges = this.galaxyvis.getSelectedEdges()
                            if (selectedEdges.size) selectedEdges.setSelected(false)
                            setTimeout(() => {
                                this.galaxyvis.events.emit('click', {
                                    button: MouseType[e.originalEvent.button],
                                    source: 'mouse',
                                    x: e.originalEvent.x,
                                    y: e.originalEvent.y,
                                    domEvent: e.originalEvent,
                                    target: null,
                                    isNode: false,
                                })
                            }, 1)
                        }

                    })
            }
            else {
                this.map.on('mousemove', (e: any) => {
                    let node = this.galaxyvis.mouseCaptor.hoverTatget
                    var useLasso = this.galaxyvis.tools.lasso.enabled();
                    if (node) {
                        this.map.dragging['disable']()
                        this.galaxyvis.mouseCaptor.geoEnable = false
                        canvas.addEventListener('mousedown', this.galaxyvis.MousedownFunction)
                    } else {
                        !useLasso && this.map.dragging['enable']()
                        this.galaxyvis.mouseCaptor.geoEnable = true
                        canvas.removeEventListener('mousedown', this.galaxyvis.MousedownFunction)
                    }
                    this.moving = true
                }) && this.map.on('mousedown', (e: any) => {
                    this.moving = false
                }) && this.map.on('mouseup', (e: any) => {
                    let node = this.galaxyvis.mouseCaptor.hoverTatget
                    if (!node && !this.moving) {
                        let selectedNodes = this.galaxyvis.getSelectedNodes()
                        if (selectedNodes.size) selectedNodes.setSelected(false)
                        let selectedEdges = this.galaxyvis.getSelectedEdges()
                        if (selectedEdges.size) selectedEdges.setSelected(false)
                        setTimeout(() => {
                            this.galaxyvis.events.emit('click', {
                                button: MouseType[e.originalEvent.button],
                                source: 'mouse',
                                x: e.originalEvent.x,
                                y: e.originalEvent.y,
                                domEvent: e.originalEvent,
                                target: null,
                                isNode: false,
                            })
                        }, 1)
                    }
                })
            }

            this.galaxyvis.view.setView({
                zoom: this.galaxyvis.camera.defaultZoom,
                x: 0,
                y: 0,
            })
            // 设置右下角的附属信息
            if (attribution) {
                var attributionControl = this.map.attributionControl
                // setPrefix是替换默认的leaflet前缀改为自定义的logo和文字链接作为前缀
                attributionControl.setPrefix('')
                // addAttribution 是在前缀后添加附属信息
                attributionControl.addAttribution(attribution)
            }

            var osm = new L.TileLayer(tiles.url, { subdomains: tiles.subdomains })
            this.map.addLayer(osm)
            // 默认为居中
            let viewZoom = Math.floor((minZoomLevel + maxZoomLevel) / 2),
                viewPoint = { lat: 0, lng: 0 },
                longitudeSum = 0,
                latitudeSum = 0
            let nodes = basicData[id].nodeList
            let len = 0
            nodes.forEach(item => {
                let data = item.getData()
                let isVisible = item.getAttribute('isVisible')
                let lats = ISLATFUNCTION ? latitudePath(item) : data?.[latitudePath]
                let longs = ISLONGFUNCTION ? longitudePath(item) : data?.[longitudePath]

                if (isVisible && lats && longs) {
                    let lat = Number(lats),
                        lng = Number(longs)
                    longitudeSum += lng
                    latitudeSum += lat
                    len++
                }
            })

            len && ((viewPoint.lat = latitudeSum / len), (viewPoint.lng = longitudeSum / len))
            !len && ((viewPoint.lat = 39.9043), (viewPoint.lng = 116.3848))
            // 设置地图的经纬度和世界缩放等级
            this.map.setView(new L.LatLng(viewPoint.lat, viewPoint.lng), viewZoom)
            this.graphContainer = this.graphicContainer()

            this.quadTree = quadtree()
                .x((d: any) => d.x)
                .y((d: any) => d.y);
            this.quadTree.retrieve = ({
                x, y, r
            }: { x: number, y: number, r: number }) => {
                const xmax = x + r / 2;
                const ymax = y + r / 2;
                const ymin = y - r / 2;
                const xmin = x - r / 2;
                const results: any[] = [];

                this.quadTree.visit((
                    node: { length: any; data: any; next: any }, 
                    x1: number, y1: number, x2: number, y2: number
                ) => {
                    if (!node.length) {
                        do {
                            let d = node.data;
                            if (d.x >= xmin && d.x < xmax && d.y >= ymin && d.y < ymax) {
                                results.push(d);
                            }
                        } while (node = node.next);
                    }
                    return x1 >= xmax || y1 >= ymax || x2 < xmin || y2 < ymin;
                });
                return results;
            }

            this.layer = new L.CanvasLayer({
                // geo地图的父级
                container: this.graphContainer,
                // 触发更新
                onUpdate: (refesh: boolean = false) => {
                    if (!this.layer._map) return Promise.resolve(void 0)
                    let nodes = basicData[id].nodeList
                    let originNodes = originInfo[id].nodeList
                    let map = this.layer._map,
                        centerMap = map.getCenter(),
                        lat = centerMap.lat,
                        lng = centerMap.lng,
                        points = map.options.crs.latLngToPoint(L.latLng(lat, lng), 1);
                    (this.layer._x = points.x), (this.layer._y = points.y)

                    let { width, height } = globalInfo[id].canvasBox

                    this.quadTree.removeAll(this.quadTree.data())

                    var quadTree = this.quadTree

                    const ZOOMRATIO = map._zoom / (maxZoomLevel * standards)
                    var nodeData: any = {}
                    nodes.forEach((item, key) => {
                        let data = item.getData()
                        let isVisible = item.getAttribute('isVisible')
                        let lats = ISLATFUNCTION ? latitudePath(item) : data?.[latitudePath]
                        let longs = ISLONGFUNCTION ? longitudePath(item) : data?.[longitudePath]
                        if (isVisible && lats && longs) {
                            let originNode = originNodes.get(key)
                            let Coords = { x: 0, y: 0 }
                            if (originNode.lat && originNode.lng && !disableNodeDragging) {
                                Coords = map.latLngToContainerPoint(
                                    L.latLng(originNode.lat, originNode.lng),
                                )
                            } else {
                                Coords = map.latLngToContainerPoint(
                                    L.latLng(lats, longs),
                                )
                            }
                            if (!originNode.baseRaius) {
                                originNode.baseRaius = cloneDeep(item.getAttribute('radius'))
                            }
                            if (this.loadingGeoMode && duration > 0) {
                                nodeData[key] = {
                                    x: Coords.x - width / 2,
                                    y: Coords.y - height / 2,
                                }
                            } else {
                                nodeData[key] = {
                                    x: Coords.x - width / 2,
                                    y: Coords.y - height / 2,
                                }

                                item.changeAttribute({
                                    x: Coords.x - width / 2,
                                    y: Coords.y - height / 2,
                                })
                            }
                            quadTree.add({ ...nodeData[key], id: key })
                        }

                    })
                    // 设置规则给到geo模式的点大小
                    // to do list： 把hover和selected的规则合并，因为geo模式下geo的class应该层次在hover..这类的下一级高于别的rule
                    if (!geoClass[id] || refesh)
                        geoClass[id] = this.galaxyvis.styles.createClass({
                            name: `geo-class`,
                            nodeAttributes: {
                                radius(node: any) {
                                    let originNode = originNodes.get(node.getId())
                                    return originNode.baseRaius * sizeRatio * ZOOMRATIO * dsr
                                },
                                text(node: any) {
                                    let { x, y } = node.getPosition()
                                    let r = 60
                                    let quadNodes = quadTree.retrieve({ x, y, r });
                                    if (quadNodes.length > 1 && quadNodes[quadNodes.length - 1].id != node.getId()) {
                                        return {
                                            fontSize: 0
                                        }
                                    }

                                    let fontSize = node.getAttribute(['text', 'fontSize'])
                                    return {
                                        fontSize:
                                            Math.max(
                                                fontSize * sizeRatio * ZOOMRATIO,
                                                map._zoom
                                            ) * dsr,
                                        minVisibleSize: 10
                                    }
                                }
                            },
                            edgeAttributes: {
                                text(edge: any) {
                                    let fontSize = edge.getAttribute(['text', 'fontSize'])
                                    return {
                                        fontSize:
                                            Math.max(
                                                fontSize * sizeRatio * ZOOMRATIO,
                                                map._zoom
                                            ) * dsr,
                                        minVisibleSize: 10
                                    }
                                }
                            }
                        })
                    // geo动画事件
                    if (this.loadingGeoMode && duration > 0) {
                        animateNodes(
                            this.galaxyvis,
                            nodeData,
                            {
                                duration,
                            },
                            () => {
                                this.loadingGeoMode = false
                            },
                        )
                    } else {
                        nodeData = {}
                        this.galaxyvis.render()
                    }
                },
            })

            this.layer.addTo(this.map)
            resolve(void 0)
        })
    }
    /**
     * 关闭geo模式
     * @param options
     * @returns
     */
    disable(options?: GeoModeOptions) {
        return new Promise((resolve, reject) => {
            if (this.map) {
                const id = this.galaxyvis.id
                // 销毁geo导致的过滤
                this.geoVisibleFilter.destroy()
                this.loadingGeoMode = true
                // 移除map的事件
                this.map.off('mousemove')
                this.map.off('mousedown')
                this.map.off('mouseup')
                // 鼠标事件释放
                this.galaxyvis.mouseCaptor.geoEnable = true
                // 删除leaflet
                this.layer && this.layer._map && this.map.removeLayer(this.layer)
                this.map.remove()
                this.map._animatingZoom = !1
                this.map = null
                var t = this.mapContainer!.parentNode
                t && t.removeChild(this.mapContainer as HTMLElement)
                // 添加回graph对象
                var divContainer = this.galaxyvis.getDivContainer()
                var canvas = this.galaxyvis.ctx?.canvas || this.galaxyvis.gl?.canvas
                divContainer.insertBefore(canvas, divContainer.firstChild)
                if (this.galaxyvis.pulse && this.pulsePass) {
                    let pulseCanvas = this.galaxyvis.pulseCanvas;
                    pulseCanvas.stop()
                    pulseCanvas.render()
                    const pulsePass = this.pulsePass;
                    divContainer.insertBefore(pulsePass, divContainer.firstChild)
                }
                if (this.galaxyvis.particle && this.particlePass) {
                    let particleCanvas = this.galaxyvis.particleCanvas;
                    particleCanvas.stop()
                    particleCanvas.render()
                    const particlePass = this.particlePass;
                    divContainer.insertBefore(particlePass, divContainer.firstChild)
                }
                // graph类的鼠标事件回滚
                canvas.addEventListener('wheel', this.galaxyvis.WheelFunction)
                canvas.addEventListener('mousedown', this.galaxyvis.MousedownFunction)
                !this.options?.allowdDclick && canvas.addEventListener('dblclick', this.galaxyvis.DoubleClickFunction)
                let nodes = basicData[id].nodeList
                let originNodes = originInfo[id].nodeList
                // 撤回计算的坐标
                nodes.forEach((item, key) => {
                    let originNode = originNodes.get(key)
                    originNode.baseRaius &&
                        item.changeAttribute({
                            radius: originNode.baseRaius,
                        })
                    originNode.baseRaius && delete originNode.baseRaius
                    originNode.lng && delete originNode.lng
                    originNode.lat && delete originNode.lat
                    originInfo[id].nodeList.set(key, originNode)
                })
                // 销毁生成的class的规则 防止冲突
                geoClass[id] && geoClass[id].destroy() && delete geoClass[id]
                this.layer = null
                this.map = null
                this.quadTree = null;
                this.galaxyvis.camera.updateTransform()
                this.galaxyvis.render()
                resolve(void 0)
            } else {
                reject()
            }
        })
    }

    updateGeoClass() {
        const id = this.galaxyvis.id
        let originNodes = originInfo[id].nodeList
        let nodes = basicData[id].nodeList

        nodes.forEach((item, key) => {
            let originNode = originNodes.get(key)
            originNode.baseRaius && delete originNode.baseRaius
            originNode.baseRaius = item.getAttribute('radius')
            originInfo[id].nodeList.set(key, originNode)
        })

        geoClass[id] && geoClass[id].update({})
    }

    getGeoTransform() {
        let id = this.galaxyvis.id
        let canvas = this.galaxyvis.gl?.canvas || this.galaxyvis.ctx?.canvas
        basicData[id].transform = canvas.width / globalProp.globalScale / this.galaxyvis.camera.aspectRatio
    }

    getGeoDsr() {
        return this.dsr
    }

    /**
     * 获取geo的中心
     * @returns
     */
    getCenter() {
        var lat, lng
        if (this.layer) {
            var centerMap = this.layer._map.getCenter()
                ; (lat = centerMap.lat), (lng = centerMap.lng)
        }
        return {
            lat,
            lng,
        }
    }
    /**
     * 设置geo的中心
     * @param lat
     * @param lng
     */
    setCenter(lat: number, lng: number) {
        if (this.layer) {
            let viewZoom = this.getZoom()
            this.map.setView(new L.LatLng(lat, lng), viewZoom)
        }
    }
    /**
     * 获取geo的map属性
     * @returns
     */
    getMap() {
        return this.map
    }
    /**
     * 获取视图的位置
     * @returns
     */
    getView() {
        let center = this.getCenter(),
            zoom = this.getZoom()
        return {
            ...center,
            zoom,
        }
    }
    /**
     * 设置视图的位置
     * @param lat
     * @param lng
     * @param zoom
     */
    setView(lat: number, lng: number, zoom: number) {
        if (this.layer) {
            this.map.setView(new L.LatLng(lat, lng), zoom)
        }
    }
    /**
     * 获取当前缩放等级
     * @returns
     */
    getZoom() {
        let zoom
        if (this.layer) {
            zoom = this.layer._map.getZoom()
        }
        return zoom
    }
    /**
     * 设置缩放等级
     * @param zoom
     */
    setZoom(zoom: number) {
        if (this.layer) {
            if (zoom > this.maxZoomLevel) zoom = this.maxZoomLevel
            if (zoom < this.minZoomLevel) zoom = this.minZoomLevel
            this.layer._map.setZoom(zoom)
        }
    }
    /**
     * geo模式是否开启
     * @returns
     */
    enabled() {
        if (this.layer) return true
        return false
    }

    private tr = throttle((ids) => {
        let len = ids.length
        let nodeList = basicData[this.galaxyvis.id].nodeList
        let o = this.options;
        let latitudePath: any = o?.latitudePath || 'lat',
            longitudePath: any = o?.longitudePath || 'lng',
            maxLng = -Infinity, maxLat = -Infinity,
            minLng = Infinity, minLat = Infinity

        const ISLATFUNCTION = typeof (latitudePath) == "function" ? true : false
        const ISLONGFUNCTION = typeof (longitudePath) == "function" ? true : false
        for (let i = 0; i < len; i++) {
            let node = nodeList.get(ids[i]);
            let data = node.getData();
            let lats = ISLATFUNCTION ? latitudePath(node) : data?.[latitudePath]
            let longs = ISLONGFUNCTION ? longitudePath(node) : data?.[longitudePath]
            if (lats && longs) {
                let lat = Number(lats),
                    lng = Number(longs)

                maxLng = Math.max(maxLng, lng)
                minLng = Math.min(minLng, lng)
                maxLat = Math.max(maxLat, lat)
                minLat = Math.min(minLat, lat)
            }
        }
        if (
            maxLng != -Infinity &&
            maxLat != -Infinity &&
            minLng != Infinity &&
            minLat != Infinity
        ) {
            let corner1 = L.latLng(minLat, minLng),
                corner2 = L.latLng(maxLat, maxLng),
                bounds = L.latLngBounds(corner1, corner2)
            this.map.fitBounds(bounds)
        }
    }, 16)

    /**
     * 
     * @param ids 
     */
    locate(ids: string | any[]) {
        if (!ids || ids?.length == 0) {
            ids = [];
            let nodeList = this.galaxyvis.getFilterNode()
            nodeList.forEach((_: any, key: string) => {
                (ids as Array<any>).push(key)
            })
        }
        if (typeof ids === "string") ids = [ids];

        this.tr(ids)
    }
    /**
     * 初始化一个dom
     * @param t
     * @param tag
     * @param id
     * @returns
     */
    private initDOM(t: any, tag: string, id: string) {
        // 创建dom对象
        let dom = document.createElement(tag)
        // 添加style
        dom.style.position = 'absolute'
        dom.style.left = '0px'
        dom.style.top = '0px'
        dom.style.width = '100%'
        dom.style.height = '100%'
        dom.id = id
        dom.className = id

        t.insertBefore(dom, t.firstChild)

        return dom
    }
    /**
     * 设置父级
     * @returns
     */
    private graphicContainer() {
        let canvas = this.galaxyvis.ctx?.canvas || this.galaxyvis.gl?.canvas

        canvas.style.background = null

        let dom = document.createElement('div')
        // 添加style
        dom.style.position = 'absolute'
        dom.style.left = '0px'
        dom.style.top = '0px'

        dom.insertBefore(canvas, dom.firstChild)

        if (this.galaxyvis.pulse) {
            const id = this.galaxyvis.id
            const pulsePass = this.pulsePass = document.getElementById("pulse_" + id) as HTMLCanvasElement;
            dom.insertBefore(pulsePass, dom.firstChild)
        }

        if (this.galaxyvis.particle) {
            const id = this.galaxyvis.id
            const particlePass = this.particlePass = document.getElementById("particle_" + id) as HTMLCanvasElement;
            dom.insertBefore(particlePass, dom.firstChild)
        }

        return dom
    }
}
