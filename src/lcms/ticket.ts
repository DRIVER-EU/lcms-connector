export class Ticket {
  private static timeToLive = 36e5;

  constructor(private ticket: Ticket, private serverUrl: string, private activityWS, private createdOn?: number) {
    if (!createdOn) createdOn = Date.now();
  }

  public get isValid() {
    return this.createdOn + Ticket.timeToLive > Date.now();
  }

  public getTicket() {
    if (this.isValid) return this.ticket;
    let success = (data: { ticket: Ticket }) => {
      this.ticket = data.ticket.ticket;
      this.createdOn = data.ticket.createdOn;
      this.serverUrl = data.ticket.serverUrl;
    };
    let failure = () => { return; };
    return this.activityWS.loadData(success, failure, Date.now()), this.ticket;
  }

  public getServerUrl() {
    return this.serverUrl;
  }

  public getFullUrl(component: string) {
    let ticket = this.getTicket();
    let ticketUrl = ticket ? '&ticket=' + ticket : '';
    return this.serverUrl + '/mobilemapmeeting' + component + ticketUrl;
  }
}

/*
    var Ticket = function() {
        function Ticket(ticket, serverUrl, activityWS, createdOn) {
            this.ticket = ticket, this.serverUrl = serverUrl, this.activityWS = activityWS, this.createdOn = createdOn, void 0 === createdOn && (this.createdOn = Date.now())
        }
        return Ticket.prototype.isValid = function() {
            return this.createdOn + Ticket.timeToLive > Date.now()
        }, Ticket.prototype.getTicket = function() {
            var _this = this,
                ret = !0;
            if (this.isValid()) return this.ticket;
            var success = function(data) {
                    _this.ticket = data.ticket.ticket, _this.createdOn = data.ticket.createdOn, _this.serverUrl = data.ticket.getServerUrl()
                },
                failure = function() {
                    ret = void 0
                };
            return this.activityWS.loadData(success, failure, Date.now()), this.ticket
        }, Ticket.prototype.getServerUrl = function() {
            return this.serverUrl
        }, Ticket.prototype.getFullUrl = function(component) {
            var ticket = this.getTicket(),
                ticketUrl = ticket ? "&ticket=" + ticket : "";
            return this.serverUrl + "/mobilemapmeeting/" + component + ticketUrl
        }, Ticket.timeToLive = 36e5, Ticket

*/