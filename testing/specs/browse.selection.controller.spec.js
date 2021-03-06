/**
 * Created on 15.05.2020.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentFilterPanel = require('../page_objects/browsepanel/content.filter.panel');

describe('Browse panel selection controller spec. Tests for Selection Controller checkBox and Show/Hide selection toggler', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;

    //Verifies: https://github.com/enonic/lib-admin-ui/issues/1266 Incorrect behavior of 'Show selection' when a single content is highlighted
    //          https://github.com/enonic/lib-admin-ui/issues/1201 Selection filter doesn't work when an item is highlighted in the Content Grid #1201
    it("GIVEN existing folder is highlighted WHEN highlighted row has been checked AND 'Show Selection' clicked THEN 'Selection Controller' checkbox gets selected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Click on the row :
            await contentBrowsePanel.clickOnRowByName(appConstant.TEST_FOLDER_NAME);
            //2. Click on checkbox in the highlighted row:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_NAME);
            //3. Click on Selection Toggle (circle, Show Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(500);
            //4. Verify that the grid is filtered:
            let displayNames = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(displayNames.length, 1, "Only one item should be present in the filtered grid");
            let result = await contentBrowsePanel.isSelectionControllerSelected();
            assert.isTrue(result, "Selection Controller checkBox should be selected");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/595  'Preview' button is enabled after 'selection controller' has been unchecked
    it("GIVEN Selection Controller checkbox is selected (All items are checked) WHEN Selection Controller checkbox has been unselected THEN 'Preview' button should be disabled AND 'New' is enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. 'Selection Controller' checkbox is selected (All items are checked):
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            //2. 'Selection Controller' checkbox has been unselected:
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await contentBrowsePanel.pause(1000);
            //3. Verify that 'Preview', Edit button are disabled:
            await contentBrowsePanel.waitForPreviewButtonDisabled();
            await contentBrowsePanel.waitForEditButtonDisabled();
            await contentBrowsePanel.waitForDeleteButtonDisabled();
            // New... button should be enabled
            await contentBrowsePanel.waitForNewButtonEnabled();
        });

    it("GIVEN 2 selected images in filtered grid WHEN Selection Toggle(Show Selection) has been clicked THEN 'Selection Controller' checkbox gets selected",
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.openFilterPanel();
            //1. Click on 'Image' checkbox in Filter Panel:
            await contentFilterPanel.clickOnCheckboxInAggregationView("Image");
            //2. Select 2 images:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName("book");
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName("cape");
            let isPartial = await contentBrowsePanel.waitForSelectionControllerPartial();
            assert.isTrue(isPartial, "Selection Controller checkbox shows that the selection is partial");
            //3. Click on Selection Toggle (circle, Show Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(1000);
            //4. Verify 'Selection Controller' checkBox is selected:
            studioUtils.saveScreenshot("selection_toggle_clicked_checkbox_selected");
            let result = await contentBrowsePanel.isSelectionControllerSelected();
            assert.isTrue(result, "Selection Controller checkBox should be selected");
        });

    it("WHEN 'Show Selection' and 'Hide Selection' sequentially clicked in filtered grid THEN 'Selection Controller' checkbox gets partial AND initial state of the grid is restored",
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.openFilterPanel();
            //1. Click on 'Image' checkbox in Filter Panel:
            await contentFilterPanel.clickOnCheckboxInAggregationView("Image");
            //2. Select 2 images:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName("book");
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName("cape");
            //3. Click on Selection Toggle (circle, Show Selection),grid gets filtered:
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(1000);
            //4. Click on Selection Toggle (circle, Hide Selection), initial state of thr grid is restored:
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(500);
            studioUtils.saveScreenshot("selection_toggle_checkbox_partial");
            //5. Verify 'Selection Controller' checkBox shows that the selection is partial:
            let result = await contentBrowsePanel.waitForSelectionControllerPartial();
            assert.isTrue(result, "'Selection Controller' shows that selection is partial");
        });

    //Verifies https://github.com/enonic/lib-admin-ui/issues/1287
    //selecting/deselecting hidden or collapsed nodes spawns error
    it("GIVEN 'Show Selection' and 'Hide Selection' sequentially clicked in filtered grid WHEN 'Selection Controller' checkbox has been clicked THEN the checkbox gets unselected",
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.openFilterPanel();
            //1. Click on 'Image' checkbox in Filter Panel:
            await contentFilterPanel.clickOnCheckboxInAggregationView("Image");
            //2. Select 2 images:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName("book");
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName("cape");
            //3. Click on Selection Toggle (circle, Show Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(1000);
            //4. Verify that only 2 images are present in  the grid
            let result1 = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result1.length, 2, "Two items should be present in the grid");
            //5. Click on 'Selection Toggle' (circle, Hide Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            studioUtils.saveScreenshot("selection_toggle_hide_selection");
            //6. Click on 'Selection Controller' checkbox:
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await contentBrowsePanel.pause(1000);
            //7. Verify that initial grid is loaded:
            studioUtils.saveScreenshot("selection_toggle_initial_grid_restored");
            let result2 = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.isAbove(result2.length, result1.length);
            //8. Verify that Selection Controller checkBox gets unselected:
            let isSelected = await contentBrowsePanel.isSelectionControllerSelected();
            assert.isFalse(isSelected, "Selection Controller checkbox should be unselected");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});