import * as fs from 'fs';
import * as path from 'path';
import {ICommandLineOptions} from './cli';
import {IConfig} from './models/config';
import {Settings} from './models/settings';

import {Activity} from './lcms/activity';
import {LoginWebService} from './lcms/login-web-service';
import {ActivityWebService} from './lcms/activity-web-service';
import {DrawingsWebService} from './lcms/drawings-web-service';
import {ActivityViewsWebService} from './lcms/activity-views-web-service';
import {ActivityMetadataWebService} from './lcms/activity-metadata-web-service';
import {Ticket} from './lcms/ticket';
import {Drawings} from './lcms/drawings';

import {Sink} from './sinks/sink';
import {FolderSink} from './sinks/folderSink';
import {TestbedSink} from './sinks/testbedSink';
import {ActivityView} from './lcms/activity-view';
import {ActivityViewContent} from './lcms/activity-view-content';
import {ActivityViewContentsWebService} from './lcms/activity-view-contents-web-service';

const publicConfig: IConfig = require(path.resolve('config.json'));
const localConfig: IConfig = require(path.resolve('./local/config.json'));
const config: IConfig = Object.assign(publicConfig, localConfig);

const log = console.log;
const error = console.error;

// /** The following variables store the webservices and the map controller as
//  * indicated by the plugin documentation. We initialize the web services without
//  * any parameters as they will only be set after the user clicks the login button.
//  *
//  * The map is already passed on to the controller. This takes care of finishing
//  * its initialization by plugging in LCMS's custom rendering code.
//  */
// const activitiesWS = new LCMS.ActivityWebService();
// const drawingsWS = new LCMS.DrawingWebService();

export class Server {
  private loginWS: LoginWebService;
  private activitiesWS: ActivityWebService;
  private activityViewsWS: ActivityViewsWebService;
  private activityViewContentsWS: ActivityViewContentsWebService;
  private activityMetadataWS: ActivityMetadataWebService;
  private drawingsWS: DrawingsWebService;
  private exercise: string;
  private cookie: string;
  private debugMode: boolean = false;
  private id: string = '';

  /** The following variables are responsible for holding the ticket object, list
   * of available drawings and list of currently selected layers.
   */
  private ticket: Ticket;
  private drawings;

  private sink: Sink;

  /**
   * Refresh time in seconds
   *
   * @private
   * @type {number}
   * @memberOf Server
   */
  private refreshTime: number;

  constructor(options?: ICommandLineOptions) {
    log('Starting server...');
    process.on('SIGINT', () => {
      process.exit(0);
    });
    this.exercise = options.exercise;
    let dataFolder = options.folder || (config.folder && config.folder.data) || 'data';
    let imageFolder = options.image || (config.folder && config.folder.images) || 'images';
    this.refreshTime = options.refresh || 0;
    this.debugMode = options.debug || false;

    if (!fs.existsSync(imageFolder)) fs.mkdirSync(imageFolder);
    if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

    Settings.getInstance().imageFolder = imageFolder;

    if (options.kafka && config.kafka) {
      this.id = config.kafka.testbedOptions.clientId;
      this.sink = new TestbedSink(config.kafka.testbedOptions, config.kafka.plotTopic, config.kafka.capTopic);
    } else {
      this.sink = new FolderSink(dataFolder, imageFolder);
    }

    log(`Contacting ${config.lcms.serverUrl}`);
    this.initialize(config.lcms.serverUrl, options.username || config.lcms.username, options.password);
  }

  initialize(serverUrl: string, username: string, password: string) {
    this.loginWS = new LoginWebService(serverUrl, username, password);
    this.activitiesWS = new ActivityWebService(serverUrl, username, password);
    this.activityViewsWS = new ActivityViewsWebService(serverUrl, username, password);
    this.activityViewContentsWS = new ActivityViewContentsWebService(serverUrl, username, password);
    this.activityMetadataWS = new ActivityMetadataWebService(serverUrl, username, password);
    this.drawingsWS = new DrawingsWebService(serverUrl, username, password);

    log('Loading activities from server ' + serverUrl + '\n');

    var success = (cookie: string) => {
      log(`Stored cookie: ${cookie}`);
      this.cookie = cookie;
      this.loadActivities();
    };

    // Failure call back that displays the HTTP error status to the user
    var failure = err => {
      error('Error while logging in: ' + JSON.stringify(err));
    };

    /** Load the data using both call backs defined above.*/
    this.loginWS.loadData(success, failure, null);
  }

  /**
   * This function is called by the success callback of the loadActivities function above.
   * It gets the data for the defined activity and reders it in the tree.
   */
  loadDrawing(activity: Activity) {
    // Success callback that renders the drawing into the tree.
    var success = (drawings: Drawings) => {
      let col = drawings.toGeoJSONCollection(this.ticket);

      this.sink.send(col);

      log(`Sinking ${Object.keys(col).length} collections: `);
      log(
        `${Object.keys(col)
          .map(k => `\t${k}`)
          .join('\n')}`
      );
      if (this.refreshTime) {
        setTimeout(() => this.loadDrawing(activity), this.refreshTime * 1000);
      } else {
        // Allow node some time to save the files to disk.
        setTimeout(() => process.exit(0), 60000);
      }
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = error => {
      log('Error when loading drawing: ' + error.statusText);
    };

    /** Load the drawing data using both callbacks and the activity id. */
    this.drawingsWS.loadData(success, failure, activity.id, this.cookie);
  }

  /**
   * This function is called by the success callback of the loadActivities function above.
   * It gets the views for the defined activity and renders it in the tree.
   */
  loadViewOverview(activity: Activity, cb: (views: ActivityView[]) => void) {
    // Success callback that renders the drawing into the tree.
    var success = (views: any) => {
      let col = JSON.stringify(views) as any;
      if (this.debugMode) {
        console.log('VIEWS');
        console.log(col);
      }
      cb(views.views);
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = error => {
      log('Error when loading views: ' + error.statusText);
      cb(null);
    };

    /** Load the drawing data using both callbacks and the activity id. */
    this.activityViewsWS.loadData(success, failure, {activityId: activity.id}, this.cookie);
  }

  /**
   * This function is called by the success callback of the loadActivities function above.
   * It gets the views for the defined activity and renders it in the tree.
   */
  loadView(activity: Activity, view: ActivityView) {
    // Success callback that renders the drawing into the tree.
    var success = (view: ActivityView) => {
      if (!view) return;
      let col = JSON.stringify(view) as any;
      if (this.debugMode) {
        console.log('VIEW CONTENTS');
        console.log(col);
      }
      if (view.viewCategory === 'SITUATIEBEELD') {
        const cap = view.toCAPMessages(this.id);
        console.log(cap);
        this.sink.sendCAP({'cap': cap});
      }
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = error => {
      log('Error when loading views: ' + error.statusText);
    };

    /** Load the drawing data using both callbacks and the activity id. */
    this.activityViewContentsWS.loadData(success, failure, {activityId: activity.id, viewId: view.id, viewChangeData: {changedFieldsByUser: [], lastChangeTime: Date.now()}}, this.cookie);
  }

  /**
   * This function is called by the success callback of the loadActivities function above.
   * It gets the metadata for the defined activity and renders it in the tree.
   */
  loadMetadata(activity: Activity) {
    // Success callback that renders the drawing into the tree.
    var success = (metadata: any) => {
      let col = metadata;
      if (this.debugMode) {
        console.log('METADATA');
        console.log(col);
      }
      // this.sink.send(col);

      log(`Sinking ${Object.keys(col).length} collections: `);
      log(col);
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = error => {
      log('Error when loading metadata: ' + error.statusText);
    };

    /** Load the drawing data using both callbacks and the activity id. */
    this.activityMetadataWS.loadData(success, failure, {activityId: activity.id, setActivityRead: true}, this.cookie);
  }

  /**
   * This function is called by the success callback of the login function above.
   * It gets the metadata for the defined activity and renders it in the tree.
   */
  loadActivities() {
    // Success callback that renders the drawing into the tree.
    var success = (activities: Activity[]) => {
      let exerciseFound = false;
      activities.forEach((a, aIndex) => {
        try {
          if (this.exercise && !exerciseFound && a.name.indexOf(this.exercise) >= 0) {
            log(`\nLoading activity ${aIndex}:  ${a.name} ...\n`);
            exerciseFound = true;
            this.loadMetadata(a);
            this.loadDrawing(a);
            this.loadViewOverview(a, views => {
              if (views) {
                views.forEach(view => {
                  this.loadView(a, view);
                });
              }
            });
          } else {
            log(`${aIndex}. ${a.name}`);
          }
        } catch (e) {
          // In case of error (e.g. if there are unsupported layers), alert the user
          if (a.name !== undefined) {
            error('Error when loading the activity ' + a.name + ': ' + e.message);
          } else {
            error('Error: Unknown error while loading an activity.');
          }
        }
      });
      log('');
      if (!exerciseFound) {
        log('No exercise found, so no data is loaded. Please specify an exercise with the `-e "exercise name" option on the command line');
        process.exit(0);
      }
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = error => {
      log('Error when loading metadata: ' + error.statusText);
    };

    this.activitiesWS.loadData(
      success,
      failure,
      {
        category: 'RUNNING',
        onlyNotRead: 'false',
        onlyOwnOrganization: 'true',
        onlyTemplate: 'false',
        pagingCount: '15',
        pagingStart: '0',
        pollingReload: 'false',
        searchQuery: '',
        sortAscending: 'false',
        sortField: 'MODIFIED'
      },
      this.cookie
    );
  }
}
