import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectViewItem} from '../view/ProjectViewItem';
import * as Q from 'q';
import {ValidationRecording} from 'lib-admin-ui/form/ValidationRecording';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';

export class ProjectItemNameWizardStepForm
    extends SettingDataItemWizardStepForm<ProjectViewItem> {

    private static PROJECT_NAME_CHARS: RegExp = /^([a-z0-9\\-])([a-z0-9_\\-])*$/;

    private projectNameInput: TextInput;

    private projectNameFormItem: ProjectFormItem;

    private descriptionInput: TextInput;

    getProjectName(): string {
        return this.projectNameInput.getValue();
    }

    setProjectName(value: string) {
        this.projectNameInput.setValue(value);
    }

    disableProjectNameInput() {
        this.projectNameInput.getEl().setDisabled(true);
    }

    getDescription(): string {
        return this.descriptionInput.getValue();
    }

    disableHelpText() {
        this.projectNameFormItem.disableHelpText();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-item-wizard-step-form');

            return rendered;
        });
    }

    public validate(): ValidationRecording {
        this.projectNameFormItem.validate(new ValidationResult(), true);

        return new ValidationRecording();
    }

    public isValid(): boolean {
        return this.isProjectNameValid();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        this.descriptionInput.setValue(item.getDescription(), true);
        this.projectNameInput.setValue(item.getName(), true);
        this.disableHelpText();
        this.disableProjectNameInput();

        return Q(null);
    }

    public getName(): string {
        return i18n('settings.items.type.project');
    }

    protected initListeners() {
        this.descriptionInput.onValueChanged(() => {
            this.notifyDataChanged();
        });

        this.projectNameInput.onValueChanged(() => {
            this.projectNameFormItem.validate(new ValidationResult(), true);
            this.notifyDataChanged();
        });
    }

    protected getFormItems(item?: ProjectViewItem): FormItem[] {
        this.projectNameInput = new TextInput();
        this.projectNameFormItem = <ProjectFormItem>new ProjectFormItemBuilder(this.projectNameInput)
            .setHelpText(i18n('settings.projects.name.helptext'))
            .setValidator(this.validateProjectName.bind(this))
            .setLabel(i18n('settings.field.project.name'))
            .build();
        this.projectNameFormItem.getLabel().addClass('required');

        this.descriptionInput = new TextInput();
        const descriptionFormItem: FormItem = new FormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build();

        return [this.projectNameFormItem, descriptionFormItem];
    }

    private validateProjectName(): string {
        return !this.isProjectNameValid() ? i18n('field.value.invalid') : undefined;
    }

    private isProjectNameValid(): boolean {
        const projectNameRegExp: RegExp = ProjectItemNameWizardStepForm.PROJECT_NAME_CHARS;
        return projectNameRegExp.test(this.projectNameInput.getValue());
    }
}
