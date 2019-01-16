import { ActionLayer } from './action-layer';

export class TopicLayer {
  public description: string;
  public version: string;
  public layerOrdering: any[];

  constructor(
    public id: string,
    public name: string,
    public lastchange: number,
    public removed: boolean,
    public zLevel: number,
    public ineditable?: boolean,
    public createdInApp?: string,
    public actionLayers?: ActionLayer[]) {
      this.layerOrdering = [];
    }

  public static fromObject(tl: TopicLayer) {
    let topicLayer = new TopicLayer(tl.id, tl.name, tl.lastchange, tl.removed, tl.zLevel, tl.ineditable, tl.createdInApp, tl.actionLayers);
    let alMap: { [key: string]: ActionLayer } = {};
    topicLayer.actionLayers = topicLayer.actionLayers.filter(al => !al.removed).map(al => { return ActionLayer.fromObject(al, topicLayer); });
    return topicLayer;
  }

  // public getAttributesFeature(UUID) {
  //   for (var key in this.actionLayers) {
  //     if (!this.actionLayers.hasOwnProperty(key)) continue;
  //     var feature = this.actionLayers[key].getAttributesFeature(UUID);
  //     if (feature) return feature;
  //   }
  // }

  public getActionLayers() {
    for (var ret = [], i = 0; i < this.layerOrdering.length; i++) ret.push(this.actionLayers[this.layerOrdering[i]]);
    return ret;
  }
}
