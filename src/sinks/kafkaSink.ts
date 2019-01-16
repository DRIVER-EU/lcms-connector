import * as fs from 'fs';
import * as path from 'path';
import * as Kafka from 'kafka-node';
import { Sink } from './sink';
import { IConfig } from '../models/config';

const config: IConfig = require(path.resolve('config.json')),
  log = console.log.bind(console),
  log_error = console.error.bind(console);

/**
 * Save GeoJSON to a folder.
 * 
 * @export
 * @class FolderSink
 */
export class KafkaSink extends Sink {
  private producer: Kafka.Producer;
  private keys: string[] = [];
  private topicPrefix: string;

  constructor() {
    super();

    this.topicPrefix = config.kafka.topicPrefix || 'lcms.actual';
    this.initialize();
  }

  protected createTopicName(key, index) {
    return `${this.topicPrefix}.${index + 1}`;
  }

  protected sendData(key: string, geoJson: Object) {
    let index = this.keys.indexOf(key);
    if (index < 0) {
      this.keys.push(key);
      index = this.keys.length - 1;
      let topic = this.createTopicName(key, index);
      this.createTopic(topic, () => {
        this.publish(topic, geoJson);
      });
    } else {
      let topic = this.createTopicName(key, index);
      this.publish(topic, geoJson);
    }
  }

  protected deleteData(key: string) {
    let index = this.keys.indexOf(key);
    let topic = this.createTopicName(key, index);
    this.publish(topic);
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
  private publish(topic: string, geoJson?: Object) {
    let payload = <Kafka.ProduceRequest>{
      topic: topic,
      partition: 0,
      messages: geoJson ? JSON.stringify(geoJson) : '',
      attributes: 1
    };
    this.producer.send([payload], (error, data) => {
      if (error) {
        log_error('Error sending GeoJSON: ' + error);
        log_error('Data: ' + data);
        return;
      }
      if (geoJson) {
        log(`Published GeoJSON file successfully to ${topic}.`);
      } else {
        log(`Deleted GeoJSON file successfully from ${topic}.`);
      }
    });
  }

  /**
   * Initialize the producer, and create the topics (if needed)
   * 
   * @private
   * @param {Kafka.Client} client
   * @param {ICommandLineOptions} options
   * @param {(err, data) => void} cb
   * 
   * @memberOf Router
   */
  private initialize() {
    const client = new Kafka.Client(config.kafka.zookeeperUrl, config.kafka.clientID);
    const Producer = Kafka.Producer;
    this.producer = new Producer(client);
    this.producer.on('error', err => {
      log_error(err);
    });
  }

  private createTopic(topic: string, cb: () => void) {
    if ((<any>this.producer).ready) {
      log(`Creating topic ${topic}.`);
      this.producer.createTopics([topic], false, cb);
    } else {
      this.producer.on('ready', event => {
        log('Producer is ready, creating topic ${topic}.');
        this.producer.createTopics([topic], false, cb);
      });
    }

  }

}
