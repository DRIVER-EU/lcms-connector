import * as request from 'request';

export class AbstractWebService {
  public cookie: string = '';
  protected serverUrl: string;
  protected options: request.CoreOptions = {
    encoding: 'utf8',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  };

  constructor(url: string, protected username: string, protected password: string) {
    this.setup(url, username, password);
  }

  public getServerUrl() {
    return this.serverUrl;
  }

  public loadData(successCall: Function, errorCall: Function, msg: Object, cookie?: string, type: string = 'POST') {
    let successCallback = response => {
      successCall(this.getRelevantData(response));
    };

    this.options.method = type;
    this.options.body = JSON.stringify(msg);
    if (cookie) {
      Object.assign(this.options.headers, {Cookie: cookie});
    }
    const url = this.getServiceSpecificUrl();
    console.log(`Requesting '${url}' with cookie ${cookie}`);
    request(url, this.options, (error, res, body) => {
      if (error) return errorCall(error);
      if (res.request.href === 'https://oefen-veiligheidsregio.lcms.nl/lcms/gui/login') {
        cookie = res.headers['set-cookie'].find(h => h.indexOf('JSESSIONID') > -1);
        console.log(`Storing cookie '${cookie}' from url ${res.request.href}`);
        successCallback({cookie: cookie});
        return;
      }
      successCallback(JSON.parse(body));
    });
  }

  protected getServiceSpecificUrl() {
    return this.serverUrl;
  }

  protected setup(url: string, username: string, password: string) {
    this.serverUrl = url;
  }

  protected getLocation(href: string) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return (
      match && {
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
      }
    );
  }

  public getRelevantData(data) {
    return data;
  }
}

/*
    var AbstractWebService = function() {
        function AbstractWebService(url, username, password) {
            void 0 !== url && this.setUp(url, username, password), $.support.cors = !0
        }
        return AbstractWebService.prototype.getServerUrl = function() {
            return this.serverUrl
        }, AbstractWebService.prototype.loadData = function(successCall, errorCall, msg) {
            var _this = this,
                successCallback = function(response) {
                    successCall(_this.getRelevantData(response))
                };
            $.ajax(this.prepareRequest(successCallback, errorCall, msg))
        }, AbstractWebService.prototype.setUp = function(url, username, password) {
            this.serverUrl = url, this.requestTmpl = {
                method: "POST",
                url: this.getServiceSpecificUrl(url),
                async: !1,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: {}
            }, void 0 !== username && (void 0 !== password ? this.requestTmpl.headers = {
                Authorization: "Basic " + $.base64.encode(username + ":" + password)
            } : this.requestTmpl.headers = {
                Authorization: "Basic " + $.base64.encode(username)
            })
        }, AbstractWebService.prototype.getServiceSpecificUrl = function(url) {
            return ""
        }, AbstractWebService.prototype.getRelevantData = function(data) {
            return data
        }, AbstractWebService.prototype.prepareRequest = function(success, error, data) {
            var request = this.requestTmpl;
            return request.data = JSON.stringify(data), request.success = success, request.error = error, request
        }, AbstractWebService

*/
