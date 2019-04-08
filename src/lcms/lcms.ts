import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as proj4 from 'proj4';
import { Entity } from './entity';
import { ActionLayer } from './action-layer';
import { Ticket } from './ticket';
import { Settings } from '../models/settings';

export class CoordinateTransform {
  private transform;
  public static instance: CoordinateTransform = new CoordinateTransform();

  private constructor() {
    proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
    proj4.defs('EPSG:28992', `+proj=sterea 
      +lat_0=52.15616055555555 
      +lon_0=5.38763888888889 
      +k=0.9999079 
      +x_0=155000 
      +y_0=463000 
      +ellps=bessel 
      +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 
      +units=m +no_defs`);
    this.transform = proj4('EPSG:28992', 'EPSG:4326');
  }

  public rd2wgs(coord: { x: number; y: number } | number[]) {
    return this.transform.forward(coord);
  }

  public wgs2rd(coord: { x: number; y: number } | number[]) {
    return this.transform.inverse(coord);
  }
}

export interface Point {
  x: number;
  y: number;
}

export class AffineTransform {
  constructor(
    public point1: Point,
    public point2: Point,
    public point3: Point,
    public point4: Point,
    transformMatrix: { transform: { m00: number; m10: number; m01: number; m11: number }, translate: Point }) {
    let transform = transformMatrix.transform;
    let translate = transformMatrix.translate;
    this.point1 = {
      x: transform.m00 * point1.x + transform.m01 * point1.y + translate.x,
      y: transform.m10 * point1.x + transform.m11 * point1.y + translate.y
    };
    this.point2 = {
      x: transform.m00 * point2.x + transform.m01 * point2.y + translate.x,
      y: transform.m10 * point2.x + transform.m11 * point2.y + translate.y
    };
    this.point3 = {
      x: transform.m00 * point3.x + transform.m01 * point3.y + translate.x,
      y: transform.m10 * point3.x + transform.m11 * point3.y + translate.y
    };
    this.point4 = {
      x: transform.m00 * point4.x + transform.m01 * point4.y + translate.x,
      y: transform.m10 * point4.x + transform.m11 * point4.y + translate.y
    };
  }
}

export class Angle {
  public radians: number;
  public value: number;

  constructor(radOrdeg: number, type: 'rad' | 'deg' = 'deg') {
    switch (type) {
      case 'deg':
        this.value = radOrdeg;
        this.radians = Angle.toRad(radOrdeg);
        break;
      case 'rad':
        this.radians = radOrdeg;
        this.value = Angle.toDeg(radOrdeg);
        break;
    }
  }

  get rad() {
    return this.radians;
  }

  get deg() {
    return this.value;
  }

  public static toDeg(n: number) {
    const R2D = 180 / Math.PI;
    return R2D * n;
  }

  public static toRad(n: number) {
    const D2R = Math.PI / 180;
    return n * D2R;
  }
}

export class FindMidPoint {
  public point3: Point;
  public lat1: Angle;
  public lat2: Angle;
  public lat3: Angle;
  public lon1: Angle;
  public lon2: Angle;
  public lon3: Angle;
  public radius: number;

  constructor(public point1: Point, public point2: Point) {
    this.lat1 = new Angle(point1.y);
    this.lat2 = new Angle(point2.y);
    this.lon1 = new Angle(point1.x);
    this.lon2 = new Angle(point2.x);
    let dLon = this.lon2.rad - this.lon1.rad;
    let Bx = Math.cos(this.lat2.rad) * Math.cos(dLon);
    let By = Math.cos(this.lat2.rad) * Math.sin(dLon);
    this.lat3 = new Angle(Math.atan2(Math.sin(this.lat1.rad) + Math.sin(this.lat2.rad), Math.sqrt((Math.cos(this.lat1.rad) + Bx) * (Math.cos(this.lat1.rad) + Bx) + By * By)), 'rad');
    this.lon3 = new Angle(this.lon1.rad + Math.atan2(By, Math.cos(this.lat1.rad) + Bx), 'rad');
    this.point3 = <Point>{ x: this.lon3.deg, y: this.lat3.deg };
  }

  public getRadius() {
    const earthRadius = 6371;
    let dLat = this.lat3.rad - this.lat2.rad;
    let dLon = this.lon3.rad - this.lon3.rad;
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(this.lat2.rad) * Math.cos(this.lat3.rad);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    this.radius = earthRadius * c;
    return this.radius;
  }
}

export class AElement {
  public UUID: string;
  public attributes: { [key: string]: any };
  public geometry;
  public content;

  constructor(public obj: Entity, public parent: AElement) {
    this.UUID = obj.id;
    this.attributes = {};
    obj.attributes.forEach(attr => {
      let values = {};
      attr.attributeItems.forEach(item => {
        if (item.type === 6 && item.attributeValue && item.attributeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) {
          values[item.name] = item.attributeValue;
        }
      });
      this.attributes[attr.name] = values;
    });
  };

  public getID() {
    return this.UUID;
  }

  // public toFeature(projection, ticket) {
  //   return null;
  // }

  public toGeoJSONFeature(cookie?: string): GeoJSON.Feature<GeoJSON.GeometryObject> {
    if (this.obj && this.obj.pointList) {
      const coords = this.obj.pointList.map(point => [point.x, point.y]);
      return <GeoJSON.Feature<GeoJSON.Polygon>>{
        type: 'Feature',
        geometry: <GeoJSON.Polygon>{
          type: 'Polygon',
          coordinates: [coords]
        },
        properties: Object.assign({id: this.getID()}, this.attributes)
      };
    }
    return null;
  }

  public getBounds() {
    if (void 0 === this.geometry) throw new Error('No geometry defined for this element.');
    return this.geometry.clearBounds(), this.geometry.getBounds();
  }

  protected async downloadFile(filename: string, url: string, cookie: string) {
    let file = fs.createWriteStream(filename);
    let req = request.get(url, {encoding: null, headers: {'Cookie': cookie}}, (err, response, body) => {
      if (err) {
        console.error(err);
        return;
      }
      file.write(body);
      file.end();
      // cb(body);
    });
  }

  // public getAttributesFeature(UUID) {
  //   if (this.parent) return this.parent.getAttributesFeature(UUID);
  //   if (!UUID || this.UUID === UUID) return {
  //     UUID: this.UUID,
  //     position: this.getBounds().getCenterLonLat(),
  //     content: this.getAttributesFeatureContent()
  //   };
  // }

  // public getAttributesFeatureContent() {
  //   if (this.content) return this.content;
  //   return '';
  //   // var content = '';
  //   // return $.each(this.attributes, function (group) {
  //   //   $.each(_this.attributes[group], function (name) {
  //   //     content += _this.createTr(group, name);
  //   //   });
  //   // }), content.length > 0 && (content = '<table class="popupContentTable"><tbody>' + content + '</tbody></table><br />'), this.content = content, content;
  // }

  // public createTr(group, name) {
  //   return '<tr class="attributeInPopup"><td class="attributeNameInPopup">' + group + '&nbsp;:&nbsp;' + name + '</td><td class="attributeValueInPopup">' + this.attributes[group][name] + '</td></tr>';
  // }
}

export class Line extends AElement {
  public coordinates: number[][];
  public lineWidth: number;

  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) {
    super(x, parent);

    if (x.point1 && x.point2) {
      this.coordinates = [
        [x.point1.x, x.point1.y],
        [x.point2.x, x.point2.y]
      ];
    }
    this.lineWidth = x.lineWidth;
  }

  public toGeoJSONFeature(): GeoJSON.Feature<GeoJSON.GeometryObject> {
    const FORCE_POLYGON = true;
    if (FORCE_POLYGON) {
      return <GeoJSON.Feature<GeoJSON.Polygon>>{
        type: 'Feature',
        geometry: <GeoJSON.Polygon>{
          type: 'Polygon',
          coordinates: [this.coordinates]
        },
        properties: Object.assign({id: this.getID()}, this.attributes)
      };
    }
    return <GeoJSON.Feature<GeoJSON.LineString>>{
      type: 'Feature',
      geometry: <GeoJSON.LineString>{
        type: 'LineString',
        coordinates: this.coordinates
      },
      properties: Object.assign({id: this.getID()}, this.attributes)
    };
  }

}

export class PolyLine extends Line {
  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) {
    super(x, actionLayer, parent);

    if (x.pointList) {
      this.coordinates = x.pointList.map(p => { return [p.x, p.y]; });
    }
  }
}

export class Rectangle extends PolyLine {
  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) {
    super(x, actionLayer, parent);

    let t = CoordinateTransform.instance;

    let lowerLeft = t.wgs2rd({ x: x.point1.x, y: x.point1.y });
    let upperRight = t.wgs2rd({ x: x.point2.x, y: x.point2.y });
    let dx = upperRight.x - lowerLeft.x;
    let dy = upperRight.y - lowerLeft.y;

    let baseCoordinate = new AffineTransform({
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
        transform: x.transform,
        translate: lowerLeft
      });
    this.coordinates = [
      [baseCoordinate.point1.x, baseCoordinate.point1.y],
      [baseCoordinate.point2.x, baseCoordinate.point2.y],
      [baseCoordinate.point3.x, baseCoordinate.point3.y],
      [baseCoordinate.point4.x, baseCoordinate.point4.y],
      [baseCoordinate.point1.x, baseCoordinate.point1.y]
    ].map(p => { return t.rd2wgs(p); });
  }

  public toGeoJSONFeature(): GeoJSON.Feature<GeoJSON.GeometryObject> {
    return <GeoJSON.Feature<GeoJSON.Polygon>>{
      type: 'Feature',
      geometry: <GeoJSON.Polygon>{
        type: 'Polygon',
        coordinates: [this.coordinates]
      },
      properties: Object.assign({id: this.getID()}, this.attributes)
    };
  }
}

export class Arc extends AElement {
  private static circleVertices = 50;
  private static ct = CoordinateTransform.instance;

  public coordinates: number[][];
  public origin_xy: Point;
  public start;
  /**
   * Between 0 and 360 degrees
   * 
   * @type {number}
   * @memberOf Arc
   */
  public extent: number;
  private majorAxis;
  private minorAxis;

  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) {
    super(x, parent);

    this.start = x.start;
    this.extent = x.extent;

    this.coordinates = [
      [x.point1.x, x.point1.y],
      [x.point2.x, x.point2.y]
    ];
    let midPoint = new FindMidPoint(x.point1, x.point2);
    midPoint.getRadius();

    // Convert to RD
    this.origin_xy = Arc.ct.wgs2rd(midPoint.point3);
    this.coordinates = this.coordinates.map(c => { return Arc.ct.wgs2rd(c); });

    if (Math.abs(Math.floor(this.coordinates[0][0] - this.coordinates[1][0])) !== Math.abs(Math.floor(this.coordinates[0][1] - this.coordinates[1][1]))) {
      // Arc
      this.majorAxis = (this.coordinates[1][0] - this.coordinates[0][0]) / 2;
      this.minorAxis = (this.coordinates[1][1] - this.coordinates[0][1]) / 2;
      let majorMinorRatio = Math.ceil(this.majorAxis / this.minorAxis);
      let circleVertices = majorMinorRatio > 10 ? Arc.circleVertices * Math.floor(majorMinorRatio / 10) * 10 : Arc.circleVertices;
      let circleVerticesSplit = circleVertices / (2 * majorMinorRatio);
      let tmp = [];
      tmp = tmp.concat(this.getEllipseCoordinates(new Angle(-30), new Angle(30), circleVerticesSplit * (majorMinorRatio - 1)));
      tmp = tmp.concat(this.getEllipseCoordinates(new Angle(30), new Angle(150), circleVerticesSplit));
      tmp = tmp.concat(this.getEllipseCoordinates(new Angle(150), new Angle(210), circleVerticesSplit * (majorMinorRatio - 1)));
      tmp = tmp.concat(this.getEllipseCoordinates(new Angle(210), new Angle(330), circleVerticesSplit));
      this.coordinates = tmp;
    } else {
      // Circle
      var startAngle, endAngle = this.extent;
      if (this.extent < 360) {
        startAngle = this.start;
        endAngle = this.extent;
      } else {
        startAngle = 0;
        this.coordinates = [];
      }
      for (var k = 0; k <= Arc.circleVertices; k++) {
        let theta = new Angle(startAngle + k * endAngle / Arc.circleVertices);
        let xNew = this.origin_xy.x + 1e3 * midPoint.radius * Math.cos(theta.rad);
        let yNew = this.origin_xy.y - 1e3 * midPoint.radius * Math.sin(theta.rad);
        let newPoint = Arc.ct.rd2wgs({ x: xNew, y: yNew });
        this.coordinates.push([newPoint.x, newPoint.y]);
      }
    }
  }

  private getEllipseCoordinates(startAngle, endAngle, stepping) {
    let newCoordinates = [];
    for (let stepSize = (endAngle.deg - startAngle.deg) / stepping, theta = startAngle; theta.deg <= endAngle.deg; theta = new Angle(theta.deg + stepSize)) {
      let ellipseR = this.majorAxis * this.minorAxis / Math.sqrt(Math.pow(this.minorAxis * Math.cos(theta.rad), 2) + Math.pow(this.majorAxis * Math.sin(theta.rad), 2)),
        xNew = this.origin_xy.x + ellipseR * Math.cos(theta.rad),
        yNew = this.origin_xy.y + ellipseR * Math.sin(theta.rad),
        newPoint = <Point>{ x: xNew, y: yNew };
      newCoordinates.push(Arc.ct.rd2wgs(newPoint));
    }
    return newCoordinates;
  }

  public toGeoJSONFeature(): GeoJSON.Feature<GeoJSON.GeometryObject> {
    return <GeoJSON.Feature<GeoJSON.Polygon>>{
      type: 'Feature',
      geometry: <GeoJSON.Polygon>{
        type: 'Polygon',
        coordinates: [this.coordinates]
      },
      properties: Object.assign({id: this.getID()}, this.attributes)
    };
  }
}

export class PolyArrow extends AElement {
  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) { super(x, parent); }
}

export class StrokeText extends AElement {
  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) { super(x, parent); }
}

export class Part extends AElement {
  private origin: number[];
  public name: string;
  public children: AElement[];
  public childrenIds: string[];
  public pixelScale: number;

  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) {
    super(x, parent);

    if (x.origin) {
      this.origin = [x.origin.x, x.origin.y];
    }
    this.childrenIds = x.children;
    this.name = x.name;
  }

  public getOrigin() {
    return this.origin;
  }

  public getChildrenIds() {
    return this.childrenIds;
  }

  public getChildren() {
    return this.children;
  }

  public setChildrenElements(children: AElement[]) {
    this.children = children;
  }

  // public getAttributesFeature(UUID) {
  //   if (this.parent) return this.parent.getAttributesFeature(UUID);
  //   if (UUID) {
  //     var IDs = this.getAllIds();
  //     if (IDs.indexOf(UUID) === -1) return;
  //   }
  //   var contents = this.getAttributesFeatureContent() || '';
  //   return {
  //     UUID: UUID || this.UUID || 'unknown',
  //     position: this.getBounds().getCenterLonLat(),
  //     content: contents
  //   };
  // }

  public getAllIds() {
    var ret = [this.getID()];
    for (var key in this.children) {
      if (!this.children.hasOwnProperty(key)) continue;
      let part = <Part>this.children[key];
      part instanceof Part
        ? ret = ret.concat(part.getAllIds())
        : ret.push(this.children[key].getID());
    }
    return ret;
  }

  public getPixelScale() {
    return this.pixelScale || void 0 === this.parent ? this.pixelScale : (<Part>this.parent).getPixelScale();
  }
}

export class Image extends AElement {
  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) { super(x, parent); }
}

export class Contour extends AElement {
  constructor(x: Entity, public actionLayer: ActionLayer, public parent: AElement) { super(x, parent); }
}

export class Symbol extends AElement {
  protected static settings = Settings.getInstance();
  public origin: number[];
  private coordinates: number[][];
  private static ct = CoordinateTransform.instance;
  private static REGEX_TRIM_NEWLINES = /^(?:\r\n|\n|\r)*([\s\S]*?)(?:\r\n|\n|\r)*$/;
  public text: string;
  public externalImage: string;
  public imageType: string;
  public background: { color: string; transparency: number; };

  constructor(x: Entity, public actionLayer: ActionLayer, public parent: Part) {
    super(x, parent);

    if (x.attributes && x.attributes.length > 0) {
      this.imageType = x.attributes[0].name;
    }
    if (x.text && x.text.style && x.text.style.balloonType) {
      if (x.text.text) {
        this.text = x.text.text.replace(Symbol.REGEX_TRIM_NEWLINES, '$1');
      }
      let backgroundColor = new Color(x.text.style.balloonFillType.paint.color1);
      this.background = {
        color: backgroundColor.getHex(),
        transparency: parseFloat(backgroundColor.getAlpha())
      };
    } else {
      this.background = {
        color: '#000000',
        transparency: 0
      };
    }
    if (this.parent.getPixelScale) {
      this.origin = parent.getOrigin();
    } else {
      // Text block?
      if (x.symbol && x.symbol.lowerLeft) {
        this.coordinates = [
          [x.symbol.lowerLeft.x, x.symbol.lowerLeft.y],
          [x.symbol.upperRight.x, x.symbol.upperRight.y]
        ];
        let lowerLeft = Symbol.ct.wgs2rd(this.coordinates[0]);
        let upperRight = Symbol.ct.wgs2rd(this.coordinates[1]);
        let dx = upperRight.x - lowerLeft.x,
          dy = upperRight.y - lowerLeft.y,
          baseCoordinate = new AffineTransform({
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
              transform: x.symbol.transform,
              translate: lowerLeft
            });
        let point1 = Symbol.ct.wgs2rd([baseCoordinate.point1.x, baseCoordinate.point1.y]);
        let point3 = Symbol.ct.wgs2rd([baseCoordinate.point3.x, baseCoordinate.point3.y]);
        var midPoint = new FindMidPoint(point1, point3);
        this.origin = [midPoint.point3.x, midPoint.point3.y];
      }
    }
    this.externalImage = x.symbol.downloadLocation;
    if (!this.externalImage) {
      let data = decodeURIComponent(`{"imageId":"${x.symbol.symbolId}","hostActivityId":"${this.actionLayer.id}","activityId":"${this.actionLayer.id}"}`);
      this.externalImage = `https://oefen-veiligheidsregio.lcms.nl/lcms//drawing/symbol?data=${data}`;
    }
  }

  getLabel() {
    var labelText = this.parent.name;
    if (this.text) labelText += ', ' + this.text;
    return labelText;
  }

  public toGeoJSONFeature(cookie: string): GeoJSON.Feature<GeoJSON.GeometryObject> {
    let properties: { [key: string]: any };
    if (this.parent) {
      properties = this.parent.attributes;
      for (var key in this.attributes) {
        if (!this.attributes.hasOwnProperty(key)) continue;
        properties[key] = this.attributes[key];
      }
    } else {
      properties = this.attributes;
    }
    if (this.obj && this.obj.hasOwnProperty('symbol') && this.obj.symbol.hasOwnProperty('symbolId')) {
      // let symbol = this.attributes['symbol']['type'] + '.png';
      let symbol = this.obj.symbol.symbolId;
      properties['icon'] = symbol;
      if (!Symbol.settings.symbolExists(symbol)) {
        let filename = path.join(Symbol.settings.imageFolder, symbol);
        fs.exists(filename, exists => {
          Symbol.settings.addSymbol(symbol);
          if (exists) return;
          this.downloadFile(filename, this.externalImage, cookie);
        });
      }
    }
    // properties['b64-icon'] = this.getBase64Icon();
    properties['Name'] = this.getLabel();
    return <GeoJSON.Feature<GeoJSON.Point>>{
      type: 'Feature',
      geometry: <GeoJSON.Point>{
        type: 'Point',
        coordinates: this.origin
      },
      properties: Object.assign({id: this.getID()}, properties)
    };
  }

}

export class Color {
  private alphaValue: number;
  private redValue: number;
  private greenValue: number;
  private blueValue: number;
  private hexValue: string;
  private red: string;
  private green: string;
  private blue: string;

  constructor(binaryValue) {
    let red, green, blue;
    this.alphaValue = ((binaryValue & 255 << 24) >>> 24) / 255;
    this.redValue = (binaryValue & 255 << 16) >>> 16;
    this.greenValue = (65280 & binaryValue) >>> 8;
    this.blueValue = 255 & binaryValue;
    red = Color.toFormattedHexString(this.redValue);
    green = Color.toFormattedHexString(this.greenValue);
    blue = Color.toFormattedHexString(this.blueValue);
    this.hexValue = '#' + red + green + blue;
  }

  public static toFormattedHexString(value: number) {
    return value < 16 ? '0' + value.toString(16) : value.toString(16);
  }

  public getHex() {
    return this.hexValue;
  }

  getAlpha() {
    return this.alphaValue.toString();
  }
}
