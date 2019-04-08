import {AbstractWebService} from './abstract-web-service';
import {Ticket} from './ticket';
import {ActivityView} from './activity-view';

export class ActivityViewsWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/gui/getactivityviewsmetadata';
  }

  public getRelevantData(data: {views: ActivityView[]; ticket: Ticket}) {
    if (!data || !data.views) {
      console.error('No views in response data: ' + JSON.stringify(data));
      return null;
    }
    console.log(`# views before: ${data.views.length}`);
    data.views = data.views.filter(b => {
      return b.visible;
    }).map(a => {
      return ActivityView.fromObject(a);
    });
    console.log(`# views after: ${data.views.length}`);
    return data;
  }

  public loadData(successCall: Function, errorCall: Function, msg: Object, cookie?: string) {
    super.loadData(successCall, errorCall, msg, cookie);
  }
}
