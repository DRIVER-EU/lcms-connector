import { TopicLayer } from './topic-layer';
import { Entity, Entities } from './entity';
import * as LCMS from './lcms';

export class ActionLayer {
  public elements: LCMS.AElement[] = [];

  constructor(
    public id: string,
    public name: string,
    public lastchange: number,
    public removed: boolean,
    public zLevel: number,
    public parent: TopicLayer,
    public description: string,
    public version: string,
    public ineditable: boolean,
    public createdInApp: string,
    public entities: Entities,
    public showInitially: boolean) {
    this.setUpElements();
  }

  public static fromObject(a: ActionLayer, parent: TopicLayer) {
    if (a.entities && a.entities.version !== ActionLayer.CURRENT_VERSION) console.error(`Error LCMS.UnsupportedLayer(${a.name})`);
    // throw new Error(`Error LCMS.UnsupportedLayer(${a.name})`); // LCMS.UnsupportedLayer(a.name);
    let actionLayer = new ActionLayer(a.id, a.name, a.lastchange, a.removed, a.zLevel, parent, a.description, a.version, a.ineditable, a.createdInApp, a.entities, a.showInitially);
    return actionLayer;
  }

  public static CURRENT_VERSION = 20150909;

  public setUpElements() {
    if (this.removed || typeof this.entities === 'undefined') return;
    let entities: {
      [key: string]: {
        entityIdentifier: string;
        entity: Entity;
      }
    } = {};
    this.entities.entityList.forEach(e => {
      entities[e.entity.id] = e;
    });

    let knownTypes = {
      Lne: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.Line(x, this, parent);
      },
      Rct: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.Rectangle(x, this, parent);
      },
      Arc: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.Arc(x, this, parent);
      },
      PAr: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.PolyArrow(x, this, parent);
      },
      STx: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.StrokeText(x, this, parent);
      },
      Prt: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.Part(x, this, parent);
      },
      Img: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.Image(x, this, parent);
      },
      PLn: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.PolyLine(x, this, parent);
      },
      Spl: (x: Entity, parent: LCMS.AElement) => {
        return new LCMS.Contour(x, this, parent);
      },
      Syn: (x: Entity, parent: LCMS.Part) => {
        return new LCMS.Symbol(x, this, parent);
      }
    };

    let createElementTree = (entityIds: string[], parent?: LCMS.Part) => {
      var ret: LCMS.AElement[] = [];

      for (var i in entityIds) {
        if (!entityIds.hasOwnProperty(i)) continue;
        var current = entities[entityIds[i]];
        if (void 0 === knownTypes[current.entityIdentifier]) throw new Error('Unknown element type: ' + current.entityIdentifier); // Possible bug in plugin
        var newElement = knownTypes[current.entityIdentifier](current.entity, parent);
        if (newElement instanceof LCMS.Part) {
          var partChildren: LCMS.AElement[] = createElementTree(newElement.getChildrenIds(), newElement);
          newElement.setChildrenElements(partChildren);
        }
        ret.push(newElement);
      }
      return ret;
    };
    this.elements = createElementTree(this.entities.topEntityIds);
  }

  // public getAttributesFeature(UUID) {
  //   for (var key in this.elements) {
  //     if (!this.elements.hasOwnProperty(key)) continue;
  //     var feature = this.elements[key].getAttributesFeature(UUID);
  //     if (feature) return feature;
  //   }
  // }
}
