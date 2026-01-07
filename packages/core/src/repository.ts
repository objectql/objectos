import { ObjectQLContext, IObjectQL } from './types';
import { ObjectConfig, FieldConfig } from './metadata';
import { Driver } from './driver';

export class ObjectRepository {
    constructor(
        private objectName: string,
        private context: ObjectQLContext,
        private app: IObjectQL
    ) {}

    private getDriver(): Driver {
        const obj = this.getSchema();
        const datasourceName = obj.datasource || 'default';
        return this.app.datasource(datasourceName);
    }

    private getOptions(extra: any = {}) {
        return {
            transaction: this.context.transactionHandle,
            ...extra
        };
    }

    getSchema(): ObjectConfig {
        const obj = this.app.getObject(this.objectName);
        if (!obj) {
            throw new Error(`Object '${this.objectName}' not found`);
        }
        return obj;
    }

    async find(query: any = {}): Promise<any[]> {
        // TODO: Apply basic filters like spaceId
        return this.getDriver().find(this.objectName, query, this.getOptions());
    }

    async findOne(idOrQuery: string | number | any): Promise<any> {
        if (typeof idOrQuery === 'string' || typeof idOrQuery === 'number') {
            return this.getDriver().findOne(this.objectName, idOrQuery, undefined, this.getOptions());
        } else {
            // It's a query
            const results = await this.find(idOrQuery);
            return results[0] || null;
        }
    }

    async count(filters: any): Promise<number> {
        return this.getDriver().count(this.objectName, filters, this.getOptions());
    }

    async create(doc: any): Promise<any> {
        const obj = this.getSchema();
        // Auto-fill
        if (this.context.userId) {
            doc.created_by = this.context.userId;
        }
        if (this.context.spaceId) {
            doc.space_id = this.context.spaceId;
        }

        // Triggers: beforeCreate
        if (!this.context.ignoreTriggers && obj.listeners?.beforeCreate) {
             await obj.listeners.beforeCreate(this.context, doc);
        }

        const result = await this.getDriver().create(this.objectName, doc, this.getOptions());

        // Triggers: afterCreate
        if (!this.context.ignoreTriggers && obj.listeners?.afterCreate) {
             await obj.listeners.afterCreate(this.context, result);
        }
        return result;
    }

    async update(id: string | number, doc: any, options?: any): Promise<any> {
        const obj = this.getSchema();
        
        // Triggers: beforeUpdate
        if (!this.context.ignoreTriggers && obj.listeners?.beforeUpdate) {
             await obj.listeners.beforeUpdate(this.context, doc);
        }

        const result = await this.getDriver().update(this.objectName, id, doc, this.getOptions(options));

        // Triggers: afterUpdate
        if (!this.context.ignoreTriggers && obj.listeners?.afterUpdate) {
             await obj.listeners.afterUpdate(this.context, doc); 
        }
        return result;
    }

    async delete(id: string | number): Promise<any> {
         const obj = this.getSchema();
        // Triggers: beforeDelete
        if (!this.context.ignoreTriggers && obj.listeners?.beforeDelete) {
             await obj.listeners.beforeDelete(this.context, { id });
        }

        const result = await this.getDriver().delete(this.objectName, id, this.getOptions());

        // Triggers: afterDelete
        if (!this.context.ignoreTriggers && obj.listeners?.afterDelete) {
             await obj.listeners.afterDelete(this.context, { id });
        }
        return result;
    }

    async aggregate(query: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.aggregate) throw new Error("Driver does not support aggregate");
        return driver.aggregate(this.objectName, query, this.getOptions());
    }

    async distinct(field: string, filters?: any): Promise<any[]> {
        const driver = this.getDriver();
        if (!driver.distinct) throw new Error("Driver does not support distinct");
        return driver.distinct(this.objectName, field, filters, this.getOptions());
    }

    async findOneAndUpdate(filters: any, update: any, options?: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.findOneAndUpdate) throw new Error("Driver does not support findOneAndUpdate");
        return driver.findOneAndUpdate(this.objectName, filters, update, this.getOptions(options));
    }

    async createMany(data: any[]): Promise<any> {
        // TODO: Triggers per record?
        const driver = this.getDriver();
        if (!driver.createMany) {
            // Fallback
            const results = [];
            for (const item of data) {
                results.push(await this.create(item));
            }
            return results;
        }
        return driver.createMany(this.objectName, data, this.getOptions());
    }

    async updateMany(filters: any, data: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.updateMany) throw new Error("Driver does not support updateMany");
        return driver.updateMany(this.objectName, filters, data, this.getOptions());
    }

    async deleteMany(filters: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.deleteMany) throw new Error("Driver does not support deleteMany");
        return driver.deleteMany(this.objectName, filters, this.getOptions());
    }

    async call(actionName: string, params: any): Promise<any> {
        const obj = this.getSchema();
        const action = obj.actions?.[actionName];
        if (!action) {
            throw new Error(`Action '${actionName}' not found on object '${this.objectName}'`);
        }
        if (action.handler) {
            return action.handler(this.context, params);
        }
        throw new Error(`Action '${actionName}' has no handler`);
    }
}
