import {ProjectResourceRequest} from './ProjectResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {Project} from '../data/project/Project';

export class ProjectUpdateIconRequest
    extends ProjectResourceRequest<Project> {

    private name: string;

    private icon: File;

    private size: number = 150;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.setIsFormRequest(true);
        this.addRequestPathElements('modifyIcon');
    }

    setName(value: string): ProjectUpdateIconRequest {
        this.name = value;
        return this;
    }

    setIcon(value: File): ProjectUpdateIconRequest {
        this.icon = value;
        return this;
    }

    setSize(value: number): ProjectUpdateIconRequest {
        this.size = value;
        return this;
    }

    getParams(): Object {
        return {
            name: this.name,
            icon: this.icon,
            size: this.size
        };
    }
}
