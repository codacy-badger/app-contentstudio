import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {PageResourceRequest} from '../resource/PageResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {PageTemplateKey} from '../page/PageTemplateKey';
import {Regions} from '../page/region/Regions';
import {Component} from '../page/region/Component';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class CreatePageRequest
    extends PageResourceRequest<Content>
    implements PageCUDRequest {

    private contentId: ContentId;

    private controller: DescriptorKey;

    private template: PageTemplateKey;

    private config: PropertyTree;

    private regions: Regions;

    private fragment: Component;

    private customized: boolean;

    constructor(contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.addRequestPathElements('create');
    }

    setController(controller: DescriptorKey): CreatePageRequest {
        this.controller = controller;
        return this;
    }

    setPageTemplateKey(pageTemplateKey: PageTemplateKey): CreatePageRequest {
        this.template = pageTemplateKey;
        return this;
    }

    setConfig(config: PropertyTree): CreatePageRequest {
        this.config = config;
        return this;
    }

    setRegions(value: Regions): CreatePageRequest {
        this.regions = value;
        return this;
    }

    setFragment(value: Component): CreatePageRequest {
        this.fragment = value;
        return this;
    }

    setCustomized(value: boolean): CreatePageRequest {
        this.customized = value;
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString(),
            controller: this.controller ? this.controller.toString() : null,
            template: this.template ? this.template.toString() : null,
            config: this.config ? this.config.toJson() : null,
            regions: this.regions != null ? this.regions.toJson() : null,
            customized: this.customized,
            fragment: this.fragment != null ? this.fragment.toJson() : null
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return response.isBlank() ? null : this.fromJsonToContent(response.getResult());
    }
}
