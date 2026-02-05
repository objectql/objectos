import type { Plugin, PluginContext } from '@objectstack/runtime';

// Define rough shape of SteedosEngine to avoid direct dependency for now
type Engine = any; 

export class ObjectQLPlugin implements Plugin {
    name = '@objectos/plugin-objectql';
    version = '0.1.0';
    dependencies: string[] = [];

    private context?: PluginContext;
    private engine: Engine;

    constructor() {
        // In a real scenario, we would import SteedosEngine from @objectql/core
        // For now, we simulate it or try to require it if available
        try {
            // @ts-ignore
            const { SteedosEngine } = require('@objectql/core');
            this.engine = new SteedosEngine();
        } catch (e) {
            console.warn('[ObjectQLPlugin] @objectql/core not found, using Mock Engine');
            this.engine = new MockEngine();
        }
    }

    async init(context: PluginContext): Promise<void> {
        this.context = context;
        context.logger.info('[ObjectQL Plugin] Initializing...');

        // 1. Create a Proxy around the Engine to intercept calls from @objectql/server (REST API)
        const engineProxy = this.createEngineProxy(this.engine, context);

        // 2. Register 'objectql' service for calls expecting the Engine (server, drivers)
        context.registerService('objectql', engineProxy);

        // 3. Register 'data' service for Kernel Plugins (Event-driven, Payload-based)
        context.registerService('data', {
            create: async (payload: any) => engineProxy.insert(payload.object, payload.doc, payload.user),
            update: async (payload: any) => engineProxy.update(payload.object, payload.id, payload.doc, payload.user),
            delete: async (payload: any) => engineProxy.delete(payload.object, payload.id, payload.user),
            find: async (payload: any) => engineProxy.find(payload.object, payload.query, payload.user),
            get: async (payload: any) => engineProxy.findOne(payload.object, payload.id, payload.user),
            count: async (payload: any) => 0
        });

        context.logger.info('[ObjectQL Plugin] Services registered: data, objectql');
    }

    async start(context: PluginContext): Promise<void> {
        context.logger.info('[ObjectQL Plugin] Started');
    }

    async stop(): Promise<void> {
    }

    private createEngineProxy(engine: any, context: PluginContext) {
        const handler = {
            get: (target: any, prop: string) => {
                const originalMethod = target[prop];
                
                if (typeof originalMethod === 'function') {
                    // Intercept INSERT (create)
                    if (prop === 'insert' || prop === 'create') {
                        return async (object: string, doc: any, user: any) => {
                            // Tenant Injection
                            if (user?.spaceId) {
                                doc.space = user.spaceId;
                            }
                            
                            // Context for Hook
                            const hookPayload = { object, doc, user, tenantId: user?.spaceId };
                            await context.trigger('data.beforeCreate', hookPayload);

                            // Execute Generic or Real Move
                            let result;
                            if (target instanceof MockEngine) {
                                result = await originalMethod.apply(target, [object, doc, user]);
                            } else {
                                // Real engine
                                result = await originalMethod.apply(target, [object, doc, user]);
                            }

                            // Post Hook
                            await context.trigger('data.afterCreate', { ...hookPayload, doc: result });
                            return result;
                        };
                    }

                    // Intercept UPDATE
                    if (prop === 'update') {
                        return async (object: string, id: string | any, doc: any, user: any) => {
                            const realId = typeof id === 'string' ? id : id.id;
                            const hookPayload = { object, id: realId, doc, previous: { id: realId }, user, tenantId: user?.spaceId };
                            
                            await context.trigger('data.beforeUpdate', hookPayload);
                            const result = await originalMethod.apply(target, [object, id, doc, user]);
                            await context.trigger('data.afterUpdate', { ...hookPayload, doc: result });
                            return result;
                        };
                    }

                    // Intercept DELETE
                    if (prop === 'delete') {
                        return async (object: string, id: string | any, user: any) => {
                            const realId = typeof id === 'string' ? id : id.id;
                            await context.trigger('data.beforeDelete', { object, id: realId, user, tenantId: user?.spaceId });
                            const result = await originalMethod.apply(target, [object, id, user]);
                            await context.trigger('data.afterDelete', { object, id: realId, user, tenantId: user?.spaceId });
                            return result;
                        };
                    }
                    
                    // Intercept FIND
                     if (prop === 'find') {
                        return async (object: string, query: any, user: any) => {
                            await context.trigger('data.beforeFind', { object, query, user, tenantId: user?.spaceId });
                            return originalMethod.apply(target, [object, query, user]);
                        };
                    }
                }

                return Reflect.get(target, prop);
            }
        };

        return new Proxy(engine, handler);
    }
}

class MockEngine {
    constructor() {}
    getDataSource() { return { objects: {} }; } 
    
    async insert(object: string, doc: any, user: any) {
        console.log(`[MockEngine] INSERT ${object}`, doc);
        return { id: 'mock_id_' + Date.now(), ...doc };
    }
    async update(object: string, id: string, doc: any, user: any) {
        console.log(`[MockEngine] UPDATE ${object} ${id}`, doc);
        return { id, ...doc };
    }
    async delete(object: string, id: string, user: any) {
        console.log(`[MockEngine] DELETE ${object} ${id}`);
        return true;
    }
    async find(object: string, query: any, user: any) {
        console.log(`[MockEngine] FIND ${object}`, query);
        return [];
    }
    async findOne(object: string, id: string, user: any) {
        console.log(`[MockEngine] GET ${object} ${id}`);
        return { id };
    }
}
