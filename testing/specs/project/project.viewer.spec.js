/**
 * Created on 19.06.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');

describe('project.viewer.spec - ui-tests for user with Viewer role', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let TEST_FOLDER;
    let FOLDER_NAME = studioUtils.generateRandomName("folder");
    let USER;
    let PASSWORD = "1q2w3e";

    it(`Preconditions: new system user should be created`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName("viewer");
            let roles = [appConstant.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN SU is logged in AND new project wizard is opened WHEN existing user has been added as Viewer THEN expected user should be selected in Custom Access form",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioWithProjects();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();

            //2.Open new project wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Custom");
            //3. Select the user in Custom Read access :(users can read content)
            await projectWizard.selectUserInCustomReadAccess(USER.displayName);
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_viewer_1");
            //4. Verify that expected user is present in selected options:
            let customReadAccessItems = await projectWizard.getSelectedCustomReadAccessOptions();
            assert.equal(customReadAccessItems[0], USER.displayName, "expected user should be selected in Custom Read access form");
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("Precondition 2: ready for publishing folder should be created in the just created project",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            TEST_FOLDER = contentBuilder.buildFolder(FOLDER_NAME);
            //1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioWithProjects();
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);

            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN user with Viewer role is logged in WHEN existing project has been opened THEN all inputs should be disabled(not clickable)",
        async () => {
            //1. Do Log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2.Double click on the project:
            await settingsBrowsePanel.doubleClickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that the project is opened:
            await projectWizard.waitForLoaded();
            //4. Verify that all inputs in the project page are disabled for viewer:
            let isPageDisabled = await projectWizard.isNoModify();
            assert.isTrue(isPageDisabled, "Wizard page should be disabled for 'Viewer' role");
            let result = await projectWizard.isDescriptionInputClickable();
            assert.isFalse(result, "Description input should not be clickable");
            result = await projectWizard.isLocaleOptionsFilterInputClickable();
            assert.isFalse(result, "Locale input should not be clickable");
            result = await projectWizard.isDisplayNameInputClickable();
            assert.isFalse(result, "Display Name input should not be clickable");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN user with Viewer role is logged in WHEN existing project has been selected THEN New...,Edit, Delete buttons should be disabled",
        async () => {
            //1. Do log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2.Click(select) on existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that all button are disabled in the project-toolbar:
            studioUtils.saveScreenshot("project_viewer_1");
            await settingsBrowsePanel.waitForNewButtonDisabled();
            await settingsBrowsePanel.waitForEditButtonDisabled();
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN user with Viewer role is logged in WHEN required context is loaded THEN New... button should be disabled for Viewer role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do log in with the user-viewer and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            //2. Verify that 'New' button is disabled for users with Viewer role
            await contentBrowsePanel.waitForNewButtonDisabled();

            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    //Verify that 'Viewer' can not publish content:
    it("GIVEN user with 'Viewer' role is logged in WHEN existing folder has been selected THEN 'Publish' menu item should be disabled for users with Viewer role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do log in with the user-viewer and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //2. Select existing folder:
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            //3. Verify that Edit, New, Delete buttons are disabled:
            await contentBrowsePanel.waitForEditButtonDisabled();
            await contentBrowsePanel.waitForDeleteButtonDisabled();
            await contentBrowsePanel.waitForNewButtonDisabled();
            await contentBrowsePanel.waitForDuplicateButtonDisabled();
            //4. Open Publish Menu:
            await contentBrowsePanel.openPublishMenu();
            studioUtils.saveScreenshot("project_viewer_3");
            //5. Verify that 'Create Task' and 'Request Publishing' menu items are enabled for Viewer role:
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.CREATE_TASK);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.REQUEST_PUBLISH);
            //6. Verify that 'Publish' menu item is disabled:
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.PUBLISH);

            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });


    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
