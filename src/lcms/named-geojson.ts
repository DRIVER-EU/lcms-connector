import {FeatureCollection} from 'geojson';

export interface INamedGeoJSON extends FeatureCollection {
  guid: string;
  title: string;
}
