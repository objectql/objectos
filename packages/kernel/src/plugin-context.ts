/**
 * Plugin Context Builder
 * 
 * Creates PluginContext instances that provide plugins with access to
 * ObjectStack APIs according to @objectstack/spec/kernel.
 */

import type { PluginContextData } from '@objectstack/spec/kernel';
import type { IObjectQL } from '@objectql/types';
import { Logger, createLogger } from './logger';
import { ScopedStorage } from './scoped-storage';

/**
 * System API implementation for plugins.
 */
class SystemAPI {
    private currentUser: any = null;
    private config: Map<string, any> = new Map();

    async getCurrentUser(): Promise<any> {
        // TODO: Implement actual user context retrieval
        return this.currentUser;
    }

    async getConfig(key: string): Promise<any> {
        return this.config.get(key);
    }

    setCurrentUser(user: any): void {
        this.currentUser = user;
    }

    setConfig(key: string, value: any): void {
        this.config.set(key, value);
    }
}

/**
 * I18n implementation for plugins.
 */
class I18nContext {
    private locale: string = 'en';
    private translations: Map<string, Map<string, string>> = new Map();

    t(key: string, params?: Record<string, any>): string {
        const localeTranslations = this.translations.get(this.locale);
        let text = localeTranslations?.get(key) || key;

        // Simple template replacement
        if (params) {
            Object.keys(params).forEach(paramKey => {
                text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey]));
            });
        }

        return text;
    }

    getLocale(): string {
        return this.locale;
    }

    setLocale(locale: string): void {
        this.locale = locale;
    }

    addTranslations(locale: string, translations: Record<string, string>): void {
        if (!this.translations.has(locale)) {
            this.translations.set(locale, new Map());
        }
        const localeMap = this.translations.get(locale)!;
        Object.entries(translations).forEach(([key, value]) => {
            localeMap.set(key, value);
        });
    }
}

/**
 * Router implementation for HTTP route registration.
 */
class Router {
    private routes: Map<string, any> = new Map();

    get(path: string, handler: (...args: unknown[]) => unknown): void {
        this.routes.set(`GET:${path}`, handler);
    }

    post(path: string, handler: (...args: unknown[]) => unknown): void {
        this.routes.set(`POST:${path}`, handler);
    }

    put(path: string, handler: (...args: unknown[]) => unknown): void {
        this.routes.set(`PUT:${path}`, handler);
    }

    patch(path: string, handler: (...args: unknown[]) => unknown): void {
        this.routes.set(`PATCH:${path}`, handler);
    }

    delete(path: string, handler: (...args: unknown[]) => unknown): void {
        this.routes.set(`DELETE:${path}`, handler);
    }

    use(pathOrHandler: string | ((...args: unknown[]) => unknown), handler?: (...args: unknown[]) => unknown): void {
        if (typeof pathOrHandler === 'function') {
            this.routes.set('MIDDLEWARE:*', pathOrHandler);
        } else if (handler) {
            this.routes.set(`MIDDLEWARE:${pathOrHandler}`, handler);
        }
    }

    getRoutes(): Map<string, any> {
        return this.routes;
    }
}

/**
 * Scheduler implementation for cron jobs.
 */
class Scheduler {
    private jobs: Map<string, any> = new Map();

    schedule(name: string, cronExpression: string, handler: (...args: unknown[]) => unknown): void {
        this.jobs.set(name, { cronExpression, handler });
    }

    unschedule(name: string): void {
        this.jobs.delete(name);
    }

    getJobs(): Map<string, any> {
        return this.jobs;
    }
}

/**
 * Event bus for inter-plugin communication.
 */
class EventBus {
    private listeners: Map<string, Set<Function>> = new Map();

    on(event: string, handler: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
    }

    off(event: string, handler: Function): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(handler);
        }
    }

    async emit(event: string, data: any): Promise<void> {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const logger = createLogger('EventBus');
            for (const handler of eventListeners) {
                try {
                    await handler(data);
                } catch (error) {
                    logger.error(`Error in event handler for '${event}'`, error as Error);
                }
            }
        }
    }

    getListeners(event: string): Set<Function> | undefined {
        return this.listeners.get(event);
    }
}

/**
 * ObjectQL Client wrapper for plugins.
 */
class ObjectQLClient {
    constructor(private ql: IObjectQL) {}

    object(name: string): any {
        return this.ql.getObject(name);
    }

    async query(objectName: string, options?: any): Promise<any> {
        const obj = this.ql.getObject(objectName);
        if (!obj) {
            throw new Error(`Object '${objectName}' not found`);
        }
        // Use the broker to query if available, otherwise call directly
        if ((this.ql as any).broker) {
            return (this.ql as any).broker.call('data.find', { 
                objectName, 
                options 
            });
        }
        // Fallback for direct query
        return (obj as any).find?.(options) || [];
    }
}

/**
 * Plugin Context Builder
 * 
 * Creates PluginContext instances for plugins.
 */
export class PluginContextBuilder {
    private ql: IObjectQL;
    private systemAPI: SystemAPI;
    private i18n: I18nContext;
    private router: Router;
    private scheduler: Scheduler;
    private eventBus: EventBus;
    private createStorage: (pluginId: string) => ScopedStorage;

    constructor(
        ql: IObjectQL,
        createStorage: (pluginId: string) => ScopedStorage
    ) {
        this.ql = ql;
        this.createStorage = createStorage;
        this.systemAPI = new SystemAPI();
        this.i18n = new I18nContext();
        this.router = new Router();
        this.scheduler = new Scheduler();
        this.eventBus = new EventBus();
    }

    /**
     * Build a PluginContext for a specific plugin.
     */
    build(pluginId: string): PluginContextData {
        const logger = createLogger(pluginId);
        const storage = this.createStorage(pluginId);
        const qlClient = new ObjectQLClient(this.ql);

        return {
            ql: {
                object: (name: string) => qlClient.object(name),
                query: async (objectName: string, options?: any) => qlClient.query(objectName, options),
            },
            os: {
                getCurrentUser: async () => this.systemAPI.getCurrentUser(),
                getConfig: async (key: string) => this.systemAPI.getConfig(key),
            },
            logger: {
                debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
                info: (message: string, context?: Record<string, any>) => logger.info(message, context),
                warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
                error: (message: string, error?: any) => logger.error(message, error),
            },
            storage: {
                get: async (key: string) => storage.get(key),
                set: async (key: string, value: any) => storage.set(key, value),
                delete: async (key: string) => storage.delete(key),
            },
            i18n: {
                t: (key: string, params?: Record<string, any>) => this.i18n.t(key, params),
                getLocale: () => this.i18n.getLocale(),
            },
            events: {
                on: (event: string, handler: Function) => this.eventBus.on(event, handler),
                emit: async (event: string, data: any) => this.eventBus.emit(event, data),
            },
            app: {
                router: {
                    get: (path: string, handler: (...args: unknown[]) => unknown) => 
                        this.router.get(path, handler),
                    post: (path: string, handler: (...args: unknown[]) => unknown) => 
                        this.router.post(path, handler),
                    use: (pathOrHandler?: string | ((...args: unknown[]) => unknown), handler?: (...args: unknown[]) => unknown) => 
                        this.router.use(pathOrHandler as any, handler),
                },
                scheduler: {
                    schedule: (name: string, cronExpression: string, handler: (...args: unknown[]) => unknown) => 
                        this.scheduler.schedule(name, cronExpression, handler),
                },
            },
            metadata: {
                getObject: (name: string) => {
                    const obj = this.ql.getObject(name);
                    return obj ? (obj as any).config : undefined;
                },
                listObjects: () => {
                    // Get all registered objects from metadata
                    const metadata = (this.ql as any).metadata;
                    if (metadata && metadata.getAll) {
                        const objects = metadata.getAll('object');
                        return objects.map((entry: any) => entry.id);
                    }
                    return [];
                },
            },
            drivers: {
                get: (name: string) => {
                    // TODO: Implement driver registry
                    return undefined;
                },
                register: (driver: any) => {
                    // TODO: Implement driver registration
                },
            },
        } as any as PluginContextData;
    }

    /**
     * Get the system API (for internal use).
     */
    getSystemAPI(): SystemAPI {
        return this.systemAPI;
    }

    /**
     * Get the router (for server integration).
     */
    getRouter(): Router {
        return this.router;
    }

    /**
     * Get the scheduler (for server integration).
     */
    getScheduler(): Scheduler {
        return this.scheduler;
    }

    /**
     * Get the event bus (for system-wide events).
     */
    getEventBus(): EventBus {
        return this.eventBus;
    }

    /**
     * Get the I18n context (for configuration).
     */
    getI18n(): I18nContext {
        return this.i18n;
    }
}
