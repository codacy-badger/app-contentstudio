import {JsonResourceRequest} from '../../resource/JsonResourceRequest';
import {Path} from 'lib-admin-ui/rest/Path';

export class ProjectResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'project');
    }

}
