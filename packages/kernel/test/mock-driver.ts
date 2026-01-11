import { Driver } from '@objectql/types';

/**
 * Mock driver for testing purposes
 */
export class MockDriver implements Driver {
    private data: Map<string, any[]> = new Map();
    public syncCalls: string[] = [];

    async connect(): Promise<void> {
        // Mock connection
    }

    async disconnect(): Promise<void> {
        // Mock disconnection
        this.data.clear();
    }

    async find(objectName: string, query: any = {}, options: any = {}): Promise<any[]> {
        const records = this.data.get(objectName) || [];
        let filtered = records;

        // Apply filters if provided
        if (query.filters) {
            filtered = records.filter(record => {
                return this.matchFilters(record, query.filters);
            });
        }

        // Apply sorting if provided
        if (query.sort && Array.isArray(query.sort)) {
            filtered = [...filtered].sort((a, b) => {
                for (const [field, order] of query.sort!) {
                    const aVal = a[field];
                    const bVal = b[field];
                    if (aVal < bVal) return order === 'asc' ? -1 : 1;
                    if (aVal > bVal) return order === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        // Apply limit if provided
        if (query.limit !== undefined) {
            filtered = filtered.slice(0, query.limit);
        }

        return filtered;
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any | null> {
        const records = this.data.get(objectName) || [];
        return records.find(r => r._id === id) || null;
    }

    async create(objectName: string, data: any, options?: any): Promise<any> {
        const records = this.data.get(objectName) || [];
        const newRecord = { 
            ...data, 
            _id: data._id || `id_${Date.now()}_${Math.random()}` 
        };
        records.push(newRecord);
        this.data.set(objectName, records);
        return newRecord;
    }

    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const records = this.data.get(objectName) || [];
        const index = records.findIndex(r => r._id === id);
        if (index === -1) {
            throw new Error(`Record not found: ${id}`);
        }
        records[index] = { ...records[index], ...data };
        this.data.set(objectName, records);
        return records[index];
    }

    async delete(objectName: string, id: string | number, options?: any): Promise<void> {
        const records = this.data.get(objectName) || [];
        const filtered = records.filter(r => r._id !== id);
        this.data.set(objectName, filtered);
    }

    async count(objectName: string, filters: any = {}, options?: any): Promise<number> {
        const results = await this.find(objectName, { filters }, options);
        return results.length;
    }

    async init(objects: any[]): Promise<void> {
        // Initialize objects
        for (const obj of objects) {
            if (!this.data.has(obj.name)) {
                this.data.set(obj.name, []);
            }
        }
    }

    private matchFilters(record: any, filters: any[]): boolean {
        if (!Array.isArray(filters) || filters.length === 0) {
            return true;
        }

        // Simple filter matching - in real implementation this would be more complex
        return filters.every(filter => {
            if (Array.isArray(filter)) {
                const [field, operator, value] = filter;
                const recordValue = record[field];
                
                switch (operator) {
                    case '=':
                    case 'eq':
                        return recordValue === value;
                    case '!=':
                    case 'ne':
                        return recordValue !== value;
                    case '>':
                    case 'gt':
                        return recordValue > value;
                    case '>=':
                    case 'gte':
                        return recordValue >= value;
                    case '<':
                    case 'lt':
                        return recordValue < value;
                    case '<=':
                    case 'lte':
                        return recordValue <= value;
                    default:
                        return true;
                }
            }
            return true;
        });
    }

    // Helper method to seed data for tests
    seedData(objectName: string, records: any[]): void {
        this.data.set(objectName, records.map((r, i) => ({ 
            ...r, 
            _id: r._id || `seed_${i}` 
        })));
    }
}
