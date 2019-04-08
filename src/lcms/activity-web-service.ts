import {AbstractWebService} from './abstract-web-service';
import {Activity} from './activity';

export class ActivityWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/gui/getactivities';
  }

  public getRelevantData(data: {activitieList: Activity[];}) {
    if (!data || !data.activitieList) {
      console.warn('No activityList present');
      return [];
    }
    data.activitieList = data.activitieList.map(a => {
      return Activity.fromObject(a);
    });
    return data.activitieList;
  }

  public loadData(successCall: Function, errorCall: Function, msg?: any, cookie?: string) {
    let timestamp = Date.now() - 1000 * 3600 * 1000;
    super.loadData(successCall, errorCall, msg, cookie);
  }
}
