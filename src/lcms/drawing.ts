import { Wind } from './wind';
import { TopicLayer } from './topic-layer';
import * as LCMS from './lcms';
import { Ticket } from './ticket';

export class Drawing {
  public map: { [key: string]: TopicLayer };

  constructor(
    public topicLayers: TopicLayer[],
    public name: string,
    public id: string,
    public starttime: number,
    public lastchange: number,
    public projection: string,
    public wind: Wind) { }

  public static fromObject(d: Drawing) {
    let drawing = new Drawing(d.topicLayers, d.name, d.id, d.starttime, d.lastchange, d.projection, d.wind);
    drawing.topicLayers = d.topicLayers.map(tl => { return TopicLayer.fromObject(tl); });
    let tlMap: { [key: string]: TopicLayer } = {};
    drawing.topicLayers.forEach(tl => tlMap[tl.id] = tl);
    drawing.map = tlMap;
    return drawing;
  }

  /**
   * Export to a GeoJSON collection, i.e. an object where each key points to a GeoJSON object.
   * 
   * @param {string} [folder]
   * 
   * @memberOf Drawing
   */
  public toGeoJSONCollection(ticket: Ticket) {
    let col: { [key: string]: GeoJSON.FeatureCollection<GeoJSON.GeometryObject> } = {};
    this.topicLayers.forEach(tl => {
      tl.actionLayers.forEach(al => {
        if (!al.elements) return;
        let geoJson = <GeoJSON.FeatureCollection<GeoJSON.GeometryObject>>{
          type: 'FeatureCollection',
          features: []
        };
        col[al.name] = geoJson;
        let features = geoJson.features;
        al.elements.forEach(el => {
          if (el instanceof LCMS.Part && el.children) {
            el.children.forEach(c => {
              let feature = c.toGeoJSONFeature(ticket);
              if (feature) features.push(feature);
            });
          } else {
            let feature = el.toGeoJSONFeature();
            if (feature) features.push(feature);
          }
        });
      });
    });
    return col;
  }
}
