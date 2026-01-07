import { Driver } from '@objectql/core';

export class KnexDriver implements Driver {
    constructor(config: any) {}

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        throw new Error('Method not implemented.');
    }
    async findOne(objectName: string, id: string | number, query?: any, options?: any) {
        throw new Error('Method not implemented.');
    }
    async create(objectName: string, data: any, options?: any) {
        throw new Error('Method not implemented.');
    }
    async update(objectName: string, id: string | number, data: any, options?: any) {
        throw new Error('Method not implemented.');
    }
    async delete(objectName: string, id: string | number, options?: any) {
        throw new Error('Method not implemented.');
    }
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        throw new Error('Method not implemented.');
    }
}

