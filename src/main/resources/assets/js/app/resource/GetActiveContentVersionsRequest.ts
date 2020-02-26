import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetActiveContentVersionsResultsJson} from './json/GetActiveContentVersionsResultsJson';
import {ActiveContentVersionJson} from './json/ActiveContentVersionJson';
import {ContentVersionJson} from './json/ContentVersionJson';
import {ContentVersion} from '../ContentVersion';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetActiveContentVersionsRequest
    extends ContentResourceRequest<GetActiveContentVersionsResultsJson, ContentVersion[]> {

    private id: ContentId;

    constructor(id: ContentId) {
        super();
        super.setMethod('GET');
        this.id = id;
    }

    getParams(): Object {
        return {
            id: this.id.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getActiveVersions');
    }

    sendAndParse(): Q.Promise<ContentVersion[]> {

        return this.send().then((response: JsonResponse<GetActiveContentVersionsResultsJson>) => {
            return this.fromJsonToContentVersions(response.getResult().activeContentVersions);
        });
    }

    private fromJsonToContentVersions(json: ActiveContentVersionJson[]): ContentVersion[] {

        let contentVersionJson: ContentVersionJson;
        let contentVersion: ContentVersion;
        let contentVersionsMap: { [id: string]: ContentVersion } = {};

        json.forEach((activeContentVersion: ActiveContentVersionJson) => {

            contentVersionJson = activeContentVersion.contentVersion;

            contentVersion = contentVersionsMap[contentVersionJson.id];
            if (!contentVersion) {
                contentVersion = ContentVersion.fromJson(contentVersionJson, [activeContentVersion.branch]);
                contentVersionsMap[contentVersion.getId()] = contentVersion;
            } else {
                // just add new workspace if already exists
                contentVersion.getWorkspaces().push(activeContentVersion.branch);
            }
        });

        return Object.keys(contentVersionsMap).map((key: string) => contentVersionsMap[key]);
    }

}
