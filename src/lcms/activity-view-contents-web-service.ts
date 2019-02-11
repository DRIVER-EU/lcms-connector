import {AbstractWebService} from './abstract-web-service';
import {Ticket} from './ticket';
import {ActivityView} from './activity-view';

export class ActivityViewContentsWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/gui/getactivityview';
  }

  public getRelevantData(data: ActivityView) {
    if (!data || !data.viewCategory) {
      console.error('No views in response data: ' + JSON.stringify(data));
      return null;
    }
    return ActivityView.fromObject(data);
  }

  public loadData(successCall: Function, errorCall: Function, msg: Object, cookie?: string) {
    super.loadData(successCall, errorCall, msg, cookie);
  }
}
