import {AbstractWebService} from './abstract-web-service';
import {IEditViewContent} from './edit-view-content';

export class ActivityPostContentsWebService extends AbstractWebService {
  private activity: string = '';
  private field: string = '';

  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/gui/editfield';
  }

  public getRelevantData(data: IEditViewContent) {
    if (!data) {
      console.error('No data in response: ' + JSON.stringify(data));
      return null;
    }
    return {};
  }

  public setActivity(activity: string) {
    this.activity = activity;
  }

  public setField(field: string) {
    this.field = field;
  }

  public loadData(successCall: Function, errorCall: Function, msg: Object, cookie?: string) {
    super.loadData(successCall, errorCall, Object.assign(msg, {activityId: this.activity, fieldId: this.field, setActivityRead: true} as IEditViewContent), this.cookie, 'POST');
  }
}
