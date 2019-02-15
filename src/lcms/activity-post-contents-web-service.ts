import {AbstractWebService} from './abstract-web-service';
import {IEditViewContent, IEditViewContentLock, IEditViewContentRelease} from './edit-view-content';
import * as request from 'request';
import {IField} from './activity-view-content';

export class ActivityPostContentsWebService extends AbstractWebService {
  private activity: string = '';
  private fields: Record<string, IField> = {};
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

  public setFields(fields: Record<string, IField>) {
    this.fields = Object.assign(this.fields, fields);
  }

  private getLockRequestUrl() {
    return this.serverUrl + '/gui/requesteditlock';
  }

  private getLockReleaseUrl() {
    return this.serverUrl + '/gui/releaseeditlock';
  }

  private async requestLock(data: IEditViewContent) {
    return new Promise<IEditViewContent>((resolve, reject) => {
      const lock: IEditViewContentLock = {activityId: data.activityId, fieldId: data.fieldId, type: 'FIELD', longEdit: false};
      this.options.body = JSON.stringify(lock);
      if (this.cookie) {
        Object.assign(this.options.headers, {Cookie: this.cookie});
      }
      const url = this.getLockRequestUrl();
      console.log(`Requesting '${url}' with cookie ${this.cookie}`);
      request(url, this.options, (error, res, body) => {
        if (error) return reject(error);
        resolve(data);
      });
    });
  }

  private async releaseLock(data: IEditViewContent) {
    return new Promise<IEditViewContent>((resolve, reject) => {
      const lock: IEditViewContentRelease = {activityId: data.activityId, fieldId: data.fieldId, type: 'FIELD'};
      this.options.body = JSON.stringify(lock);
      if (this.cookie) {
        Object.assign(this.options.headers, {Cookie: this.cookie});
      }
      const url = this.getLockReleaseUrl();
      console.log(`Requesting '${url}' with cookie ${this.cookie}`);
      request(url, this.options, (error, res, body) => {
        if (error) return reject(error);
        resolve(data);
      });
    });
  }

  private async postData(data: IEditViewContent) {
    return new Promise<IEditViewContent>((resolve, reject) => {
      this.options.body = JSON.stringify(data);
      if (this.cookie) {
        Object.assign(this.options.headers, {Cookie: this.cookie});
      }
      const url = this.getServiceSpecificUrl();
      console.log(`Requesting '${url}' with cookie ${this.cookie}`);
      request(url, this.options, (error, res, body) => {
        if (error) return reject(error);
        resolve(data);
      });
    });
  }

  private getFieldId(organisation: string) {
    if (this.fields.hasOwnProperty(organisation)) {
      return this.fields[organisation].id;
    } else {
      return undefined;
    }
  }

  public async writeLCMSData(organisation: string, content: string) {
    return new Promise((resolve, reject) => {
      const fieldId = this.getFieldId(organisation);
      if (!fieldId) {
        return console.warn(`Could not find fieldID for ${organisation}`);
      }
      const body: IEditViewContent = {newContents: content, activityId: this.activity, fieldId: fieldId, setActivityRead: true, longEdit: false, attachments: [], type: 'FIELD'};
      this.requestLock(body)
        .then(data => {
          this.postData(data)
            .then(data => {
              this.releaseLock(data)
                .then(() => {
                  resolve();
                })
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }
}
