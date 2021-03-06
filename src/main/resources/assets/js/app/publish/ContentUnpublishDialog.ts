import * as Q from 'q';
import {showError} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentUnpublishPromptEvent} from '../browse/ContentUnpublishPromptEvent';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {UnpublishContentRequest} from '../resource/UnpublishContentRequest';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {Action} from 'lib-admin-ui/ui/Action';
import {BEl} from 'lib-admin-ui/dom/BEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';

export class ContentUnpublishDialog
    extends DependantItemsWithProgressDialog {

    constructor() {
        super(<DependantItemsWithProgressDialogConfig> {
                title: i18n('dialog.unpublish'),
                class: 'unpublish-dialog',
                dialogSubName: i18n('dialog.unpublish.subname'),
                dependantsName: i18n('dialog.showDependants'),
                dependantsDescription: i18n('dialog.unpublish.dependants'),
                processingLabel: `${i18n('field.progress.unpublishing')}...`,
                processHandler: () => {
                    new ContentUnpublishPromptEvent([]).fire();
                },
            }
        );
        // Sub title uses html decorated text, that can't be passed into the super config
        this.useDefaultSubTitle();
    }

    protected initElements() {
        super.initElements();

        this.actionButton = this.addAction(new ContentUnpublishDialogAction(), true, true);
    }

    protected postInitElements() {
        this.lockControls();
    }

    protected initListeners() {
        super.initListeners();

        this.actionButton.getAction().onExecuted(this.doUnpublish.bind(this));

        this.getItemList().onItemsRemoved(() => {
            if (!this.isIgnoreItemsChanged()) {
                this.reloadUnpublishDependencies().done();
            }
        });

        this.onProgressComplete(() => {
            this.useDefaultSubTitle();
        });
    }

    private useDefaultSubTitle() {
        this.setSubTitleChildren([
            BEl.fromText(i18n('dialog.unpublish.subname')),
            SpanEl.fromText(i18n('dialog.unpublish.subname.description'))
        ]);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    open() {
        this.reloadUnpublishDependencies().then(() => {
            this.updateTabbable();
            this.getButtonRow().focusDefaultAction();
        });

        super.open();
    }

    private reloadUnpublishDependencies(): Q.Promise<void> {
        if (this.isProgressBarEnabled()) {
            return Q<void>(null);
        }

        this.showLoadMask();

        this.getDependantList().clearItems();
        this.lockControls();

        return this.loadDescendantIds([CompareStatus.EQUAL, CompareStatus.NEWER, CompareStatus.PENDING_DELETE]).then(() => {
            return this.loadDescendants(0, 20).then((items: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(items);

                // do not set requested contents as they are never going to change

                this.unlockControls();
            }).finally(() => {
                this.hideLoadMask();
                return Q(null);
            });
        });

    }

    private filterUnpublishableItems(items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] {
        return items.filter(item => {
            let status = item.getCompareStatus();
            return status === CompareStatus.EQUAL || status === CompareStatus.NEWER || status === CompareStatus.PENDING_DELETE ||
                   status === CompareStatus.OLDER;
        });
    }

    setDependantItems(items: ContentSummaryAndCompareStatus[]) {
        super.setDependantItems(this.filterUnpublishableItems(items));

        this.updateButtonCount(i18n('action.unpublish'), this.countTotal());
    }

    addDependantItems(items: ContentSummaryAndCompareStatus[]) {
        super.addDependantItems(this.filterUnpublishableItems(items));

        this.updateButtonCount(i18n('action.unpublish'), this.countTotal());
    }

    setContentToUnpublish(contents: ContentSummaryAndCompareStatus[]) {
        this.setIgnoreItemsChanged(true);
        this.setListItems(this.filterUnpublishableItems(contents));
        this.setIgnoreItemsChanged(false);
        return this;
    }

    private getContentToUnpublishIds(): ContentId[] {
        return this.getItemList().getItems().map(item => {
            return item.getContentId();
        });
    }

    private doUnpublish() {

        this.lockControls();

        this.setSubTitle(i18n('dialog.unpublish.beingUnpublished', this.countTotal()));

        let selectedIds = this.getContentToUnpublishIds();

        new UnpublishContentRequest()
            .setIncludeChildren(true)
            .setIds(selectedIds)
            .sendAndParse()
            .then((taskId: TaskId) => {
                this.pollTask(taskId);
            }).catch((reason) => {
            this.unlockControls();
            this.close();
            if (reason && reason.message) {
                showError(reason.message);
            }
        });
    }
}

export class ContentUnpublishDialogAction
    extends Action {
    constructor() {
        super(i18n('action.unpublish'));
        this.setIconClass('unpublish-action');
    }
}
