import {WidgetView} from './WidgetView';
import {WidgetsSelectionRow} from './WidgetsSelectionRow';
import {VersionsWidgetItemView} from './widget/version/VersionsWidgetItemView';
import {DependenciesWidgetItemView} from './widget/dependency/DependenciesWidgetItemView';
import {StatusWidgetItemView} from './widget/info/StatusWidgetItemView';
import {PropertiesWidgetItemView} from './widget/info/PropertiesWidgetItemView';
import {AttachmentsWidgetItemView} from './widget/info/AttachmentsWidgetItemView';
import {PageTemplateWidgetItemView} from './widget/info/PageTemplateWidgetItemView';
import {ActiveContextPanelManager} from './ActiveContextPanelManager';
import {ActiveContentVersionSetEvent} from '../../event/ActiveContentVersionSetEvent';
import {GetWidgetsByInterfaceRequest} from '../../resource/GetWidgetsByInterfaceRequest';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {UserAccessWidgetItemView} from '../../security/UserAccessWidgetItemView';
import Widget = api.content.Widget;
import ContentSummaryViewer = api.content.ContentSummaryViewer;
import ApplicationEvent = api.application.ApplicationEvent;
import ApplicationEventType = api.application.ApplicationEventType;
import AppHelper = api.util.AppHelper;
import i18n = api.util.i18n;

export class ContextView
    extends api.dom.DivEl {

    private widgetViews: WidgetView[] = [];
    private viewer: ContentSummaryViewer;
    private contextContainer: api.dom.DivEl = new api.dom.DivEl('context-container');
    private widgetsSelectionRow: WidgetsSelectionRow;

    private loadMask: api.ui.mask.LoadMask;
    private divForNoSelection: api.dom.DivEl;

    private item: ContentSummaryAndCompareStatus;

    private activeWidget: WidgetView;
    private defaultWidgetView: WidgetView;

    private alreadyFetchedCustomWidgets: boolean;

    private sizeChangedListeners: {(): void}[] = [];

    private widgetsUpdateList: {[key: string]: (key: string, type: ApplicationEventType) => void } = {};

    public static debug: boolean = false;

    constructor() {
        super('context-panel-view');

        this.appendChild(this.loadMask = new api.ui.mask.LoadMask(this));
        this.loadMask.addClass('context-panel-mask');

        this.initCommonWidgetViews();
        this.initDivForNoSelection();
        this.initWidgetsSelectionRow();
        this.initViewer();

        this.appendChild(this.contextContainer);
        this.appendChild(this.divForNoSelection);

        this.subscribeOnEvents();

        this.layout();

        this.getCustomWidgetViewsAndUpdateDropdown();

        const handleWidgetsUpdate = (e) => this.handleWidgetsUpdate(e);
        ApplicationEvent.on(handleWidgetsUpdate);
        this.onRemoved(() => ApplicationEvent.un(handleWidgetsUpdate));
    }

    private subscribeOnEvents() {
        ActiveContentVersionSetEvent.on((event: ActiveContentVersionSetEvent) => {
            if (ActiveContextPanelManager.getActiveContextPanel().isVisibleOrAboutToBeVisible() && !!this.activeWidget &&
                this.activeWidget.getWidgetName() === i18n('field.widget.versionHistory')) {
                this.updateActiveWidget();
            }
        });
    }

    private initDivForNoSelection() {
        this.divForNoSelection = new api.dom.DivEl('no-selection-message');
        this.divForNoSelection.getEl().setInnerHtml(i18n('field.contextPanel.empty'));
        this.appendChild(this.divForNoSelection);
    }

    private initWidgetsSelectionRow() {
        this.widgetsSelectionRow = new WidgetsSelectionRow(this);
        this.appendChild(this.widgetsSelectionRow);
        this.widgetsSelectionRow.updateState(this.activeWidget);
    }

    getWidgetsSelectionRow(): WidgetsSelectionRow {
        return this.widgetsSelectionRow;
    }

    public resetWidgetsWidth() {
        this.widgetViews.forEach((widgetView: WidgetView) => {
            widgetView.resetContainerWidth();
        });
    }

    private handleWidgetsUpdate(event: ApplicationEvent) {
        const isWidgetUpdated = [
            ApplicationEventType.INSTALLED,
            ApplicationEventType.UNINSTALLED,
            ApplicationEventType.STARTED,
            ApplicationEventType.STOPPED,
            ApplicationEventType.UPDATED
        ].indexOf(event.getEventType()) > -1;

        if (isWidgetUpdated) {
            const key = event.getApplicationKey().getName();

            if (!this.widgetsUpdateList[key]) {
                this.widgetsUpdateList[key] = AppHelper.debounce((k, type) => this.handleWidgetUpdate(k, type), 1000);
            }
            this.widgetsUpdateList[key](key, event.getEventType());
        }
    }

    private handleWidgetUpdate(key: string, type: ApplicationEventType) {
        let widgetView = this.getWidgetByKey(key);
        const isActive = widgetView && this.activeWidget.getWidgetName() === widgetView.getWidgetName();

        const isRemoved = [
            ApplicationEventType.UNINSTALLED,
            ApplicationEventType.STOPPED
        ].indexOf(type) > -1;

        const isUpdated = !!widgetView;

        const updateView = (useDefault?: boolean) => {
            this.widgetsSelectionRow.updateWidgetsDropdown(this.widgetViews);
            if (useDefault) {
                this.activateDefaultWidget();
            } else {
                this.activeWidget.setActive();
            }
            this.widgetsSelectionRow.updateState(this.activeWidget);
        };

        if (isRemoved) {
            this.removeWidgetByKey(key);

            updateView(isActive);

            return;
        }

        this.fetchWidgetByKey(key).then((widget: Widget) => {
            widgetView = WidgetView.create().setName(widget.getDisplayName()).setContextView(this).setWidget(widget).build();
            isUpdated ? this.updateWidget(widgetView) : this.addWidget(widgetView);

            updateView();
        });
    }

    getCustomWidgetViewsAndUpdateDropdown(): wemQ.Promise<void> {
        let deferred = wemQ.defer<void>();
        if (!this.alreadyFetchedCustomWidgets) {
            this.fetchAndInitCustomWidgetViews().then(() => {
                this.widgetsSelectionRow.updateWidgetsDropdown(this.widgetViews);
                this.alreadyFetchedCustomWidgets = true;
                deferred.resolve(null);
            });
        } else {
            deferred.resolve(null);
        }
        return deferred.promise;
    }

    setActiveWidget(widgetView: WidgetView) {
        if (this.activeWidget) {
            this.activeWidget.setInactive();
        }

        this.activeWidget = widgetView;

        this.toggleClass('default-widget', this.defaultWidgetView.isActive());

        if (this.widgetsSelectionRow) {
            this.widgetsSelectionRow.updateState(this.activeWidget);
        }
    }

    getActiveWidget(): WidgetView {
        return this.activeWidget;
    }

    resetActiveWidget() {
        this.activeWidget = null;
    }

    activateDefaultWidget() {
        if (this.defaultWidgetView) {
            this.defaultWidgetView.setActive();
        }
    }

    private initViewer() {
        this.viewer = new ContentSummaryViewer();
        this.viewer.addClass('context-panel-label');

        this.contextContainer.insertChild(this.viewer, 0);
    }

    public setItem(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        if (ContextView.debug) {
            console.debug('ContextView.setItem: ', item);
        }

            this.item = item;
            if (item) {
                this.layout(false);
                if (ActiveContextPanelManager.getActiveContextPanel().isVisibleOrAboutToBeVisible() && !!this.activeWidget) {
                    return this.updateActiveWidget();
                }
            } else {
                this.layout();
            }
        return wemQ<any>(null);
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item;
    }

    private getWidgetsInterfaceNames(): string[] {
        return ['com.enonic.xp.content-manager.context-widget', 'contentstudio.detailpanel'];
    }

    updateActiveWidget(): wemQ.Promise<any> {
        if (ContextView.debug) {
            console.debug('ContextView.updateWidgetsForItem');
        }

        if (!this.activeWidget) {
            return wemQ<any>(null);
        }

        this.updateViewer();

        return this.activeWidget.updateWidgetItemViews().then(() => {
            // update active widget's height
            setTimeout(() => {
                this.setContextContainerHeight();
            }, 400);

            this.activeWidget.slideIn();
        });
    }

    public showLoadMask() {
        this.loadMask.show();
    }

    public hideLoadMask() {
        this.loadMask.hide();
    }

    private initCommonWidgetViews() {

        this.defaultWidgetView = WidgetView.create().setName(i18n('field.contextPanel')).setContextView(this)
            .setWidgetItemViews([
                new StatusWidgetItemView(),
                new UserAccessWidgetItemView(),
                new PropertiesWidgetItemView(),
                new PageTemplateWidgetItemView(),
                new AttachmentsWidgetItemView()
            ]).build();

        const versionsWidgetView = WidgetView.create().setName(i18n('field.contextPanel.versionHistory')).setContextView(this)
            .addWidgetItemView(new VersionsWidgetItemView()).build();

        const dependenciesWidgetView = WidgetView.create().setName(i18n('field.contextPanel.dependencies')).setContextView(this)
            .addWidgetItemView(new DependenciesWidgetItemView()).build();

        dependenciesWidgetView.addClass('dependency-widget');

        this.addWidgets([this.defaultWidgetView, versionsWidgetView, dependenciesWidgetView]);

        this.setActiveWidget(this.defaultWidgetView);
    }

    private fetchCustomWidgetViews(): wemQ.Promise<Widget[]> {
        let getWidgetsByInterfaceRequest = new GetWidgetsByInterfaceRequest(this.getWidgetsInterfaceNames());

        return getWidgetsByInterfaceRequest.sendAndParse();
    }

    private fetchAndInitCustomWidgetViews(): wemQ.Promise<any> {
        return this.fetchCustomWidgetViews().then((widgets: Widget[]) => {
            widgets.forEach((widget) => {
                let widgetView = WidgetView.create().setName(widget.getDisplayName()).setContextView(this).setWidget(widget).build();
                this.addWidget(widgetView);
            });
        }).catch((reason: any) => {
            const msg = reason ? reason.message : i18n('notify.widget.error');
            api.notify.showError(msg);
        });
    }

    private fetchWidgetByKey(key: string): wemQ.Promise<Widget>  {
        return this.fetchCustomWidgetViews().then((widgets: Widget[]) => {
            for (let i = 0; i < widgets.length; i++) {
                if (widgets[i].getWidgetDescriptorKey().getApplicationKey().getName() === key) {
                    return widgets[i];
                }
            }
            return null;
        }).catch((reason: any) => {
            const msg = reason ? reason.message : i18n('notify.widget.error');
            api.notify.showError(msg);
            return null;
        });
    }

    setContextContainerHeight() {
        let panelHeight = ActiveContextPanelManager.getActiveContextPanel().getEl().getHeight();
        let panelOffset = ActiveContextPanelManager.getActiveContextPanel().getEl().getOffsetToParent();
        let containerHeight = this.contextContainer.getEl().getHeight();
        let containerOffset = this.contextContainer.getEl().getOffsetToParent();

        if (containerOffset.top > 0 && containerHeight !== (panelHeight - panelOffset.top - containerOffset.top)) {
            this.contextContainer.getEl().setHeightPx(panelHeight - panelOffset.top - containerOffset.top);
        }
    }

    private getWidgetByKey(key: string): WidgetView {
        for (let i = 0; i < this.widgetViews.length; i++) {
            if (this.widgetViews[i].getWidgetKey() === key) {
                return this.widgetViews[i];
            }
        }
        return null;
    }

    private addWidget(widget: WidgetView) {
        this.widgetViews.push(widget);
        this.contextContainer.appendChild(widget);
    }

    private addWidgets(widgetViews: WidgetView[]) {
        widgetViews.forEach((widget) => {
            this.addWidget(widget);
        });
    }

    private removeWidgetByKey(key: string) {
        const widget = this.getWidgetByKey(key);
        if (widget) {
            this.widgetViews = this.widgetViews.filter((view) => view !== widget);
            widget.remove();
        }
    }

    private updateWidget(widget: WidgetView) {
        for (let i = 0; i < this.widgetViews.length; i++) {
            if (this.widgetViews[i].getWidgetName() === widget.getWidgetName()) {
                this.widgetViews[i].replaceWith(widget);
                this.widgetViews[i] = widget;
                break;
            }
        }
    }

    updateViewer() {
        if (this.item) {
            this.viewer.setObject(this.item.getContentSummary());
        }
    }

    private layout(empty: boolean = true) {
        this.contextContainer.setVisible(!empty);
        this.toggleClass('no-selection', empty);
    }

    onPanelSizeChanged(listener: () => void) {
        this.sizeChangedListeners.push(listener);
    }

    notifyPanelSizeChanged() {
        this.sizeChangedListeners.forEach((listener: ()=> void) => listener());
    }
}
