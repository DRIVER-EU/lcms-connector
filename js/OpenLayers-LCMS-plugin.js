/*! Copyright 2016, Instituut Fysieke Veiligheid (IFV)
Postbus 7010
6801 HA Arnhem
The Netherlands
http://www.ifv.nl/

All rights are reserved. Some rights may be granted, but only on an individual basis and only by
express agreement in writing with the copyright holders. All such agreements will be subject to Dutch law.

This entire notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */
Proj4js.defs["EPSG:28992"] = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.237,50.0087,465.658,-0.406857,0.350733,-1.87035,4.0812 +units=m +no_defs", Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs", Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
var OpenLayers;
! function(OpenLayers) {
    "use strict";
    OpenLayers.Renderer || (OpenLayers.Renderer = {});
    var arrowSizing = {
            none: function(geometry, style) {
                return style
            },
            arrow: function(geometry, style) {
                OpenLayers.Renderer.symbol.arrow = [0, 2, 1, 0, 2, 2, 0, 2];
                var p1 = OpenLayers.Renderer.symbol.arrow.slice(0, 2),
                    p2 = OpenLayers.Renderer.symbol.arrow.slice(2, 4),
                    arrowWidth = style.arrowWidth,
                    arrowLength = style.arrowLength,
                    arrowId = geometry.id.split(".");
                arrowId = arrowId[arrowId.length - 1].toLowerCase();
                var p12Length = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)),
                    lengthArrow = Math.sqrt(arrowLength * arrowLength + arrowWidth * arrowWidth / 4),
                    xNew = p12Length * (arrowWidth / lengthArrow / 2),
                    yNew = p12Length * (arrowLength / lengthArrow);
                return OpenLayers.Renderer.symbol[arrowId] = [0, yNew, xNew, 0, 2 * xNew, yNew, 0, yNew], style.graphicName = arrowId, style
            },
            arrowBlunt: function(geometry, style) {
                return style
            },
            arrowSlash: function(geometry, style) {
                OpenLayers.Renderer.symbol.arrowSlash = [0, 2, 1, 0, 2, -2];
                var p1 = OpenLayers.Renderer.symbol.arrowSlash.slice(0, 2),
                    p2 = OpenLayers.Renderer.symbol.arrowSlash.slice(2, 4),
                    arrowWidth = style.arrowWidth,
                    arrowLength = style.arrowLength,
                    arrowId = geometry.id.split(".");
                arrowId = arrowId[arrowId.length - 1].toLowerCase().split("_"), arrowId = style.arrowType + "_" + arrowId[1];
                var p12Length = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)),
                    lengthArrow = Math.sqrt(arrowLength * arrowLength + arrowWidth * arrowWidth / 4),
                    xNew = p12Length * (arrowWidth / lengthArrow),
                    yNew = p12Length * (arrowLength / lengthArrow);
                return OpenLayers.Renderer.symbol[arrowId] = [0, 2 * yNew, xNew, yNew, 2 * xNew, 0], style.pointRadius = lengthArrow, style.graphicName = arrowId, style
            }
        },
        getOrientation = function(pt1, pt2) {
            var x = pt2.x - pt1.x,
                y = pt2.y - pt1.y,
                rad = Math.acos(y / Math.sqrt(x * x + y * y)),
                factor = x > 0 ? 1 : -1;
            return Math.round(factor * rad * 180 / Math.PI)
        };
    OpenLayers.Renderer.LCMSRenderer = OpenLayers.Class(OpenLayers.Renderer.SVG, {
        drawFeature: function(feature, style) {
            try {
                if ("undefined" != typeof feature.attributes.featureType)
                    if ("arrow" === feature.attributes.featureType.toLowerCase()) {
                        var drawn = document.getElementById(feature.geometry.id);
                        if (drawn) {
                            var arrowHead = document.getElementById(feature.geometry.id + "_head");
                            arrowHead && arrowHead.parentNode.removeChild(arrowHead);
                            var arrowTail = document.getElementById(feature.geometry.id + "_tail");
                            arrowTail && arrowTail.parentNode.removeChild(arrowTail)
                        }
                    } else style.strokeWidth = 1 + feature.data.lineWeight;
                return OpenLayers.Renderer.SVG.prototype.drawFeature.apply(this, arguments)
            } catch (err) {
                throw "Failed @OpenLayers.Renderer.SVGExtended.drawFeature"
            }
        },
        drawLineString: function(node, geometry) {
            try {
                return geometry.id.indexOf("Arrow") >= 0 && (this.drawArrows(geometry, node._style), node._style.strokeWidth = 1 + node._style.lineWeight), OpenLayers.Renderer.SVG.prototype.drawLineString.apply(this, arguments)
            } catch (err) {
                throw "Failed @OpenLayers.Renderer.SVGExtended.drawLineString"
            }
        },
        drawText: function(featureId, style, location) {
            try {
                OpenLayers.Renderer.SVG.prototype.drawText.apply(this, arguments);
                var text = $("#" + featureId + "_label")[0];
                if (text.setAttribute("style", style.fontStyle), !style.balloonType || 0 == style.balloonType) return;
                var boundingBox = text.getBBox();
                $("#" + featureId + "_labelBG").remove();
                var background, margin = 2;
                switch (style.balloonType) {
                    case 1:
                    case 2:
                    case 4:
                        background = document.createElementNS("http://www.w3.org/2000/svg", "rect"), background.setAttribute("x", boundingBox.x - margin), background.setAttribute("y", boundingBox.y - margin), background.setAttribute("height", boundingBox.height + 2 * margin), background.setAttribute("width", boundingBox.width + 2 * margin), background.setAttribute("style", style.backgroundStyle), 2 == style.balloonType && background.setAttribute("ry", style.borderRadius);
                        break;
                    case 3:
                        var background = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        background.setAttribute("cx", boundingBox.x + boundingBox.width / 2), background.setAttribute("cy", boundingBox.y + boundingBox.height / 2), background.setAttribute("r", Math.max(boundingBox.width, boundingBox.height) / 2 + margin), background.setAttribute("style", style.backgroundStyle)
                }
                if (style.textAngle) {
                    var cx = boundingBox.x + boundingBox.width / 2 * ((style.textReference - 1) % 3),
                        cy = boundingBox.y + boundingBox.height / 2 * (2 - Math.floor((style.textReference - 1) / 3)),
                        rotateTransform = "rotate(" + style.textAngle + "," + cx + "," + cy + ")";
                    text.setAttribute("transform", rotateTransform), background.setAttribute("transform", rotateTransform)
                }
                background.setAttribute("id", featureId + "_labelBG"), $(text).before(background)
            } catch (err) {
                throw "Failed @OpenLayers.Renderer.SVGExtended.drawText"
            }
        },
        removeText: function(featureId) {
            try {
                OpenLayers.Renderer.SVG.prototype.removeText.apply(this, arguments), $("#" + featureId + "_labelBG").remove()
            } catch (err) {
                throw "Failed @OpenLayers.Renderer.SVGExtended.removeText"
            }
        },
        drawArrows: function(geometry, style) {
            try {
                if ("none" === style.arrowType) return;
                var pts = geometry.components,
                    arrowStart = pts[pts.length - 2],
                    arrowEnd = pts[pts.length - 1];
                if (style = OpenLayers.Util.extend({}, style), style.pointRadius = 5, style.strokeWidth += 1, style = arrowSizing[style.arrowType](geometry, style), "false" !== style.arrowEnd) {
                    var arrowHead = pts[pts.length - 1];
                    arrowHead.id = geometry.id + "_head", style.rotation = getOrientation(arrowStart, arrowEnd), this.drawGeometry(arrowHead, style, arrowHead.id)
                }
                if ("false" !== style.arrowStart) {
                    var arrowTail = pts[0];
                    arrowTail.id = geometry.id + "_tail", style.rotation = getOrientation(pts[1], pts[0]), this.drawGeometry(arrowTail, style, arrowTail.id)
                }
            } catch (err) {
                throw "Failed @OpenLayers.Renderer.prototype.drawArrows"
            }
        },
        initialize: function() {
            OpenLayers.Renderer.SVG.prototype.initialize.apply(this, arguments)
        },
        setStyle: function(node, style, options) {
            node = OpenLayers.Renderer.SVG.prototype.setStyle.apply(this, arguments);
            try {
                if ("OpenLayers.Geometry.Point" == node._geometryClass && style.externalGraphic) {
                    var transformation = "",
                        cx = $(node).attr("cx"),
                        cy = $(node).attr("cy");
                    transformation = " rotate(" + style.geoRotation + "," + cx + "," + cy + ")", "true" === style.mirror && (transformation += " translate(" + 2 * cx + ",0) scale(-1,1)"), jQuery(node).attr("transform", transformation)
                }
                return node
            } catch (err) {
                throw "Error in LCMSRenderer.setStyle"
            }
        }
    })
}(OpenLayers || (OpenLayers = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    LCMS.DefaultMapStyle = {
        point: {
            graphicWidth: 32,
            graphicHeight: 32,
            graphicXOffset: -16,
            graphicYOffset: -16,
            label: "${labelText}"
        },
        plotsymbol: {
            externalGraphic: "${externalImage}",
            mirror: "${mirror}",
            graphicXOffset: "${geoXOffset}",
            graphicYOffset: "${geoYOffset}",
            graphicWidth: "${geoWidth}",
            graphicHeight: "${geoHeight}",
            geoRotation: "${geoRotation}",
            textAngle: "${textAngle}",
            balloonType: "${ballonType}",
            fontStyle: "${fontStyle}",
            textReference: "${textReference}",
            backgroundStyle: "${backgroundStyle}",
            borderRadius: "${borderRadius}",
            pointRadius: 0
        },
        text: {
            fontStyle: "${fontStyle}",
            backgroundStyle: "${backgroundStyle}",
            borderRadius: "${borderRadius}",
            label: "${labelText}",
            textAngle: "${textAngle}",
            textReference: "${textReference}",
            balloonType: "${ballonType}",
            labelYOffset: "${labelYOffset}",
            pointRadius: 0
        },
        geoimage: {
            externalGraphic: "${externalImage}",
            mirror: "${mirror}",
            graphicXOffset: "${geoXOffset}",
            graphicYOffset: "${geoYOffset}",
            graphicWidth: "${geoWidth}",
            graphicHeight: "${geoHeight}",
            geoRotation: "${geoRotation}",
            label: "${labelText}",
            textReference: "${textReference}",
            labelXOffset: 0,
            labelYOffset: 24,
            lineWeight: "${lineWeight}",
            strokeWidth: 2,
            strokeColor: "blue",
            scaling: "${scaling}",
            pointRadius: 0,
            geoResolution: 25
        },
        geothumb: {
            externalGraphic: "${externalImage}",
            mirror: "${mirror}",
            graphicWidth: 20,
            graphicHeight: 20,
            graphicXOffset: -10,
            graphicYOffset: -10,
            geoRotation: "${geoRotation}",
            label: "${labelText}",
            textReference: "${textReference}",
            labelXOffset: 0,
            labelYOffset: 24,
            lineWeight: "${lineWeight}",
            strokeWidth: 2,
            strokeColor: "blue",
            pointRadius: 0
        },
        polygon: {
            fillColor: "${fillColor}",
            fillOpacity: .3,
            lineWeight: "${lineWeight}",
            strokeWidth: 2,
            strokeColor: "blue",
            pointRadius: 0,
            label: "${labelText}",
            textReference: "${textReference}"
        },
        circle: {
            lineWeight: "${lineWeight}",
            strokeWidth: 2,
            strokeColor: "blue",
            pointRadius: 0,
            label: "${labelText}",
            textReference: "${textReference}"
        },
        line: {
            lineWeight: "${lineWeight}",
            strokeWidth: 2,
            strokeColor: "blue",
            pointRadius: 0
        },
        freeline: {
            lineWeight: "${lineWeight}",
            strokeWidth: 2,
            strokeColor: "blue",
            pointRadius: 0
        },
        arrow: {
            lineWeight: "${lineWeight}",
            strokeColor: "blue",
            pointRadius: 0,
            arrowWidth: "${arrowWidth}",
            arrowLength: "${arrowLength}",
            arrowType: "${arrowType}",
            arrowStart: "${arrowStart}",
            arrowEnd: "${arrowEnd}"
        },
        plotsymbolNS: {
            externalGraphic: "${externalImage}",
            mirror: "${mirror}",
            graphicXOffset: "${geoXOffset}",
            graphicYOffset: "${geoYOffset}",
            graphicWidth: "${geoWidth}",
            graphicHeight: "${geoHeight}",
            geoRotation: "${geoRotation}",
            textAngle: "${textAngle}",
            textReference: "${textReference}",
            balloonType: "${ballonType}",
            fontStyle: "${fontStyle}",
            backgroundStyle: "${backgroundStyle}",
            borderRadius: "${borderRadius}",
            pointRadius: 0,
            scaling: "${scaling}",
            geoResolution: 25
        },
        textNS: {
            fontStyle: "${fontStyle}",
            backgroundStyle: "${backgroundStyle}",
            borderRadius: "${borderRadius}",
            label: "${labelText}",
            textAngle: "${textAngle}",
            textReference: "${textReference}",
            balloonType: "${ballonType}",
            pointRadius: 0,
            scaling: "${scaling}",
            labelYOffset: "${labelYOffset}",
            geoResolution: 25
        }
    }, LCMS.defaultTemplate = {
        strokeWidth: 2,
        strokeColor: "blue",
        pointRadius: 5,
        labelAlign: "lb"
    }, LCMS.selectTemplate = {
        fillColor: "#66cccc",
        fillOpacity: .3,
        strokeColor: "#66cccc",
        strokeOpacity: 1,
        strokeWidth: 2,
        pointRadius: 5,
        graphicName: "circle"
    }, LCMS.temporaryTemplate = {
        fillColor: "#66cccc",
        fillOpacity: .3,
        strokeColor: "#66cccc",
        strokeOpacity: 1,
        strokeWidth: 2,
        pointRadius: 5,
        graphicName: "circle"
    };
    var scaleContext = function(parameter) {
            return function(feature) {
                return feature.attributes.scaling === !0 ? feature.attributes[parameter] : feature.attributes[parameter] * LCMS.Image.geoResolution / feature.layer.map.getResolution()
            }
        },
        scaleRadius = function(feature) {
            return feature.attributes.border ? feature.attributes.scaling === !0 ? feature.attributes.border.cornerRadius / 2 : feature.attributes.border.cornerRadius * LCMS.Image.geoResolution / (2 * feature.layer.map.getResolution()) : 0
        },
        anchors = ["start", "middle", "end"],
        alignments = ["text-after-edge", "middle", "text-before-edge"],
        createTextStyle = function(feature) {
            var font = feature.attributes.font;
            if (!font) return "";
            var fontScale = 1;
            feature.attributes.scaling || (fontScale = LCMS.Image.geoResolution / feature.layer.map.getResolution());
            var style = "font-family: monospace, serif; font-size: " + font.size * fontScale + "pt;";
            style += "fill: " + font.color + ";", style += "stroke: " + font.color + ";", style += parseFloat(font.weight) > 1 ? "font-weight: bold; stroke-width: 1px;" : "font-weight: normal; stroke-width: 0px;";
            var anchor = anchors[(font.reference - 1) % 3],
                alignment = alignments[Math.floor((font.reference - 1) / 3)];
            return style += "text-anchor: " + anchor + "; dominant-baseline: " + alignment + ";"
        },
        createBackgroundStyle = function(feature) {
            var background = feature.attributes.background,
                border = feature.attributes.border;
            if (!background || !border) return "";
            var style = "fill: " + background.color + ";";
            return style += "stroke: " + border.color + ";", style += "fill-opacity: " + background.transparency + ";", style += "stroke-width: " + border.width + ";"
        };
    LCMS.context = {
        geoXOffset: scaleContext("geoXOffset"),
        geoYOffset: scaleContext("geoYOffset"),
        geoWidth: scaleContext("geoWidth"),
        geoHeight: scaleContext("geoHeight"),
        fontStyle: createTextStyle,
        backgroundStyle: createBackgroundStyle,
        borderRadius: scaleRadius,
        ballonType: function(feature) {
            return feature.attributes.border ? feature.attributes.border.type : 0
        }
    }
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var MapController = function() {
        function MapController(map) {
            this.drawings = {}, this.popups = {}, void 0 !== map && this.setMap(map)
        }
        return MapController.prototype.setMap = function(map) {
            this.map = map;
            var defaultStyle = new OpenLayers.Style(LCMS.defaultTemplate, {
                    context: LCMS.context
                }),
                selectStyle = new OpenLayers.Style(LCMS.selectTemplate, {
                    context: LCMS.context
                }),
                temporaryStyle = new OpenLayers.Style(LCMS.temporaryTemplate, {
                    context: LCMS.context
                });
            this.defaultStyleMap = new OpenLayers.StyleMap({
                "default": defaultStyle,
                select: selectStyle,
                temporary: temporaryStyle
            }), this.defaultStyleMap.addUniqueValueRules("default", "featureType", LCMS.DefaultMapStyle), this.defaultStyleMap.addUniqueValueRules("select", "featureType", LCMS.DefaultMapStyle), this.defaultStyleMap.addUniqueValueRules("temporary", "featureType", LCMS.DefaultMapStyle), this.setUpSelectControls()
        }, MapController.prototype.updateDrawing = function(drawing, ticket, defaultVisible) {
            var tmpDrawing = drawing.clone();
            void 0 === this.drawings[drawing.id] && (this.drawings[drawing.id] = tmpDrawing);
            var updates = this.drawings[drawing.id].update(tmpDrawing, this.map, this.defaultStyleMap, ticket, defaultVisible || void 0 === defaultVisible);
            return this.selectControl.setLayer(this.getVectorLayers(drawing.id)), this.setPopups(drawing.id), updates
        }, MapController.prototype.getCurrentVersions = function(id) {
            if (id && this.drawings[id]) return this.drawings[id].getCurrentVersions();
            var ret = {};
            for (var key in this.drawings) $.extend(ret, this.drawings[key].getCurrentVersions());
            return ret
        }, MapController.prototype.drawLayers = function(ids) {
            var _this = this,
                layers = this.getVectorLayerSets(ids);
            layers.notInList.map(function(x) {
                x.setVisibility(!1), _this.removePopups(x.name)
            }), layers.inList.map(function(x) {
                x.setVisibility(!0), _this.addPopups(x.name)
            })
        }, MapController.prototype.setPopups = function(drawingId) {
            var _this = this;
            if (this.drawings[drawingId]) {
                this.removeAllPopups();
                for (var actionLayers = this.drawings[drawingId].getActionLayers(), i = 0; i < actionLayers.length; i++) this.popups[actionLayers[i].id] = actionLayers[i].getPopups(function(args) {
                    _this.addAttributesPopup.apply(_this, [args])
                });
                if (this.selectControl.active)
                    for (var key in this.popups) this.addPopups(key)
            }
        }, MapController.prototype.addPopups = function(id) {
            if (this.popups && this.popups[id] && this.selectControl.active) {
                var layers = this.map.getLayersByName(id);
                if (layers && 0 != layers.length && layers[0].getVisibility())
                    for (var i = 0; i < this.popups[id].length; i++) this.map.addPopup(this.popups[id][i], !1)
            }
        }, MapController.prototype.removePopups = function(id) {
            if (this.popups && this.popups[id])
                for (var i = 0; i < this.popups[id].length; i++) this.map.removePopup(this.popups[id][i])
        }, MapController.prototype.activateSelectControls = function(drawingId) {
            if (this.drawings[drawingId]) {
                this.selectControl.activate(), this.selectControl.deactivate(), this.selectControl.activate();
                var actionLayers = this.drawings[drawingId].getActionLayers();
                for (var i in actionLayers) this.addPopups(actionLayers[i].id)
            }
        }, MapController.prototype.removeAllPopups = function() {
            if (this.popups)
                for (var pop in this.popups) this.removePopups(pop)
        }, MapController.prototype.setUpSelectControls = function() {
            var _this = this;
            this.selectControl = new OpenLayers.Control.SelectFeature([], {
                onSelect: function(args) {
                    _this.onFeatureSelect.apply(_this, [args])
                },
                onUnselect: this.removeAttributesPopup,
                toggle: !0,
                hover: !1
            }), this.map.addControl(this.selectControl), this.selectControl.deactivate()
        }, MapController.prototype.deactivateSelectControls = function() {
            void 0 !== this.selectControl && (this.removeAllPopups(), this.selectControl.deactivate())
        }, MapController.prototype.onFeatureSelect = function(onSelect) {
            for (var key in this.drawings) {
                var feature = this.drawings[key].getAttributesFeature(onSelect.data.UUID);
                if (feature) return void this.addAttributesPopup(feature)
            }
        }, MapController.prototype.addAttributesPopup = function(feature) {
            var _this = this;
            this.currentAttributesPopup && this.map.removePopup(this.currentAttributesPopup);
            var popup = new OpenLayers.Popup.FramedCloud(feature.UUID, feature.position, new OpenLayers.Size(250, 250), feature.content, null, (!0), function(x) {});
            $(popup.closeDiv).click(function() {
                _this.removeAttributesPopup.apply(_this, [])
            }), popup.maxSize = new OpenLayers.Size(500, 660), popup.panMapIfOutOfView = !1, popup.keepInMap = !1, this.map.addPopup(popup, !1), this.currentAttributesPopup = popup
        }, MapController.prototype.removeAttributesPopup = function() {
            this.currentAttributesPopup && (this.map.removePopup(this.currentAttributesPopup), this.currentAttributesPopup = void 0)
        }, MapController.prototype.getVectorLayers = function(drawingId) {
            var actionLayersIds = $.map(this.drawings[drawingId].getActionLayers(), function(al) {
                return al.id
            });
            return this.getVectorLayerSets(actionLayersIds).inList
        }, MapController.prototype.getVectorLayerSets = function(names) {
            for (var ret = {
                    inList: [],
                    notInList: []
                }, layers = this.map.getLayersByClass("OpenLayers.Layer.Vector"), i = 0; i < layers.length; i++) names.indexOf(layers[i].name) != -1 ? ret.inList.push(layers[i]) : ret.notInList.push(layers[i]);
            return ret
        }, MapController
    }();
    LCMS.MapController = MapController
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict"
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict"
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict"
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var AbstractWebService = function() {
        function AbstractWebService(url, username, password) {
            void 0 !== url && this.setUp(url, username, password), $.support.cors = !0
        }
        return AbstractWebService.prototype.getServerUrl = function() {
            return this.serverUrl
        }, AbstractWebService.prototype.loadData = function(successCall, errorCall, msg) {
            var _this = this,
                successCallback = function(response) {
                    successCall(_this.getRelevantData(response))
                };
            $.ajax(this.prepareRequest(successCallback, errorCall, msg))
        }, AbstractWebService.prototype.setUp = function(url, username, password) {
            this.serverUrl = url, this.requestTmpl = {
                method: "POST",
                url: this.getServiceSpecificUrl(url),
                async: !1,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: {}
            }, void 0 !== username && (void 0 !== password ? this.requestTmpl.headers = {
                Authorization: "Basic " + $.base64.encode(username + ":" + password)
            } : this.requestTmpl.headers = {
                Authorization: "Basic " + $.base64.encode(username)
            })
        }, AbstractWebService.prototype.getServiceSpecificUrl = function(url) {
            return ""
        }, AbstractWebService.prototype.getRelevantData = function(data) {
            return data
        }, AbstractWebService.prototype.prepareRequest = function(success, error, data) {
            var request = this.requestTmpl;
            return request.data = JSON.stringify(data), request.success = success, request.error = error, request
        }, AbstractWebService
    }();
    LCMS.AbstractWebService = AbstractWebService
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var ActivityWebService = function(_super) {
        function ActivityWebService() {
            _super.apply(this, arguments)
        }
        return __extends(ActivityWebService, _super), ActivityWebService.prototype.getServiceSpecificUrl = function(url) {
            return url + "/drawing/activities"
        }, ActivityWebService.prototype.getRelevantData = function(data) {
            return data.activities = $.map(data.activities, function(a) {
                return LCMS.Activity.fromObject(a)
            }), data.ticket = new LCMS.Ticket(data.ticket, this.getServerUrl(), this), data
        }, ActivityWebService.prototype.prepareRequest = function(success, error, data) {
            var time = 0;
            return void 0 !== data && (time = data), _super.prototype.prepareRequest.call(this, success, error, {
                active_after: time
            })
        }, ActivityWebService
    }(LCMS.AbstractWebService);
    LCMS.ActivityWebService = ActivityWebService
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var DrawingWebService = function(_super) {
        function DrawingWebService() {
            _super.apply(this, arguments)
        }
        return __extends(DrawingWebService, _super), DrawingWebService.prototype.getServiceSpecificUrl = function(url) {
            return url + "/drawing/drawings"
        }, DrawingWebService.prototype.getRelevantData = function(data) {
            return LCMS.Drawing.fromObject(data)
        }, DrawingWebService.prototype.prepareRequest = function(success, error, data) {
            return "string" == typeof data ? _super.prototype.prepareRequest.call(this, success, error, {
                activity_id: data
            }) : _super.prototype.prepareRequest.call(this, success, error, data)
        }, DrawingWebService
    }(LCMS.AbstractWebService);
    LCMS.DrawingWebService = DrawingWebService
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var AElement = function() {
        function AElement(obj, parent) {
            var _this = this;
            this.parent = parent, this.UUID = obj.id, this.attributes = {}, obj.attributes.forEach(function(attr) {
                var values = {};
                attr.attributeItems.forEach(function(item) {
                    6 == item.type && item.attributeValue && item.attributeValue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), values[item.name] = item.attributeValue
                }), _this.attributes[attr.name] = values
            })
        }
        return AElement.prototype.getID = function() {
            return this.UUID
        }, AElement.prototype.toFeature = function(projection, ticket) {
            return null
        }, AElement.prototype.getBounds = function() {
            if (void 0 === this.geometry) throw new Error("No geometry defined for this element.");
            return this.geometry.clearBounds(), this.geometry.getBounds()
        }, AElement.prototype.getAttributesFeature = function(UUID) {
            if (this.parent) return this.parent.getAttributesFeature(UUID);
            if (!UUID || this.UUID == UUID) return {
                UUID: this.UUID,
                position: this.getBounds().getCenterLonLat(),
                content: this.getAttributesFeatureContent()
            }
        }, AElement.prototype.getAttributesFeatureContent = function() {
            var _this = this;
            if (this.content) return this.content;
            var content = "";
            return $.each(this.attributes, function(group) {
                $.each(_this.attributes[group], function(name) {
                    content += _this.createTr(group, name)
                })
            }), content.length > 0 && (content = '<table class="popupContentTable"><tbody>' + content + "</tbody></table><br />"), this.content = content, content
        }, AElement.prototype.createTr = function(group, name) {
            return '<tr class="attributeInPopup"><td class="attributeNameInPopup">' + group + "&nbsp;:&nbsp;" + name + '</td><td class="attributeValueInPopup">' + this.attributes[group][name] + "</td></tr>"
        }, AElement
    }();
    LCMS.AElement = AElement
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var Arc = function(_super) {
        function Arc(obj, actionLayer, parent) {
            _super.call(this, obj, parent), this.actionLayer = actionLayer, this.lineWeight = obj.lineWidth, this.coordinates = [new OpenLayers.Geometry.Point(obj.point1.x, obj.point1.y), new OpenLayers.Geometry.Point(obj.point2.x, obj.point2.y)], this.start = obj.start, this.extent = obj.extent, this.style = LCMS.Styles.styleBuilder(obj.color, obj.lineType, obj.fillType);
            var midPoint = new LCMS.FindMidPoint(this.coordinates[0], this.coordinates[1]);
            midPoint.getRadius();
            midPoint.point3.y, midPoint.point3.x;
            if (this.origin_xy = midPoint.point3, this.origin_xy.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992")), this.coordinates[0].transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992")), this.coordinates[1].transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992")), Math.abs(Math.floor(this.coordinates[0].x - this.coordinates[1].x)) !== Math.abs(Math.floor(this.coordinates[0].y - this.coordinates[1].y))) {
                this.majorAxis = (this.coordinates[1].x - this.coordinates[0].x) / 2, this.minorAxis = (this.coordinates[1].y - this.coordinates[0].y) / 2;
                var majorMinorRatio = Math.ceil(this.majorAxis / this.minorAxis),
                    circleVertices = majorMinorRatio > 10 ? Arc.circleVertices * Math.floor(majorMinorRatio / 10) * 10 : Arc.circleVertices,
                    circleVerticesSplit = circleVertices / (2 * majorMinorRatio),
                    tmp = [];
                tmp = tmp.concat(this.getEllipseCoordinates(new LCMS.Angle((-30)), new LCMS.Angle(30), circleVerticesSplit * (majorMinorRatio - 1))), tmp = tmp.concat(this.getEllipseCoordinates(new LCMS.Angle(30), new LCMS.Angle(150), circleVerticesSplit)), tmp = tmp.concat(this.getEllipseCoordinates(new LCMS.Angle(150), new LCMS.Angle(210), circleVerticesSplit * (majorMinorRatio - 1))), tmp = tmp.concat(this.getEllipseCoordinates(new LCMS.Angle(210), new LCMS.Angle(330), circleVerticesSplit)), this.coordinates = tmp
            } else {
                var startAngle, endAngle = this.extent;
                this.extent < 360 ? (startAngle = this.start, endAngle = this.extent) : startAngle = 0, this.coordinates = [];
                for (var k = 0; k <= Arc.circleVertices; k++) {
                    var theta = new LCMS.Angle(startAngle + k * endAngle / Arc.circleVertices),
                        xNew = this.origin_xy.x + 1e3 * midPoint.radius * Math.cos(theta.rad),
                        yNew = this.origin_xy.y - 1e3 * midPoint.radius * Math.sin(theta.rad),
                        newPoint = new OpenLayers.Geometry.Point(xNew, yNew);
                    newPoint.transform(new OpenLayers.Projection("EPSG:28992"), new OpenLayers.Projection("EPSG:4326")), this.coordinates.push(newPoint)
                }
            }
            0 == this.start ? this.featureType = "polygon" : this.featureType = "line"
        }
        return __extends(Arc, _super), Arc.prototype.getEllipseCoordinates = function(startAngle, endAngle, stepping) {
            for (var newCoordinates = [], stepSize = (endAngle.deg - startAngle.deg) / stepping, theta = startAngle; theta.deg <= endAngle.deg; theta = new LCMS.Angle(theta.deg + stepSize)) {
                var ellipseR = this.majorAxis * this.minorAxis / Math.sqrt(Math.pow(this.minorAxis * Math.cos(theta.rad), 2) + Math.pow(this.majorAxis * Math.sin(theta.rad), 2)),
                    xNew = this.origin_xy.x + ellipseR * Math.cos(theta.rad),
                    yNew = this.origin_xy.y + ellipseR * Math.sin(theta.rad),
                    newPoint = new OpenLayers.Geometry.Point(xNew, yNew);
                newPoint.transform(new OpenLayers.Projection("EPSG:28992"), new OpenLayers.Projection("EPSG:4326")), newCoordinates.push(newPoint)
            }
            return newCoordinates
        }, Arc.prototype.toFeature = function(projection) {
            if (void 0 === this.geometry)
                if (this.coordinates.forEach(function(x) {
                        x.transform(new OpenLayers.Projection("EPSG:4326"), projection)
                    }), this.featureType.match("polygon")) {
                    var ring = new OpenLayers.Geometry.LinearRing(this.coordinates);
                    this.geometry = new OpenLayers.Geometry.Polygon([ring])
                } else this.geometry = new OpenLayers.Geometry.LineString(this.coordinates);
            return [new OpenLayers.Feature.Vector(this.geometry, {
                actionLayerId: this.actionLayer.id,
                UUID: this.UUID,
                featureType: this.featureType,
                lineWeight: this.lineWeight,
                element: this
            }, this.style)]
        }, Arc.circleVertices = 50, Arc
    }(LCMS.AElement);
    LCMS.Arc = Arc
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var Contour = function(_super) {
        function Contour(obj, actionLayer, parent) {
            _super.call(this, obj, parent), this.contour = [], this.actionLayer = actionLayer, this.lineWeight = obj.lineWidth, this.typeList = obj.typeList, this.coordinates = $.map(obj.pointList, function(p) {
                return new OpenLayers.Geometry.Point(p.x, p.y)
            }), void 0 !== this.parent ? (this.style = LCMS.Styles.styleBuilder(void 0, void 0, obj.fillType), this.style.stroke = !1) : this.style = LCMS.Styles.styleBuilder(obj.color, obj.lineType);
            var pointIndex = 0;
            this.featureType = "freeline";
            for (var i = 0; i < this.typeList.length; i++) {
                var segmentType = this.typeList.charAt(i);
                if ("0" === segmentType || "1" === segmentType) this.contour.push(this.coordinates[pointIndex]), pointIndex++;
                else if ("2" === segmentType) LCMS.BezierCurve.bezierCurve(this.coordinates.slice(pointIndex - 1, pointIndex + 2), this.contour), pointIndex += 2;
                else if ("3" === segmentType) LCMS.BezierCurve.bezierCurve(this.coordinates.slice(pointIndex - 1, pointIndex + 3), this.contour), pointIndex += 3;
                else {
                    if ("4" !== segmentType) throw "Unknown segment type in spline: " + segmentType;
                    this.featureType = "polygon"
                }
            }
        }
        return __extends(Contour, _super), Contour.prototype.toFeature = function(projection) {
            if (void 0 === this.geometry)
                if (this.contour.forEach(function(x) {
                        x.transform(new OpenLayers.Projection("EPSG:4326"), projection)
                    }), this.featureType.match("polygon")) {
                    var ring = new OpenLayers.Geometry.LinearRing(this.contour);
                    this.geometry = new OpenLayers.Geometry.Polygon([ring])
                } else this.geometry = new OpenLayers.Geometry.LineString(this.contour);
            return [new OpenLayers.Feature.Vector(this.geometry, {
                actionLayerId: this.actionLayer.id,
                UUID: this.UUID,
                featureType: this.featureType,
                lineWeight: this.lineWeight
            }, this.style)]
        }, Contour
    }(LCMS.AElement);
    LCMS.Contour = Contour
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var Image = function(_super) {
        function Image(obj, actionLayer, parent) {
            _super.call(this, obj, parent), void 0 !== obj.attributes && obj.attributes.length >= 1 && (this.imageType = obj.attributes[0].name), this.actionLayer = actionLayer, this.coordinates = [new OpenLayers.Geometry.Point(obj.lowerLeft.x, obj.lowerLeft.y), new OpenLayers.Geometry.Point(obj.upperRight.x, obj.upperRight.y)];
            var lowerLeft = this.coordinates[0];
            lowerLeft.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992"));
            var upperRight = this.coordinates[1];
            upperRight.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992"));
            var dx = upperRight.x - lowerLeft.x,
                dy = upperRight.y - lowerLeft.y,
                corners = new LCMS.AffineTransform({
                    x: 0,
                    y: 0
                }, {
                    x: dx,
                    y: 0
                }, {
                    x: dx,
                    y: dy
                }, {
                    x: 0,
                    y: dy
                }, {
                    transform: obj.transform,
                    translate: lowerLeft
                });
            this.width = Math.sqrt(Math.pow(corners.point2.x - corners.point1.x, 2) + Math.pow(corners.point2.y - corners.point1.y, 2)) / Image.geoResolution, this.height = Math.sqrt(Math.pow(corners.point4.x - corners.point1.x, 2) + Math.pow(corners.point4.y - corners.point1.y, 2)) / Image.geoResolution, this.rotation = Math.atan2(corners.point1.y - corners.point2.y, corners.point1.x - corners.point2.x), this.rotation = -new LCMS.Angle(this.rotation + Math.PI, "rad").deg, this.mirror = !1, (obj.transform.m00 < 0 && obj.transform.m11 < 0 || obj.transform.m00 > 0 && obj.transform.m11 > 0) && (this.mirror = !0, this.rotation = this.rotation - 180), void 0 !== this.parent && this.parent.getPixelScale ? (this.featureType = "geothumb", this.scaling = !0) : (this.featureType = "geoimage", this.scaling = !1), this.origin = new OpenLayers.Geometry.Point((corners.point1.x + corners.point3.x) / 2, (corners.point1.y + corners.point3.y) / 2), this.externalImage = obj.downloadLocation
        }
        return __extends(Image, _super), Image.prototype.toFeature = function(projection, ticket) {
            if (void 0 === this.geometry && (this.origin.transform(new OpenLayers.Projection("EPSG:28992"), projection), this.geometry = this.origin, void 0 !== this.parent)) {
                var attributes = this.parent.getAttributes;
                void 0 !== attributes && void 0 !== attributes["Geolocator-gegevens"] && void 0 !== attributes["Geolocator-gegevens"]["x-coordinaat"] && void 0 !== attributes["Geolocator-gegevens"]["x-coordinaat"] && (this.geometry = new OpenLayers.Geometry.Point(attributes["Geolocator-gegevens"]["x-coordinaat"], attributes["Geolocator-gegevens"]["y-coordinaat"])), this.attributes && this.attributes[0] && "symbol" == this.attributes[0].name && (this.width = 32, this.height = 32, this.featureType = "plotsymbol")
            }
            return void 0 !== ticket && (this.ticket = ticket), [new OpenLayers.Feature.Vector(this.geometry, {
                actionLayer: this.actionLayer.id,
                UUID: this.UUID,
                featureType: this.featureType,
                geoRotation: this.rotation,
                geoHeight: this.height,
                geoWidth: this.width,
                geoXOffset: -this.width / 2,
                geoYOffset: -this.height / 2,
                scaling: this.scaling,
                mirror: this.mirror,
                textAngle: 0,
                labelText: "",
                textReference: 5,
                externalImage: this.ticket.getFullUrl(this.externalImage)
            })]
        }, Image.prototype.getAttributesFeatureContent = function() {
            return '<div class="popupContentImage"><img src="' + this.ticket.getFullUrl(this.externalImage) + '" alt="image"></img></div>'
        }, Image.geoResolution = 25, Image
    }(LCMS.AElement);
    LCMS.Image = Image
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var Line = function(_super) {
        function Line(obj, actionLayer, parent) {
            _super.call(this, obj, parent), this.actionLayer = actionLayer, this.lineWeight = obj.lineWidth, this.coordinates = [new OpenLayers.Geometry.Point(obj.point1.x, obj.point1.y), new OpenLayers.Geometry.Point(obj.point2.x, obj.point2.y)], this.style = LCMS.Styles.styleBuilder(obj.color, obj.lineType)
        }
        return __extends(Line, _super), Line.prototype.toFeature = function(projection) {
            return void 0 === this.geometry && (this.coordinates.forEach(function(x) {
                x.transform(new OpenLayers.Projection("EPSG:4326"), projection)
            }), this.geometry = new OpenLayers.Geometry.LineString(this.coordinates)), [new OpenLayers.Feature.Vector(this.geometry, {
                actionLayer: this.actionLayer.id,
                UUID: this.UUID,
                styleId: this.styleId,
                featureType: "line",
                lineWeight: this.lineWeight
            }, this.style)]
        }, Line
    }(LCMS.AElement);
    LCMS.Line = Line
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var Part = function(_super) {
        function Part(obj, actionLayer, parent) {
            _super.call(this, obj, parent), this.origin = void 0, void 0 !== obj.origin && (this.origin = new OpenLayers.Geometry.Point(obj.origin.x, obj.origin.y)), this.actionLayer = actionLayer, this.UUID = obj.id, this.pixelScale = obj.pixelScale, this.childrenIds = obj.children, this.name = obj.name
        }
        return __extends(Part, _super), Part.prototype.hasChildren = function() {
            return this.childrenIds.length > 0
        }, Part.prototype.getChildrenIds = function() {
            return this.childrenIds
        }, Part.prototype.getChildren = function() {
            return this.children
        }, Part.prototype.setChildrenElements = function(children) {
            this.children = children
        }, Part.prototype.toFeature = function(projection, ticket) {
            for (var features = [], i = 0; i < this.children.length; i++) features = features.concat(this.children[i].toFeature(projection, ticket));
            return features
        }, Part.prototype.getPopup = function(popupCallback) {
            var popup = null;
            if (Object.keys(this.attributes).length) {
                var documentHTML = document.createElement("img");
                $(documentHTML).attr("src", "img/Haspopup.png").attr("id", "popupPreviewOf_img_" + this.UUID), popup = new OpenLayers.Popup("popupPreviewOf" + this.UUID, this.getBounds().getCenterLonLat(), new OpenLayers.Size(30, 30), documentHTML.outerHTML, (!1)), popup.events.register("click", this, this.getSelectFeature(popupCallback)), popup.backgroundColor = null
            }
            return popup
        }, Part.prototype.getAttributesFeature = function(UUID) {
            if (this.parent) return this.parent.getAttributesFeature(UUID);
            if (UUID) {
                var IDs = this.getAllIds();
                if (IDs.indexOf(UUID) == -1) return
            }
            var contents = this.getAttributesFeatureContent() || "";
            return {
                UUID: UUID || this.UUID || "unknown",
                position: this.getBounds().getCenterLonLat(),
                content: contents
            }
        }, Part.prototype.getAllIds = function() {
            var ret = [this.getID()];
            for (var key in this.children) this.children[key] instanceof Part ? ret = ret.concat(this.children[key].getAllIds()) : ret.push(this.children[key].getID());
            return ret
        }, Part.prototype.getSelectFeature = function(popupCallback) {
            return function() {
                popupCallback(this.getAttributesFeature())
            }
        }, Part.prototype.getAll = function(f, args) {
            var ret = [];
            this.hasChildren() && (ret = this.getChildren().reduce(function(previous, current) {
                return current instanceof Part ? previous.concat(current.getAll(f, args)) : previous
            }, []));
            var local = f.apply(this, args);
            return null !== local && ret.push(local), ret
        }, Object.defineProperty(Part.prototype, "getPixelScale", {
            get: function() {
                return this.pixelScale || void 0 === this.parent ? this.pixelScale : this.parent.getPixelScale
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(Part.prototype, "getOrigin", {
            get: function() {
                return void 0 === this.parent || this.pixelScale ? this.origin : this.parent.getOrigin
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(Part.prototype, "getAttributes", {
            get: function() {
                return this.attributes
            },
            enumerable: !0,
            configurable: !0
        }), Part.prototype.getBounds = function() {
            for (var listOfBounds = $.map(this.children, function(c) {
                    return c.getBounds()
                }), ret = listOfBounds[0].clone(), i = 1; i < listOfBounds.length; i++) ret.extend(listOfBounds[i]);
            return ret
        }, Part.prototype.getAttributesFeatureContent = function() {
            if (this.content) return this.content;
            var subAttributes = this.getSubAttributesContent();
            return this.attributes && Object.keys(this.attributes).length > 0 && (this.attributes.symbol && this.attributes.symbol.title && "Rijopdracht" == this.attributes.symbol.title ? (this.attributes.Rijopdracht = this.attributes.symbol, delete this.attributes.symbol, subAttributes.headers.unshift(this.name)) : this.attributes.symbol && this.attributes.symbol.title && "Meetopdracht" == this.attributes.symbol.title && (this.attributes.Meetopdracht = this.attributes.symbol, subAttributes.headers.unshift(this.name), delete this.attributes.symbol)), _super.prototype.getAttributesFeatureContent.call(this), this.content = '<h1 class="labelInPopup">' + subAttributes.headers.join(", ") + "</h1>" + this.content + subAttributes.images.join(""), this.content
        }, Part.prototype.getSubAttributesContent = function() {
            var ret = {
                headers: [],
                images: []
            };
            return this.hasChildren() && this.getChildren().forEach(function(current) {
                if (current instanceof Part) {
                    var tmp = current.getSubAttributesContent();
                    ret.headers = ret.headers.concat(tmp.headers), ret.images = ret.images.concat(tmp.images)
                } else current instanceof LCMS.StrokeText ? ret.headers.push(current.getLabel()) : current instanceof LCMS.Image ? ret.images.push(current.getAttributesFeatureContent()) : current instanceof LCMS.Symbol && (ret.headers.push(current.getLabel()), ret.images.push(current.getSymbolImage()))
            }), ret
        }, Part
    }(LCMS.AElement);
    LCMS.Part = Part
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var PolyArrow = function(_super) {
        function PolyArrow(obj, actionLayer, parent) {
            _super.call(this, obj, parent);
            var color = new LCMS.Color(obj.style.color);
            this.actionLayer = actionLayer, this.jsonStyle = obj.style, this.coordinates = $.map(obj.pointList, function(point) {
                return new OpenLayers.Geometry.Point(point.x, point.y)
            }), this.style = LCMS.Styles.styleBuilder(color.getHex(), obj.stylelineType), this.style.arrowWidth = this.jsonStyle.arrowWidth, this.style.arrowLength = this.jsonStyle.arrowLength, this.style.arrowStart = this.jsonStyle.arrowStart.toString(), this.style.arrowEnd = this.jsonStyle.arrowEnd.toString(), this.jsonStyle.arrowType > PolyArrow.arrowStyles.length || this.jsonStyle.arrowType < 0 ? this.style.arrowType = PolyArrow.arrowStyles[1] : this.style.arrowType = PolyArrow.arrowStyles[this.jsonStyle.arrowType]
        }
        return __extends(PolyArrow, _super), PolyArrow.prototype.toFeature = function(projection) {
            return void 0 === this.geometry && (this.coordinates.forEach(function(x) {
                x.transform(new OpenLayers.Projection("EPSG:4326"), projection)
            }), this.geometry = new OpenLayers.Geometry.LineString(this.coordinates), this.geometry.id = this.geometry.id.replace("LineString", "Arrow")), [new OpenLayers.Feature.Vector(this.geometry, {
                actionLayerId: this.actionLayer.id,
                UUID: this.UUID,
                styleId: this.styleId,
                featureType: "arrow"
            }, this.style)]
        }, PolyArrow.arrowStyles = ["none", "arrow", "arrowSlash", "arrowBlunt"], PolyArrow
    }(LCMS.AElement);
    LCMS.PolyArrow = PolyArrow
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var PolyLine = function(_super) {
        function PolyLine(obj, actionLayer, parent) {
            _super.call(this, obj, parent), this.actionLayer = actionLayer, this.lineColor = obj.color, this.lineWeight = obj.lineWidth, this.typeList = obj.typeList, this.coordinates = $.map(obj.pointList, function(p) {
                return new OpenLayers.Geometry.Point(p.x, p.y)
            }), this.style = LCMS.Styles.styleBuilder(this.lineColor, obj.lineType, obj.fillType), this.typeList.match(/.*4$/) ? this.featureType = "polygon" : this.featureType = "line"
        }
        return __extends(PolyLine, _super), PolyLine.prototype.toFeature = function(projection) {
            return void 0 === this.geometry && (this.coordinates.forEach(function(x) {
                x.transform(new OpenLayers.Projection("EPSG:4326"), projection)
            }), this.featureType.match("polygon") ? this.geometry = new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(this.coordinates)]) : this.geometry = new OpenLayers.Geometry.LineString(this.coordinates)), [new OpenLayers.Feature.Vector(this.geometry, {
                actionLayerId: this.actionLayer.id,
                UUID: this.UUID,
                featureType: this.featureType,
                lineWeight: this.lineWeight,
                lineColor: this.lineColor
            }, this.style)]
        }, PolyLine
    }(LCMS.AElement);
    LCMS.PolyLine = PolyLine
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var Rectangle = function(_super) {
        function Rectangle(obj, actionLayer, parent) {
            _super.call(this, obj, parent), this.actionLayer = actionLayer, this.lineWeight = obj.lineWidth, this.coordinates = [new OpenLayers.Geometry.Point(obj.point1.x, obj.point1.y), new OpenLayers.Geometry.Point(obj.point2.x, obj.point2.y)], this.style = LCMS.Styles.styleBuilder(obj.color, obj.lineType, obj.fillType);
            var lowerLeft = this.coordinates[0];
            lowerLeft.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992"));
            var upperRight = this.coordinates[1];
            upperRight.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992"));
            var dx = upperRight.x - lowerLeft.x,
                dy = upperRight.y - lowerLeft.y,
                baseCoordinate = new LCMS.AffineTransform({
                    x: 0,
                    y: 0
                }, {
                    x: dx,
                    y: 0
                }, {
                    x: dx,
                    y: dy
                }, {
                    x: 0,
                    y: dy
                }, {
                    transform: obj.transform,
                    translate: lowerLeft
                }),
                point1 = new OpenLayers.Geometry.Point(baseCoordinate.point1.x, baseCoordinate.point1.y),
                point2 = new OpenLayers.Geometry.Point(baseCoordinate.point2.x, baseCoordinate.point2.y),
                point3 = new OpenLayers.Geometry.Point(baseCoordinate.point3.x, baseCoordinate.point3.y),
                point4 = new OpenLayers.Geometry.Point(baseCoordinate.point4.x, baseCoordinate.point4.y);
            this.coordinates = [point1, point2, point3, point4]
        }
        return __extends(Rectangle, _super), Rectangle.prototype.toFeature = function(projection) {
            if (void 0 === this.geometry) {
                this.coordinates.forEach(function(x) {
                    x.transform(new OpenLayers.Projection("EPSG:28992"), projection)
                });
                var ring = new OpenLayers.Geometry.LinearRing(this.coordinates);
                this.geometry = new OpenLayers.Geometry.Polygon([ring])
            }
            return [new OpenLayers.Feature.Vector(this.geometry, {
                actionLayerId: this.actionLayer.id,
                UUID: this.UUID,
                featureType: "polygon",
                lineWeight: this.lineWeight,
                rotation: 0
            }, this.style)]
        }, Rectangle
    }(LCMS.AElement);
    LCMS.Rectangle = Rectangle
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var StrokeText = function(_super) {
        function StrokeText(obj, actionLayer, parent) {
            if (_super.call(this, obj, parent), this.actionLayerId = actionLayer.id, this.topicLayerId = actionLayer.parent.id, this.UUID = obj.id, this.labelText = obj.text.replace(StrokeText.REGEX_TRIM_NEWLINES, "$1"), this.font = {
                    size: obj.style.characterSize,
                    color: obj.style.characterColor,
                    weight: obj.style.characterLine,
                    reference: parseInt(obj.style.reference)
                }, obj.style.balloonFillType) {
                var backgroundColor = new LCMS.Color(obj.style.balloonFillType.paint.color1);
                this.background = {
                    color: backgroundColor.getHex(),
                    transparency: parseFloat(backgroundColor.getAlpha())
                }
            } else this.background = {
                color: "#000000",
                transparency: 0
            };
            this.border = {
                color: obj.style.balloonColor,
                cornerRadius: obj.style.balloonRadius,
                width: obj.style.balloonLineWidth,
                type: obj.style.balloonType
            }, this.textAngle = new LCMS.Angle(obj.textAngle, "rad"), parent instanceof LCMS.Part && parent.getPixelScale ? (this.origin = parent.getOrigin, this.scaling = !0) : (this.origin = new OpenLayers.Geometry.Point(obj.origin.x, obj.origin.y), this.scaling = !1)
        }
        return __extends(StrokeText, _super), StrokeText.prototype.toFeature = function(projection) {
            return void 0 === this.geometry && (this.origin.transform(new OpenLayers.Projection("EPSG:4326"), projection), this.geometry = this.origin), [new OpenLayers.Feature.Vector(this.geometry, {
                id: this.actionLayerId,
                UUID: this.UUID,
                labelText: this.labelText,
                featureType: this.scaling ? "text" : "textNS",
                textAngle: -this.textAngle.deg,
                font: this.font,
                background: this.background,
                border: this.border,
                scaling: this.scaling,
                textReference: this.font.reference
            })]
        }, StrokeText.prototype.getAttributesFeatureContent = function() {
            return '<h1 class="labelInPopup">' + this.labelText + "</h1>"
        }, StrokeText.prototype.getLabel = function() {
            return this.labelText
        }, StrokeText.REGEX_TRIM_NEWLINES = /^(?:\r\n|\n|\r)*([\s\S]*?)(?:\r\n|\n|\r)*$/, StrokeText
    }(LCMS.AElement);
    LCMS.StrokeText = StrokeText
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var Symbol = function(_super) {
        function Symbol(obj, actionLayer, parent) {
            if (_super.call(this, obj, parent), void 0 !== obj.attributes && obj.attributes.length >= 1 && (this.imageType = obj.attributes[0].name), this.actionLayer = actionLayer, this.UUID = obj.id, this.font = {
                    size: obj.text.style.characterSize,
                    color: obj.text.style.characterColor,
                    weight: obj.text.style.characterLine,
                    reference: parseInt(obj.text.style.reference)
                }, obj.text.style.balloonFillType) {
                var backgroundColor = new LCMS.Color(obj.text.style.balloonFillType.paint.color1);
                this.background = {
                    color: backgroundColor.getHex(),
                    transparency: parseFloat(backgroundColor.getAlpha())
                }
            } else this.background = {
                color: "#000000",
                transparency: 0
            };
            if (this.border = {
                    color: obj.text.style.balloonColor,
                    cornerRadius: obj.text.style.balloonRadius,
                    width: obj.text.style.balloonLineWidth,
                    type: obj.text.style.balloonType
                }, this.parent.getPixelScale) this.featureType = "plotsymbol", this.labelFeatureType = "text", this.scaling = !0, this.rotation = 0, this.mirror = !1, this.width = 32, this.height = 32, this.origin = parent.getOrigin, this.textOrigin = this.origin.clone(), this.labelYOffset = 18;
            else {
                this.featureType = "plotsymbolNS", this.labelFeatureType = "textNS", this.textOrigin = new OpenLayers.Geometry.Point(obj.text.textOrigin.x, obj.text.textOrigin.y), this.labelYOffset = 0, this.scaling = !1, this.coordinates = [new OpenLayers.Geometry.Point(obj.symbol.lowerLeft.x, obj.symbol.lowerLeft.y), new OpenLayers.Geometry.Point(obj.symbol.upperRight.x, obj.symbol.upperRight.y)];
                var lowerLeft = this.coordinates[0];
                lowerLeft.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992"));
                var upperRight = this.coordinates[1];
                upperRight.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992"));
                var dx = upperRight.x - lowerLeft.x,
                    dy = upperRight.y - lowerLeft.y,
                    baseCoordinate = new LCMS.AffineTransform({
                        x: 0,
                        y: 0
                    }, {
                        x: dx,
                        y: 0
                    }, {
                        x: dx,
                        y: dy
                    }, {
                        x: 0,
                        y: dy
                    }, {
                        transform: obj.symbol.transform,
                        translate: lowerLeft
                    }),
                    point1 = new OpenLayers.Geometry.Point(baseCoordinate.point1.x, baseCoordinate.point1.y);
                point1.transform(new OpenLayers.Projection("EPSG:28992"), new OpenLayers.Projection("EPSG:4326"));
                var point3 = new OpenLayers.Geometry.Point(baseCoordinate.point3.x, baseCoordinate.point3.y);
                point3.transform(new OpenLayers.Projection("EPSG:28992"), new OpenLayers.Projection("EPSG:4326"));
                var midPoint = new LCMS.FindMidPoint(point1, point3);
                this.width = Math.sqrt(Math.pow(baseCoordinate.point2.x - baseCoordinate.point1.x, 2) + Math.pow(baseCoordinate.point2.y - baseCoordinate.point1.y, 2)) / LCMS.Image.geoResolution, this.height = Math.sqrt(Math.pow(baseCoordinate.point4.x - baseCoordinate.point1.x, 2) + Math.pow(baseCoordinate.point4.y - baseCoordinate.point1.y, 2)) / LCMS.Image.geoResolution, this.rotation = Math.atan2(baseCoordinate.point1.y - baseCoordinate.point2.y, baseCoordinate.point1.x - baseCoordinate.point2.x), this.rotation = -new LCMS.Angle(this.rotation + Math.PI, "rad").deg, this.mirror = !1, (obj.symbol.transform.m00 < 0 && obj.symbol.transform.m11 < 0 || obj.symbol.transform.m00 > 0 && obj.symbol.transform.m11 > 0) && (this.mirror = !0, this.rotation = this.rotation - 180), this.origin = new OpenLayers.Geometry.Point(midPoint.point3.x, midPoint.point3.y)
            }
            this.text = obj.text.text.replace(LCMS.StrokeText.REGEX_TRIM_NEWLINES, "$1"), this.externalImage = obj.symbol.downloadLocation
        }
        return __extends(Symbol, _super), Symbol.prototype.getAttributesFeatureContent = function() {
            var tmp = '<h1 class="labelInPopup">' + this.getLabel() + "</h1>";
            return tmp += this.getSymbolImage()
        }, Symbol.prototype.getLabel = function() {
            var labelText = this.parent.name;
            return this.text && (labelText += ", " + this.text), labelText
        }, Symbol.prototype.getSymbolImage = function() {
            return '<div class="popupContentImage"><img src="' + this.ticket.getFullUrl(this.externalImage) + '" alt="image"></img></div>'
        }, Symbol.prototype.toFeature = function(projection, ticket) {
            void 0 === this.geometry && (this.origin.transform(new OpenLayers.Projection("EPSG:4326"), projection), this.textOrigin.transform(new OpenLayers.Projection("EPSG:4326"), projection), this.geometry = this.origin);
            return void 0 !== ticket && (this.ticket = ticket), [new OpenLayers.Feature.Vector(this.textOrigin, {
                actionLayer: this.actionLayer.id,
                UUID: this.UUID + "_label",
                featureType: this.labelFeatureType,
                textAngle: this.rotation,
                scaling: this.scaling,
                mirror: this.mirror,
                labelText: this.text,
                font: this.font,
                textReference: this.font.reference,
                background: this.background,
                border: this.border,
                labelYOffset: this.labelYOffset
            }), new OpenLayers.Feature.Vector(this.geometry, {
                actionLayer: this.actionLayer.id,
                UUID: this.UUID,
                featureType: this.featureType,
                geoRotation: this.rotation,
                geoHeight: this.height,
                geoWidth: this.width,
                geoXOffset: -this.width / 2,
                geoYOffset: -this.height / 2,
                scaling: this.scaling,
                mirror: this.mirror,
                externalImage: this.ticket.getFullUrl(this.externalImage)
            })]
        }, Symbol.geoResolution = 25, Symbol
    }(LCMS.AElement);
    LCMS.Symbol = Symbol
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var Layer = function() {
        function Layer(id, name, lastchange, removed, zLevel) {
            this.id = id, this.name = name, this.lastchange = lastchange, this.removed = removed, this.zLevel = zLevel
        }
        return Layer
    }();
    LCMS.Layer = Layer
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var Activity = function() {
        function Activity(activity_id, title, last_change, secluded) {
            this.activity_id = activity_id, this.title = title, this.last_change = last_change, this.secluded = secluded
        }
        return Activity.fromObject = function(obj) {
            return $.extend(!0, obj, Activity.prototype)
        }, Activity
    }();
    LCMS.Activity = Activity
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var ActionLayer = function(_super) {
        function ActionLayer(id, name, lastchange, removed, zLevel, parent, description, version, ineditable, createdInApp, entities, showInitially) {
            _super.call(this, id, name, lastchange, removed, zLevel), this.id = id, this.name = name, this.lastchange = lastchange, this.removed = removed, this.zLevel = zLevel, this.parent = parent, this.description = description, this.version = version, this.ineditable = ineditable, this.createdInApp = createdInApp, this.entities = entities, this.showInitially = showInitially, this.setUpElements()
        }
        return __extends(ActionLayer, _super), ActionLayer.prototype.clone = function(parent) {
            var ret = new ActionLayer(this.id, this.name, this.lastchange, this.removed, this.zLevel, parent ? parent : this.parent, this.description, this.version, this.ineditable, this.createdInApp, this.entities, this.showInitially);
            return ret
        }, ActionLayer.prototype.setUpElements = function() {
            var _this = this;
            if (this.elements = [], !this.removed && void 0 !== this.entities) {
                var entities = {};
                this.entities.entityList.forEach(function(e) {
                    entities[e.entity.id] = e
                });
                var knownTypes = {
                        Lne: function(x, parent) {
                            return new LCMS.Line(x, _this, parent)
                        },
                        Rct: function(x, parent) {
                            return new LCMS.Rectangle(x, _this, parent)
                        },
                        Arc: function(x, parent) {
                            return new LCMS.Arc(x, _this, parent)
                        },
                        PAr: function(x, parent) {
                            return new LCMS.PolyArrow(x, _this, parent)
                        },
                        STx: function(x, parent) {
                            return new LCMS.StrokeText(x, _this, parent)
                        },
                        Prt: function(x, parent) {
                            return new LCMS.Part(x, _this, parent)
                        },
                        Img: function(x, parent) {
                            return new LCMS.Image(x, _this, parent)
                        },
                        PLn: function(x, parent) {
                            return new LCMS.PolyLine(x, _this, parent)
                        },
                        Spl: function(x, parent) {
                            return new LCMS.Contour(x, _this, parent)
                        },
                        Syn: function(x, parent) {
                            return new LCMS.Symbol(x, _this, parent)
                        }
                    },
                    createElementTree = function(entityIds, parent) {
                        var ret = [];
                        for (var i in entityIds) {
                            var current = entities[entityIds[i]];
                            if (void 0 === knownTypes[current.entityIdentifier]) throw new Error("Unknown element type: " + current.type);
                            var newElement = knownTypes[current.entityIdentifier](current.entity, parent);
                            if (newElement instanceof LCMS.Part) {
                                var partChildren = createElementTree(newElement.getChildrenIds(), newElement);
                                newElement.setChildrenElements(partChildren)
                            }
                            ret.push(newElement)
                        }
                        return ret
                    };
                this.elements = createElementTree(this.entities.topEntityIds)
            }
        }, ActionLayer.prototype.destroy = function(map) {
            var layers = map.getLayersByName(this.id);
            layers.length > 0 && layers[0].destroy()
        }, ActionLayer.prototype.update = function(other, map, styleMap, ticket, defaultVisible) {
            if (other.id != this.id || other.lastchange < this.lastchange) throw new Error("Invalid new data for action layer update");
            var ret = [];
            this.name != other.name && (this.name = other.name, ret.push(LCMS.UpdateType.ACTION_LAYER_RENAMED)), this.zLevel = other.zLevel;
            var vectorLayer, layers = map.getLayersByName(this.id);
            if (layers.length > 0) {
                if (vectorLayer = layers[0], other.lastchange <= this.lastchange) return ret;
                ret.push(LCMS.UpdateType.ACTION_LAYER_MODIFIED), vectorLayer.removeAllFeatures()
            } else vectorLayer = this.createLayer(styleMap, map.getProjectionObject(), defaultVisible), ret.push(LCMS.UpdateType.ACTION_LAYER_ADDED), map.addLayer(vectorLayer);
            this.lastchange = other.lastchange, this.elements = other.elements;
            var newFeatures = [].concat($.map(this.elements, function(el) {
                return el.toFeature(map.getProjectionObject(), ticket)
            }));
            return newFeatures.length > 0 && vectorLayer.addFeatures(newFeatures), ret
        }, ActionLayer.prototype.updateLevel = function(map, currentIndex) {
            var vectorLayers = map.getLayersByName(this.id);
            return vectorLayers.length > 0 && (vectorLayers[0].setZIndex(currentIndex), currentIndex++), currentIndex
        }, ActionLayer.prototype.createLayer = function(defaultStyleMap, projection, defaultVisible) {
            var vectorLayer = new OpenLayers.Layer.Vector(this.id, {
                renderers: ["LCMSRenderer"],
                rendererOptions: {
                    zIndexing: !0
                },
                styleMap: defaultStyleMap,
                projection: projection
            });
            return vectorLayer.setVisibility(defaultVisible), vectorLayer
        }, ActionLayer.prototype.getPopups = function(popupCallback) {
            var ret = [];
            return this.elements.forEach(function(cur) {
                cur instanceof LCMS.Part && (ret = ret.concat(cur.getAll(LCMS.Part.prototype.getPopup, [popupCallback])))
            }), ret
        }, ActionLayer.fromObject = function(obj, parent) {
            if (obj.entities && obj.entities.version != ActionLayer.CURRENT_VERSION) throw new LCMS.UnsupportedLayer(obj.name);
            return $.extend(!0, obj, ActionLayer.prototype), obj.parent = parent, obj.setUpElements(), obj
        }, ActionLayer.prototype.getAttributesFeature = function(UUID) {
            for (var key in this.elements) {
                var feature = this.elements[key].getAttributesFeature(UUID);
                if (feature) return feature
            }
        }, ActionLayer.CURRENT_VERSION = "20150909", ActionLayer
    }(LCMS.Layer);
    LCMS.ActionLayer = ActionLayer
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var Drawing = function() {
        function Drawing(topicLayers, name, id, starttime, lastchange, projection, wind) {
            this.topicLayers = topicLayers, this.name = name, this.id = id, this.starttime = starttime, this.lastchange = lastchange, this.projection = projection, this.wind = wind, this.layerOrdering = []
        }
        return Drawing.prototype.clone = function() {
            var topicLayers = {};
            for (var key in this.topicLayers) topicLayers[key] = this.topicLayers[key].clone();
            var ret = new Drawing(topicLayers, this.name, this.id, this.starttime, this.lastchange, this.projection, this.wind.clone());
            return ret.layerOrdering = this.layerOrdering, ret
        }, Drawing.fromObject = function(obj) {
            LCMS.Wind.fromObject(obj.wind), $.map(obj.topicLayers, function(tl) {
                return LCMS.TopicLayer.fromObject(tl)
            });
            var tlMap = {};
            return $.map(obj.topicLayers, function(tl) {
                tlMap[tl.id] = tl
            }), obj.topicLayers = tlMap, obj.layerOrdering || (obj.layerOrdering = []), $.extend(!0, obj, Drawing.prototype)
        }, Drawing.prototype.update = function(other, map, styleMap, ticket, defaultVisible) {
            var _this = this,
                ret = {};
            for (var key in this.topicLayers) other.topicLayers[key] || (this.topicLayers[key].destroy(map), delete this.topicLayers[key], ret[key] = [LCMS.UpdateType.TOPIC_LAYER_REMOVED], this.layerOrdering.indexOf(key) != -1 && this.layerOrdering.splice(this.layerOrdering.indexOf(key), 1));
            for (var key in other.topicLayers) {
                var tl = other.topicLayers[key];
                if (tl.removed) this.topicLayers[key] && (this.topicLayers[key].destroy(map), delete this.topicLayers[key], ret[key] = [LCMS.UpdateType.TOPIC_LAYER_REMOVED]), this.layerOrdering.indexOf(key) != -1 && this.layerOrdering.splice(this.layerOrdering.indexOf(key), 1);
                else {
                    var newLayer = !1;
                    this.topicLayers[key] || (this.topicLayers[key] = tl, newLayer = !0), this.layerOrdering.indexOf(key) == -1 && this.layerOrdering.push(key);
                    var tlRet = this.topicLayers[key].update(tl, map, styleMap, ticket, defaultVisible);
                    $.extend(ret, tlRet), newLayer ? ret[key] = [LCMS.UpdateType.TOPIC_LAYER_ADDED] : ret[key] && 0 == ret[key].length && delete ret[key]
                }
            }
            this.layerOrdering.sort(function(a, b) {
                return _this.topicLayers[b].zLevel - _this.topicLayers[a].zLevel
            });
            for (var currentLevel = map.baseLayer.getZIndex() + 1, i = this.layerOrdering.length - 1; i >= 0; i--) currentLevel = this.topicLayers[this.layerOrdering[i]].updateLevel(map, currentLevel);
            return ret
        }, Drawing.prototype.getCurrentVersions = function() {
            var ret = {};
            for (var key in this.topicLayers) $.extend(ret, this.topicLayers[key].getCurrentVersions());
            return ret
        }, Drawing.prototype.getActionLayers = function() {
            var ret = [];
            for (var key in this.topicLayers) ret = ret.concat(this.topicLayers[key].getActionLayers());
            return ret
        }, Drawing.prototype.getAttributesFeature = function(UUID) {
            for (var key in this.topicLayers) {
                var feature = this.topicLayers[key].getAttributesFeature(UUID);
                if (feature) return feature
            }
        }, Drawing
    }();
    LCMS.Drawing = Drawing
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var Ticket = function() {
        function Ticket(ticket, serverUrl, activityWS, createdOn) {
            this.ticket = ticket, this.serverUrl = serverUrl, this.activityWS = activityWS, this.createdOn = createdOn, void 0 === createdOn && (this.createdOn = Date.now())
        }
        return Ticket.prototype.isValid = function() {
            return this.createdOn + Ticket.timeToLive > Date.now()
        }, Ticket.prototype.getTicket = function() {
            var _this = this,
                ret = !0;
            if (this.isValid()) return this.ticket;
            var success = function(data) {
                    _this.ticket = data.ticket.ticket, _this.createdOn = data.ticket.createdOn, _this.serverUrl = data.ticket.getServerUrl()
                },
                failure = function() {
                    ret = void 0
                };
            return this.activityWS.loadData(success, failure, Date.now()), this.ticket
        }, Ticket.prototype.getServerUrl = function() {
            return this.serverUrl
        }, Ticket.prototype.getFullUrl = function(component) {
            var ticket = this.getTicket(),
                ticketUrl = ticket ? "&ticket=" + ticket : "";
            return this.serverUrl + "/mobilemapmeeting/" + component + ticketUrl
        }, Ticket.timeToLive = 36e5, Ticket
    }();
    LCMS.Ticket = Ticket
}(LCMS || (LCMS = {}));
var __extends = this && this.__extends || function(d, b) {
        function __() {
            this.constructor = d
        }
        for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __)
    },
    LCMS;
! function(LCMS) {
    "use strict";
    var TopicLayer = function(_super) {
        function TopicLayer(id, name, lastchange, removed, zLevel, ineditable, createdInApp, actionLayers) {
            _super.call(this, id, name, lastchange, removed, zLevel), this.id = id, this.name = name, this.lastchange = lastchange, this.removed = removed, this.zLevel = zLevel, this.ineditable = ineditable, this.createdInApp = createdInApp, this.actionLayers = actionLayers, this.layerOrdering = []
        }
        return __extends(TopicLayer, _super), TopicLayer.prototype.clone = function() {
            var actionLayers = {};
            for (var key in this.actionLayers) actionLayers[key] = this.actionLayers[key].clone(this);
            var ret = new TopicLayer(this.id, this.name, this.lastchange, this.removed, this.zLevel, this.ineditable, this.createdInApp, actionLayers);
            return ret.layerOrdering = this.layerOrdering, ret
        }, TopicLayer.fromObject = function(obj) {
            var alMap = {};
            $.map(obj.actionLayers, function(al) {
                alMap[al.id] = al
            }), obj.actionLayers = alMap, obj = $.extend(!0, obj, TopicLayer.prototype);
            for (var key in obj.actionLayers) obj.actionLayers[key].removed ? delete obj.actionLayers[key] : obj.actionLayers[key] = LCMS.ActionLayer.fromObject(obj.actionLayers[key], obj);
            return obj.layerOrdering || (obj.layerOrdering = []), obj
        }, TopicLayer.prototype.destroy = function(map) {
            for (var key in this.actionLayers) this.actionLayers[key].destroy(map)
        }, TopicLayer.prototype.update = function(other, map, styleMap, ticket, defaultVisible) {
            var _this = this,
                ret = {};
            if (ret[this.id] = [], other.id != this.id || other.lastchange < this.lastchange) throw new Error("Invalid new data for topic layer update");
            this.name != other.name && (ret[this.id].push(LCMS.UpdateType.TOPIC_LAYER_RENAMED), this.name = other.name), this.lastchange != other.lastchange && (ret[this.id].push(LCMS.UpdateType.TOPIC_LAYER_MODIFIED), this.lastchange = other.lastchange), this.zLevel = other.zLevel;
            for (var key in this.actionLayers) other.actionLayers[key] || (this.actionLayers[key].destroy(map), delete this.actionLayers[key], ret[key] = [LCMS.UpdateType.ACTION_LAYER_REMOVED], this.layerOrdering.indexOf(key) != -1 && this.layerOrdering.splice(this.layerOrdering.indexOf(key), 1));
            for (var key in other.actionLayers) {
                var al = other.actionLayers[key];
                if (al.removed) this.actionLayers[key] && (this.actionLayers[key].destroy(map), delete this.actionLayers[key], ret[key] = [LCMS.UpdateType.ACTION_LAYER_REMOVED], this.layerOrdering.indexOf(key) != -1 && this.layerOrdering.splice(this.layerOrdering.indexOf(key), 1));
                else {
                    this.actionLayers[key] || (this.actionLayers[key] = al), this.layerOrdering.indexOf(key) == -1 && this.layerOrdering.push(key);
                    var alRet = this.actionLayers[key].update(al, map, styleMap, ticket, defaultVisible);
                    alRet.length > 0 && (ret[key] = alRet)
                }
            }
            return this.layerOrdering.sort(function(a, b) {
                return _this.actionLayers[b].zLevel - _this.actionLayers[a].zLevel
            }), ret
        }, TopicLayer.prototype.getActionLayers = function() {
            for (var ret = [], i = 0; i < this.layerOrdering.length; i++) ret.push(this.actionLayers[this.layerOrdering[i]]);
            return ret
        }, TopicLayer.prototype.updateLevel = function(map, currentIndex) {
            for (var i = this.layerOrdering.length - 1; i >= 0; i--) currentIndex = this.actionLayers[this.layerOrdering[i]].updateLevel(map, currentIndex);
            return currentIndex
        }, TopicLayer.prototype.getCurrentVersions = function() {
            var ret = {};
            for (var key in this.actionLayers) ret[key] = this.actionLayers[key].lastchange;
            return ret
        }, TopicLayer.prototype.getAttributesFeature = function(UUID) {
            for (var key in this.actionLayers) {
                var feature = this.actionLayers[key].getAttributesFeature(UUID);
                if (feature) return feature
            }
        }, TopicLayer
    }(LCMS.Layer);
    LCMS.TopicLayer = TopicLayer
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var URLResolver = function() {
        function URLResolver(serverUrl) {
            this.serverUrl = serverUrl
        }
        return URLResolver.prototype.getFullUrl = function(component) {
            return this.serverUrl + "/mobilemapmeeting/" + component
        }, URLResolver
    }();
    LCMS.URLResolver = URLResolver
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var Wind = function() {
        function Wind(direction, force, description) {
            this.direction = direction, this.force = force, this.description = description
        }
        return Wind.prototype.clone = function() {
            return new Wind(this.direction, this.force, this.description)
        }, Wind.fromObject = function(obj) {
            return $.extend(!0, obj, Wind.prototype)
        }, Wind
    }();
    LCMS.Wind = Wind
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var AffineTransform = function() {
        function AffineTransform(point1, point2, point3, point4, transformMatrix) {
            this.point1 = point1, this.point2 = point2, this.point3 = point3, this.point4 = point4;
            var transform = transformMatrix.transform,
                translate = transformMatrix.translate;
            this.point1 = {
                x: transform.m00 * point1.x + transform.m01 * point1.y + translate.x,
                y: transform.m10 * point1.x + transform.m11 * point1.y + translate.y
            }, this.point2 = {
                x: transform.m00 * point2.x + transform.m01 * point2.y + translate.x,
                y: transform.m10 * point2.x + transform.m11 * point2.y + translate.y
            }, this.point3 = {
                x: transform.m00 * point3.x + transform.m01 * point3.y + translate.x,
                y: transform.m10 * point3.x + transform.m11 * point3.y + translate.y
            }, this.point4 = {
                x: transform.m00 * point4.x + transform.m01 * point4.y + translate.x,
                y: transform.m10 * point4.x + transform.m11 * point4.y + translate.y
            }
        }
        return AffineTransform
    }();
    LCMS.AffineTransform = AffineTransform
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var Angle = function() {
        function Angle(value, type) {
            this.value = value, void 0 === type || type.toLowerCase().substr(0, 3).match("deg") ? this.radians = Angle.toRad(this.value) : (this.radians = value, this.value = Angle.toDeg(this.radians));
        }
        return Object.defineProperty(Angle.prototype, "rad", {
            get: function() {
                return this.radians
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(Angle.prototype, "deg", {
            get: function() {
                return this.value
            },
            enumerable: !0,
            configurable: !0
        }), Angle.toDeg = function(n) {
            return 180 * n / Math.PI
        }, Angle.toRad = function(n) {
            return n * Math.PI / 180
        }, Angle
    }();
    LCMS.Angle = Angle
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var BezierCurve = function() {
        function BezierCurve() {}
        return BezierCurve.bezierCurve = function(controlPoints, contour) {
            for (var steps = 20, convertedPoints = [], i = 0; i < controlPoints.length; i++) {
                var point = new OpenLayers.Geometry.Point(controlPoints[i].x, controlPoints[i].y);
                point.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:28992")), convertedPoints.push(point)
            }
            for (var i = 0; i < steps; i++) {
                var t = (i + 1) / steps,
                    interpolation = BezierCurve.bezierInterpolation(convertedPoints, t),
                    newPoint = new OpenLayers.Geometry.Point(interpolation.x, interpolation.y);
                newPoint.transform(new OpenLayers.Projection("EPSG:28992"), new OpenLayers.Projection("EPSG:4326")), contour.push(newPoint)
            }
        }, BezierCurve.bezierInterpolation = function(controlPoints, t) {
            for (var dx = 0, dy = 0, n = controlPoints.length - 1, i = 0; i <= n; i++) dx += BezierCurve.binomialCoef(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i) * controlPoints[i].x, dy += BezierCurve.binomialCoef(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i) * controlPoints[i].y;
            return {
                x: dx,
                y: dy
            }
        }, BezierCurve.sFact = function(num) {
            for (var rval = 1, i = 2; i <= num; i++) rval *= i;
            return rval
        }, BezierCurve.binomialCoef = function(n, i) {
            var val = BezierCurve.sFact(n) / (BezierCurve.sFact(i) * BezierCurve.sFact(n - i));
            return val
        }, BezierCurve
    }();
    LCMS.BezierCurve = BezierCurve
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var Color = function() {
        function Color(binaryValue) {
            var red, green, blue;
            this.alphaValue = ((binaryValue & 255 << 24) >>> 24) / 255, this.redValue = (binaryValue & 255 << 16) >>> 16, this.greenValue = (65280 & binaryValue) >>> 8, this.blueValue = 255 & binaryValue, red = Color.toFormattedHexString(this.redValue), green = Color.toFormattedHexString(this.greenValue), blue = Color.toFormattedHexString(this.blueValue), this.hexValue = "#" + red + green + blue
        }
        return Color.toFormattedHexString = function(value) {
            return value < 16 ? "0" + value.toString(16) : value.toString(16)
        }, Color.prototype.getHex = function() {
            return this.hexValue
        }, Color.prototype.getAlpha = function() {
            return this.alphaValue.toString()
        }, Color
    }();
    LCMS.Color = Color
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var FindMidPoint = function() {
        function FindMidPoint(point1, point2) {
            this.point1 = point1, this.point2 = point2, this.lat1 = new LCMS.Angle(point1.y), this.lat2 = new LCMS.Angle(point2.y), this.lon1 = new LCMS.Angle(point1.x), this.lon2 = new LCMS.Angle(point2.x);
            var dLon = this.lon2.rad - this.lon1.rad,
                Bx = Math.cos(this.lat2.rad) * Math.cos(dLon),
                By = Math.cos(this.lat2.rad) * Math.sin(dLon);
            this.lat3 = new LCMS.Angle(Math.atan2(Math.sin(this.lat1.rad) + Math.sin(this.lat2.rad), Math.sqrt((Math.cos(this.lat1.rad) + Bx) * (Math.cos(this.lat1.rad) + Bx) + By * By)), "rad"), this.lon3 = new LCMS.Angle(this.lon1.rad + Math.atan2(By, Math.cos(this.lat1.rad) + Bx), "rad"), this.point3 = new OpenLayers.Geometry.Point(this.lon3.deg, this.lat3.deg)
        }
        return FindMidPoint.prototype.getRadius = function() {
            var earthRadius = 6371,
                dLat = this.lat3.rad - this.lat2.rad,
                dLon = this.lon3.rad - this.lon3.rad,
                a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(this.lat2.rad) * Math.cos(this.lat3.rad),
                c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            this.radius = earthRadius * c
        }, FindMidPoint
    }();
    LCMS.FindMidPoint = FindMidPoint
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var Styles;
    ! function(Styles) {
        function styleBuilder(color, lineType, fillType) {
            var style = {
                stroke: !0,
                strokeColor: "#000000",
                strokeDashstyle: "solid",
                fill: !1,
                fillColor: "#000000",
                fillOpacity: "1"
            };
            if (void 0 !== color && (style.strokeColor = color), void 0 !== fillType) {
                var fillColor = new LCMS.Color(fillType.paint.color1);
                style.fill = !0, style.fillColor = fillColor.getHex(), style.fillOpacity = fillColor.getAlpha()
            }
            return void 0 !== lineType && (lineType.name.match(/dash_[0-9].*/) ? style.strokeDashstyle = "dash" : lineType.name.match(/dash_dot_.*$/) ? style.strokeDashstyle = "dashdot" : lineType.name.match(/longdash_dash_.*$/) && (style.strokeDashstyle = "longdashdot")), style
        }
        Styles.styleBuilder = styleBuilder
    }(Styles = LCMS.Styles || (LCMS.Styles = {}))
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var UnsupportedLayer = function() {
        function UnsupportedLayer(layerName) {
            this.layerName = layerName, this.message = "Layer " + layerName + " was made in an incompatible Plot version. Please load it in Plot and save it again.", this.name = "UnsupportedLayer"
        }
        return UnsupportedLayer
    }();
    LCMS.UnsupportedLayer = UnsupportedLayer
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    var UnsupportedLayers = function() {
        function UnsupportedLayers(names) {
            this.names = names;
            for (var nameList = "", i = 0; i < names.length - 1; i++) nameList += names[i] + ", ";
            nameList += names[names.length - 1], this.message = "Layer(s) " + nameList + " were made in an incompatible Plot version. Please load it in Plot and save it again.", this.name = "UnsupportedLayers"
        }
        return UnsupportedLayers
    }();
    LCMS.UnsupportedLayers = UnsupportedLayers
}(LCMS || (LCMS = {}));
var LCMS;
! function(LCMS) {
    "use strict";
    ! function(UpdateType) {
        UpdateType[UpdateType.NOT_MODIFIED = 0] = "NOT_MODIFIED", UpdateType[UpdateType.ACTION_LAYER_ADDED = 1] = "ACTION_LAYER_ADDED", UpdateType[UpdateType.ACTION_LAYER_REMOVED = 2] = "ACTION_LAYER_REMOVED", UpdateType[UpdateType.ACTION_LAYER_MODIFIED = 3] = "ACTION_LAYER_MODIFIED", UpdateType[UpdateType.ACTION_LAYER_RENAMED = 4] = "ACTION_LAYER_RENAMED", UpdateType[UpdateType.TOPIC_LAYER_ADDED = 5] = "TOPIC_LAYER_ADDED", UpdateType[UpdateType.TOPIC_LAYER_REMOVED = 6] = "TOPIC_LAYER_REMOVED", UpdateType[UpdateType.TOPIC_LAYER_MODIFIED = 7] = "TOPIC_LAYER_MODIFIED", UpdateType[UpdateType.TOPIC_LAYER_RENAMED = 8] = "TOPIC_LAYER_RENAMED"
    }(LCMS.UpdateType || (LCMS.UpdateType = {}));
    LCMS.UpdateType
}(LCMS || (LCMS = {}));