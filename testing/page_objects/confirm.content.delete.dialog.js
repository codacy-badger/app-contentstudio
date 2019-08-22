/**
 * Created  on 20/01/2018
 */
const Page = require('./page');
const lib = require('../libs/elements');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ConfirmContentDeleteDialog')]`,
    confirmButton: `//button[contains(@id,'DialogButton') and child::span[text()='Confirm']]`,
    cancelButton: `//div[@class='dialog-buttons']//button/span[text()='Cancel']`,
};

class ConfirmContentDeleteDialog extends Page {

    get warningMessage() {
        return XPATH.container +
               `//div[contains(@id,'ModalDialogHeader')]//h6[text()='You are about to delete a site or multiple content items. This action cannot be undone.']`;
    }

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get confirmButton() {
        return XPATH.container + XPATH.confirmButton;
    }

    get numberInput() {
        return XPATH.container + lib.TEXT_INPUT;
    }

    async clickOnYesButton() {
        await this.waitForElementDisplayed(this.yesButton, appConst.TIMEOUT_2);
        await this.clickOnElement(this.yesButton);
        await this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_2)
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_3).catch(err => {
            throw new Error("Confirmation Content Deleting Dialog is not loaded " + err);
        })
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_3).catch(err => {
            throw new Error("Confirmation Content Deleting Dialog must be closed " + err);
        })
    }

    waitForConfirmButtonDisabled() {
        return this.waitForElementDisabled(this.confirmButton, appConst.TIMEOUT_3).catch(err => {
            throw new Error("Confirm button is not disabled in " + err);
        })
    }

    waitForCancelButtonEnabled() {
        return this.waitForElementEnabled(this.cancelButton, appConst.TIMEOUT_3).catch(err => {
            throw new Error("Confirm Delete Dialog - Cancel button is not enabled in " + err);
        })
    }

    isWarningMessageVisible() {
        return this.isElementDisplayed(this.warningMessage);
    }

    getWarningMessage() {
        return this.getText(this.warningMessage);
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnConfirmButton() {
        try {
            await this.waitForElementEnabled(this.confirmButton, appConst.TIMEOUT_2);
            await this.clickOnElement(this.confirmButton);
            //modal dialog closes:
            await this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_3);
            return await this.pause(1000);
        } catch (err) {
            this.saveScreenshot('err_confirmation_dialog');
            throw new Error('Confirmation dialog - Error when clicking on Confirm button.' + err);
        }
    }

    typeNumberOfContent(number) {
        return this.typeTextInInput(this.numberInput, number);
    }
};
module.exports = ConfirmContentDeleteDialog;