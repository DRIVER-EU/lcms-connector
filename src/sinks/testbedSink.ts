import {ProduceRequest, TestBedAdapter, ITestBedOptions} from 'node-test-bed-adapter';
import {Sink} from './sink';
import { FeatureCollection } from 'geojson';

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
  private topic: string = 'lcms_plots';
  private queue: ProduceRequest[] = [];

  constructor(options: ITestBedOptions, topic: string) {
    super();
    options.clientId = options.clientId || this.id;
    this.id = options.clientId;
    this.topic = topic || this.topic;
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

  protected createTopicName(key: string) {
    return this.topic;
  }

  protected sendData(key: string, geoJson: FeatureCollection) {
    this.processQueue();
    let topic = this.createTopicName(key);
    this.publish(topic, geoJson);
  }

  protected deleteData(key: string) {
    let topic = this.createTopicName(key);
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
  private publish(topic: string, geoJson?: FeatureCollection) {
    let payload: ProduceRequest = {
      topic: topic,
      partition: 0,
      messages: geoJson,
      attributes: 1
    };
    if (!this.adapter || !this.adapter.isConnected) {
      log(`Adapter not ready, add GeoJSON file to queue (at position: ${this.queue.length}).`);
      this.queue.push(payload);
      return;
    }
    this.sendPayload(payload);
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
