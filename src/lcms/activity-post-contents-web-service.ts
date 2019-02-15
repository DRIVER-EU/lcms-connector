import {AbstractWebService} from './abstract-web-service';
import {IEditViewContent, IEditViewContentLock, IEditViewContentRelease} from './edit-view-content';
import * as request from 'request';

export class ActivityPostContentsWebService extends AbstractWebService {
  private activity: string = '';
  private field: string = '';
  protected options: request.CoreOptions = {
    method: 'POST',
    encoding: 'utf8',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  };

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

  private getLockRequestUrl() {
    return this.serverUrl + '/gui/requesteditlock';
  }

  private getLockReleaseUrl() {
    return this.serverUrl + '/gui/releaseeditlock';
  }

  private async requestLock() {
    return new Promise<any>((resolve, reject) => {
      const lock: IEditViewContentLock = {activityId: this.activity, fieldId: this.field, type: 'FIELD', longEdit: false};
      this.options.body = JSON.stringify(lock);
      if (this.cookie) {
        Object.assign(this.options.headers, {Cookie: this.cookie});
      }
      const url = this.getLockRequestUrl();
      console.log(`Requesting '${url}' with cookie ${this.cookie}`);
      request(url, this.options, (error, res, body) => {
        if (error) return reject(error);
        resolve(JSON.parse(body));
      });
    });
  }

  private async releaseLock() {
    return new Promise<any>((resolve, reject) => {
      const lock: IEditViewContentRelease = {activityId: this.activity, fieldId: this.field, type: 'FIELD'};
      this.options.body = JSON.stringify(lock);
      if (this.cookie) {
        Object.assign(this.options.headers, {Cookie: this.cookie});
      }
      const url = this.getLockReleaseUrl();
      console.log(`Requesting '${url}' with cookie ${this.cookie}`);
      request(url, this.options, (error, res, body) => {
        if (error) return reject(error);
        resolve(JSON.parse(body));
      });
    });
  }

  public loadData(successCall: Function, errorCall: Function, msg: Object, cookie?: string) {
    const body = Object.assign(msg, {activityId: this.activity, fieldId: this.field, setActivityRead: true} as IEditViewContent);
    const success = (data) => {
      this.releaseLock().then(() => successCall(body));
    };
    this.requestLock().then((status) => {
      super.loadData(success, errorCall, body, this.cookie, 'POST');
    });
  }
}
