import {AbstractWebService} from './abstract-web-service';
import {Ticket} from './ticket';
import {ActivityMetadata} from './activity-metadata';

export class ActivityMetadataWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/gui/getactivitymetadata';
  }

  public getRelevantData(data: ActivityMetadata) {
    if (!data) {
      console.error('No views in response data: ' + JSON.stringify(data));
      return null;
    }
    return ActivityMetadata.fromObject(data);
  }

  public loadData(successCall: Function, errorCall: Function, msg: Object, cookie?: string) {
    super.loadData(successCall, errorCall, msg, cookie);
  }
}
