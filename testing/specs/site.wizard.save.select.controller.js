/**
 * Created on 02.04.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");

describe('site.wizard.save.select.controller.spec: Saves site-data and selects a controller', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN wizard for new site is opened WHEN name typed and Save button has been pressed THEN controller selector should be available in no longer than 5 seconds`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site');
            let SITE = contentBuilder.buildSite(displayName, 'test site', [appConstant.APP_CONTENT_TYPES]);
            //1. Open new site-wizard:
            await studioUtils.doOpenSiteWizard();
            await contentWizard.typeData(SITE);
            //2. Press on 'Save' button:
            await contentWizard.waitAndClickOnSave();
            //3. Click on remove-icon and close the current notification message:
            await contentWizard.removeNotificationMessage();
            //4. switch to 'LiveEdit' and select the controller
            await contentWizard.selectPageDescriptor('Page');
            //The notification message should appear, because the site automatically saved after the selecting a page-controller.
            studioUtils.saveScreenshot("site_page_descriptor_selected1");
            let result = await contentWizard.waitForNotificationMessage();
            assert.equal(result, appConstant.itemSavedNotificationMessage(displayName), "Expected notification message should appear");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
