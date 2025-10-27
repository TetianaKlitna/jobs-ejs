const puppeteer = require('puppeteer');
require('../app');
const { seed_db, testUserPassword } = require('../util/seed_db');
const Job = require('../models/Job');

let testUser = null;

let page = null;
let browser = null;
// Launch the browser and open a new blank page
describe('jobs-ejs puppeteer test', function () {
  before(async function () {
    this.timeout(10000);
    //await sleeper(5000)
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('http://localhost:3001');
  });
  after(async function () {
    this.timeout(5000);
    await browser.close();
  });
  describe('got to site', function () {
    it('should have completed a connection', async function () {});
  });
  describe('index page test', function () {
    this.timeout(10000);
    it('finds the index page logon link', async () => {
      this.logonLink = await page.waitForSelector(
        'a ::-p-text(Click this link to logon)'
      );
    });
    it('gets to the logon page', async () => {
      await this.logonLink.click();
      await page.waitForNavigation();
      const email = await page.waitForSelector('input[name="email"]');
    });
  });
  describe('logon page test', function () {
    this.timeout(20000);
    it('resolves all the fields', async () => {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector('button ::-p-text(Logon)');
    });
    it('sends the logon', async () => {
      testUser = await seed_db();
      await this.email.type(testUser.email);
      await this.password.type(testUserPassword);
      await this.submit.click();
      await page.waitForNavigation();
      await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
      await page.waitForSelector('a ::-p-text(change the secret)');
      await page.waitForSelector('a[href="/secretWord"]');
      const copyr = await page.waitForSelector('p ::-p-text(copyright)');
      const copyrText = await copyr.evaluate((el) => el.textContent);
      console.log('copyright text: ', copyrText);
    });
  });
  describe('puppeteer job operations', function () {
    this.timeout(50000);
    it('click jobs list link', async function () {
      const { expect } = await import('chai');
      await Promise.all([
        page.waitForNavigation(),
        page.click('a[href="/jobs"]'),
      ]);
      const content = await page.content();
      const jobsCnt = content.split('<tr').length - 1;
      expect(jobsCnt).to.equal(21); // 20 from db_seed + 1 added
    });
    it('click "add job" button', async function () {
      const { expect } = await import('chai');
      await Promise.all([
        page.waitForNavigation(),
        page.click('a[href="/jobs/new"]'),
      ]);
      const company = await page.waitForSelector('form input[name="company"]');
      const position = await page.waitForSelector(
        'form input[name="position"]'
      );
      const addBtn = await page.waitForSelector('#adding-job');
      expect(company).to.exist;
      expect(position).to.exist;
      expect(addBtn).to.exist;
    });
    it('click on the add submit button', async function () {
      const { expect } = await import('chai');
      await page.type('form input[name="company"]', 'Company');
      await page.type('form input[name="position"]', 'Position');
      await Promise.all([page.waitForNavigation(), page.click('#adding-job')]);
      const text = await page.content();
      expect(text).to.include('Job created successfully!');
      const job = await Job.findOne({
        company: 'Company',
        position: 'Position',
      });
      expect(job).to.exist;
    });
  });
});
