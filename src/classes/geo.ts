import { basicData, globalInfo, globalProp } from '../initial/globalProp'
import { originInfo } from '../initial/originInitial'
import { GeoModeOptions } from '../types'
import { animateNodes } from '../utils/graphAnimate'
import { cloneDeep } from 'lodash'

const L = window.L //解决未引入leaflet导致编译失败
const standards = 1.5
let geoClass: { [key: string]: any } = {}
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
// `https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetGray/MapServer/tile/{z}/{y}/{x}`
// 'https://{s}.tile.osm.org/{z}/{x}/{y}.png'
// "http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
// "http://api0.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&udt=20191205&scale=1&ak=5ieMMexWmzB9jivTq6oCRX9j"

const DEFAULT_TITLE = {
    subdomains: 'abc',
    url: `https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetGray/MapServer/tile/{z}/{y}/{x}`,
}

/**
 * @class geo
 * @constructor
 * @param {galaxyvis<any>} 初始化
 */
export default class geo<T, K> {
    private galaxyvis: any
    map: any
    layer: any
    mapContainer: any
    loadingGeoMode: boolean = true
    geoVisibleFilter: any
    options: any
    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
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
            let minZoomLevel: any = o?.minZoomLevel || 1,
                maxZoomLevel: any = o?.maxZoomLevel || 20,
                sizeRatio: any = o?.sizeRatio || 1.0,
                attribution: any = o?.attribution,
                tiles: any = o?.tiles || DEFAULT_TITLE,
                latitudePath: any = o?.latitudePath || 'lat',
                longitudePath: any = o?.longitudePath || 'lng',
                duration: any = o?.duration || 0,
                disableNodeDragging: any =
                    Number(o?.disableNodeDragging) == 0 ? o?.disableNodeDragging : true,
                crs: any = o?.crs || L?.CRS.EPSG3857
            this.options = options
            tiles = Object.assign(DEFAULT_TITLE, tiles)

            // 去除canvas的wheel和mousedown的事件
            let canvas = this.galaxyvis.gl?.canvas || this.galaxyvis.ctx?.canvas
            canvas.removeEventListener('wheel', this.galaxyvis.WheelFunction)
            canvas.removeEventListener('mousedown', this.galaxyvis.MousedownFunction)

            // 创建geo的容器和图层
            if (!document.getElementById('galaxyvis-geo-map')) {
                divContainer =
                    this.galaxyvis.ctx?.canvas.parentNode || this.galaxyvis.gl?.canvas.parentNode
                this.mapContainer = this.initDOM(divContainer, 'div', 'galaxyvis-geo-map')
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
                reject(void 0)
                return
            }

            // 获取Data能支持Path的点信息
            this.geoVisibleFilter = this.galaxyvis.transformations.addNodeFilter((node: any) => {
                return node.getData(latitudePath) && node.getData(longitudePath)
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
                    if (node?.isNode()) {
                        draggable = true
                        this.map.dragging['disable']()
                        canvas.addEventListener('mousedown', this.galaxyvis.MousedownFunction)
                    } else if (!this.map.dragging._enable && draggable) {
                        draggable = false
                        this.map.dragging['enable']()
                        canvas.removeEventListener('mousedown', this.galaxyvis.MousedownFunction)
                    }
                }) &&
                    this.map.on('mousedown', (e: any) => {
                        let node = this.galaxyvis.mouseCaptor.hoverTatget
                        if (node?.isNode()) {
                            startLat = e.latlng.lat
                            startLng = e.latlng.lng
                        } else {
                            let selectedNodes = this.galaxyvis.getSelectedNodes()
                            if (selectedNodes.size) selectedNodes.setSelected(false)
                        }
                    }) &&
                    this.map.on('mouseup', (e: any) => {
                        let node = this.galaxyvis.mouseCaptor.hoverTatget
                        if (node?.isNode()) {
                            endLat = e.latlng.lat
                            endLng = e.latlng.lng
                            let nodeId = node.getId()
                            let originNode = originInfo[id].nodeList.get(nodeId)
                            if (originNode.lat && originNode.lng) {
                                originNode.lat += endLat - startLat
                                originNode.lng += endLng - startLng
                            } else {
                                let data = node.getData()
                                let lat = Number(data[latitudePath]),
                                    lng = Number(data[longitudePath])
                                originNode.lat = lat + (endLat - startLat)
                                originNode.lng = lng + (endLng - startLng)
                            }
                        }
                    })
            }
            else {
                this.map.on('mousemove', (e: any) => {
                    let node = this.galaxyvis.mouseCaptor.hoverTatget
                    if (node?.isNode()) {
                        this.map.dragging['disable']()
                        this.galaxyvis.mouseCaptor.geoEnable = false
                        canvas.addEventListener('mousedown', this.galaxyvis.MousedownFunction)
                    } else {
                        this.map.dragging['enable']()
                        this.galaxyvis.mouseCaptor.geoEnable = true
                        canvas.removeEventListener('mousedown', this.galaxyvis.MousedownFunction)
                    }
                }) && this.map.on('mousedown', (e: any) => {
                    let node = this.galaxyvis.mouseCaptor.hoverTatget
                    if (!node?.isNode()) {
                        let selectedNodes = this.galaxyvis.getSelectedNodes()
                        if (selectedNodes.size) selectedNodes.setSelected(false)
                    }
                })
            }

            this.galaxyvis.view.setView({
                zoom: globalProp.defaultZoom,
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
                if (isVisible && data[latitudePath] && data[longitudePath]) {
                    let lat = Number(data[latitudePath]),
                        lng = Number(data[longitudePath])
                    longitudeSum += lng
                    latitudeSum += lat
                    len++
                }
            })

            len && ((viewPoint.lat = latitudeSum / len), (viewPoint.lng = longitudeSum / len))
            // 设置地图的经纬度和世界缩放等级
            this.map.setView(new L.LatLng(viewPoint.lat, viewPoint.lng), viewZoom)

            this.layer = new L.CanvasLayer({
                // geo地图的父级
                container: this.graphicContainer(),
                // 触发更新
                onUpdate: () => {
                    if (!this.layer._map) return Promise.resolve(void 0)

                    let map = this.layer._map,
                        centerMap = map.getCenter(),
                        lat = centerMap.lat,
                        lng = centerMap.lng,
                        points = map.options.crs.latLngToPoint(L.latLng(lat, lng), 1)
                        ; (this.layer._x = points.x), (this.layer._y = points.y)

                    let { width, height } = globalInfo[id].canvasBox

                    const ZOOMRATIO = map._zoom / (maxZoomLevel * standards)
                    var nodeData: any = {}
                    nodes.forEach((item, key) => {
                        let data = item.getData()
                        let isVisible = item.getAttribute('isVisible')
                        if (isVisible) {
                            let originNode = originInfo[id].nodeList.get(key)
                            let Coords = { x: 0, y: 0 }
                            if (originNode.lat && originNode.lng && !disableNodeDragging) {
                                Coords = map.latLngToContainerPoint(
                                    L.latLng(originNode.lat, originNode.lng),
                                )
                            } else {
                                Coords = map.latLngToContainerPoint(
                                    L.latLng(data[latitudePath], data[longitudePath]),
                                )
                            }

                            if (!originNode.baseRaius)
                                originNode.baseRaius = cloneDeep(item.value.attribute.radius)
                            if (this.loadingGeoMode && duration > 0) {
                                nodeData[key] = {
                                    x: Coords.x - width / 2,
                                    y: Coords.y - height / 2,
                                }
                            } else {
                                item.changeAttribute({
                                    x: Coords.x - width / 2,
                                    y: Coords.y - height / 2,
                                })
                            }
                        }
                    })
                    // 设置规则给到geo模式的点大小
                    // to do list： 把hover和selected的规则合并，因为geo模式下geo的class应该层次在hover..这类的下一级高于别的rule
                    if (!geoClass[id])
                        geoClass[id] = this.galaxyvis.styles.createClass({
                            nodeAttributes: {
                                radius(node: any) {
                                    let originNode = originInfo[id].nodeList.get(node.getId())
                                    return originNode.baseRaius * sizeRatio * ZOOMRATIO
                                },
                            },
                        })
                    // geo动画事件
                    if (this.loadingGeoMode && duration > 0) {
                        animateNodes(
                            this.galaxyvis,
                            nodeData,
                            {
                                duration: duration,
                            },
                            () => { },
                        )
                        this.loadingGeoMode = false
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
                var t = this.mapContainer.parentNode
                t && t.removeChild(this.mapContainer)
                // 添加回graph对象
                var divContainer = this.galaxyvis.getDivContainer()
                var canvas = this.galaxyvis.ctx?.canvas || this.galaxyvis.gl?.canvas
                divContainer.insertBefore(canvas, divContainer.firstChild)
                // graph类的鼠标事件回滚
                canvas.addEventListener('wheel', this.galaxyvis.WheelFunction)
                canvas.addEventListener('mousedown', this.galaxyvis.MousedownFunction)
                let nodes = basicData[id].nodeList
                // 撤回计算的坐标
                nodes.forEach((item, key) => {
                    let originNode = originInfo[id].nodeList.get(key)
                    originNode.baseRaius &&
                        item.changeAttribute({
                            radius: originNode.baseRaius,
                        })
                    originNode.baseRaius && delete originNode.baseRaius
                    originNode.lng && delete originNode.lng
                    originNode.lat && delete originNode.lat
                })

                // 销毁生成的class的规则 防止冲突
                geoClass[id] && geoClass[id].destroy() && delete geoClass[id]
                this.layer = null
                this.map = null
                this.galaxyvis.render()
                resolve(void 0)
            } else {
                reject()
            }
        })
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
    /**
     * 
     * @param ids 
     */
    locate(ids: string | any[]) {
        if (!ids || ids?.length == 0) return
        if (typeof ids === "string") ids = [ids];
        let len = ids.length
        let nodeList = basicData[this.galaxyvis.id].nodeList
        let o = this.options;
        let latitudePath: any = o?.latitudePath || 'lat',
            longitudePath: any = o?.longitudePath || 'lng',
            maxLng = -Infinity, maxLat = -Infinity,
            minLng = Infinity, minLat = Infinity

        for (let i = 0; i < len; i++) {
            let node = nodeList.get(ids[i]);
            let data = node.getData();
            if (data[latitudePath] && data[longitudePath]) {
                let lat = Number(data[latitudePath]),
                    lng = Number(data[longitudePath])

                maxLng = Math.max(maxLng, lng)
                minLng = Math.min(minLng, lng)
                maxLat = Math.max(maxLat, lat)
                minLat = Math.min(minLat, lat)
            }
        }
        let corner1 = L.latLng(minLat, minLng),
            corner2 = L.latLng(maxLat, maxLng),
            bounds = L.latLngBounds(corner1, corner2)
        this.map.fitBounds(bounds)

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

        return dom
    }
}
