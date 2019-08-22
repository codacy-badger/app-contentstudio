/**
 * Created on 09.07.2019.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const ImageFormPanel = require('../page_objects/wizardpanel/image.form.panel');
const ImagePhotoInfoFormPanel = require('../page_objects/wizardpanel/image.photoinfo.form.panel');
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');

describe("image.wizard.photo.properties.spec: Open an image and update photo properties then rollback the previous version",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'nord';

        // verifies https://github.com/enonic/app-contentstudio/issues/388  and https://github.com/enonic/app-contentstudio/issues/618
        //Image Wizard - some field values are not updated after version rollback
        it(`GIVEN existing image is opened(photo's date time is not specified) WHEN date time has been typed and saved AND rollback previous version THEN date time input should be empty in Photo form`,
            async () => {
                let imageFormPanel = new ImageFormPanel();
                let contentWizard = new ContentWizard();
                let imagePhotoInfoFormPanel = new ImagePhotoInfoFormPanel();
                let wizardDetailsPanel = new WizardDetailsPanel();
                //1. open existing image
                await studioUtils.selectContentAndOpenWizard(IMAGE_DISPLAY_NAME);
                await imageFormPanel.clickOnPhotoWizardStep();
                // 2. Type and save a date time in the input
                await imagePhotoInfoFormPanel.typeDateTime('2019-07-09 00:00');
                studioUtils.saveScreenshot("image_photo_date_time_saved");
                await imageFormPanel.pause(1000);
                await contentWizard.waitAndClickOnSave();

                //3. open Versions widget in wizard-details panel
                await contentWizard.openDetailsPanel();
                await wizardDetailsPanel.openVersionHistory();
                let wizardVersionsWidget = new WizardVersionsWidget();
                await wizardVersionsWidget.waitForVersionsLoaded();
                //4. Expand menu and restore the previous version
                await wizardVersionsWidget.clickAndExpandVersion(1);
                // click on 'Restore this version' button:
                await wizardVersionsWidget.clickOnRestoreButton();
                studioUtils.saveScreenshot("photo_form_date_time_rollback");
                let result = await imagePhotoInfoFormPanel.getDateTimeValue();
                assert.equal(result, "", "Date Time input should be empty after rollback the version");

                //Timeout waiting for 'Save' button is disabled. (exception will bw thrown when timeout expired)
                await contentWizard.waitForSaveButtonDisabled()
            });


        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
