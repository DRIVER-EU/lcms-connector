import {AbstractWebService} from './abstract-web-service';
import * as request from 'request';
import {IField, ActivityViewContent} from './activity-view-content';
import {IActivityView} from './activity-view';
import {ActivityViewContentsWebService} from './activity-view-contents-web-service';
import {IActionOperation, ICreateActionOperationData, ICAPAction} from './action-operation';
import {IUserInfo, ICurrentProfile} from './user-info';
import * as bluebird from 'bluebird';
import {findDisciplineId, findOrganizationId, findTeamId, findFunctionId} from '../models/lcms';

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

  public async writeLCMSActions(organisation: string, content: string) {
    const parsedContent: ICAPAction | ICAPAction[] = JSON.parse(content);
    if (!parsedContent) {
      return new Promise(async (resolve, reject) => {
        reject('No content found in action message');
      });
    }
    const actionArray: ICAPAction[] = Array.isArray(parsedContent) ? parsedContent : [parsedContent];
    return new Promise(async (resolve, reject) => {
      bluebird
        .each(actionArray, async action => {
          await this.writeLCMSAction(action);
        })
        .then(() => {
          console.log(`Sent ${actionArray.length} actions to LCMS`);
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  public async writeLCMSAction(capAction: ICAPAction) {
    return new Promise(async (resolve, reject) => {
      const userInfo: IUserInfo = await this.getUserInfo();
      const profile: ICurrentProfile = userInfo.currentProfile;
      const body: IActionOperation = {
        operation: 'CREATE_ACTION',
        data: {
          activityId: this.activity,
          description: capAction.description,
          summary: capAction.title,
          priority: capAction.priority,
          actionTaker: {
            disciplineId: findDisciplineId(capAction.discipline) || profile.discipline.id,
            functionId: findFunctionId(capAction.function) || profile.function.id,
            teamId: findTeamId(capAction.team) || profile.team.id,
            organizationId: findOrganizationId(capAction.organisation) || profile.organization.id
          }
        }
      };
      this.postData(body)
        .then((data) => {
          console.log(`Added action ${JSON.stringify(data || {})} to LCMS`);
          resolve();
        })
        .catch(err => {
          console.warn(`Cannot send action ${JSON.stringify(body)} to LCMS`);
          reject(err);
        });
    });
  }
}
