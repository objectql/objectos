export interface Driver {
    find(objectName: string, query: any): Promise<any[]>;
    findOne(objectName: string, id: string | number, query?: any): Promise<any>;
    create(objectName: string, data: any): Promise<any>;
    update(objectName: string, id: string | number, data: any): Promise<any>;
    delete(objectName: string, id: string | number): Promise<any>;
    count(objectName: string, filters: any): Promise<number>;
    
    // Advanced
    aggregate?(objectName: string, query: any): Promise<any>;
    distinct?(objectName: string, field: string, filters?: any): Promise<any[]>;
    
    // Bulk / Atomic
    createMany?(objectName: string, data: any[]): Promise<any>;
    updateMany?(objectName: string, filters: any, data: any): Promise<any>;
    deleteMany?(objectName: string, filters: any): Promise<any>;
    findOneAndUpdate?(objectName: string, filters: any, update: any, options?: any): Promise<any>;
}
