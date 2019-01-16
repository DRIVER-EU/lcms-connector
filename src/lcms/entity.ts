import { Point } from './lcms';

export class Entity {
  name?: string;
  symbol?: {
    lowerLeft?: Point;
    upperRight?: Point;
    transform?: { m00: number; m10: number; m01: number; m11: number };
    // eg /DownloadFile?imageid=41HK0U2VJHK1G9XQ1PCPPS6OEEDTHT (server address?)
    downloadLocation?: string;
    symbolId?: string;
    alpha?: number; // 0..1
  };
  text?: {
    text?: string;
    textOrigin?: { x: number; y: number; }; // x: 6370.216858128834, y: 18176.731090682522
    textAngle?: number;
    style?: {
      styleName: 'Ingezet';
      characterColor: string; //hex
      characterLine: number;
      characterSize: number;
      characterSlant: number;
      characterAngle: number;
      relativeWidth: number;
      relativeSpacing: number;
      relativeLineDistance: number;
      monoSpacing: boolean;
      reference: number;
      balloonType: number;
      balloonLineWidth: number;
      balloonColor: string;
      balloonRadius: number;
      includeReferencePointer: boolean;
      balloonFillType: { paint; };
      strokeFontName: string;
    };
  };
  layerInvisible?: boolean;
  children?: string[]; // list of GUIDs
  origin?: Point;
  pixelScale?: boolean;
  isRotatable?: boolean;
  drawOutline?: boolean;
  typeList?: string;
  transform?: { m00: number; m10: number; m01: number; m11: number };
  start?;
  extent?;
  point1?: Point;
  point2?: Point;
  /**
   * Coordinates x, y, where x is longitude and y is latitude.
   * 
   * @type {Object}
   */
  pointList?: { x: number; y: number }[];
  // Example of color1: 2147418112
  fillType?: { paint: { mode: boolean; color1: number; name: string } };
  // hex color string
  color?: string;
  lineType?: { name: 'Solid' };
  lineWidth?: number;
  alpha?: number;
  styleName?: string;
  id?: string;
  readOnly?: boolean;
  alwaysInFront?: boolean;
  alwaysBehind?: boolean;
  isUser3?: boolean;
  isSymbol?: boolean;
  zLevel?: number;
  attributes?: { name: 'symbol'; attributeItems: [{ type: number; name: 'type'; attributeValue: string }] }[];
  versionId?: number;
}

export class Entities {
  public version: number;
  // GUIDs
  public topEntityIds: string[];
  public entityList: {
    entityIdentifier: string;
    entity: Entity;
  }[];
};
