import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {PartComponentView} from './PartComponentView';
import {SiteModel} from '../../app/site/SiteModel';
import {PartDescriptorComboBox} from './PartDescriptorComboBox';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {H2El} from 'lib-admin-ui/dom/H2El';
import {H3El} from 'lib-admin-ui/dom/H3El';

export class PartPlaceholder
    extends ItemViewPlaceholder {

    private comboBox: PartDescriptorComboBox;

    private displayName: H2El;

    private partComponentView: PartComponentView;

    constructor(partView: PartComponentView) {
        super();
        this.addClassEx('part-placeholder').addClass(StyleHelper.getCommonIconCls('part'));

        this.partComponentView = partView;

        this.comboBox = new PartDescriptorComboBox();
        this.comboBox.setApplicationKeys(partView.getLiveEditModel().getSiteModel().getApplicationKeys());

        this.appendChild(this.comboBox);

        const partComponent = this.partComponentView.getComponent();

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<PartDescriptor>) => {
            this.partComponentView.showLoadingSpinner();
            const descriptor: Descriptor = event.getSelectedOption().getOption().displayValue;
            partComponent.setDescriptor(descriptor);
        });

        let siteModel = partView.getLiveEditModel().getSiteModel();

        let listener = () => this.reloadDescriptors(siteModel);

        siteModel.onApplicationAdded(listener);
        siteModel.onApplicationRemoved(listener);
        siteModel.onSiteModelUpdated(listener);

        this.onRemoved(() => {
            siteModel.unApplicationAdded(listener);
            siteModel.unApplicationRemoved(listener);
            siteModel.unSiteModelUpdated(listener);
        });

        this.displayName = new H3El('display-name');
        this.appendChild(this.displayName);
        if (partComponent && partComponent.getName()) {
            this.setDisplayName(partComponent.getName().toString());
        }
    }

    private reloadDescriptors(siteModel: SiteModel) {
        this.comboBox.setApplicationKeys(siteModel.getApplicationKeys());
        this.comboBox.getLoader().load();
    }

    setDisplayName(name: string) {
        this.displayName.setHtml(name);
    }

    select() {
        this.comboBox.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboBox.hide();
    }
}
