import * as fs from 'fs';
import * as path from 'path';
import { ICommandLineOptions } from './cli';
import { IConfig } from './models/config';
import { Settings } from './models/settings';

import { Activity } from './lcms/activity';
import { ActivityWebService } from './lcms/activity-web-service';
import { DrawingWebService } from './lcms/drawing-web-service';
import { Drawing } from './lcms/drawing';
import { Ticket } from './lcms/ticket';

import { Sink } from './sinks/sink';
import { FolderSink } from './sinks/folderSink';
import { KafkaSink } from './sinks/kafkaSink';

const config: IConfig = require(path.resolve('config.json'));

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
  private activitiesWS: ActivityWebService;
  private drawingsWS: DrawingWebService;
  private exercise: string;

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
    process.on('SIGINT', () => {
      process.exit(0);
    });
    this.exercise = options.exercise;
    let dataFolder = options.folder || (config.folder && config.folder.data) || 'data';
    let imageFolder = options.image || (config.folder && config.folder.images) || 'images';
    this.refreshTime = options.refresh || 0;

    if (!fs.existsSync(imageFolder)) fs.mkdirSync(imageFolder);
    if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);

    Settings.getInstance().imageFolder = imageFolder;

    if (options.kafka) {
      this.sink = new KafkaSink();
    } else {
      this.sink = new FolderSink(dataFolder, imageFolder);
    }

    this.initialize(config.lcms.serverUrl, options.username || config.lcms.username, options.password);
  }

  initialize(serverUrl: string, username: string, password: string) {
    // Set up both web services.
    // activitiesWS.setUp(serverUrl, username, password);
    // drawingsWS.setUp(serverUrl, username, password);
    this.activitiesWS = new ActivityWebService(serverUrl, username, password);
    this.drawingsWS = new DrawingWebService(serverUrl, username, password);

    log('Loading activities from server ' + serverUrl + '\n');

    var success = (data: { ticket: Ticket, activities: Activity[] }) => {
      this.ticket = data.ticket;
      this.drawings = [];
      // Display the empty tree (that will be populated below)

      let exerciseFound = false;
      data.activities.forEach(a => {
        try {
          if (this.exercise && !exerciseFound && a.title.indexOf(this.exercise) >= 0) {
            log('\nLoading activity ' + a.title + ' ...\n');
            exerciseFound = true;
            this.loadDrawing(a);
          } else {
            log('Activity ' + a.title);
          }
        } catch (e) {
          // In case of error (e.g. if there are unsupported layers), alert the user
          if (a.title !== undefined) {
            error('Error when loading the activity ' + a.title + ': ' + e.message);
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

    // Failure call back that displays the HTTP error status to the user
    var failure = function (err) {
      error('Error while loading the activities list: ' + err.statusText);
    };

    /** Load the data using both call backs defined above.
     * Listing everything from the last 200 hours as an example.
     */
    var timestamp = Date.now() - 200 * 3600 * 1000;
    this.activitiesWS.loadData(success, failure, timestamp);
  }

  /**
   * This function is called by the success callback of the loadActivities function above.
   * It gets the data for the defined activity and reders it in the tree.
   */
  loadDrawing(activity: Activity) {
    // Success callback that renders the drawing into the tree.
    var success = (drawing: Drawing) => {
      let col = drawing.toGeoJSONCollection(this.ticket);
      // if (config.debugMode) {
      //   log(JSON.stringify(col, null, 2));
      // }
      this.sink.send(col);
      if (this.refreshTime) {
        setTimeout(() => this.loadDrawing(activity), this.refreshTime * 1000);
      } else {
        // Allow node some time to save the files to disk.
        setTimeout(() => process.exit(0), 3000);
      }
    };

    // Failure callback that displayes the HTTP error status to the user
    var failure = (error) => {
      log('Error when loading drawing: ' + error.statusText);
    };

    /** Load the drawing data using both callbacks and the activity id. */
    this.drawingsWS.loadData(success, failure, activity.activity_id);
  }

}
