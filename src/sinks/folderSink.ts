import * as fs from 'fs';
import * as path from 'path';
import { Sink } from './sink';

/**
 * Save GeoJSON to a folder.
 * 
 * @export
 * @class FolderSink
 */
export class FolderSink extends Sink {
  constructor(private dataPath: string, private imagePath: string) {
    super();
    this.dataPath = path.resolve(this.dataPath);
    this.imagePath = path.resolve(this.imagePath);
    if (!fs.existsSync(this.dataPath)) fs.mkdirSync(this.dataPath);
    if (!fs.existsSync(this.imagePath)) fs.mkdirSync(this.imagePath);
  }

  protected createFilename(key) {
    return path.join(this.dataPath, key.toLowerCase() + '.geojson');
  }

  protected sendData(key: string, geoJson: Object) {
    let filename = this.createFilename(key);
    fs.writeFile(filename, JSON.stringify(geoJson), err => {
      if (err) console.error(`Error saving ${filename}: ${err.message}!`);
    });
  }

  protected deleteData(key: string) {
    let filename = this.createFilename(key);
    fs.unlink(filename, err => {
      if (err) console.error(`Error deleting ${filename}: ${err.message}!`);
    });
  }
}
