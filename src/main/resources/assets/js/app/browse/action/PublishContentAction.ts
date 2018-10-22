import {ContentPublishPromptEvent} from '../ContentPublishPromptEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class PublishContentAction extends Action {

    constructor(grid: ContentTreeGrid, includeChildItems: boolean = false) {
        super(i18n('action.publishMore'), 'ctrl+alt+p');
        this.setEnabled(false);
        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new ContentPublishPromptEvent(contents, includeChildItems).fire();
        });
    }
}
