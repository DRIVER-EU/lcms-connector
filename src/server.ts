import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as yn from 'yn';
import {ICommandLineOptions} from './cli';
import {IConfig} from './models/config';
import {Settings} from './models/settings';

import {Activity} from './lcms/activity';
import {LoginWebService} from './lcms/login-web-service';
import {ActivityWebService} from './lcms/activity-web-service';
import {DrawingsWebService} from './lcms/drawings-web-service';
import {ActivityViewsWebService} from './lcms/activity-views-web-service';
import {UserHeartbeatWebService} from './lcms/user-heartbeat-web-service';
import {ActivityMetadataWebService} from './lcms/activity-metadata-web-service';
import {Ticket} from './lcms/ticket';
import {Drawings} from './lcms/drawings';

import {Sink} from './sinks/sink';
import {FolderSink} from './sinks/folderSink';
import {TestbedSink} from './sinks/testbedSink';
import {ActivityView} from './lcms/activity-view';
import {ActivityViewContent, IField} from './lcms/activity-view-content';
import {ActivityViewContentsWebService} from './lcms/activity-view-contents-web-service';
import {ActivityPostContentsWebService} from './lcms/activity-post-contents-web-service';
import {createLCMSContent} from './models/lcms';
import {createDefaultCAPMessage, ICAPAlert} from './models/cap';
import {INamedGeoJSON} from './lcms/named-geojson';
import {ActivityActionOperationWebService} from './lcms/activity-action-operation-web-service';
import {ICAPAction} from './lcms/action-operation';

if (!fs.existsSync('./local')) {
  fs.mkdirSync('./local');
}
if (!fs.existsSync('./local/config.json')) {
  fs.writeFileSync('./local/config.json', '{}', 'utf8');
}
const localConfig: IConfig = require(path.resolve('./local/config.json'));
const publicConfig: IConfig = require(path.resolve('config.json'));
const config: IConfig = Object.assign(publicConfig, localConfig);
const disableSSL: boolean = process.env.LCMS_CONNECTOR_SSL_MODE && yn(process.env.LCMS_CONNECTOR_SSL_MODE) === false;
if (config.testbed && config.testbed.sslOptions && config.kafka && config.kafka.testbedOptions && !disableSSL) {
  config.kafka.testbedOptions.sslOptions = {
    passphrase: config.testbed.sslOptions.passphrase,
    pfx: config.testbed.sslOptions.pfx ? fs.readFileSync(config.testbed.sslOptions.pfx) : undefined,
    cert: config.testbed.sslOptions.cert ? fs.readFileSync(config.testbed.sslOptions.cert) : undefined,
    ca: config.testbed.sslOptions.ca ? fs.readFileSync(config.testbed.sslOptions.ca) : undefined,
    rejectUnauthorized: config.testbed.sslOptions.rejectUnauthorized
  };
  console.log('Using SSL config to connect to testbed');
}

const log = console.log;
const error = console.error;

const LCMS_HEARTBEAT_MS = 30000;
const LCMS_AUTO_UPDATE_MS = 60000;

// /** The following variables store the webservices and the map controller as
//  * indicated by the plugin documentation. We initialize the web services without
//  * any parameters as they will only be set after the user clicks the login button.
//  *
//  * The map is already passed on to the controller. This takes care of finishing
//  * its initialization by plugging in LCMS's custom rendering code.
//  */
// const activitiesWS = new LCMS.ActivityWebService();
// const drawingsWS = new LCMS.DrawingWebService();

const SERVER_PORT: number = +process.env.LCMS_CONNECTOR_SERVER_PORT || 5000;

export class Server {
  private loginWS: LoginWebService;
  private activitiesWS: ActivityWebService;
  private activityViewsWS: ActivityViewsWebService;
  private activityViewContentsWS: ActivityViewContentsWebService;
  private activityPostContentsWS: ActivityPostContentsWebService;
  private activityActionOperationWS: ActivityActionOperationWebService;
  private activityMetadataWS: ActivityMetadataWebService;
  private userHeartBeatWS: UserHeartbeatWebService;
  private drawingsWS: DrawingsWebService;
  private exercise: string;
  private cookie: string;
  private loggedInToLCMS: boolean = false;
  private debugMode: boolean = false;
  private serverMode: boolean = false;
  private sslMode: boolean = false;
  private id: string = '';
  private consumeDisciplines: string[] = [];
  private views: {[title: string]: ActivityView};
  private fields: {[title: string]: ActivityViewContent};

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
    log('Starting...');
    process.on('SIGINT', () => {
      process.exit(0);
    });
    this.exercise = options.exercise;
    let dataFolder = options.folder || (config.folder && config.folder.data) || 'data';
    let imageFolder = options.image || (config.folder && config.folder.images) || 'images';
    this.refreshTime = options.refresh || 0;
    this.debugMode = options.debug || false;
    this.serverMode = options.server || false;
    this.sslMode = !!config.kafka.testbedOptions.sslOptions;
    this.consumeDisciplines = config.lcms ? config.lcms.consumeDisciplines : [];

    // Overrule config with env variables if present
    config.kafka.testbedOptions.kafkaHost = process.env.KAFKA_BROKER_URL || config.kafka.testbedOptions.kafkaHost;
    config.kafka.testbedOptions.schemaRegistry = process.env.SCHEMA_REGISTRY_URL || config.kafka.testbedOptions.schemaRegistry;
    options.username = process.env.LCMS_CONNECTOR_USERNAME || options.username;
    options.password = process.env.LCMS_CONNECTOR_PASSWORD || options.password;
    this.exercise = process.env.LCMS_CONNECTOR_EXCERCISE || this.exercise;
    this.serverMode = process.env.LCMS_CONNECTOR_SERVER_MODE ? yn(process.env.LCMS_CONNECTOR_SERVER_MODE) : this.serverMode;
    this.sslMode = process.env.LCMS_CONNECTOR_SSL_MODE ? yn(process.env.LCMS_CONNECTOR_SSL_MODE) : this.sslMode;
    this.debugMode = process.env.LCMS_CONNECTOR_DEBUG_MODE ? yn(process.env.LCMS_CONNECTOR_DEBUG_MODE) : this.debugMode;
    options.kafka = process.env.LCMS_CONNECTOR_KAFKA_MODE ? yn(process.env.LCMS_CONNECTOR_KAFKA_MODE) : options.kafka;

    if (!fs.existsSync(imageFolder)) fs.mkdirSync(imageFolder);
    if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

    Settings.getInstance().imageFolder = imageFolder;

    if (options.kafka && config.kafka) {
      this.id = config.kafka.testbedOptions.clientId;
      if (!this.sslMode) {
        console.log(`Forcibly disabling SSL-Mode to connect to testbed`);
        config.kafka.testbedOptions.sslOptions = null;
      }
      this.sink = new TestbedSink(config.kafka.testbedOptions, config.kafka.plotTopic, config.kafka.capTopic, dataFolder);
      // this.sink = new FolderSink(dataFolder, imageFolder);
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
    this.userHeartBeatWS = new UserHeartbeatWebService(serverUrl, username, password);
    this.drawingsWS = new DrawingsWebService(serverUrl, username, password);

    if (this.sink && this.sink.canPost()) {
      this.activityPostContentsWS = new ActivityPostContentsWebService(serverUrl, username, password);
      this.sink.setPostService(this.activityPostContentsWS);
      this.activityActionOperationWS = new ActivityActionOperationWebService(serverUrl, username, password);
      this.sink.setActionOperationService(this.activityActionOperationWS);
    }
    this.login(serverUrl, (err?: string) => {
      if (err) {
        console.error('Error logging in: ' + err);
        process.exit(1);
      }
      console.log('Login success');
      if (this.serverMode) {
        console.log('Will start server at ' + SERVER_PORT);
        this.startServer();
        this.loadActivities(false);
      } else {
        this.loadActivities();
      }
    });
  }

  private startUserAliveTick() {
    if (!this.userHeartBeatWS) return;
    setTimeout(() => {
      this.sendAliveTick();
    }, LCMS_HEARTBEAT_MS);
  }

  private startAutoUpdate() {
    setTimeout(() => {
      this.checkForUpdates();
    }, LCMS_AUTO_UPDATE_MS);
  }

  public lcmsLoggedIn(): boolean {
    return this.loggedInToLCMS;
  }

  private sendAliveTick() {
    var success = (res: any) => {};
    var failure = (error: any) => log('Error sending alive heartbeat to LCMS. ' + error);
    this.userHeartBeatWS.loadData(success, failure, null, this.cookie);
    setTimeout(() => {
      this.sendAliveTick();
    }, LCMS_HEARTBEAT_MS);
  }

  private checkForUpdates() {
    console.log('Auto-update check');
    this.loadActivities();
    setTimeout(() => {
      this.checkForUpdates();
    }, LCMS_AUTO_UPDATE_MS);
  }

  private startServer() {
    this.startUserAliveTick();
    this.startAutoUpdate();
    const app = express();
    const staticFolder = path.join('gui');
    console.log(`Exposing static folder ${staticFolder}`);
    app.use(express.static(staticFolder));
    app.get('/update', (req, res) => {
      this.loadActivities();
      res.send('Publishing activities');
    });
    app.get('/test/loadtest', (req, res) => {
      const capMsg: ICAPAlert = createDefaultCAPMessage('lcms');
      capMsg.info.headline = 'headline';
      (this.sink as TestbedSink).sendCAP({cap: capMsg});
      res.send('Published cap msg');
    });
    app.get('/test/overig/create', (req, res) => {
      (this.sink as TestbedSink).publishToLCMS([createLCMSContent('OVERIG', `OVERIG ${new Date().getMilliseconds()}`, `OVERIG Status ${new Date().getMilliseconds()}`)]);
      res.send('Published overig title');
    });
    app.get('/test/htm', (req, res) => {
      (this.sink as TestbedSink).publishToLCMS([createLCMSContent('HTM', 'Verwachtingen', `HTM Status ${new Date().getMilliseconds()}`)]);
      res.send('Published htm');
    });
    app.get('/test/stedin', (req, res) => {
      (this.sink as TestbedSink).publishToLCMS([createLCMSContent('STEDIN', 'Verwachtingen', `<h3>Stedin Status ${new Date().getMilliseconds()}</h3>`)]);
      res.send('Published stedin');
    });
    app.get('/test/action', (req, res) => {
      (this.sink as TestbedSink).publishToLCMS([
        createLCMSContent(
          'ACTION',
          'ACTION',
          JSON.stringify([{title: `Actie ${new Date().getMilliseconds()}`, description: 'Beschrijving', organisation: 'VR015-Haaglanden', team: 'ROT', discipline: 'GZ', function: 'AC', priority: 'AVERAGE'}] as ICAPAction[])
        )
      ]);
      res.send('Published action');
    });
    app.get('/test/geojson', (req, res) => {
      let geoJson: INamedGeoJSON = {
        properties: {
          guid: 'test',
          name: 'LCMS test'
        },
        geojson: {
          type: 'FeatureCollection',
          features: [{type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [5.1, 52.9]}}]
        }
      };
      (this.sink as TestbedSink).send({test: geoJson});
      res.send('Published geojson');
    });
    const server = app.listen(SERVER_PORT, () => {
      console.log(`App listening on port ${SERVER_PORT}`);
      if (this.debugMode) console.log(server.address());
    });
  }

  private login(serverUrl: string, cb: Function) {
    log('Logging in on server ' + serverUrl + '\n');

    var success = (cookie: string) => {
      log(`Stored cookie: ${cookie}`);
      this.cookie = cookie;
      if (cookie) {
        this.loggedInToLCMS = true;
        if (this.sink && (this.sink as TestbedSink).setEnabled) (this.sink as TestbedSink).setEnabled();
      } else {
        this.loggedInToLCMS = false;
        error('Could not get login cookie from LCMS!');
      }
      cb();
    };

    // Failure call back that displays the HTTP error status to the user
    var failure = err => {
      error('Error while logging in: ' + JSON.stringify(err));
      cb(err);
    };

    /** Load the data using both call backs defined above.*/
    this.loginWS.loadData(success, failure, null);
  }

  /**
   * This function is called by the success callback of the loadActivities function above.
   * It gets the data for the defined activity and reders it in the tree.
   */
  loadDrawing(activity: Activity, sendToSink: boolean = false) {
    // Success callback that renders the drawing into the tree.
    var success = (drawings: Drawings) => {
      let col = drawings.toGeoJSONCollection(this.cookie);

      if (sendToSink) this.sink.send(col);

      log(`Sinking ${Object.keys(col).length} collections: `);
      log(
        `${Object.keys(col)
          .map(k => `\t${k}`)
          .join('\n')}`
      );
      if (this.refreshTime) {
        setTimeout(() => this.loadDrawing(activity, sendToSink), this.refreshTime * 1000);
      } else {
        // Allow node some time to save the files to disk.
        // setTimeout(() => process.exit(0), 60000);
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
        // console.log(col);
      }
      cb(views.views);
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = error => {
      log('Error when loading views: ' + error.statusText ? error.statusText : error);
      cb(null);
    };

    /** Load the drawing data using both callbacks and the activity id. */
    this.activityViewsWS.loadData(success, failure, {activityId: activity.id}, this.cookie);
  }

  /**
   * This function is called by the success callback of the loadActivities function above.
   * It gets the views for the defined activity and renders it in the tree.
   */
  loadView(activity: Activity, view: ActivityView, sendToSink: boolean = false) {
    // Success callback that renders the drawing into the tree.
    var success = (viewContent: ActivityViewContent) => {
      if (!viewContent) return;
      let col = viewContent.screenTitle;
      if (this.debugMode) {
        console.log(`  VIEW CONTENTS: ${col} (${viewContent.fields.length} fields)`);
      }
      this.activityActionOperationWS.setActivity(activity.id);
      this.activityPostContentsWS.setActivity(activity.id);
      this.activityPostContentsWS.setViews(this.views);
      this.activityPostContentsWS.setFields(
        viewContent.fields.reduce((prev: Record<string, IField>, curr: IField) => {
          const key = `${viewContent.screenTitle}--${curr.screenTitle}`;
          // console.log(key);
          prev[key] = curr;
          return prev;
        }, {})
      );
      if (this.consumeDisciplines.indexOf(viewContent.screenTitle.toUpperCase()) >= 0) {
        this.activityActionOperationWS.setCookie(this.cookie);
        this.activityPostContentsWS.setCookie(this.cookie);
        const cap = viewContent.toCAPMessages(this.id);
        if (sendToSink) {
          console.log('Start sending process...: ' + JSON.stringify(cap));
          this.sink.sendCAP({cap: cap});
        }
      }
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = error => {
      log('Error when loading view contents: ' + error.statusText ? error.statusText : error);
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
      log('Error when loading metadata: ' + error);
    };

    /** Load the drawing data using both callbacks and the activity id. */
    this.activityMetadataWS.loadData(success, failure, {activityId: activity.id, setActivityRead: true}, this.cookie);
  }

  /**
   * This function is called by the success callback of the login function above.
   * It gets the metadata for the defined activity and renders it in the tree.
   */
  loadActivities(sendToSink: boolean = true) {
    // Success callback that renders the drawing into the tree.
    var success = (activities: Activity[]) => {
      let exerciseFound = false;
      activities.forEach((a, aIndex) => {
        try {
          if (this.exercise && !exerciseFound && a.name.indexOf(this.exercise) >= 0) {
            log(`\nLoading activity ${aIndex}:  ${a.name} ...\n`);
            exerciseFound = true;
            this.loadMetadata(a);
            this.loadDrawing(a, sendToSink);
            this.loadViewOverview(a, (views: ActivityView[]) => {
              this.views = views.reduce((prev: Record<string, ActivityView>, curr: ActivityView) => {
                prev[curr.screenTitle] = curr;
                return prev;
              }, {});
              if (views) {
                views.forEach((view: ActivityView) => {
                  this.loadView(a, view, sendToSink);
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
      if (this.loggedInToLCMS && this.sink && (this.sink as TestbedSink).setEnabled) (this.sink as TestbedSink).setEnabled();
      if (!exerciseFound) {
        log('No exercise found, so no data is loaded. Please specify an exercise with the `-e "exercise name" option on the command line');
        process.exit(0);
      }
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = error => {
      log('Error when loading metadata: ' + error.statusText);
      if (this.loggedInToLCMS && this.sink && (this.sink as TestbedSink).setEnabled) (this.sink as TestbedSink).setEnabled();
    };

    if (this.loggedInToLCMS && this.sink && (this.sink as TestbedSink).setDisabled) (this.sink as TestbedSink).setDisabled();
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
