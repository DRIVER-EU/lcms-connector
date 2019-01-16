import { AbstractWebService } from './abstract-web-service';
import { Ticket } from './ticket';
import { Activity } from './activity';

export class ActivityWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return this.serverUrl + '/drawing/activities';
  }

  public getRelevantData(data: { activities: Activity[], ticket: Ticket }) {
    data.activities = data.activities.map(a => {
      return Activity.fromObject(a);
    });
    data.ticket = new Ticket(data.ticket, this.getServerUrl(), this);
    return data;
  }

  public loadData(successCall: Function, errorCall: Function, msg) {
    let timestamp = Date.now() - 200 * 3600 * 1000;
    super.loadData(successCall, errorCall, { active_after: timestamp });
  }
}

/*
    var ActivityWebService = function(_super) {
        function ActivityWebService() {
            _super.apply(this, arguments)
        }
        return __extends(ActivityWebService, _super), ActivityWebService.prototype.getServiceSpecificUrl = function(url) {
            return url + "/drawing/activities"
        }, ActivityWebService.prototype.getRelevantData = function(data) {
            return data.activities = $.map(data.activities, function(a) {
                return LCMS.Activity.fromObject(a)
            }), data.ticket = new LCMS.Ticket(data.ticket, this.getServerUrl(), this), data
        }, ActivityWebService.prototype.prepareRequest = function(success, error, data) {
            var time = 0;
            return void 0 !== data && (time = data), _super.prototype.prepareRequest.call(this, success, error, {
                active_after: time
            })
        }, ActivityWebService
    }(LCMS.AbstractWebService);
    LCMS.ActivityWebService = ActivityWebService

*/
