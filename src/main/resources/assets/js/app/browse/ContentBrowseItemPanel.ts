import {ContentItemStatisticsPanel} from '../view/ContentItemStatisticsPanel';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {BrowseItemPanel} from 'lib-admin-ui/app/browse/BrowseItemPanel';

export class ContentBrowseItemPanel
    extends BrowseItemPanel<ContentSummaryAndCompareStatus> {

    constructor() {
        super();

        this.addClass('content-browse-item-panel');
    }

    createItemStatisticsPanel(): ContentItemStatisticsPanel {
        return new ContentItemStatisticsPanel();
    }

}
