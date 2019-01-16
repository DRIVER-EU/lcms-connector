import { AbstractWebService } from './abstract-web-service';
import { Ticket } from './ticket';
import { Activity } from './activity';
import { Drawing } from './drawing';

export class DrawingWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/drawing/drawings';
  }

  public getRelevantData(data) {
    return Drawing.fromObject(data);
  }

  public loadData(successCall: Function, errorCall: Function, activityId: string) {
    super.loadData(successCall, errorCall, { activity_id: activityId });
  }

}
