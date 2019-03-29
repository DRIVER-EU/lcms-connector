import {ProduceRequest, TestBedAdapter, ITestBedOptions, IAdapterMessage} from 'node-test-bed-adapter';
import {Sink} from './sink';
import {FeatureCollection} from 'geojson';
import {ICAPAlert, IValueNamePair} from '../models/cap';
import {ILargeDataUpdate, DataType} from '../models/ldu';
import * as axios from 'axios';
import {ActivityPostContentsWebService} from '../lcms/activity-post-contents-web-service';
import {ActivityActionOperationWebService} from '../lcms/activity-action-operation-web-service';
import {INamedGeoJSON} from '../lcms/named-geojson';
import * as fs from 'fs';
import * as path from 'path';
import {ILCMSContent, createLCMSContent} from '../models/lcms';
import {Promise} from 'bluebird';

const log = console.log.bind(console),
  log_error = console.error.bind(console);

const stringify = (m: string | Object) => (typeof m === 'string' ? m : JSON.stringify(m, null, 2));

/**
 * Save GeoJSON to a folder.
 *
 * @export
 * @class TestbedSink
 */
export class TestbedSink extends Sink {
  private id = 'lcms';
  private adapter: TestBedAdapter;
  private plotTopic: string = 'lcms_plots';
  private capTopic: string = 'standard_cap';
  private queue: ProduceRequest[] = [];
  private activityPostContentsWS: ActivityPostContentsWebService;
  private activityActionOperationWS: ActivityActionOperationWebService;

  constructor(options: ITestBedOptions, plotTopic: string, capTopic: string, private dataPath: string = '.') {
    super();
    this.dataPath = path.resolve(this.dataPath);
    if (!fs.existsSync(this.dataPath)) fs.mkdirSync(this.dataPath);
    options.clientId = options.clientId || this.id;
    this.id = options.clientId;
    this.plotTopic = plotTopic || this.plotTopic;
    this.capTopic = capTopic || this.capTopic;
    this.adapter = new TestBedAdapter(options);
    this.adapter.on('error', e => {
      log_error(e);
    });
    this.adapter.on('ready', () => {
      console.log('Producer is connected');
      this.processQueue();
    });
    this.connectAdapter(options);
  }

  public canPost() {
    return true;
  }

  public setPostService(svc: ActivityPostContentsWebService) {
    this.activityPostContentsWS = svc;
  }

  public setActionOperationService(svc: ActivityActionOperationWebService) {
    this.activityActionOperationWS = svc;
  }

  private connectAdapter(options: ITestBedOptions, retries: number = 0) {
    this.adapter
      .connect()
      .then(() => {
        console.log(`Initialized test-bed-adapter correctly`);
        this.adapter.on('message', message => this.handleMessage(message));
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

  protected sendData(key: string, geoJson: any) {
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
  private publish(topic: string, data?: INamedGeoJSON | ICAPAlert) {
    const payload = this.createProduceRequest(topic, data);
    if (!payload) return;
    if (!this.adapter || !this.adapter.isConnected) {
      log(`Adapter not ready, add GeoJSON file to queue (at position: ${this.queue.length}).`);
      this.queue.push(payload);
      return;
    }
    this.sendPayload(payload);
  }

  private createProduceRequest(topic: string, data?: INamedGeoJSON | ICAPAlert): ProduceRequest | undefined {
    if (!data) return undefined;
    if (data.hasOwnProperty('geojson') && (data as INamedGeoJSON).geojson.hasOwnProperty('features')) {
      this.wrapUnionFieldsOfGeojson((data as INamedGeoJSON).geojson);
    }
    if (data.hasOwnProperty('properties')) {
      this.wrapUnionFieldsOfProperties((data as INamedGeoJSON).properties);
    }
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
        this.wrapUnionFieldsOfProperties(f.properties);
      });
    }
    if (data.hasOwnProperty('identifier')) {
      const cap = data as ICAPAlert;
    }
  }

  private wrapUnionFieldsOfProperties(props: any) {
    if (props && Object.keys(props).length > 0) {
      Object.keys(props).forEach(key => {
        const val = props[key];
        props[key] = {};
        if (typeof val === 'object') {
          props[key][`string`] = JSON.stringify(val);
        } else {
          props[key][`${typeof val}`] = val;
        }
      });
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

  private handleMessage(message: IAdapterMessage) {
    switch (message.topic.toLowerCase()) {
      case 'system_heartbeat':
        // log.info(`Received heartbeat message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
      case 'system_configuration':
        // log.info(`Received configuration message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
      case 'standard_cap':
        this.handleCAPMessage(message);
        break;
      case 'lcms_plots':
      case 'test_plots':
      case 'crisissuite_htm_plots':
      case 'crisissuite_stedin_plots':
      case 'flood_prediction_geojson':
        log(`Received plots message with key ${stringify(message.key)}}`);
        this.handleGeoJSONMessage(message);
        break;
      case 'flood_actual':
      case 'flood_actual_lcms':
      case 'flood_prediction_netcdf':
        log(`Received flood_actual message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        this.handleLargeDataMessage(message);
        break;
      default:
        log(`Received ${message.topic} message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
    }
  }

  private handleCAPMessage(message: IAdapterMessage) {
    if (message.key && typeof message.key === 'object' && message.key.senderID === this.id) {
      //Skip own messages
      return;
    }
    log(`Received CAP message with key ${stringify(message.key)}: ${stringify(message.value)}`);
    const msg: ICAPAlert = message.value as ICAPAlert;
    let organisation: string = msg.sender;
    if (organisation.indexOf('@crisissuite.com') > 0) {
      organisation = organisation.replace('@crisissuite.com', '').toUpperCase();
      const contents: ILCMSContent[] = this.getCAPParameterValues(msg, organisation);
      if (organisation && contents) this.publishToLCMS(contents);
    } else if (organisation.indexOf('@sim-ci.com') > 0) {
      organisation = organisation.replace('@sim-ci.com', '').toUpperCase();
      const contents: ILCMSContent[] = this.getCAPParameterValues(msg, organisation);
      if (organisation && contents) this.publishToLCMS(contents);
    } else if (organisation.indexOf('@tmt.eu') > 0) {
      organisation = organisation.replace('@tmt.eu', '').toUpperCase();
      const contents: ILCMSContent[] = this.getCAPParameterValues(msg, organisation);
      if (organisation && contents) this.publishToLCMS(contents);
    } else if (organisation.indexOf('@lcms.com') > 0) {
      organisation = organisation.replace('@lcms.com', '').toUpperCase();
      // const contents: ILCMSContent[] = this.getCAPParameterValues(msg, organisation);
      // if (organisation && contents) this.publishToLCMS(contents);
    } else {
      organisation = organisation.toUpperCase();
    }
  }

  private getCAPParameterValues(msg: ICAPAlert, organisation: string): ILCMSContent[] {
    const result = [];
    if (!msg || !msg.info || !msg.info.parameter) {
      result.push(createLCMSContent(organisation, organisation));
    } else {
      const parameter: IValueNamePair | IValueNamePair[] = msg.info.parameter;
      if (Array.isArray(parameter)) {
        parameter.forEach(p => {
          result.push(createLCMSContent(organisation, p.valueName, p.value));
        });
      } else {
        result.push(createLCMSContent(organisation, parameter.valueName, parameter.value));
      }
    }
    // return parameter.value;
    return result;
  }

  private handleLargeDataMessage(message: IAdapterMessage) {
    const msg: ILargeDataUpdate = message.value as ILargeDataUpdate;
    console.log(stringify(msg));
    if (msg.dataType && (msg.dataType === DataType.pdf || msg.dataType === DataType.wms)) {
      // || msg.dataType === DataType.geojson)) {
      this.publishToLCMS([createLCMSContent('ZKI', msg.title, `<h2>${msg.title}</h2><br><br><a href="${msg.url}">${msg.url}</a><br><br>${msg.description}`)]);
    } else {
      axios.default
        .get(msg.url)
        .then((body: axios.AxiosResponse) => {
          console.log(`Downloaded ${msg.title} ${msg.dataType}:`);
          // console.log(data);
          const filename = this.createFilename(msg.title, msg.dataType);
          fs.writeFile(filename, JSON.stringify(body.data), err => {
            if (err) console.error(`Error saving ${filename}: ${err.message}!`);
            console.log(`Wrote ${filename}`);
          });
        })
        .catch(err => console.error(err));
    }
  }

  private handleGeoJSONMessage(message: IAdapterMessage) {
    const msg: INamedGeoJSON = message.value as INamedGeoJSON;
    const filename = this.createFilename(!msg.properties ? 'none' : !msg.properties.name ? 'noname' : msg.properties.name, 'geojson');
    fs.writeFile(filename, JSON.stringify(msg), err => {
      if (err) console.error(`Error saving ${filename}: ${err.message}!`);
      console.log(`Wrote ${filename}`);
    });
  }

  protected createFilename(key: string = 'default', ext: string) {
    if (typeof key !== 'string' && (<any>key).string) key = (<any>key).string;
    const keyFiltered = key.replace(/[^a-zA-Z0-9 -]/g, '');
    return path.join(this.dataPath, `${keyFiltered.toLowerCase()}.${ext}`);
  }

  public publishToLCMS(contents: ILCMSContent[]) {
    var success = (data: Object) => {
      log(`Sent data: ${JSON.stringify(data)}`);
    };

    var error = (err: string) => {
      log(`Error sending data: ${err}`);
    };

    Promise.each(contents, content => {
      if (content.tabTitle === 'action') {
        return this.activityActionOperationWS.writeLCMSAction(content.tabTitle, content.content);
      } else {
        return this.activityPostContentsWS.writeLCMSData(content.tabTitle, content.fieldTitle, content.content);
      }
    }).then(() => {
      console.log('Added/updated LCMS field');
    });
  }
}
