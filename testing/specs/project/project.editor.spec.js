/**
 * Created on 15.06.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');

describe("project.editor.spec - ui-tests for an user with 'Editor' role", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let FOLDER_NAME = studioUtils.generateRandomName("folder");

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let USER;
    let PASSWORD = "1q2w3e";

    it(`Preconditions: new system user should be created`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName("editor");
            let roles = [appConstant.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN new project wizard is opened WHEN existing user has been added as Editor THEN expected user should be selected in Project Roles form",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();

            //2.Open new project wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Private");
            let result = await projectWizard.isDescriptionInputClickable();
            //3. Select the user in roles, assign Contributor role him:
            await projectWizard.selectProjectAccessRoles(USER.displayName);
            await projectWizard.updateUserAccessRole(USER.displayName, appConstant.PROJECT_ROLES.EDITOR);
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_editor_1");
            //4. Verify that expected user is present in selected options:
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems[0], USER.displayName, "expected user should be selected in Project Roles form");
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN user with Editor role is logged in WHEN existing project has been opened THEN all inputs should be disabled(not clickable)",
        async () => {
            //1. Do Log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2.Double click on the project:
            await settingsBrowsePanel.doubleClickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that the project is opened:
            await projectWizard.waitForLoaded();
            //4. Verify that all inputs in the project page are disabled for contributor:
            let isPageDisabled = await projectWizard.isNoModify();
            assert.isTrue(isPageDisabled, "Wizard page should be disabled for contributor");
            let result = await projectWizard.isDescriptionInputClickable();
            assert.isFalse(result, "Description input should not be clickable");
            result = await projectWizard.isLocaleOptionsFilterInputClickable();
            assert.isFalse(result, "Locale input should not be clickable");
            result = await projectWizard.isDisplayNameInputClickable();
            assert.isFalse(result, "Display Name input should not be clickable");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN user with Editor role is logged in WHEN existing project has been selected THEN New...,Edit, Delete buttons should be disabled",
        async () => {
            //1. Do log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2.Click(select) on existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that all button are disabled in the toolbar:
            await settingsBrowsePanel.waitForNewButtonDisabled();
            await settingsBrowsePanel.waitForEditButtonDisabled();
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            studioUtils.saveScreenshot("project_editor_1");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN user with Editor role is logged in WHEN required context is loaded THEN only New... button should be enabled for Editor role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            //1. Do log in with the user-editor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await contentBrowsePanel.waitForNewButtonEnabled();
            //2. Click on New... button
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            let items = await newContentDialog.getItems();
            studioUtils.saveScreenshot("project_editor_3");
            //3. Verify that only 'Folders' and 'Shortcut' are allowed for Editor role
            assert.equal(items.length, 2, "Two items should be available for Editor");
            assert.isTrue(items.includes("Folder"), "Folder is allowed for creating");
            assert.isTrue(items.includes("Shortcut"), "Shortcut is allowed for creating");

            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    //Verify that Editor can select a language:
    it("GIVEN user with Editor role is logged in WHEN new folder has been saved THEN Mark as Ready should be as default action in Publish Menu",
        async () => {
            let contentWizard = new ContentWizard();
            let settingsStepForm = new SettingsStepForm();
            //1. Do log in with the user-editor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            //2. Open folder-wizard and save new folder:
            await studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME);
            studioUtils.saveScreenshot("project_editor_4");
            await settingsStepForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot("project_editor_5");
            //3. Verify that 'Mark as Ready' button is available in the wizard:
            await contentWizard.waitForMarkAsReadyButtonVisible();

            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    //Verify that 'Editor' can publish content:
    it("GIVEN user with 'Editor' role is logged in WHEN existing folder(work in progress) has been published THEN the folder gets Published",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do log in with the user-editor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            //2. The folder has been 'Marked as ready' in browse panel:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            studioUtils.saveScreenshot("project_editor_6");
            //3. The folder has been published in browse panel:
            await studioUtils.doPublish();
            studioUtils.saveScreenshot("project_editor_7");
            await contentBrowsePanel.waitForNotificationMessage();
            //4. Verify that status of thr folder is Published:
            let status = await contentBrowsePanel.getContentStatus(FOLDER_NAME);
            assert.equal(status, appConstant.CONTENT_STATUS.PUBLISHED, "The folder should be 'Published'");
        });

    afterEach(async () => {
        let title = await webDriverHelper.browser.getTitle();
        if (title.includes("Content Studio") || title.includes("Users")) {
            return await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        }
    });

    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});