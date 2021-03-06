/**
 * Created on 12/2/2017.
 */
const LauncherPanel = require('../page_objects/launcher.panel');
const HomePage = require('../page_objects/home.page');
const LoginPage = require('../page_objects/login.page');
const BrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const FilterPanel = require("../page_objects/browsepanel/content.filter.panel");
const appConst = require("./app_const");
const lib = require("./elements");
const NewContentDialog = require('../page_objects/browsepanel/new.content.dialog');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const webDriverHelper = require("./WebDriverHelper");
const IssueListDialog = require('../page_objects/issue/issue.list.dialog');
const CreateTaskDialog = require('../page_objects/issue/create.task.dialog');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ConfirmContentDeleteDialog = require('../page_objects/confirm.content.delete.dialog');
const InsertLinkDialog = require('../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');
const BrowseDetailsPanel = require('../page_objects/browsepanel/detailspanel/browse.details.panel');
const BrowseDependenciesWidget = require('../page_objects/browsepanel/detailspanel/browse.dependencies.widget');
const ContentUnpublishDialog = require('../page_objects/content.unpublish.dialog');
const CreateRequestPublishDialog = require('../page_objects/issue/create.request.publish.dialog');
const ProjectSelectionDialog = require('../page_objects/project/project.selection.dialog');
const ProjectWizard = require('../page_objects/project/project.wizard.panel');
const SettingsBrowsePanel = require('../page_objects/project/settings.browse.panel');
const UserBrowsePanel = require('../page_objects/users/userbrowse.panel');
const UserWizard = require('../page_objects/users/user.wizard');
const NewPrincipalDialog = require('../page_objects/users/new.principal.dialog');
const PrincipalFilterPanel = require('../page_objects/users/principal.filter.panel');
const ConfirmationDialog = require('../page_objects/confirmation.dialog');

module.exports = {
    setTextInCKE: function (id, text) {
        let script = `CKEDITOR.instances['${id}'].setData('${text}')`;
        return webDriverHelper.browser.execute(script).then(() => {
            let script2 = `CKEDITOR.instances['${id}'].fire('change')`;
            return webDriverHelper.browser.execute(script2);
        })
    },
    async waitForElementDisplayed(selector, ms) {
        let element = await webDriverHelper.browser.$(selector);
        return await element.waitForDisplayed(ms);
    },
    async clickOnElement(selector) {
        let el = await webDriverHelper.browser.$(selector);
        await el.waitForDisplayed(1500);
        return await el.click();
    },
    async getText(selector) {
        let el = await webDriverHelper.browser.$(selector);
        await el.waitForDisplayed(1500);
        return await el.getText();
    },

    async isElementDisplayed(selector) {
        let el = await webDriverHelper.browser.$(selector);
        return await el.isDisplayed();
    },
    getPageSource() {
        return webDriverHelper.browser.getPageSource();
    },

    async switchToFrameBySrc(src) {
        try {
            let selector = `//iframe[contains(@src,'${src}')]`;
            let el = await webDriverHelper.browser.$(selector);
            await el.waitForDisplayed(1500);
            return await webDriverHelper.browser.switchToFrame(el);
        } catch (err) {
            throw new Error('Error when switch to frame  ' + err);
        }
    },
    getTitle() {
        return webDriverHelper.browser.getTitle();
    },

    getTextInCKE: function (id) {
        let script = `return CKEDITOR.instances['${id}'].getData()`;
        return webDriverHelper.browser.execute(script);
    },
    async insertUrlLinkInCke(text, url) {
        let insertLinkDialog = new InsertLinkDialog();
        await insertLinkDialog.typeText(text);
        await insertLinkDialog.typeUrl(url);
        await insertLinkDialog.clickOnInsertButtonAndWaitForClosed();
        return await webDriverHelper.browser.pause(500);
    },
    async insertDownloadLinkInCke(text, contentDisplayName) {
        let insertLinkDialog = new InsertLinkDialog();
        await insertLinkDialog.typeText(text);
        await insertLinkDialog.selectTargetInDownloadTab(contentDisplayName);
        this.saveScreenshot('download_link_dialog');
        await insertLinkDialog.clickOnInsertButton();
        return await insertLinkDialog.pause(700);
    },
    async insertEmailLinkInCke(text, email) {
        let insertLinkDialog = new InsertLinkDialog();
        await insertLinkDialog.typeText(text);
        await insertLinkDialog.fillEmailForm(email);
        this.saveScreenshot('email_link_dialog');
        await insertLinkDialog.clickOnInsertButton();
        return await insertLinkDialog.pause(700);
    },

    async insertContentLinkInCke(text, contentDisplayName) {
        let insertLinkDialog = new InsertLinkDialog();
        await insertLinkDialog.typeText(text);
        await insertLinkDialog.selectTargetInContentTab(contentDisplayName);
        this.saveScreenshot('content_link_dialog');
        await insertLinkDialog.clickOnInsertButton();
        return await insertLinkDialog.pause(700);
    },
    doCloseCurrentBrowserTab: function () {
        return webDriverHelper.browser.getTitle().then(title => {
            if (title != 'Enonic XP Home') {
                return webDriverHelper.browser.closeWindow();
            }
        })
    },
    async openIssuesListDialog() {
        let browsePanel = new BrowsePanel();
        let issueListDialog = new IssueListDialog();
        await browsePanel.clickOnShowIssuesListButton();
        await issueListDialog.waitForDialogOpened();
        return await issueListDialog.pause(300);
    },
    async openCreateTaskDialog() {
        try {
            let browsePanel = new BrowsePanel();
            let createTaskDialog = new CreateTaskDialog();
            let issueListDialog = new IssueListDialog();
            await browsePanel.clickOnShowIssuesListButton();
            await issueListDialog.waitForDialogOpened();
            await issueListDialog.clickOnNewTaskButton();
            return await createTaskDialog.waitForDialogLoaded();
        } catch (err) {
            throw new Error("Error when opening Create Task Dialog " + err);
        }
    },
    async createPublishRequest(text) {
        try {
            let browsePanel = new BrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            await browsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await createRequestPublishDialog.waitForDialogLoaded();
            await createRequestPublishDialog.pause(300);
            await createRequestPublishDialog.clickOnNextButton();
            await createRequestPublishDialog.typeInChangesInput(text);
            return await createRequestPublishDialog.clickOnCreateRequestButton();
        } catch (err) {
            throw new Error("Error when create Publish Request " + err);
        }
    },
    async openPublishMenuAndClickOnCreateTask() {
        let browsePanel = new BrowsePanel();
        let createTaskDialog = new CreateTaskDialog();
        await browsePanel.openPublishMenuAndClickOnCreateTask();
        return await createTaskDialog.waitForDialogLoaded();
    },
    async openBrowseDetailsPanel() {
        let browsePanel = new BrowsePanel();
        let browseDetailsPanel = new BrowseDetailsPanel();
        let result = await browseDetailsPanel.isPanelVisible();
        if (!result) {
            await browsePanel.clickOnDetailsPanelToggleButton();
        }
        await browseDetailsPanel.waitForDetailsPanelLoaded();
        await browsePanel.waitForSpinnerNotVisible(appConst.TIMEOUT_5);
        return await browsePanel.pause(1000);
    },
    async openContentWizard(contentType) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await browsePanel.waitForNewButtonEnabled(appConst.mediumTimeout);
        await browsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.clickOnContentType(contentType);
        //Switch to the new wizard:
        await this.doSwitchToNewWizard();
        return await contentWizardPanel.waitForOpened();
    },
    async selectAndOpenContentInWizard(contentName) {
        let contentWizardPanel = new ContentWizardPanel();
        let browsePanel = new BrowsePanel();
        await this.findAndSelectItem(contentName);
        await browsePanel.clickOnEditButton();
        await this.doSwitchToNewWizard();
        return await contentWizardPanel.waitForOpened();
    },

    async doAddShortcut(shortcut) {
        let contentWizardPanel = new ContentWizardPanel();
        //Open new shortcut-wizard:
        await this.openContentWizard(appConst.contentTypes.SHORTCUT);
        await contentWizardPanel.typeData(shortcut);
        await contentWizardPanel.waitAndClickOnSave();
        return await this.doCloseWizardAndSwitchToGrid();
    },
    async doAddReadyFolder(folder) {
        let contentWizardPanel = new ContentWizardPanel();
        await this.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizardPanel.typeData(folder);
        await contentWizardPanel.clickOnMarkAsReadyButton();
        await this.doCloseWizardAndSwitchToGrid()
        return await webDriverHelper.browser.pause(1000);
    },
    async doAddFolder(folder) {
        let contentWizardPanel = new ContentWizardPanel();
        //1. Open the folder-wizard:
        await this.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizardPanel.typeData(folder);
        //2. Save the folder:
        await contentWizardPanel.waitAndClickOnSave();
        //3.Close the wizard:
        await this.doCloseWizardAndSwitchToGrid()
        return await webDriverHelper.browser.pause(1000);
    },
    doCloseWizardAndSwitchToGrid: function () {
        return this.doCloseCurrentBrowserTab().then(() => {
            return this.doSwitchToContentBrowsePanel();
        });
    },
    async doAddSite(site) {
        let contentWizardPanel = new ContentWizardPanel();
        //1. Open new site-wizard:
        await this.openContentWizard(appConst.contentTypes.SITE);
        await contentWizardPanel.typeData(site);
        //2. Type the data and save:
        if (site.data.controller) {
            await contentWizardPanel.selectPageDescriptor(site.data.controller);
        } else {
            await contentWizardPanel.waitAndClickOnSave();
        }
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await webDriverHelper.browser.pause(1000);

    },
    async doAddReadySite(site) {
        let contentWizardPanel = new ContentWizardPanel();
        await this.openContentWizard(appConst.contentTypes.SITE);
        await contentWizardPanel.typeData(site);

        if (site.data.controller) {
            await contentWizardPanel.selectPageDescriptor(site.data.controller);
        } else {
            await contentWizardPanel.clickOnMarkAsReadyButton();
        }
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await webDriverHelper.browser.pause(1000);
    },
    doOpenSiteWizard: function () {
        return this.openContentWizard(appConst.contentTypes.SITE);
    },
    async doOpenPageTemplateWizard(siteName) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await this.typeNameInFilterPanel(siteName);
        await browsePanel.waitForContentDisplayed(siteName);
        await browsePanel.pause(300);
        await browsePanel.clickOnExpanderIcon(siteName);
        await browsePanel.clickCheckboxAndSelectRowByDisplayName('Templates');
        await browsePanel.clickOnNewButton();
        await newContentDialog.clickOnContentType(appConst.contentTypes.PAGE_TEMPLATE);
        await this.doSwitchToNewWizard();
        return await contentWizardPanel.waitForOpened();
    },

    async doAddPageTemplate(siteName, template) {
        let contentWizardPanel = new ContentWizardPanel();
        await this.doOpenPageTemplateWizard(siteName);
        await contentWizardPanel.typeData(template);
        //auto saving should be here:
        await contentWizardPanel.selectPageDescriptor(template.data.controllerDisplayName);
        this.saveScreenshot(template.displayName + '_created');
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await contentWizardPanel.pause(2000);
    },
    //Clicks on Publish button on the toolbar then clicks on Publish button in the dialog
    async doPublish() {
        let browsePanel = new BrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        await browsePanel.waitForPublishButtonVisible();
        await browsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },
    async doPublishTree() {
        let browsePanel = new BrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        await browsePanel.clickOnPublishTreeButton();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },
    async doPublishInWizard() {
        let contentPublishDialog = new ContentPublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        //1. Open Publish Content Dialog:
        await contentWizardPanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        //2. Click on Publish Now button:
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },

    async doUnPublishInWizard() {
        let contentUnpublishDialog = new ContentUnpublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        //1. Click on Unpublish menu item:
        await contentWizardPanel.clickOnUnpublishMenuItem();
        await contentUnpublishDialog.waitForDialogOpened();
        //2. Click on Unpublish button:
        await contentUnpublishDialog.clickOnUnpublishButton();
        return await contentUnpublishDialog.waitForDialogClosed();
    },

    async doAddArticleContent(siteName, article) {
        let contentWizardPanel = new ContentWizardPanel();
        //1. Select the site
        await this.findAndSelectItem(siteName);
        //2. Open article-wizard:
        await this.openContentWizard(article.contentType);
        //3.Type the data and save all
        await contentWizardPanel.typeData(article);
        await contentWizardPanel.waitAndClickOnSave();
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await webDriverHelper.browser.pause(1000);
    },

    async findAndSelectItem(name) {
        let browsePanel = new BrowsePanel();
        await this.typeNameInFilterPanel(name);
        await browsePanel.waitForRowByNameVisible(name);
        await browsePanel.pause(500);
        await browsePanel.clickOnRowByName(name);
        return await browsePanel.pause(400);
    },
    async findAndSelectContentByDisplayName(displayName) {
        let browsePanel = new BrowsePanel();
        await this.typeNameInFilterPanel(displayName);
        await browsePanel.waitForContentByDisplayNameVisible(displayName);
        return await browsePanel.clickOnRowByDisplayName(displayName);
    },
    //find the content, select it and 'Delete Now'
    async doDeleteContent(name) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        await this.findAndSelectItem(name);
        //Open modal dialog:
        await browsePanel.clickOnDeleteButton();
        await deleteContentDialog.waitForDialogOpened();
        //Click on 'Delete Now' button in the modal dialog:
        await deleteContentDialog.clickOnDeleteNowButton();
        return await deleteContentDialog.waitForDialogClosed();
    },
    async doDeleteContentByDisplayName(displayName) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        await this.findAndSelectContentByDisplayName(displayName);
        //Open modal dialog:
        await browsePanel.clickOnDeleteButton();
        await deleteContentDialog.waitForDialogOpened();
        //Click on 'Delete Now' button in the modal dialog:
        await deleteContentDialog.clickOnDeleteNowButton();
        return await deleteContentDialog.waitForDialogClosed();
    },
    async selectContentAndOpenWizard(name) {
        let browsePanel = new BrowsePanel();
        let contentWizardPanel = new ContentWizardPanel();
        await this.findAndSelectItem(name);
        return await this.doClickOnEditAndOpenContent(name);
    },
    async doClickOnEditAndOpenContent(name) {
        let browsePanel = new BrowsePanel();
        let contentWizardPanel = new ContentWizardPanel();
        await browsePanel.waitForEditButtonEnabled();
        await browsePanel.clickOnEditButton();
        //switch to the opened wizard:
        await this.doSwitchToNewWizard();
        return await contentWizardPanel.waitForOpened();
    },
    async findContentAndClickCheckBox(displayName) {
        let browsePanel = new BrowsePanel();
        await this.typeNameInFilterPanel(displayName);
        await browsePanel.waitForContentByDisplayNameVisible(displayName);
        return await browsePanel.clickCheckboxAndSelectRowByDisplayName(displayName);
    },
    async selectSiteAndOpenNewWizard(siteName, contentType) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await this.findAndSelectItem(siteName);
        await browsePanel.waitForNewButtonEnabled();
        await browsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.typeSearchText(contentType);
        await newContentDialog.clickOnContentType(contentType);
        await this.doSwitchToNewWizard();
        return await contentWizardPanel.waitForOpened();
    },
    //Open delete dialog, click on 'Delete Now' button then type a number to delete
    async doDeleteNowAndConfirm(numberOfContents) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        let confirmContentDeleteDialog = new ConfirmContentDeleteDialog();
        //1. Open Delete Content dialog:
        await browsePanel.clickOnDeleteButton();
        await deleteContentDialog.waitForDialogOpened();
        //2. Click on Delete Now button
        await deleteContentDialog.clickOnDeleteNowButton();
        //3. wait for Confirm dialog is loaded:
        await confirmContentDeleteDialog.waitForDialogOpened();
        //4. Type required number:
        await confirmContentDeleteDialog.typeNumberOfContent(numberOfContents);
        //Click on Confirm button:
        await confirmContentDeleteDialog.clickOnConfirmButton();
        return await deleteContentDialog.waitForDialogClosed();
    },
    async typeNameInFilterPanel(name) {
        try {
            let browsePanel = new BrowsePanel();
            let filterPanel = new FilterPanel();
            let result = await filterPanel.isPanelVisible();
            if (!result) {
                await browsePanel.clickOnSearchButton();
                await filterPanel.waitForOpened();
            }
            await filterPanel.typeSearchText(name);
            await browsePanel.waitForSpinnerNotVisible(appConst.TIMEOUT_5);
            return await browsePanel.pause(300);
        } catch (err) {
            this.saveScreenshot(appConst.generateRandomName('err_spinner'))
            throw new Error("Filter Panel-  error : " + err);
        }
    },

    async openFilterPanel() {
        try {
            let browsePanel = new BrowsePanel();
            let filterPanel = new FilterPanel();
            await browsePanel.clickOnSearchButton();
            return await filterPanel.waitForOpened();
        } catch (err) {
            throw new Error("Error when opening Filter Panel! " + err);
        }
    },

    async doLogout() {
        let launcherPanel = new LauncherPanel();
        let loginPage = new LoginPage();
        let isDisplayed = await launcherPanel.isPanelOpened();
        if (isDisplayed) {
            await launcherPanel.clickOnLogoutLink();
        }
        return await loginPage.waitForPageLoaded(appConst.mediumTimeout);
    },
    async navigateToContentStudioApp(userName, password) {
        try {
            await this.clickOnContentStudioLink(userName, password);
            return await this.doSwitchToContentBrowsePanel();
        } catch (err) {
            console.log('tried to navigate to Content Studio app, but: ' + err);
            this.saveScreenshot(appConst.generateRandomName("err_navigate_to_studio"));
            throw new Error('error when navigate to Content Studio app ' + err);
        }
    },
    async clickOnContentStudioLink(userName, password) {
        let launcherPanel = new LauncherPanel();
        let result = await launcherPanel.waitForPanelDisplayed(2000);
        console.log("Launcher Panel is opened, click on the `Content Studio` link...");
        if (result) {
            await launcherPanel.clickOnContentStudioLink(userName, password);
        } else {
            console.log("Login Page is opened, type a password and name...");
            return await this.doLoginAndClickOnContentStudio(userName, password);
        }
    },
    async navigateToContentStudioWithProjects(userName, password) {
        try {
            await this.clickOnContentStudioLink(userName, password);
            await webDriverHelper.browser.switchWindow("Content Studio - Enonic XP Admin");
            return await webDriverHelper.browser.pause(300);
        } catch (err) {
            this.saveScreenshot(appConst.generateRandomName("err_navigate_to_studio"));
            throw new Error('error when navigate to Content Studio app ' + err);
        }
    },
    //Clicks on Cancel button and switches to Default project
    async closeProjectSelectionDialog() {
        let projectSelectionDialog = new ProjectSelectionDialog();
        let isLoaded = await projectSelectionDialog.isDialogLoaded();
        if (isLoaded) {
            await projectSelectionDialog.clickOnCancelButtonTop();
            await projectSelectionDialog.waitForDialogClosed();
            return await webDriverHelper.browser.pause(200);
        }
    },
    async doLoginAndClickOnContentStudio(userName, password) {
        let loginPage = new LoginPage();
        await loginPage.doLogin(userName, password);
        let launcherPanel = new LauncherPanel();
        return await launcherPanel.clickOnContentStudioLink();

    },

    async doSwitchToContentBrowsePanel() {
        try {
            console.log('testUtils:switching to Content Browse panel...');
            let browsePanel = new BrowsePanel();
            await webDriverHelper.browser.switchWindow("Content Studio - Enonic XP Admin");
            console.log("switched to content browse panel...");
            return await browsePanel.waitForGridLoaded(appConst.longTimeout);
        } catch (err) {
            throw new Error("Error when switching to Content Studio App " + err);
        }
    },
    doSwitchToHome: function () {
        console.log('testUtils:switching to Home page...');
        return webDriverHelper.browser.switchWindow("Enonic XP Home").then(() => {
            console.log("switched to Home...");
        }).then(() => {
            let homePage = new HomePage();
            return homePage.waitForLoaded(appConst.mediumTimeout);
        });
    },
    async doCloseWindowTabAndSwitchToBrowsePanel() {
        await webDriverHelper.browser.closeWindow();
        return await this.doSwitchToContentBrowsePanel();
    },

    async saveAndCloseWizard() {
        let contentWizardPanel = new ContentWizardPanel();
        await contentWizardPanel.waitAndClickOnSave();
        await contentWizardPanel.pause(300);
        return await this.doCloseWindowTabAndSwitchToBrowsePanel();
    },

    async switchToContentTabWindow(contentDisplayName) {
        await webDriverHelper.browser.switchWindow(contentDisplayName);
        let contentWizardPanel = new ContentWizardPanel();
        return await contentWizardPanel.waitForSpinnerNotVisible();
    },
    doPressBackspace: function () {
        return webDriverHelper.browser.keys('\uE003');
    },
    doPressTabKey: function () {
        return webDriverHelper.browser.keys('Tab');
    },
    doPressEnter: function () {
        return webDriverHelper.browser.keys('Enter');
    },

    doSwitchToNewWizard: function () {
        console.log('testUtils:switching to the new wizard tab...');
        let contentWizardPanel = new ContentWizardPanel();
        return webDriverHelper.browser.getWindowHandles().then(tabs => {
            return webDriverHelper.browser.switchToWindow(tabs[tabs.length - 1]);
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        });
    },
    async doSwitchToNextTab() {
        let tabs = await webDriverHelper.browser.getWindowHandles();
        return await webDriverHelper.browser.switchToWindow(tabs[tabs.length - 1]);
    },
    doCloseAllWindowTabsAndSwitchToHome: function () {
        return webDriverHelper.browser.getWindowHandles().then(tabIds => {
            let result = Promise.resolve();
            tabIds.forEach(tabId => {
                result = result.then(() => {
                    return this.switchAndCheckTitle(tabId, "Enonic XP Home");
                }).then(result => {
                    if (!result) {
                        return webDriverHelper.browser.closeWindow().then(() => {
                            console.log(tabId + ' was closed');
                        }).catch(err => {
                            console.log(tabId + ' was not closed ' + err);
                        });
                    }
                });
            });
            return result;
        }).then(() => {
            return this.doSwitchToHome();
        });
    },
    switchAndCheckTitle: function (handle, reqTitle) {
        return webDriverHelper.browser.switchToWindow(handle).then(() => {
            return webDriverHelper.browser.getTitle().then(title => {
                return title.includes(reqTitle);
            }).catch(err => {
                console.log("Error when getting Title" + err);
                throw new Error("Error  " + err);
            })
        });
    },

    saveScreenshot: function (name) {
        let path = require('path');
        let screenshotsDir = path.join(__dirname, '/../build/screenshots/');
        return webDriverHelper.browser.saveScreenshot(screenshotsDir + name + '.png').then(() => {
            return console.log('screenshot saved ' + name);
        }).catch(err => {
            return console.log('screenshot was not saved ' + screenshotsDir + 'utils  ' + err);
        })
    },
    openDependencyWidgetInBrowsePanel: function () {
        let browsePanel = new BrowsePanel();
        let browseDependenciesWidget = new BrowseDependenciesWidget();
        return browsePanel.openDetailsPanel().then(() => {
            return browsePanel.openDependencies();
        }).then(() => {
            return browseDependenciesWidget.waitForWidgetLoaded();
        })
    },
    isStringEmpty(str) {
        return (!str || 0 === str.length);
    },
    sendRequestGetHeaders() {
        return webDriverHelper.browser.executeAsync(
            "var callback = arguments[arguments.length - 1];" +
            "var xhr = new XMLHttpRequest();" +
            "xhr.open('GET', '', true);" +
            "xhr.onreadystatechange = function() {" +
            "  if (xhr.readyState == 4) {" +
            "    callback(xhr.getAllResponseHeaders());" +
            "  }" +
            "};" +
            "xhr.send();");
    },
    async openAppModeSwitcher() {
        await this.clickOnElement(lib.APP_MODE_SWITCHER_TOGGLER);
        return await webDriverHelper.browser.pause(200);
    },
    async openSettingsPanel() {
        await this.openAppModeSwitcher();
        await this.clickOnElement(lib.SETTINGS_BUTTON);
        return await webDriverHelper.browser.pause(300);
    },
    async switchToContentMode() {
        await this.clickOnElement(lib.MODE_CONTENT_BUTTON);
        return await webDriverHelper.browser.pause(200);
    },
    generateRandomName: function (part) {
        return part + Math.round(Math.random() * 1000000);
    },
    async saveTestProject(name, description, language, principalsToAccess, accessMode) {
        let projectWizard = new ProjectWizard();
        let settingsBrowsePanel = new SettingsBrowsePanel();
        await settingsBrowsePanel.openProjectWizard();
        await projectWizard.typeDisplayName(name);
        await projectWizard.typeDescription(description);
        if (language) {
            await projectWizard.selectLanguage(language);
        }
        if (principalsToAccess) {
            await projectWizard.addPrincipalsInRolesForm(principalsToAccess);
        }
        if (accessMode) {
            await projectWizard.clickOnAccessModeRadio(accessMode);
        } else {
            await projectWizard.clickOnAccessModeRadio("Private");
        }
        await projectWizard.pause(400);
        await projectWizard.waitAndClickOnSave();
        await projectWizard.waitForNotificationMessage();
        await projectWizard.pause(700);
        await settingsBrowsePanel.clickOnCloseIcon(name);
        await projectWizard.waitForWizardClosed();
        return await settingsBrowsePanel.pause(500);
    },
    navigateToUsersApp: function (userName, password) {
        let launcherPanel = new LauncherPanel();
        return launcherPanel.waitForPanelDisplayed(3000).then(result => {
            if (result) {
                console.log("Launcher Panel is opened, click on the `Users` link...");
                return launcherPanel.clickOnUsersLink();
            } else {
                console.log("Login Page is opened, type a password and name...");
                return this.doLoginAndClickOnUsersLink(userName, password);
            }
        }).then(() => {
            return this.doSwitchToUsersApp();
        }).catch(err => {
            console.log('tried to navigate to Users app, but: ' + err);
            throw new Error('error when navigate to Users app ' + err);
        });
    },
    async doLoginAndClickOnUsersLink(userName, password) {
        let loginPage = new LoginPage();
        await loginPage.doLogin(userName, password);
        let launcherPanel = new LauncherPanel();
        await launcherPanel.clickOnUsersLink();
        return await loginPage.pause(1000);
    },
    doSwitchToUsersApp: function () {
        console.log('testUtils:switching to users app...');
        let browsePanel = new UserBrowsePanel();
        return webDriverHelper.browser.switchWindow("Users - Enonic XP Admin").then(() => {
            console.log("switched to Users app...");
            return browsePanel.waitForSpinnerNotVisible();
        }).then(() => {
            return browsePanel.waitForUsersGridLoaded(appConst.mediumTimeout);
        }).catch(err => {
            throw new Error("Error when switching to Users App " + err);
        })
    },
    async addSystemUser(userData) {
        let userWizard = new UserWizard();
        //1. Select System ID Provider folder:
        await this.clickOnSystemOpenUserWizard();
        //2. Type the data:
        await userWizard.typeData(userData);
        //3. Save the data and close the wizard:
        return await this.saveAndCloseUserWizard(userData.displayName);
    },
    async selectAndDeleteUserItem(name) {
        let userBrowsePanel = new UserBrowsePanel();
        let confirmationDialog = new ConfirmationDialog();
        await this.findAndSelectUserItem(name);
        await userBrowsePanel.waitForDeleteButtonEnabled();
        await userBrowsePanel.clickOnDeleteButton();
        await confirmationDialog.waitForDialogOpened();
        await confirmationDialog.clickOnYesButton();
        return await userBrowsePanel.waitForSpinnerNotVisible();
    },
    async typeNameInUserFilterPanel(name) {
        let browsePanel = new UserBrowsePanel();
        let filterPanel = new PrincipalFilterPanel();
        await browsePanel.clickOnSearchButton();
        await filterPanel.waitForOpened();
        await filterPanel.typeSearchText(name);
        await browsePanel.pause(300);
        return await browsePanel.waitForSpinnerNotVisible();
    },
    async findAndSelectUserItem(name) {
        let userBrowsePanel = new UserBrowsePanel();
        await this.typeNameInUserFilterPanel(name);
        await userBrowsePanel.pause(400);
        await userBrowsePanel.waitForRowByNameVisible(name);
        await userBrowsePanel.clickOnRowByName(name);
        return await userBrowsePanel.pause(800);
    },
    //Click on Save button and close the wizard:
    async saveAndCloseUserWizard(displayName) {
        let wizardPanel = new UserWizard();
        let browsePanel = new UserBrowsePanel();
        await wizardPanel.waitAndClickOnSave();
        await wizardPanel.waitForNotificationMessage();
        await wizardPanel.pause(700);
        //Click on Close icon and close the wizard:
        return await browsePanel.doClickOnCloseTabAndWaitGrid(displayName);
    },
    async clickOnSystemOpenUserWizard() {
        let browsePanel = new UserBrowsePanel();
        let userWizard = new UserWizard();
        let newPrincipalDialog = new NewPrincipalDialog();
        await browsePanel.clickOnRowByName('system');
        await browsePanel.waitForNewButtonEnabled();
        await browsePanel.clickOnNewButton();
        await newPrincipalDialog.clickOnItem('User');
        return await userWizard.waitForOpened();
    },
    async typeNameInUsersFilterPanel(name) {
        let browsePanel = new UserBrowsePanel();
        let principalFilterPanel = new PrincipalFilterPanel();
        await browsePanel.clickOnSearchButton();
        await principalFilterPanel.waitForOpened();
        await principalFilterPanel.typeSearchText(name);
        await browsePanel.pause(300);
        return await browsePanel.waitForSpinnerNotVisible();
    },
    async showLauncherPanel() {
        let launcherPanel = new LauncherPanel();
        let selector = "//button[contains(@class,'launcher-button') and child::span[contains(@class,'span-x')] ]";
        try {
            await this.waitUntilDisplayed(selector, 2000);
        } catch (err) {
            await webDriverHelper.browser.refresh();
            await webDriverHelper.browser.pause(2000);
            await this.closeProjectSelectionDialog();
            await this.waitUntilDisplayed(selector, 2000);
        }
        await webDriverHelper.browser.pause(100);
        let el = await this.getDisplayedElements(selector);
        await el[0].click();
        return await launcherPanel.waitForPanelDisplayed(1000);
    },
    async getDisplayedElements(selector) {
        let elements = await webDriverHelper.browser.$$(selector);
        let pr = elements.map(el => el.isDisplayed());
        return await Promise.all(pr).then(result => {
            return elements.filter((el, i) => result[i]);
        });
    },
    waitUntilDisplayed(selector, ms) {
        return webDriverHelper.browser.waitUntil(() => {
            return this.getDisplayedElements(selector).then(result => {
                return result.length > 0;
            })
        }, ms).catch(err => {
            this.saveScreenshot(appConst.generateRandomName("err_timeout"));
            throw new Error("Timeout exception. Element " + selector + " still not visible in: " + ms);
        });
    }
};
