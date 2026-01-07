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

    getSchema(): ObjectConfig {
        const obj = this.app.getObject(this.objectName);
        if (!obj) {
            throw new Error(`Object '${this.objectName}' not found`);
        }
        return obj;
    }

    async find(query: any = {}): Promise<any[]> {
        // TODO: Apply basic filters like spaceId
        return this.getDriver().find(this.objectName, query);
    }

    async findOne(idOrQuery: string | number | any): Promise<any> {
        if (typeof idOrQuery === 'string' || typeof idOrQuery === 'number') {
            return this.getDriver().findOne(this.objectName, idOrQuery);
        } else {
            // It's a query
            const results = await this.find(idOrQuery);
            return results[0];
        }
    }

    async count(filters: any): Promise<number> {
        return this.getDriver().count(this.objectName, filters);
    }

    async create(doc: any): Promise<any> {
        // TODO: Validate, triggers
        if (this.context.userId) {
            doc.created_by = this.context.userId;
        }
        if (this.context.spaceId) {
            doc.space_id = this.context.spaceId;
        }
        return this.getDriver().create(this.objectName, doc);
    }

    async update(id: string | number, doc: any, options?: any): Promise<any> {
        // TODO: Triggers
        return this.getDriver().update(this.objectName, id, doc);
    }

    async delete(id: string | number): Promise<any> {
        // TODO: Triggers
        return this.getDriver().delete(this.objectName, id);
    }

    async aggregate(query: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.aggregate) throw new Error("Driver does not support aggregate");
        return driver.aggregate(this.objectName, query);
    }

    async distinct(field: string, filters?: any): Promise<any[]> {
        const driver = this.getDriver();
        if (!driver.distinct) throw new Error("Driver does not support distinct");
        return driver.distinct(this.objectName, field, filters);
    }

    async findOneAndUpdate(filters: any, update: any, options?: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.findOneAndUpdate) throw new Error("Driver does not support findOneAndUpdate");
        return driver.findOneAndUpdate(this.objectName, filters, update, options);
    }

    async createMany(data: any[]): Promise<any> {
        // TODO: Triggers per record?
        const driver = this.getDriver();
        if (!driver.createMany) {
            // Fallback
            return Promise.all(data.map(d => this.create(d)));
        }
        return driver.createMany(this.objectName, data);
    }

    async updateMany(filters: any, data: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.updateMany) throw new Error("Driver does not support updateMany");
        return driver.updateMany(this.objectName, filters, data);
    }

    async deleteMany(filters: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.deleteMany) throw new Error("Driver does not support deleteMany");
        return driver.deleteMany(this.objectName, filters);
    }
}
}
