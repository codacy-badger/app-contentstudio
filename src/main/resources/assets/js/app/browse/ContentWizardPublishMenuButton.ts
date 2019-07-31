import {Issue} from '../issue/Issue';
import {IssueType} from '../issue/IssueType';
import {ContentPublishMenuAction, ContentPublishMenuButton, ContentPublishMenuButtonConfig} from './ContentPublishMenuButton';
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;
import ContentId = api.content.ContentId;
import {IssueDialogsManager} from '../issue/IssueDialogsManager';

export interface ContentWizardPublishMenuButtonConfig extends ContentPublishMenuButtonConfig {
    openRequestAction: Action;
}

export class ContentWizardPublishMenuButton
    extends ContentPublishMenuButton {

    protected openRequestAction: ContentPublishMenuAction;

    protected openRequestButton: ActionButton;

    private publishRequest: Issue;

    private publishRequestActionChangeListeners: { (added: boolean): void }[] = [];

    constructor(config: ContentWizardPublishMenuButtonConfig) {
        super(config);
    }

    protected initMenuActions(config: ContentWizardPublishMenuButtonConfig) {
        super.initMenuActions(config);
        this.openRequestAction = new ContentPublishMenuAction(config.openRequestAction, 'open-request');
        this.openRequestAction.getAction().onExecuted(() => {
            if (this.publishRequest) {
                IssueDialogsManager.get().openDetailsDialog(this.publishRequest);
            }
        });
    }

    protected getActions(): Action[] {
        return [
            this.markAsReadyAction.getAction(),
            this.publishAction.getAction(),
            this.unpublishAction.getAction(),
            this.requestPublishAction.getAction(),
            this.openRequestAction.getAction(),
            this.createIssueAction.getAction()
        ];
    }

    protected initButtons() {
        super.initButtons();
        this.openRequestButton = new ActionButton(this.openRequestAction.getAction());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.openRequestButton.addClass('open-request-action-button');
            return rendered;
        });
    }

    protected getButtons(): ActionButton[] {
        return [this.markAsReadyButton, this.unpublishButton, this.requestPublishButton, this.openRequestButton, this.createIssueButton];
    }

    protected findIssues(contentId: ContentId): wemQ.Promise<Issue[]> {
        return super.findIssues(contentId).then((issues: Issue[]) => {
            this.createPublishRequestAction(issues);
            return issues;
        });
    }

    protected updateActiveClass() {
        if (this.openRequestAction.isEnabled()) {
            this.setActiveClass(this.openRequestAction.getActionClass());
        } else {
            super.updateActiveClass();
        }
    }

    private createPublishRequestAction(issues: Issue[]) {
        const hasIssues = issues != null && issues.length > 0;
        let publishRequestAdded = false;
        if (hasIssues) {
            this.publishRequest = null;
            // Reverse to find the oldest
            issues.reverse().some(issue => {
                const isPublishRequest = issue.getType() === IssueType.PUBLISH_REQUEST;
                if (isPublishRequest) {
                    this.publishRequest = issue;
                }

                return isPublishRequest;
            });

            const hasPublishRequest = this.publishRequest != null;
            if (hasPublishRequest) {
                publishRequestAdded = true;
            }
        }
        this.notifyPublishRequestActionChanged(publishRequestAdded);
    }

    public onPublishRequestActionChanged(listener: (added: boolean) => void) {
        this.publishRequestActionChangeListeners.push(listener);
    }

    public unPublishRequestActionChanged(listener: (added: boolean) => void) {
        this.publishRequestActionChangeListeners = this.publishRequestActionChangeListeners.filter(curr => curr !== listener);
    }

    private notifyPublishRequestActionChanged(added: boolean) {
        this.publishRequestActionChangeListeners.forEach(listener => listener(added));
    }

}
