import {NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeItem, NodeServerChangeItemBuilder} from 'lib-admin-ui/event/NodeServerChangeItem';

export class IssueServerChangeItem
    extends NodeServerChangeItem {

    constructor(builder: IssueServerChangeItemBuilder) {
        super(builder);
    }

    protected processPath(path: string): string {
        return path.substr('/issue'.length);
    }

    static fromJson(json: NodeEventNodeJson): IssueServerChangeItem {
        return new IssueServerChangeItemBuilder().fromJson(json).build();
    }
}

export class IssueServerChangeItemBuilder
    extends NodeServerChangeItemBuilder {

    fromJson(json: NodeEventNodeJson): IssueServerChangeItemBuilder {
        super.fromJson(json);

        return this;
    }

    build(): IssueServerChangeItem {
        return new IssueServerChangeItem(this);
    }
}
