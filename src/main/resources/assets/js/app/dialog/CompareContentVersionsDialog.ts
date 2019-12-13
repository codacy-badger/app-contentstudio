import * as Q from 'q';
import {ContentVersion} from '../ContentVersion';
import {ContentVersionViewer} from '../view/context/widget/version/ContentVersionViewer';
import {ActiveContentVersionSetEvent} from '../event/ActiveContentVersionSetEvent';
import {GetContentVersionRequest} from '../resource/GetContentVersionRequest';
import {Delta, DiffPatcher, formatters} from 'jsondiffpatch';
import {GetContentVersionsForViewRequest} from '../resource/GetContentVersionsForViewRequest';
import {ContentVersions} from '../ContentVersions';
import {RevertVersionRequest} from '../resource/RevertVersionRequest';
import {ModalDialog} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {OptionSelectedEvent} from 'lib-admin-ui/ui/selector/OptionSelectedEvent';
import {CheckboxBuilder} from 'lib-admin-ui/ui/Checkbox';
import {Element} from 'lib-admin-ui/dom/Element';
import {LabelEl} from 'lib-admin-ui/dom/LabelEl';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {Dropdown} from 'lib-admin-ui/ui/selector/dropdown/Dropdown';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {i18n} from 'lib-admin-ui/util/Messages';

export class CompareContentVersionsDialog
    extends ModalDialog {

    private static INSTANCE: CompareContentVersionsDialog;

    private leftVersion: string;

    private rightVersion: string;

    private activeVersion: string;

    private contentId: ContentId;

    private toolbar: DivEl;

    private leftDropdown: Dropdown<ContentVersion>;

    private rightDropdown: Dropdown<ContentVersion>;

    private leftLabel: LabelEl;

    private rightLabel: LabelEl;

    private comparisonContainer: DivEl;

    private revertLeftButton: Button;

    private revertRightButton: Button;

    private contentCache: { [key: string]: Object };

    private diffPatcher: DiffPatcher;

    private htmlFormatter: any;

    protected constructor() {
        super(<ModalDialogConfig>{
            class: 'compare-content-versions-dialog grey-header',
        });

        this.diffPatcher = new DiffPatcher();
    }

    private createVersionDropdown(stylePrefix: string, version: string): Dropdown<ContentVersion> {

        const dropdown = new Dropdown(`${stylePrefix}-version`, {
            optionDisplayValueViewer: new ContentVersionViewer(),
            disableFilter: true,
            dataIdProperty: 'value',
            value: version
        });

        dropdown.onOptionSelected((event: OptionSelectedEvent<ContentVersion>) => {
            if (!this.isRendered()) {
                return;
            }

            const leftVersion = this.leftDropdown.getValue();
            const rightVersion = this.rightDropdown.getValue();

            if (!leftVersion || !rightVersion) {
                return;
            }

            if (dropdown === this.rightDropdown && this.leftVersionRequiresForcedSelection()) {
                this.forceSelectLeftVersion();

                return;
            }

            this.updateButtonsState();
            this.displayDiff(leftVersion, rightVersion);
        });
        return dropdown;
    }

    createVersionRevertButton(dropdown: Dropdown<ContentVersion>): Button {
        const button = new Button(i18n('field.version.revert'));

        button.onClicked(event => this.restoreVersion(dropdown.getValue()));

        return button;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.toolbar = new DivEl('toolbar-container');

            this.leftDropdown = this.createVersionDropdown('left', this.leftVersion);

            this.leftDropdown.onExpanded(() => this.disableLeftVersions());

            this.revertLeftButton = this.createVersionRevertButton(this.leftDropdown);

            this.leftLabel = new LabelEl(i18n('dialog.compareVersions.olderVersion'));
            const leftContainer = new DivEl('container left');
            leftContainer.appendChildren<Element>(this.leftLabel, this.leftDropdown, this.revertLeftButton);

            this.rightLabel = new LabelEl(i18n('dialog.compareVersions.newerVersion'));
            this.rightDropdown = this.createVersionDropdown('right', this.rightVersion);
            this.revertRightButton = this.createVersionRevertButton(this.rightDropdown);

            const rightContainer = new DivEl('container right');
            rightContainer.appendChildren<Element>(this.rightLabel, this.rightDropdown, this.revertRightButton);

            const bottomContainer = new DivEl('container bottom');
            this.htmlFormatter = (<any>formatters.html);
            this.htmlFormatter.showUnchanged(false, null, 0);
            const changesCheckbox = new CheckboxBuilder().setLabelText(i18n('dialog.compareVersions.showUnchanged')).build();
            changesCheckbox.onValueChanged(event => {
                this.htmlFormatter.showUnchanged(event.getNewValue() === 'true', null, 0);
            });
            bottomContainer.appendChild(changesCheckbox);

            return this.reloadVersions().then(() => {

                this.toolbar.appendChildren(leftContainer, rightContainer, bottomContainer);

                this.comparisonContainer = new DivEl('jsondiffpatch-delta');

                this.appendChildToHeader(this.toolbar);
                this.appendChildToContentPanel(this.comparisonContainer);

                this.updateButtonsState();
                this.displayDiff(this.leftVersion, this.rightVersion);

                return rendered;
            });
        });
    }

    public static get(): CompareContentVersionsDialog {
        if (!CompareContentVersionsDialog.INSTANCE) {
            CompareContentVersionsDialog.INSTANCE = new CompareContentVersionsDialog();
        }
        return CompareContentVersionsDialog.INSTANCE;
    }

    setLeftVersion(value: string): CompareContentVersionsDialog {
        this.leftVersion = value;
        return this;
    }

    setRightVersion(value: string): CompareContentVersionsDialog {
        this.rightVersion = value;
        return this;
    }

    setActiveVersion(value: string): CompareContentVersionsDialog {
        this.activeVersion = value;
        return this;
    }

    setContentDisplayName(value: string): CompareContentVersionsDialog {
        this.setTitle(i18n('dialog.compareVersions.comparingVersions', value));
        return this;
    }

    setContentId(value: ContentId): CompareContentVersionsDialog {
        this.contentId = value;
        return this;
    }

    open() {
        super.open();
        this.contentCache = {};

        if (!this.isRendered()) {
            return;
        }

        this.htmlFormatter.showUnchanged(false, null, 0);
        this.reloadVersions();
    }

    private reloadVersions(): Q.Promise<void> {
        if (!this.contentId) {
            return;
        }
        return new GetContentVersionsForViewRequest(this.contentId).setSize(-1).sendAndParse()
            .then((contentVersions: ContentVersions) => {

                if (this.leftDropdown) {
                    this.leftDropdown.removeAllOptions();
                }
                if (this.rightDropdown) {
                    this.rightDropdown.removeAllOptions();
                }

                let options: Option<ContentVersion>[] = [];
                const versions = contentVersions.getContentVersions();
                for (let i = 0; i < versions.length; i++) {
                    const version = versions[i];
                    options.push({
                        value: version.id,
                        displayValue: version
                    });
                }

                options = options.sort((a, b) => {
                    return b.displayValue.modified.getTime() - a.displayValue.modified.getTime();
                });

                this.leftDropdown.setOptions(options);
                this.rightDropdown.setOptions(options);

                this.leftDropdown.setValue(this.leftVersion, true);
                this.rightDropdown.setValue(this.rightVersion);
            });
    }

    private getSelectedRightVersion(): string {
        const rightSelectedOption: Option<ContentVersion> = this.rightDropdown.getSelectedOption();
        if (!rightSelectedOption) {
            return null;
        }

        return rightSelectedOption.value;
    }

    private getSelectedIndex(version: string, options: Option<ContentVersion>[]): number {
        return options.findIndex((option: Option<ContentVersion>) => option.value === version);
    }

    private leftVersionRequiresForcedSelection() {

        const options = this.leftDropdown.getOptions();

        const leftIndex = this.getSelectedIndex(this.leftDropdown.getValue(), options);
        const rightIndex = this.getSelectedIndex(this.rightDropdown.getValue(), options);

        return leftIndex < rightIndex;
    }

    private forceSelectLeftVersion() {
        if (!this.leftVersionRequiresForcedSelection()) {
            return;
        }

        const options = this.leftDropdown.getOptions();
        const rightIndex = this.getSelectedIndex(this.rightDropdown.getValue(), options);

        const nextIndex = (rightIndex + 1 === this.rightDropdown.getOptionCount()) ? rightIndex : rightIndex + 1;

        this.leftDropdown.resetActiveSelection();
        this.leftDropdown.setValue(options[nextIndex].value);
    }

    private disableLeftVersions() {
        const rightVersion = this.getSelectedRightVersion();

        if (!rightVersion) {
            return;
        }
        const readonlyOptions = [];
        this.leftDropdown.getOptions().every((option: Option<ContentVersion>) => {
            if (option.value === rightVersion) {
                if (readonlyOptions.length) {
                    this.leftDropdown.markReadOnly(readonlyOptions);
                }
                return false;
            }

            option.readOnly = true;
            readonlyOptions.push(option);
            return true;
        });
    }

    private fetchVersionPromise(version: string): Q.Promise<Object> {
        const cache = this.contentCache[version];

        if (cache) {
            return Q(cache);
        }

        return new GetContentVersionRequest(this.contentId)
            .setVersion(version)
            .sendRequest().then(content => {
                const processedContent = this.processContent(content);
                this.contentCache[version] = processedContent;
                return processedContent;
            });
    }

    private displayDiff(leftVersion: string, rightVersion: string): Q.Promise<void> {
        const promises = [
            this.fetchVersionPromise(leftVersion)
        ];
        if (leftVersion !== rightVersion) {
            promises.push(this.fetchVersionPromise(rightVersion));
        }
        this.comparisonContainer.addClass('loading');

        return Q.all(promises).spread((leftJson: Object, rightJson: Object) => {
            const delta: Delta = this.diffPatcher.diff(leftJson, rightJson || leftJson);
            let text;
            let isEmpty = false;
            if (delta) {
                text = formatters.html.format(delta, rightJson || leftJson);
            } else {
                isEmpty = true;
                text = `<h3>${i18n('dialog.compareVersions.versionsIdentical')}</h3>`;
            }
            this.comparisonContainer.removeClass('loading');
            this.comparisonContainer.setHtml(text, false).toggleClass('empty', isEmpty);
        });
    }

    private restoreVersion(version: string): Q.Promise<void> {
        return new RevertVersionRequest(version, this.contentId.toString()).sendAndParse()
            .then((contentKey: string) => {
                if (contentKey === this.activeVersion) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                } else {
                    NotifyManager.get().showFeedback(i18n('notify.version.changed', contentKey));
                    new ActiveContentVersionSetEvent(this.contentId, contentKey).fire();
                    this.activeVersion = contentKey;
                    return this.reloadVersions();
                }
            });
    }

    private updateButtonsState() {
        const isCurrentVersionLeft = this.leftDropdown.getValue() === this.activeVersion;
        const isCurrentVersionRight = this.rightDropdown.getValue() === this.activeVersion;

        const leftLabel = i18n(isCurrentVersionLeft ? 'dialog.compareVersions.current' : 'dialog.compareVersions.olderVersion');
        const rightLabel = i18n(isCurrentVersionRight ? 'dialog.compareVersions.current' : 'dialog.compareVersions.newerVersion');

        this.revertLeftButton.setEnabled(!isCurrentVersionLeft);
        this.revertRightButton.setEnabled(!isCurrentVersionRight);

        this.leftLabel.setValue(leftLabel);
        this.rightLabel.setValue(rightLabel);
    }

    private processContent(contentJson: any): Object {
        [
            '_id', 'childOrder', 'creator', 'createdTime', 'hasChildren'
        ].forEach(e => delete contentJson[e]);

        return contentJson;
    }
}
