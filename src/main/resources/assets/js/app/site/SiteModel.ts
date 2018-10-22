import {ApplicationAddedEvent} from './ApplicationAddedEvent';
import {ApplicationRemovedEvent} from './ApplicationRemovedEvent';
import {Site} from '../content/Site';
import ApplicationKey = api.application.ApplicationKey;
import ApplicationEvent = api.application.ApplicationEvent;
import ApplicationEventType = api.application.ApplicationEventType;
import ApplicationConfig = api.application.ApplicationConfig;
import ObjectHelper = api.ObjectHelper;

export class SiteModel {

    private site: Site;

    private siteConfigs: ApplicationConfig[];

    private applicationAddedListeners: { (event: ApplicationAddedEvent): void }[] = [];

    private applicationRemovedListeners: { (event: ApplicationRemovedEvent): void }[] = [];

    private propertyChangedListeners: { (event: api.PropertyChangedEvent): void }[] = [];

    private applicationPropertyAddedListener: (event: api.data.PropertyAddedEvent) => void;

    private applicationPropertyRemovedListener: (event: api.data.PropertyRemovedEvent) => void;

    private applicationGlobalEventsListener: (event: ApplicationEvent) => void;

    private applicationUnavailableListeners: { (applicationEvent: ApplicationEvent): void }[] = [];

    private applicationStartedListeners: { (applicationEvent: ApplicationEvent): void }[] = [];

    private siteModelUpdatedListeners: { (): void }[] = [];

    constructor(site: Site) {
        this.initApplicationPropertyListeners();
        this.setup(site);
    }

    private initApplicationPropertyListeners() {
        this.applicationPropertyAddedListener = (event: api.data.PropertyAddedEvent) => {
            let property: api.data.Property = event.getProperty();

            if (property.getPath().toString().indexOf('.siteConfig') === 0 && property.getName() === 'config') {
                let siteConfig: ApplicationConfig = api.application.ApplicationConfig.create().fromData(property.getParent()).build();
                if (!this.siteConfigs) {
                    this.siteConfigs = [];
                }
                this.siteConfigs.push(siteConfig);
                this.notifyApplicationAdded(siteConfig);
            }
        };

        this.applicationPropertyRemovedListener = (event: api.data.PropertyRemovedEvent) => {
            let property: api.data.Property = event.getProperty();
            if (property.getName() === 'siteConfig') {
                let applicationKey = ApplicationKey.fromString(property.getPropertySet().getString('applicationKey'));
                this.siteConfigs = this.siteConfigs.filter((siteConfig: ApplicationConfig) =>
                    !siteConfig.getApplicationKey().equals(applicationKey)
                );
                this.notifyApplicationRemoved(applicationKey);
            }
        };

        this.applicationGlobalEventsListener = (event: ApplicationEvent) => {
            if (ApplicationEventType.STOPPED === event.getEventType()) {
                this.notifyApplicationUnavailable(event);
            } else if (ApplicationEventType.STARTED === event.getEventType()) {
                this.notifyApplicationStarted(event);
            }
        };
    }

    private setup(site: Site) {
        this.site = site;
        this.siteConfigs = site.getSiteConfigs();
        this.site.getContentData().onPropertyAdded(this.applicationPropertyAddedListener);
        this.site.getContentData().onPropertyRemoved(this.applicationPropertyRemovedListener);
        ApplicationEvent.on(this.applicationGlobalEventsListener);
    }

    update(site: Site): SiteModel {
        const changed = !ObjectHelper.equals(site, this.site);

        if (this.site) {
            this.site.getContentData().unPropertyAdded(this.applicationPropertyAddedListener);
            this.site.getContentData().unPropertyRemoved(this.applicationPropertyRemovedListener);
            ApplicationEvent.un(this.applicationGlobalEventsListener);
        }

        if (site) {
            this.setup(site);
        }

        if (changed) {
            this.notifySiteModelUpdated();
        }

        return this;
    }

    getSite(): Site {
        return this.site;
    }

    getSiteId(): api.content.ContentId {
        return this.site.getContentId();
    }

    getApplicationKeys(): ApplicationKey[] {
        return this.siteConfigs.map((sc: ApplicationConfig) => sc.getApplicationKey());
    }

    onPropertyChanged(listener: (event: api.PropertyChangedEvent) => void) {
        this.propertyChangedListeners.push(listener);
    }

    unPropertyChanged(listener: (event: api.PropertyChangedEvent) => void) {
        this.propertyChangedListeners =
            this.propertyChangedListeners.filter((curr: (event: api.PropertyChangedEvent) => void) => {
                return listener !== curr;
            });
    }

    onApplicationAdded(listener: (event: ApplicationAddedEvent) => void) {
        this.applicationAddedListeners.push(listener);
    }

    unApplicationAdded(listener: (event: ApplicationAddedEvent) => void) {
        this.applicationAddedListeners =
            this.applicationAddedListeners.filter((curr: (event: ApplicationAddedEvent) => void) => {
                return listener !== curr;
            });
    }

    private notifyApplicationAdded(siteConfig: ApplicationConfig) {
        let event = new ApplicationAddedEvent(siteConfig);
        this.applicationAddedListeners.forEach((listener: (event: ApplicationAddedEvent) => void) => {
            listener(event);
        });
    }

    onApplicationRemoved(listener: (event: ApplicationRemovedEvent) => void) {
        this.applicationRemovedListeners.push(listener);
    }

    unApplicationRemoved(listener: (event: ApplicationRemovedEvent) => void) {
        this.applicationRemovedListeners =
            this.applicationRemovedListeners.filter((curr: (event: ApplicationRemovedEvent) => void) => {
                return listener !== curr;
            });
    }

    private notifyApplicationRemoved(applicationKey: ApplicationKey) {
        let event = new ApplicationRemovedEvent(applicationKey);
        this.applicationRemovedListeners.forEach((listener: (event: ApplicationRemovedEvent) => void) => {
            listener(event);
        });
    }

    onApplicationUnavailable(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationUnavailableListeners.push(listener);
    }

    unApplicationUnavailable(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationUnavailableListeners =
            this.applicationUnavailableListeners.filter((curr: (applicationEvent: ApplicationEvent) => void) => {
                return listener !== curr;
            });
    }

    private notifyApplicationUnavailable(applicationEvent: ApplicationEvent) {
        this.applicationUnavailableListeners.forEach((listener: (applicationEvent: ApplicationEvent) => void) => {
            listener(applicationEvent);
        });
    }

    onApplicationStarted(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationStartedListeners.push(listener);
    }

    unApplicationStarted(listener: (applicationEvent: ApplicationEvent) => void) {
        this.applicationStartedListeners =
            this.applicationStartedListeners.filter((curr: (applicationEvent: ApplicationEvent) => void) => {
                return listener !== curr;
            });
    }

    private notifyApplicationStarted(applicationEvent: ApplicationEvent) {
        this.applicationStartedListeners.forEach((listener: (applicationEvent: ApplicationEvent) => void) => {
            listener(applicationEvent);
        });
    }

    onSiteModelUpdated(listener: () => void) {
        this.siteModelUpdatedListeners.push(listener);
    }

    unSiteModelUpdated(listener: () => void) {
        this.siteModelUpdatedListeners =
            this.siteModelUpdatedListeners.filter((curr: () => void) => {
                return listener !== curr;
            });
    }

    private notifySiteModelUpdated() {
        this.siteModelUpdatedListeners.forEach((listener: () => void) => {
            listener();
        });
    }
}
