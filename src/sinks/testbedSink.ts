import {ProduceRequest, TestBedAdapter, ITestBedOptions} from 'node-test-bed-adapter';
import {Sink} from './sink';
import {FeatureCollection} from 'geojson';
import {ICAPAlert} from '../models/cap';

const log = console.log.bind(console),
  log_error = console.error.bind(console);

/**
 * Save GeoJSON to a folder.
 *
 * @export
 * @class TestbedSink
 */
export class TestbedSink extends Sink {
  private id = 'lcms-plotter';
  private adapter: TestBedAdapter;
  private plotTopic: string = 'lcms_plots';
  private capTopic: string = 'standard_cap';
  private queue: ProduceRequest[] = [];

  constructor(options: ITestBedOptions, plotTopic: string, capTopic: string) {
    super();
    options.clientId = options.clientId || this.id;
    this.id = options.clientId;
    this.plotTopic = plotTopic || this.plotTopic;
    this.capTopic = capTopic || this.capTopic;
    this.adapter = new TestBedAdapter(options);
    this.adapter.on('error', e => {
      log_error(e);
    });
    this.adapter.on('ready', () => {
      log('Producer is connected');
      this.processQueue();
    });
    this.connectAdapter(options);
  }

  private connectAdapter(options: ITestBedOptions, retries: number = 0) {
    this.adapter
      .connect()
      .then(() => {
        log(`Initialized test-bed-adapter correctly`);
      })
      .catch(err => {
        log_error(`Initializing test-bed-adapter failed: ${err}`);
        if (retries < options.maxConnectionRetries) {
          retries += 1;
          let timeout = options.retryTimeout;
          log(`Retrying to connect in ${timeout} seconds (retry #${retries})`);
          setTimeout(() => this.connectAdapter(options, retries), timeout * 1000);
        }
      });
  }

  protected createTopicName(type: 'cap' | 'geojson') {
    switch (type) {
      case 'cap':
        return this.capTopic;
        break;
      case 'geojson':
        return this.plotTopic;
      default:
        log_error(`Could not obtain topic`);
        return '';
        break;
    }
  }

  protected sendData(key: string, geoJson: FeatureCollection) {
    this.processQueue();
    let topic = this.createTopicName('geojson');
    this.publish(topic, geoJson);
  }

  protected sendCAPData(key: string, cap: ICAPAlert) {
    this.processQueue();
    let topic = this.createTopicName('cap');
    this.publish(topic, cap);
  }

  protected deleteData(key: string) {
    let topic = this.createTopicName('geojson');
    this.publish(topic);
  }

  private processQueue() {
    if (this.queue.length > 0 && this.adapter && this.adapter.isConnected) {
      log(`Processing queue (of length: ${this.queue.length})...`);
      while (this.queue.length > 0) {
        const payload = this.queue.shift();
        this.sendPayload(payload);
      }
      return;
    }
  }

  /**
   * Publish a file to Kafka using gzip compression.
   *
   * @private
   * @param {string} file
   * @param {number} index
   *
   * @memberOf Router
   */
  private publish(topic: string, data?: FeatureCollection | ICAPAlert) {
    const payload = this.createProduceRequest(topic, data);
    if (!this.adapter || !this.adapter.isConnected) {
      log(`Adapter not ready, add GeoJSON file to queue (at position: ${this.queue.length}).`);
      this.queue.push(payload);
      return;
    }
    this.sendPayload(payload);
  }

  private createProduceRequest(topic: string, data?: FeatureCollection | ICAPAlert): ProduceRequest {
    this.wrapUnionFieldsOfGeojson(data);
    const payload: ProduceRequest = {
      topic: topic,
      partition: 0,
      messages: data,
      attributes: 1
    };
    return payload;
  }

  private wrapUnionFieldsOfGeojson(data: FeatureCollection | ICAPAlert) {
    if (!data) return;
    if (data.hasOwnProperty('features')) {
      const geoJson = data as FeatureCollection;
      geoJson.features.forEach(f => {
        if (f && f.geometry && f.geometry && Object.keys(f.geometry).length > 1) {
          const geom = JSON.parse(JSON.stringify(f.geometry));
          delete f.geometry;
          f.geometry = {} as any;
          f.geometry[`eu.driver.model.geojson.${geom.type}`] = geom;
        }
        if (f && f.properties && Object.keys(f.properties).length > 0) {
          Object.keys(f.properties).forEach(key => {
            const val = f.properties[key];
            f.properties[key] = {};
            if (typeof val === 'object') {
              f.properties[key][`string`] = JSON.stringify(val);
            } else {
              f.properties[key][`${typeof val}`] = val;
            }
          });
        }
      });
    }
    if (data.hasOwnProperty('identifier')) {
      const cap = data as ICAPAlert;
    }
  }

  private sendPayload(payload: ProduceRequest) {
    this.adapter.send([payload], (error, data) => {
      if (error) {
        log_error('Error sending GeoJSON: ' + error);
        log_error('Data: ' + data);
        return;
      }
    });
  }
}
