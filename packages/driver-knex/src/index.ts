import { Driver } from '@objectql/core';
import knex, { Knex } from 'knex';

export class KnexDriver implements Driver {
    private knex: Knex;
    private config: any;

    constructor(config: any) {
        this.config = config;
        this.knex = knex(config);
    }

    private getBuilder(objectName: string, options?: any) {
        let builder = this.knex(objectName);
        if (options?.transaction) {
            builder = builder.transacting(options.transaction);
        }
        return builder;
    }

    private applyFilters(builder: Knex.QueryBuilder, filters: any) {
        if (!filters || filters.length === 0) return;

        // Simple linear parser handling [cond, 'or', cond, 'and', cond]
        // Default join is AND.
        let nextJoin = 'and';

        for (const item of filters) {
             if (typeof item === 'string') {
                 if (item.toLowerCase() === 'or') nextJoin = 'or';
                 else if (item.toLowerCase() === 'and') nextJoin = 'and';
                 continue;
             }

             if (Array.isArray(item)) {
                 const [field, op, value] = item;
                 
                 // Handle specific operators that map to different knex methods
                 const apply = (b: any) => {
                     // b is the builder to apply on (could be root or a where clause)
                     // But here we call directly on builder using 'where' or 'orWhere'
                     
                     // Method selection
                     let method = nextJoin === 'or' ? 'orWhere' : 'where';
                     let methodIn = nextJoin === 'or' ? 'orWhereIn' : 'whereIn';
                     let methodNotIn = nextJoin === 'or' ? 'orWhereNotIn' : 'whereNotIn';

                     switch (op) {
                         case '=': b[method](field, value); break;
                         case '!=': b[method](field, '<>', value); break;
                         case 'in': b[methodIn](field, value); break;
                         case 'nin': b[methodNotIn](field, value); break;
                         case 'contains': b[method](field, 'like', `%${value}%`); break; // Simple LIKE
                         default: b[method](field, op, value);
                     }
                 };

                 apply(builder);
                 
                 // Reset join to 'and' for subsequent terms unless strictly specified?
                 // In SQL `A or B and C` means `A or (B and C)`.
                 // If we chain `.where(A).orWhere(B).where(C)` in Knex:
                 // It produces `... WHERE A OR B AND C`.
                 // So linear application matches SQL precedence usually if implicit validation is ok.
                 // But explicit AND after OR is necessary in our array format.
                 nextJoin = 'and'; 
             }
        }
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        const builder = this.getBuilder(objectName, options);
        
        if (query.fields) {
            builder.select(query.fields);
        } else {
            builder.select('*');
        }

        if (query.filters) {
            this.applyFilters(builder, query.filters);
        }

        if (query.sort) {
            for (const [field, dir] of query.sort) {
                builder.orderBy(field, dir);
            }
        }

        if (query.skip) builder.offset(query.skip);
        if (query.limit) builder.limit(query.limit);

        return await builder;
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any) {
        if (id) {
            return await this.getBuilder(objectName, options).where('id', id).first();
        }
        if (query) {
             const results = await this.find(objectName, { ...query, limit: 1 }, options);
             return results[0];
        }
        return null;
    }

    async create(objectName: string, data: any, options?: any) {
        // Knex insert returns Result array (e.g. ids)
        // We want the created document. 
        // Some DBs support .returning('*'), others don't easily.
        // Assuming Postgres/SQLite/Modern MySQL for now support returning.
        const builder = this.getBuilder(objectName, options);
        const result = await builder.insert(data).returning('*'); // This might fail on old MySQL
        return result[0];
    }

    async update(objectName: string, id: string | number, data: any, options?: any) {
        const builder = this.getBuilder(objectName, options);
        await builder.where('id', id).update(data);
        return { id, ...data }; // Return patched data? Or fetch fresh?
    }

    async delete(objectName: string, id: string | number, options?: any) {
        const builder = this.getBuilder(objectName, options);
        return await builder.where('id', id).delete();
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const builder = this.getBuilder(objectName, options);
        if (filters) {
            this.applyFilters(builder, filters);
        }
        const result = await builder.count<{count: number}[]>('* as count');
        // result is usually [{count: 123}] or similar depending on driver
        if (result && result.length > 0) {
            const row: any = result[0];
            return Number(row.count || row['count(*)']);
        }
        return 0;
    }

    // Transaction Support
    async beginTransaction(): Promise<any> {
        return await this.knex.transaction();
    }

    async commitTransaction(trx: Knex.Transaction): Promise<void> {
        await trx.commit();
    }

    async rollbackTransaction(trx: Knex.Transaction): Promise<void> {
        await trx.rollback();
    }
    
    // Bulk
    async createMany(objectName: string, data: any[], options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        return await builder.insert(data).returning('*');
    }
    
    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        if(filters) this.applyFilters(builder, filters);
        return await builder.update(data);
    }
    
    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        if(filters) this.applyFilters(builder, filters);
        return await builder.delete();
    }

    async init(objects: any[]): Promise<void> {
        await this.ensureDatabaseExists();

        for (const obj of objects) {
            const tableName = obj.name;
            const exists = await this.knex.schema.hasTable(tableName);
            
            if (!exists) {
                await this.knex.schema.createTable(tableName, (table) => {
                    table.string('id').primary(); 
                    table.timestamp('created_at').defaultTo(this.knex.fn.now());
                    table.timestamp('updated_at').defaultTo(this.knex.fn.now());
                    if (obj.fields) {
                        for (const [name, field] of Object.entries(obj.fields)) {
                            this.createColumn(table, name, field);
                        }
                    }
                });
                console.log(`[KnexDriver] Created table '${tableName}'`);
            } else {
                 const columnInfo = await this.knex(tableName).columnInfo();
                 const existingColumns = Object.keys(columnInfo);
                 
                 await this.knex.schema.alterTable(tableName, (table) => {
                     if (obj.fields) {
                         for (const [name, field] of Object.entries(obj.fields)) {
                             if (!existingColumns.includes(name)) {
                                 this.createColumn(table, name, field);
                                 console.log(`[KnexDriver] Added column '${name}' to '${tableName}'`);
                             }
                         }
                     }
                 });
            }
        }
    }

    private createColumn(table: Knex.CreateTableBuilder, name: string, field: any) {
        const type = field.type || 'string';
        let col;
        switch(type) {
            case 'string': col = table.string(name); break;
            case 'text': col = table.text(name); break;
            case 'integer': 
            case 'int': col = table.integer(name); break;
            case 'float': 
            case 'number': col = table.float(name); break;
            case 'boolean': col = table.boolean(name); break;
            case 'date': col = table.date(name); break;
            case 'datetime': col = table.timestamp(name); break;
            case 'json': 
            case 'object':
            case 'array': col = table.json(name); break;
            default: col = table.string(name);
        }
    }

    private async ensureDatabaseExists() {
        if (this.config.client !== 'pg' && this.config.client !== 'postgresql') return;
        
        try {
            await this.knex.raw('SELECT 1');
        } catch (e: any) {
            if (e.code === '3D000') { // Database does not exist
                 await this.createDatabase();
            } else {
                throw e;
            }
        }
    }

    private async createDatabase() {
        const config = this.config;
        const connection = config.connection;
        let dbName = '';
        let adminConfig = { ...config };

        if (typeof connection === 'string') {
            const url = new URL(connection);
            dbName = url.pathname.slice(1);
            url.pathname = '/postgres';
            adminConfig.connection = url.toString();
        } else {
            dbName = connection.database;
            adminConfig.connection = { ...connection, database: 'postgres' };
        }

        console.log(`[KnexDriver] Database '${dbName}' does not exist. Creating...`);

        const adminKnex = knex(adminConfig);
        try {
            await adminKnex.raw(`CREATE DATABASE "${dbName}"`);
            console.log(`[KnexDriver] Database '${dbName}' created successfully.`);
        } catch (e: any) {
             console.error(`[KnexDriver] Failed to create database '${dbName}':`, e.message);
             if (e.code === '42501') {
                 console.error(`[KnexDriver] Hint: The user '${adminConfig.connection.user || 'current user'}' does not have CREATEDB privileges.`);
                 console.error(`[KnexDriver] Please run: createdb ${dbName}`);
             }
             throw e;
        } finally {
            await adminKnex.destroy();
        }
    }
}

