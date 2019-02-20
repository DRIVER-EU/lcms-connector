import { Ticket } from './ticket';
import { Drawing } from './drawing';

export interface DrawingObject {
  drawing: Drawing, drawingType: string,
  status: string
};

export class Drawings {

  constructor(
    public drawings: DrawingObject[],
    public assigner: string,
    public overlays: any[],
    public overlaysUpdateTime: number,
    public ownApplicationId: string
  ) { }

  public static fromObject(ds: Drawings) {
    let drawings = new Drawings(ds.drawings, ds.assigner, ds.overlays, ds.overlaysUpdateTime, ds.ownApplicationId);
    drawings.drawings.forEach(d => { d.drawing = Drawing.fromObject(d.drawing); });
    return drawings;
  }

  /**
   * Export to a GeoJSON collection, i.e. an object where each key points to a GeoJSON object.
   * 
   * @param {string} [folder]
   * 
   * @memberOf Drawing
   */
  public toGeoJSONCollection(cookie: string) {
    let col: { [key: string]: GeoJSON.FeatureCollection<GeoJSON.GeometryObject> } = {};
    this.drawings.forEach((d: DrawingObject) => {
      let drawingCollection = d.drawing.toGeoJSONCollection(cookie);
      col = Object.assign(col, drawingCollection);
    });
    return col;
  }
}
