import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {LayoutComponentView} from './LayoutComponentView';
import {SiteModel} from '../../app/site/SiteModel';
import {LayoutDescriptorComboBox} from './LayoutDescriptorComboBox';
import {LayoutComponent} from '../../app/page/region/LayoutComponent';
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;

export class LayoutPlaceholder
    extends ItemViewPlaceholder {

    private comboBox: LayoutDescriptorComboBox;

    private layoutComponentView: LayoutComponentView;

    constructor(layoutView: LayoutComponentView) {
        super();
        this.addClassEx('layout-placeholder');
        this.layoutComponentView = layoutView;

        this.comboBox = new LayoutDescriptorComboBox();
        this.comboBox.loadDescriptors(layoutView.getLiveEditModel().getSiteModel().getApplicationKeys());

        this.appendChild(this.comboBox);

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<LayoutDescriptor>) => {
            this.layoutComponentView.showLoadingSpinner();
            const descriptor = event.getSelectedOption().getOption().displayValue;

            const layoutComponent: LayoutComponent = this.layoutComponentView.getComponent();
            layoutComponent.setDescriptor(descriptor);
        });

        let siteModel = layoutView.getLiveEditModel().getSiteModel();

            let listener = () => this.reloadDescriptors(siteModel);

            siteModel.onApplicationAdded(listener);
            siteModel.onApplicationRemoved(listener);
            siteModel.onSiteModelUpdated(listener);

            this.onRemoved(() => {
                siteModel.unApplicationAdded(listener);
                siteModel.unApplicationRemoved(listener);
                siteModel.unSiteModelUpdated(listener);
            });
        }

        private reloadDescriptors(siteModel: SiteModel) {
            this.comboBox.loadDescriptors(siteModel.getApplicationKeys());
        }

    select() {
        this.comboBox.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboBox.hide();
    }
}
