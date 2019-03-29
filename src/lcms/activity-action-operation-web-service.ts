import {AbstractWebService} from './abstract-web-service';
import * as request from 'request';
import {IField, ActivityViewContent} from './activity-view-content';
import {IActivityView} from './activity-view';
import {ActivityViewContentsWebService} from './activity-view-contents-web-service';
import {IActionOperation, ICreateActionOperationData, ICAPAction} from './action-operation';
import {IUserInfo, ICurrentProfile} from './user-info';

export class ActivityActionOperationWebService extends AbstractWebService {
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
    return this.serverUrl + '/action/actionmodule';
  }

  public getRelevantData(data: any) {
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

  private getUserInfoUrl() {
    return this.serverUrl + '/gui/getmyuserinfo';
  }

  private async postData(data: IActionOperation) {
    return new Promise<IActionOperation>((resolve, reject) => {
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

  public async getUserInfo(): Promise<IUserInfo> {
    return new Promise((resolve, reject) => {
      this.options.body = null;
      if (this.cookie) {
        Object.assign(this.options.headers, {Cookie: this.cookie});
      }
      const url = this.getUserInfoUrl();
      console.log(`Requesting '${url}' with cookie ${this.cookie}`);
      request(url, this.options, (error, res, body) => {
        if (error) return reject(error);
        resolve(JSON.parse(body));
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

  public async writeLCMSAction(organisation: string, content: string) {
    const parsedContent: ICAPAction = JSON.parse(content);
    return new Promise(async (resolve, reject) => {
      const userInfo: IUserInfo = await this.getUserInfo();
      const profile: ICurrentProfile = userInfo.currentProfile;
      const body: IActionOperation = {operation: 'CREATE_ACTION', data: {activityId: this.activity, description: parsedContent.description, summary: parsedContent.title, priority: parsedContent.priority, actionTaker: {disciplineId: profile.discipline.id, functionId: profile.function.id, teamId: profile.team.id, organizationId: profile.organization.id}}};
      this.postData(body)
        .then(data => {
          resolve();
        })
        .catch(err => reject(err));
    });
  }
}
