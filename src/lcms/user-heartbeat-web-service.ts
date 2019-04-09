import {AbstractWebService} from './abstract-web-service';

export class UserHeartbeatWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/gui/getuserupdate';
  }

  public getRelevantData(data: {time: string | number; activity: any}) {
    if (!data || !data.time) {
      console.error('No time in response data: ' + JSON.stringify(data));
      return null;
    }
    console.log('User heartbeat at ' + data.time);
    return data;
  }

  public loadData(successCall: Function, errorCall: Function, msg?: Object, cookie?: string) {
    msg = {userUpdateType: ["TIME"]};
    super.loadData(successCall, errorCall, msg, cookie);
  }
}
