/**
 * Created on 20/06/2018.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    toolbar: `//div[contains(@id,'ContentItemPreviewToolbar')]`,
    status: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status')]`,
    author: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'author')]`,
    issueMenuButton: `//div[contains(@id,'MenuButton')]`,
    issueMenuItemByName:
        name => `//ul[contains(@id,'Menu')]/li[contains(@id,'MenuItem')]/i[contains(.,'${name}')]`,

};
const contentItemPreviewPanel = Object.create(page, {

    issueDropdownHandle: {
        get: function () {
            return `${xpath.toolbar}` + `${xpath.issueMenuButton}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    contentStatus: {
        get: function () {
            return `${xpath.toolbar}${xpath.status}`;
        }
    },
    author: {
        get: function () {
            return `${xpath.toolbar}${xpath.author}`;
        }
    },
    waitForPanelVisible: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Content Item preview toolbar was not loaded in ' + appConst.TIMEOUT_2);
            });
        }
    },
    //wait for ContentItemPreviewToolbar is not visible
    waitForToolbarNotVisible: {
        value: function () {
            return this.waitForNotVisible(xpath.toolbar, appConst.TIMEOUT_3).catch(err => {
                throw new Error("Timeout exception: Item Preview Toolbar is visible in " + appConst.TIMEOUT_3);
            })
        }
    },
    clickOnIssueMenuDropDownHandle: {
        value: function () {
            return this.doClick(this.issueDropdownHandle).catch(err => {
                throw new Error('error when clicking on the dropdown handle ' + err);
            })
        }
    },

    waitForIssueDropDownHandleDisplayed: {
        value: function () {
            return this.waitForVisible(this.issueDropdownHandle, appConst.TIMEOUT_2).catch(err => {
                console.log("dropdown handle is not displayed ");
                return false;
            });
        }
    },
    clickOnIssueMenuItem: {
        value: function (issueName) {
            let selector = xpath.issueMenuItemByName(issueName);
            return this.waitForVisible(selector, appConst.TIMEOUT_3).catch((err) => {
                console.log('issue menu item is not present !  ' + issueName);
                throw new Error("Menu item was not found! " + issueName + "  " + err);
                this.saveScreenshot("err_issue_menu_item");
            }).then(() => {
                return this.doClick(selector);
            });
        }
    },
    waitForIssueMenuButtonNotVisible: {
        value: function () {
            return this.waitForNotVisible(`${xpath.toolbar}${xpath.issueMenuButton}`, appConst.TIMEOUT_3).catch(err => {
                console.log('issue menu button still visible in !  ' + appConst.TIMEOUT_3);
                return false;
            });
        }
    },
    clickOnIssueMenuButton: {
        value: function () {
            return this.waitForVisible(`${xpath.toolbar}${xpath.issueMenuButton}`, appConst.TIMEOUT_3).catch(err => {
                console.log("issue menu button was not found:");
                throw new Error('issue menu button was not found!  ');
            }).then(() => {
                return this.doClick(`${xpath.toolbar}${xpath.issueMenuButton}`);
            });
        }
    },
    getContentStatus: {
        value: function () {
            return this.getDisplayedElements(this.contentStatus).then(result => {
                return this.getBrowser().elementIdText(result[0].ELEMENT);
            }).then(result => {
                return result.value;
            }).catch(err => {
                this.saveScreenshot('err_contentitem_preview_toolbar_status');
                throw Error('Error when getting of content status. content item preview toolbar ');
            })
        }
    },
    getContentAuthor: {
        value: function () {
            return this.getDisplayedElements(this.author).then(result => {
                return this.getBrowser().elementIdText(result[0].ELEMENT);
            }).then(result => {
                return result.value;
            }).catch(err => {
                this.saveScreenshot('err_contentitem_preview_toolbar_author');
                throw Error('Error when getting of author for content. content item preview toolbar ');
            })
        }
    },
    getIssueNameOnMenuButton: {
        value: function () {
            let selector = `${xpath.toolbar}${xpath.issueMenuButton}` + '//span/i';
            return this.getText(selector);
        }
    }
});
module.exports = contentItemPreviewPanel;


