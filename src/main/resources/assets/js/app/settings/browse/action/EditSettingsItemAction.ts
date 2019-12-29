import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {SettingsItem} from '../../data/SettingsItem';
import {EditSettingsItemEvent} from '../../event/EditSettingsItemEvent';

export class EditSettingsItemAction
    extends Action {

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('action.edit'), 'mod+alt+n');
        // this.setEnabled(false);
        this.onExecuted(() => {
            const items: SettingsItem[] = grid.getSelectedDataList();
            new EditSettingsItemEvent(items).fire();
        });
    }
}
