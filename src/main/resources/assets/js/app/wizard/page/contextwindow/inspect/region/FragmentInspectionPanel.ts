import * as Q from 'q';
import {showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {FragmentSelectorForm} from './FragmentSelectorForm';
import {FragmentComponentView} from '../../../../../../page-editor/fragment/FragmentComponentView';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {LayoutItemType} from '../../../../../../page-editor/layout/LayoutItemType';
import {FragmentDropdown} from './FragmentDropdown';
import {GetContentSummaryByIdRequest} from '../../../../../resource/GetContentSummaryByIdRequest';
import {GetContentByIdRequest} from '../../../../../resource/GetContentByIdRequest';
import {ContentUpdatedEvent} from '../../../../../event/ContentUpdatedEvent';
import {EditContentEvent} from '../../../../../event/EditContentEvent';
import {Content} from '../../../../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../../../../content/ContentSummaryAndCompareStatus';
import {FragmentComponent} from '../../../../../page/region/FragmentComponent';
import {ComponentPropertyChangedEvent} from '../../../../../page/region/ComponentPropertyChangedEvent';
import {LayoutComponentType} from '../../../../../page/region/LayoutComponentType';
import {OptionSelectedEvent} from 'lib-admin-ui/ui/selector/OptionSelectedEvent';
import {Button} from 'lib-admin-ui/ui/button/Button';

export class FragmentInspectionPanel
    extends ComponentInspectionPanel<FragmentComponent> {

    private fragmentView: FragmentComponentView;

    private fragmentSelector: FragmentDropdown;

    private fragmentForm: FragmentSelectorForm;

    private editFragmentButton: Button;

    private handleSelectorEvents: boolean = true;

    private componentPropertyChangedEventHandler: (event: ComponentPropertyChangedEvent) => void;

    private contentUpdatedListener: (event: any) => void;

    constructor() {
        super(<ComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType('fragment')
        });

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.fragmentSelector = new FragmentDropdown();
        this.fragmentForm = new FragmentSelectorForm(this.fragmentSelector, i18n('field.fragment'));
        this.editFragmentButton = new Button(i18n('action.editFragment'));
        this.editFragmentButton.addClass('blue large');
    }

    private initListeners() {
        this.componentPropertyChangedEventHandler = (event: ComponentPropertyChangedEvent) => {
            // Ensure displayed selector option is removed when fragment is removed
            if (event.getPropertyName() === FragmentComponent.PROPERTY_FRAGMENT) {
                if (!this.component.hasFragment()) {
                    // this.fragmentSelector.setContent(null);
                    this.fragmentSelector.setSelection(null);
                }
            }
        };

        this.editFragmentButton.onClicked(() => {
            const fragmentId: ContentId = this.component.getFragment();
            if (fragmentId) {
                const fragment: ContentSummary = this.fragmentSelector.getSelection(fragmentId);
                const fragmentContent: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromContentSummary(fragment);

                new EditContentEvent([fragmentContent]).fire();
            }
        });

        this.handleContentUpdatedEvent();
        this.initSelectorListeners();
    }

    setModel(liveEditModel: LiveEditModel) {
        super.setModel(liveEditModel);
        this.fragmentSelector.setModel(liveEditModel);
        this.fragmentSelector.load();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.fragmentForm);
            this.fragmentForm.appendChild(this.editFragmentButton);

            return rendered;
        });
    }

    private handleContentUpdatedEvent() {
        this.contentUpdatedListener = (event: ContentUpdatedEvent) => {
            // update currently selected option if this is the one updated
            if (this.component && event.getContentId().equals(this.component.getFragment())) {
                this.fragmentSelector.getSelectedOption().displayValue = event.getContentSummary();
            }
        };
        ContentUpdatedEvent.on(this.contentUpdatedListener);

        this.onRemoved((event) => {
            ContentUpdatedEvent.un(this.contentUpdatedListener);
        });
    }

    setFragmentComponentView(fragmentView: FragmentComponentView) {
        this.fragmentView = fragmentView;
    }

    setFragmentComponent(fragment: FragmentComponent) {
        this.unregisterComponentListeners();

        this.setComponent(fragment);
        this.updateSelectorValue();

        this.registerComponentListeners();
    }

    private updateSelectorValue() {
        const contentId: ContentId = this.component.getFragment();
        if (contentId) {
            const fragment: ContentSummary = this.fragmentSelector.getSelection(contentId);
            if (fragment) {
                this.setSelectorValue(fragment);
            } else {
                new GetContentSummaryByIdRequest(contentId).sendAndParse().then((receivedFragment: ContentSummary) => {
                    this.setSelectorValue(receivedFragment);
                }).catch((reason: any) => {
                    if (this.isNotFoundError(reason)) {
                        this.setSelectorValue(null);
                    } else {
                        DefaultErrorHandler.handle(reason);
                    }
                }).done();
            }
        } else {
            this.setSelectorValue(null);
        }
    }

    private registerComponentListeners() {
        if (this.component) {
            this.component.onPropertyChanged(this.componentPropertyChangedEventHandler);
        }
    }

    private unregisterComponentListeners() {
        if (this.component) {
            this.component.unPropertyChanged(this.componentPropertyChangedEventHandler);
        }
    }

    private setSelectorValue(fragment: ContentSummary) {
        this.handleSelectorEvents = false;
        if (fragment) {
            let option = this.fragmentSelector.getOptionByValue(fragment.getId().toString());
            if (!option) {
                this.fragmentSelector.addFragmentOption(fragment);
            }
        }
        this.fragmentSelector.setSelection(fragment);
        this.editFragmentButton.setEnabled(!!fragment);
        this.handleSelectorEvents = true;
    }

    private initSelectorListeners() {
        this.fragmentSelector.onOptionSelected((selectedOption: OptionSelectedEvent<ContentSummary>) => {
            if (this.handleSelectorEvents) {
                let option: Option<ContentSummary> = selectedOption.getOption();
                let fragmentContent = option.displayValue;

                if (this.isInsideLayout()) {
                    new GetContentByIdRequest(fragmentContent.getContentId()).sendAndParse().done((content: Content) => {
                        let fragmentComponent = content.getPage() ? content.getPage().getFragment() : null;

                        if (fragmentComponent &&
                            ObjectHelper.iFrameSafeInstanceOf(fragmentComponent.getType(), LayoutComponentType)) {
                            showWarning(i18n('notify.nestedLayouts'));

                        } else {
                            this.component.setFragment(fragmentContent.getContentId(), fragmentContent.getDisplayName());
                        }
                    });
                } else {
                    this.component.setFragment(fragmentContent.getContentId(), fragmentContent.getDisplayName());
                }
            }
        });
    }

    private isInsideLayout(): boolean {
        let parentRegion = this.fragmentView.getParentItemView();
        if (!parentRegion) {
            return false;
        }
        let parent = parentRegion.getParentItemView();
        if (!parent) {
            return false;
        }
        return ObjectHelper.iFrameSafeInstanceOf(parent.getType(), LayoutItemType);
    }

    cleanUp() {
        this.unregisterComponentListeners();
        this.component = null;
    }

    getName(): string {
        return i18n('live.view.insert.fragment');
    }

}
