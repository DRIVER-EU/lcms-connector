import {AbstractWebService} from './abstract-web-service';
import * as puppeteer from 'puppeteer';

export class LoginWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string) {
    super(url, username, password);
  }

  public getServiceSpecificUrl() {
    return 'https://mijn.lcms.nl/gebruikersbeheer/#/login';
  }

  public getRelevantData(data: {cookie: string}) {
    return data.cookie;
  }

  public loadData(successCall: Function, errorCall: Function, msg) {
    this.loadDataAsync()
      .then(res => {
        successCall(this.getRelevantData(res));
      })
      .catch(err => {
        errorCall(err);
      });
  }

  public async loadDataAsync() {
    var cookie = {name: '', value: ''};
    try {
      console.log('Logging in on LCMS...');
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(this.getServiceSpecificUrl());
      const USERNAME_SELECTOR = '#ifvUsername';
      const PASSWORD_SELECTOR = '#ifvPassword';
      const BUTTON_SELECTOR = '#loginForm > button';
      await page.waitFor(USERNAME_SELECTOR);
      await page.click(USERNAME_SELECTOR);
      await page.keyboard.type(this.username);
      await page.click(PASSWORD_SELECTOR);
      await page.keyboard.type(this.password);
      await page.screenshot({path: 'images/login1.png'});
      await page.click(BUTTON_SELECTOR);
      await page.waitForNavigation();
      await page.screenshot({path: 'images/login2.png'});
      const DOMAIN_SELECTOR = '#all-domains > div.domain-box.ng-scope > div';
      await page.click(DOMAIN_SELECTOR);
      await page.waitForNavigation();
      await page.waitFor('#section-to-print table tr th');
      await page.waitFor(1000);
      await page.screenshot({path: 'images/login3.png'});
      const cookies: any[] = await page.cookies();
      console.log(JSON.stringify(cookies));
      cookie = cookies.find(c => c.name === 'JSESSIONID');
      await browser.close();
    } catch (err) {
      return err;
    }
    return {cookie: `${cookie.name}=${cookie.value};SLG_GWPT_Show_Hide_tmp=1; SLG_wptGlobTipTmp=1`};
  }
}
