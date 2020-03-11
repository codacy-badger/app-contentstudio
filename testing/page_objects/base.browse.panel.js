/**
 * Created on 05/03/2020.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');

const XPATH = {};

class BaseBrowsePanel extends Page {

    waitForGridLoaded(ms) {
        return this.waitForElementDisplayed(lib.GRID_CANVAS, ms).then(() => {
            return this.waitForSpinnerNotVisible(ms);
        }).catch(err => {
            throw new Error('Browse panel was not loaded in ' + ms);
        });
    }

    hotKeyNew() {
        return this.getBrowser().keys(['Alt', 'n']);
    }


    hotKeyDelete() {
        return this.getBrowser().status().then(status => {
            if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
                return this.getBrowser().keys(['Control', 'Delete']);
            }
            if (status.os.name.toLowerCase().includes('mac')) {
                return this.getBrowser().keys(['Command', 'Delete']);
            }
        })
    }

    async hotKeyEdit() {
        let status = await this.getBrowser().status();
        if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
            await this.getBrowser().keys(['Control', 'e']);
            return await this.pause(500);
        }
        if (status.os.name.toLowerCase().includes('mac')) {
            await this.getBrowser().keys(['Command', 'e']);
            return await this.pause(500);
        }
    }

    clickOnSelectionControllerCheckbox() {
        return this.clickOnElement(this.selectionControllerCheckBox).catch(() => {
            this.saveScreenshot('err_click_on_selection_controller');
            throw new Error(`Error when clicking on Selection controller ` + err);
        });
    }

    //wait for the "Show Selection" icon in the toolbar
    async waitForSelectionTogglerVisible() {
        try {
            await this.waitForElementDisplayed(this.selectionPanelToggler, appConst.TIMEOUT_3);
            let attr = await this.getAttribute(this.selectionPanelToggler, 'class');
            return attr.includes('any-selected');
        } catch (err) {
            return false
        }
    }

    //gets list of content display names
    getDisplayNamesInGrid() {
        return this.getTextInElements(this.displayNames).catch(err => {
            this.saveScreenshot('err_get_display_name_grid');
            throw new Error(`Error when getting display names in grid` + err);
        });
    }

    waitForNewButtonDisabled() {
        return this.waitForElementDisabled(this.newButton, 3000).catch(err => {
            this.saveScreenshot('err_new_disabled_button');
            throw Error('New... button should be disabled, timeout: ' + 3000 + 'ms')
        })
    }

    //Wait for `New` button is visible
    waitForNewButtonVisible() {
        return this.waitForElementDisplayed(this.newButton, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot("err_new_project_button");
            throw new Error("New button is not visible! " + err);
        })
    }

    waitForNewButtonEnabled() {
        return this.waitForElementEnabled(this.newButton, 3000).catch(err => {
            this.saveScreenshot('err_new_button');
            throw new Error('New button is not enabled in : ' + err);
        })
    }

    isNewButtonEnabled() {
        return this.isElementEnabled(this.newButton);
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, 3000).catch(err => {
            this.saveScreenshot('err_delete_disabled_button');
            throw Error('Browse toolbar - Delete button should be disabled, timeout: ' + 3000 + 'ms')
        })
    }

    waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, 3000).catch(err => {
            this.saveScreenshot('err_delete_button');
            throw Error('Delete button is not enabled after ' + 3000 + 'ms')
        })
    }

    isDeleteButtonEnabled() {
        return this.isElementEnabled(this.deleteButton);
    }

    waitForEditButtonDisabled() {
        return this.waitForElementDisabled(this.editButton, 3000).catch(err => {
            this.saveScreenshot('err_edit_disabled_button');
            throw Error('Edit button should be disabled, timeout: ' + 3000 + 'ms')
        })
    }

    waitForEditButtonEnabled() {
        return this.waitForElementEnabled(this.editButton, appConst.TIMEOUT_5).catch(err => {
            this.saveScreenshot('err_edit_button');
            throw Error('Edit button is not enabled after ' + appConst.TIMEOUT_5 + 'ms')
        })
    }

    isEditButtonEnabled() {
        return this.isElementEnabled(this.editButton);
    }


    async clickOnNewButton() {
        await this.waitForNewButtonVisible();
        await this.pause(200);
        return await this.clickOnElement(this.newButton);
    }

    async clickOnEditButton() {
        try {
            await this.waitForElementEnabled(this.editButton, appConst.TIMEOUT_2);
            return await this.clickOnElement(this.editButton);
        } catch (err) {
            this.saveScreenshot('err_settings_edit_button');
            throw new Error('Browse Panel: Edit button is not enabled! ' + err);
        }
    }
};
module.exports = BaseBrowsePanel;


