import {AbstractWebService} from './abstract-web-service';
import * as puppeteer from 'puppeteer';

export class LoginWebService extends AbstractWebService {
  constructor(protected url: string, protected username: string, protected password: string, protected profileKey: string) {
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
    const puppeteerOptions: any = {ignoreHTTPSErrors: true, headless: true, executablePath: process.env.CHROME_BIN || null, args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'], defaultViewport: {width: 1400, height: 900}};
    try {
      console.log('Logging in on LCMS...');
      const browser = await puppeteer.launch(puppeteerOptions);
      const page = await browser.newPage();
      await page.goto(this.getServiceSpecificUrl());
      const USERNAME_SELECTOR = '#ifvUsername';
      const PASSWORD_SELECTOR = '#ifvPassword';
      const BUTTON_SELECTOR = '#loginForm > button';
      await page.waitFor(USERNAME_SELECTOR);
      console.log(`Login - Fill in user credentials - ${this.username}:${this.password.length}`);
      await page.click(USERNAME_SELECTOR);
      await page.keyboard.type(this.username);
      await page.click(PASSWORD_SELECTOR);
      await page.keyboard.type(this.password);
      await page.screenshot({path: 'images/login1.png'});
      await page.click(BUTTON_SELECTOR);
      await page.waitForNavigation();
      await page.screenshot({path: 'images/login2.png'});
      console.log('Login - Select the VR-oefen omgeving');
      const DOMAIN_SELECTOR = '#all-domains > div.domain-box.ng-scope > div';
      await page.click(DOMAIN_SELECTOR);
      await page.waitForNavigation();
      await page.waitFor(3000);
      await page.screenshot({path: 'images/login2b.png'});
      // If the account has multiple profiles, select the organisation name
      console.log(page.url());
      if (page.url().indexOf('set_user_profile') >= 0) {
        await page.waitFor('#screen-user-profiles');
        await page.waitFor(500);
        await page.screenshot({path: 'images/login3.png'});
        const PROFILE_SELECTOR = this.profileKey;
        console.log(`Login - select user profile ${this.profileKey}`);
        const profileValues: string[] = await page.$$eval('table.ifv-table tbody tr', list => list.map(el => el.innerHTML));
        const profileIndex = 1 + profileValues.findIndex(el => el.indexOf(PROFILE_SELECTOR) >= 0);
        await page.click(`table.ifv-table tbody tr:nth-child(${profileIndex})`);
        await page.waitFor(500);
        await page.click('input[type="submit"]');
      }
      await page.waitFor('#section-to-print table tr th');
      console.log('Login - delay');
      await page.waitFor(4000);
      console.log('Login - Get the activities');
      await page.screenshot({path: 'images/login4.png'});
      const cookies: any[] = await page.cookies();
      console.log(JSON.stringify(cookies));
      cookie = cookies.find(c => c.name === 'JSESSIONID');
      console.log(`Login - Cookie: ${cookie.name}`);
      await browser.close();
      console.log(`Login - Browser closed`);
    } catch (err) {
      console.error(`Login - Err: ${err}`);
      return err;
    }
    return {cookie: `${cookie.name}=${cookie.value};SLG_GWPT_Show_Hide_tmp=1; SLG_wptGlobTipTmp=1`};
  }
}
