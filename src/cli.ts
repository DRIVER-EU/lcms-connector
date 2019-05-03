import { Server } from './server';

const commandLineArgs = require('command-line-args');

export interface ICommandLineOptions {
  /**
   * Show help information.
   * 
   * @type {boolean}
   * @memberOf ICommandLineOptions
   */
  help: boolean;
  /**
   * Optional username, overrides the one in config.json
   * 
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  username: string;
  /**
   * Password for the LCMS service.
   * 
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  password: string;
  /**
   * The name of the exercise
   * 
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  exercise: string;
  /**
   * Save the GeoJSON files to a folder (default data). 
   * 
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  folder: string;
  /**
   * Image output folder
   * 
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  image: string;
  /**
   * Use the Kafka connector to push the data to Kafka (in which case, no files are saved to the folder)
   * 
   * @type {boolean}
   * @memberOf ICommandLineOptions
   */
  kafka: boolean;
  /**
   * Refresh time in seconds
   * 
   * @type {number}
   * @memberOf ICommandLineOptions
   */
  refresh: number;
  /**
   * Use the debug mode
   * 
   * @type {boolean}
   * @memberOf ICommandLineOptions
   */
  debug: boolean;
  /**
   * Use the server mode
   * 
   * @type {boolean}
   * @memberOf ICommandLineOptions
   */
  server: boolean;
}

export class CommandLineInterface {
  static optionDefinitions = [
    { name: 'help', alias: '?', type: Boolean, multiple: false, typeLabel: 'Help', description: 'Display help information.' },
    { name: 'kafka', alias: 'k', type: Boolean, multiple: false, typeLabel: 'Use Kafka', description: 'Send output to Kafka.' },
    { name: 'refresh', alias: 'r', type: Number, multiple: false, typeLabel: 'Refresh time', description: 'Refresh time in seconds (default 0 = no refresh).' },
    {
      name: 'exercise', alias: 'e', type: String, multiple: false, typeLabel: 'Name of the selected exercise',
      description: 'Only load the data from the selected exercise. If omitted, show active exercises. Case sensitive.'
    },
    { name: 'folder', alias: 'f', type: String, multiple: false, typeLabel: 'Output folder', description: 'For saving the GeoJSON files (default ./data).' },
    { name: 'image', alias: 'i', type: String, multiple: false, typeLabel: 'Image folder', description: 'For saving the image files (default ./images).' },
    { name: 'username', alias: 'u', type: String, multiple: false, typeLabel: 'Username', description: 'If given, overrides the name specified in config.json.' },
    { name: 'password', alias: 'p', type: String, multiple: false, typeLabel: 'Password', description: 'LCMS password for the user (as specified in config.json).' },
    { name: 'debug', alias: 'd', type: Boolean, multiple: false, typeLabel: 'Use debug mode', description: 'Write debug output to files.' },
    { name: 'server', alias: 's', type: Boolean, multiple: false, typeLabel: 'Start server mode', description: 'If true, start tool in server mode. Otherwise, send the LCMS information once, then quit.' }
  ];

  static sections = [{
    header: 'LCMS connector',
    content: 'Connect to the Dutch LCMS (Landelijk Crisis Management System) and save each plot layer as a GeoJSON file or publish it to Apache Kafka.'
  }, {
    header: 'Options',
    optionList: CommandLineInterface.optionDefinitions
  }, {
    header: 'Example',
    content: `Save the GeoJSON every minute to the folder './data':
    >> lcms_connector -p YOUR_PASSWORD -e "Excercise name" -r 60 -f data
    
    Send the data every minute to Kafka (using the details in config.json):
    >> lcms_connector -p YOUR_PASSWORD -e "Excercise name" -r 60 -k`
  }];
}

let options: ICommandLineOptions = commandLineArgs(CommandLineInterface.optionDefinitions);
options.password = process.env.LCMS_CONNECTOR_PASSWORD || options.password;
options.exercise = process.env.LCMS_CONNECTOR_EXCERCISE || options.exercise;

if (options.help || !options.password || !options.exercise) {
  const getUsage = require('command-line-usage');
  const usage = getUsage(CommandLineInterface.sections);
  console.log(usage);
  process.exit(1);
}

if (!options || typeof options !== 'object') options = <ICommandLineOptions>{};

const server = new Server(options);
