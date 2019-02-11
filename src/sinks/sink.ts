import {FeatureCollection} from 'geojson';
import {ICAPAlert} from '../models/cap';

/**
 * The Sink class offers an endpoint to the received data. It should be overriden, e.g. to save the data to a folder, or publish it to Kafka.
 *
 * @export
 * @class Sink
 */
export class Sink {
  /**
   * List of hashes, one for each layer
   *
   * @protected
   * @type {{ [key: string]: { hash: number, index: number } }}
   * @memberOf Sink
   */
  protected hashes: {[key: string]: number} = {};

  /**
   * Simple hash function, converting a string to a number.
   *
   * See also: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
   *
   * @static
   * @param {string} str
   * @returns
   *
   * @memberOf StringUtils
   */
  private static hash(obj: Object) {
    let str = JSON.stringify(obj);
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      let char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Send the data to the sink.
   *
   * @param {{ [key: string]: GeoJSON.FeatureCollection<GeoJSON.GeometryObject> }} data
   * @returns
   *
   * @memberOf Sink
   */
  public send(data: {[key: string]: GeoJSON.FeatureCollection<GeoJSON.GeometryObject>}) {
    this.checkForRemovedLayers(data);
    for (let key in data) {
      if (!data.hasOwnProperty(key)) continue;
      let geoJson = data[key];
      if (this.hasChanged(key, geoJson)) {
        this.sendData(key, geoJson);
      }
    }
  }

  /**
   * Send the CAP data to the sink.
   *
   * @param {ICAPAlert} data
   * @returns
   *
   * @memberOf Sink
   */
  public sendCAP(data: {[key: string]: ICAPAlert}) {
    for (let key in data) {
      if (!data.hasOwnProperty(key)) continue;
      let capData = data[key];
      if (this.hasChanged(key, capData)) {
        this.sendCAPData(key, capData);
      }
    }
  }

  /**
   * Check whether the layer was removed.
   *
   * @protected
   * @param {{ [key: string]: GeoJSON.FeatureCollection<GeoJSON.GeometryObject> }} data
   *
   * @memberOf Sink
   */
  protected checkForRemovedLayers(data: {[key: string]: GeoJSON.FeatureCollection<GeoJSON.GeometryObject>}) {
    for (let key in this.hashes) {
      if (!this.hashes.hasOwnProperty(key)) continue;
      if (!data.hasOwnProperty(key)) {
        this.deleteData(key);
        delete this.hashes[key];
      }
    }
  }

  /**
   * Does the actual processing, and which should be overriden in a super class.
   *
   * @protected
   * @param {string} key
   * @param {Object} geoJson
   * @returns
   *
   * @memberOf Sink
   */
  protected sendData(key: string, geoJson: FeatureCollection) {
    return;
  }

  /**
   * Does the actual processing, and which should be overriden in a super class.
   *
   * @protected
   * @param {string} key
   * @param {Object} geoJson
   * @returns
   *
   * @memberOf Sink
   */
  protected sendCAPData(key: string, capMsg: ICAPAlert) {
    return;
  }

  /**
   * Called when the layer should be removed.
   *
   * @protected
   * @param {string} key
   * @returns
   *
   * @memberOf Sink
   */
  protected deleteData(key: string) {
    return;
  }

  protected hasChanged(key: string, data: GeoJSON.FeatureCollection<GeoJSON.GeometryObject> | ICAPAlert) {
    if (!data) return false;
    let hash = Sink.hash(data);
    if (!this.hashes.hasOwnProperty(key) || this.hashes[key] !== hash) {
      // new or changed
      this.hashes[key] = hash;
      return true;
    } else {
      return false;
    }
  }
}
