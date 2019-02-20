import {AbstractWebService} from './abstract-web-service';
import {IEditViewContent, IEditViewContentLock, IEditViewContentRelease} from './edit-view-content';
import * as request from 'request';
import {IField, ActivityViewContent} from './activity-view-content';
import {IActivityView} from './activity-view';
import {ActivityViewContentsWebService} from './activity-view-contents-web-service';

export class ActivityPostContentsWebService extends AbstractWebService {
  private activityViewContentsWS: ActivityViewContentsWebService;
  private activity: string = '';
  private views: Record<string, IActivityView> = {};
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
    this.activityViewContentsWS = new ActivityViewContentsWebService(url, username, password);
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

  public setViews(views: Record<string, IActivityView>) {
    this.views = Object.assign(this.views, views);
  }

  private getAddProperFieldUrl() {
    return this.serverUrl + '/gui/addproperfield';
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

  private getViewId(organisation: string) {
    if (this.views.hasOwnProperty(organisation)) {
      return this.views[organisation].id;
    } else {
      return undefined;
    }
  }

  private getFieldId(organisation: string) {
    if (this.fields.hasOwnProperty(organisation)) {
      return this.fields[organisation].id;
    } else {
      return undefined;
    }
  }

  public async createProperField(organisation: string, title: string) {
    return new Promise((resolve, reject) => {
      const newField = {
        activityId: this.activity,
        viewId: this.getViewId(organisation),
        fieldTitle: title,
        setActivityRead: false
      };
      this.options.body = JSON.stringify(newField);
      if (this.cookie) {
        Object.assign(this.options.headers, {Cookie: this.cookie});
      }
      const url = this.getAddProperFieldUrl();
      console.log(`Requesting '${url}' with cookie ${this.cookie}`);
      request(url, this.options, (error, res, body) => {
        if (error) return reject(error);
        resolve(body);
      });
    });
  }

  public updateFields(activityId: string, viewId: string) {
    return new Promise(async (resolve, reject) => {
      var success = (viewContent: ActivityViewContent) => {
        if (!viewContent || !viewContent.fields) return resolve();
        console.log('--Updated fields');
        this.setFields(
          viewContent.fields.reduce((prev: Record<string, IField>, curr: IField) => {
            prev[curr.screenTitle] = curr;
            return prev;
          }, {})
        );
        resolve();
      };
      var failure = (metadata: any) => {
        reject();
      };
      this.activityViewContentsWS.loadData(success, failure, {activityId: activityId, viewId: viewId, viewChangeData: {changedFieldsByUser: [], lastChangeTime: Date.now()}}, this.cookie);
    });
  }

  public async writeLCMSData(organisation: string, title: string, content: string) {
    return new Promise(async (resolve, reject) => {
      var fieldId = this.getFieldId(title);
      if (!fieldId) {
        await this.createProperField(organisation, title);
        await this.updateFields(this.activity, this.getViewId(organisation));
        console.warn(`Created fieldID for ${title}`);
        fieldId = this.getFieldId(title);
      } else {
        console.log(`USe existing fieldID for ${title}`);
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
