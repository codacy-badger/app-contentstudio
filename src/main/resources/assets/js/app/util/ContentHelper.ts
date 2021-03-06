import * as Q from 'q';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {CompareExpr} from 'lib-admin-ui/query/expr/CompareExpr';
import {ValueExpr} from 'lib-admin-ui/query/expr/ValueExpr';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {ContentQueryRequest} from '../resource/ContentQueryRequest';
import {ContentQueryResult} from '../resource/ContentQueryResult';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Content} from '../content/Content';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentQuery} from '../content/ContentQuery';
import {QueryField} from 'lib-admin-ui/query/QueryField';

export class ContentHelper {

    static isReferencedBy(content: ContentSummary, reference: ContentId) {
        if (!content) {
            return Q(false);
        }

        const contentQuery: ContentQuery = new ContentQuery();
        contentQuery.setMustBeReferencedById(reference);
        contentQuery.setQueryExpr(
            new QueryExpr(CompareExpr.eq(new FieldExpr(QueryField.ID), ValueExpr.string(content.getContentId().toString()))));

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
            (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                return contentQueryResult.getMetadata().getTotalHits() > 0;
            });
    }

    static containsChildContentId(content: Content, contentId: ContentId): Q.Promise<boolean> {
        const page = content.getPage();

        if (page) {
            if (page.doesFragmentContainId(contentId)) {
                return Q(true);
            }

            // return page.doRegionComponentsContainId(contentId);
            const fragments: ContentId[] = [];
            const containsId = page.getRegions() && page.doRegionsContainId(page.getRegions().getRegions(), contentId, fragments);
            if (!containsId && fragments.length > 0) {
                return Q.all(fragments.map(fragmentId => new GetContentByIdRequest(fragmentId).sendAndParse()))
                    .then((fragmentContents: Content[]) => {
                        return fragmentContents.some((fragmentContent: Content) => {
                            return fragmentContent.getPage().doesFragmentContainId(contentId);
                        });
                    });
            } else {
                return Q(containsId);
            }
        }

        return Q(false);
    }

    static createView(model: ContentSummaryAndCompareStatus): ViewItem<ContentSummaryAndCompareStatus> {
        return new ViewItem<ContentSummaryAndCompareStatus>(model)
            .setIconUrl(model.getIconUrl())
            .setDisplayName(model.getDisplayName())
            .setPath(model.getPath().toString());
    }
}
