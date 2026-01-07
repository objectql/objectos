import { Driver } from '@objectql/core';

export class MockDriver implements Driver {
    private data: Record<string, any[]> = {};
    
    constructor() {}

    private getData(objectName: string) {
        if (!this.data[objectName]) {
            this.data[objectName] = [];
        }
        return this.data[objectName];
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        const items = this.getData(objectName);
        let result = [...items];

        if (query.filters && query.filters.length > 0) {
            // Very basic filter: supports ['field', '=', 'value']
            // Doesn't support nested logic 'and'/'or' for this simple mock
            for (const filter of query.filters) {
                if (Array.isArray(filter) && filter.length === 3) {
                    const [field, op, val] = filter;
                    if (op === '=') {
                        result = result.filter(item => item[field] === val);
                    }
                }
            }
        }
        
        if (query.limit) {
            result = result.slice(0, query.limit);
        }

        return result;
    }

    async findOne(objectName: string, id: string | number, fields?: string[], options?: any): Promise<any> {
        const items = this.getData(objectName);
        return items.find(i => i._id === id || i.id === id);
    }

    async create(objectName: string, data: any, options?: any): Promise<any> {
        const items = this.getData(objectName);
        const newItem = { ...data };
        if (!newItem._id && !newItem.id) {
            newItem._id = Math.random().toString(36).substring(7);
            newItem.id = newItem._id;
        } else if (!newItem._id) {
            newItem._id = newItem.id;
        } else if (!newItem.id) {
            newItem.id = newItem._id;
        }
        items.push(newItem);
        return newItem;
    }

    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const items = this.getData(objectName);
        const idx = items.findIndex(i => i._id === id || i.id === id);
        if (idx >= 0) {
            const updated = { ...items[idx], ...data };
            items[idx] = updated;
            return updated;
        }
        return null;
    }

    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const items = this.getData(objectName);
        const idx = items.findIndex(i => i._id === id || i.id === id);
        if (idx >= 0) {
            const deleted = items[idx];
            items.splice(idx, 1);
            return deleted;
        }
        return null;
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        return (await this.find(objectName, { filters })).length;
    }
}
