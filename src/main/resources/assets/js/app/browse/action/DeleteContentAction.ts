import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentDeletePromptEvent} from '../ContentDeletePromptEvent';
import {CompareStatus} from '../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class DeleteContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.deleteMore'), 'mod+del');
        this.setEnabled(false);
        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new ContentDeletePromptEvent(contents)
                .setNoCallback(null)
                .setYesCallback((exclude?: CompareStatus[]) => {

                    let excludeStatuses = exclude ? exclude : [CompareStatus.EQUAL, CompareStatus.NEWER, CompareStatus.MOVED,
                            CompareStatus.PENDING_DELETE, CompareStatus.OLDER];
                    let deselected = [];
                    grid.getSelectedDataList().forEach((content: ContentSummaryAndCompareStatus) => {
                        if (excludeStatuses.indexOf(content.getCompareStatus()) < 0) {
                            deselected.push(content.getId());
                        }
                    });
                grid.deselectNodes(deselected);
                }).fire();
        });
    }
}
