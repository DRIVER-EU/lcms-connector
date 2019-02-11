import {ITestBedOptions} from 'node-test-bed-adapter';

/**
 * Configuration file
 *
 * @export
 * @interface IConfig
 */
export interface IConfig {
  /**
   * If true, show more debug output.
   *
   * @type {boolean}
   * @memberOf IConfig
   */
  debugMode?: boolean;
  /**
   * If set, refresh the data every 'refreshTime' seconds.
   *
   * @type {number}
   * @memberOf IConfig
   */
  refreshTime?: number;
  /**
   * LCMS connection settings
   *
   * @type {{
   *     username: string;
   *     serverUrl: string;
   *     path: string;
   *   }}
   * @memberOf IConfig
   */
  lcms: {
    /**
     * The LCMS username may be overriden on the command line
     *
     * @type {string}
     */
    username: string;
    /**
     * Location of the LCMS server
     *
     * @type {string}
     */
    serverUrl: string;
  };
  kafka?: {
    zookeeperUrl: string;
    clientID: string;
    topicPrefix: string;
    testbedOptions?: ITestBedOptions;
    plotTopic: string;
    capTopic: string;
  };
  folder?: {
    data: string;
    images: string;
  };
}
