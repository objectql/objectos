export * from './metadata';
export * from './types';
export * from './driver';
export * from './repository';

import { ObjectConfig } from './metadata';
import { ObjectQLContext, ObjectQLContextOptions, IObjectQL } from './types';
import { ObjectRepository } from './repository';
import { Driver } from './driver';

export interface ObjectQLConfig {
    datasources: Record<string, Driver>;
    objects?: Record<string, ObjectConfig>;
}

export class ObjectQL implements IObjectQL {
    private objects: Record<string, ObjectConfig> = {};
    private datasources: Record<string, Driver> = {};

    constructor(config: ObjectQLConfig) {
        this.datasources = config.datasources;
        if (config.objects) {
            for (const obj of Object.values(config.objects)) {
                this.registerObject(obj);
            }
        }
    }

    createContext(options: ObjectQLContextOptions): ObjectQLContext {
        const ctx: ObjectQLContext = {
            userId: options.userId,
            spaceId: options.spaceId,
            roles: options.roles || [],
            isSystem: options.isSystem,
            ignoreTriggers: options.ignoreTriggers,
            object: (name: string) => {
                return new ObjectRepository(name, ctx, this);
            },
            transaction: async (callback) => {
                 const driver = this.datasources['default'];
                 if (!driver || !driver.beginTransaction) {
                      return callback(ctx);
                 }

                 let trx: any;
                 try {
                     trx = await driver.beginTransaction();
                 } catch (e) {
                     // If beginTransaction fails, fail.
                     throw e;
                 }

                 const trxCtx: ObjectQLContext = {
                     ...ctx,
                     transactionHandle: trx,
                     // Nested transaction simply reuses the current one (flat transaction)
                     transaction: async (cb) => cb(trxCtx)
                 };

                 try {
                     const result = await callback(trxCtx);
                     if (driver.commitTransaction) await driver.commitTransaction(trx);
                     return result;
                 } catch (error) {
                     if (driver.rollbackTransaction) await driver.rollbackTransaction(trx);
                     throw error;
                 }
            },
            sudo: () => {
                 return this.createContext({ ...options, isSystem: true });
            }
        };
        return ctx;
    }

    registerObject(object: ObjectConfig) {
        // Normalize fields
        if (object.fields) {
            for (const [key, field] of Object.entries(object.fields)) {
                if (!field.name) {
                    field.name = key;
                }
            }
        }
        this.objects[object.name] = object;
    }

    getObject(name: string): ObjectConfig | undefined {
        return this.objects[name];
    }

    datasource(name: string): Driver {
        const driver = this.datasources[name];
        if (!driver) {
            throw new Error(`Datasource '${name}' not found`);
        }
        return driver;
    }
}
