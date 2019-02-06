import { AbstractWebService } from './abstract-web-service';
import { Drawings } from './drawings';

export class DrawingsWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/drawing/drawings';
  }

  public getRelevantData(data) {
    return Drawings.fromObject(data);
  }

  public loadData(successCall: Function, errorCall: Function, activityId: string, cookie?: string) {
    super.loadData(successCall, errorCall, { activity_id: activityId }, cookie);
  }

}
