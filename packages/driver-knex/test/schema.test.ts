import { KnexDriver } from '../src';

describe('KnexDriver Schema Sync (SQLite)', () => {
    let driver: KnexDriver;
    let knexInstance: any;

    beforeEach(async () => {
        // Init ephemeral in-memory database
        driver = new KnexDriver({
            client: 'sqlite3',
            connection: {
                filename: ':memory:'
            },
            useNullAsDefault: true
        });
        knexInstance = (driver as any).knex;
    });

    afterEach(async () => {
        await knexInstance.destroy();
    });

    it('should create table if not exists', async () => {
        const objects = [{
            name: 'test_obj',
            fields: {
                name: { type: 'string' },
                age: { type: 'integer' }
            }
        }];

        await driver.init(objects);

        const exists = await knexInstance.schema.hasTable('test_obj');
        expect(exists).toBe(true);

        const columns = await knexInstance('test_obj').columnInfo();
        expect(columns).toHaveProperty('id');
        expect(columns).toHaveProperty('created_at');
        expect(columns).toHaveProperty('updated_at');
        expect(columns).toHaveProperty('name');
        expect(columns).toHaveProperty('age');
    });

    it('should add new columns if table exists', async () => {
        // 1. Setup existing table with subset of columns
        await knexInstance.schema.createTable('test_obj', (t: any) => {
            t.string('id').primary();
            t.string('name');
        });

        // 2. Insert some data
        await knexInstance('test_obj').insert({ id: '1', name: 'Old Data' });

        // 3. Init with new fields
        const objects = [{
            name: 'test_obj',
            fields: {
                name: { type: 'string' },
                age: { type: 'integer' }, // New field
                active: { type: 'boolean' } // New field
            }
        }];

        await driver.init(objects);

        // 4. Verify columns
        const columns = await knexInstance('test_obj').columnInfo();
        expect(columns).toHaveProperty('age');
        expect(columns).toHaveProperty('active');

        // 5. Verify data is intact
        const row = await knexInstance('test_obj').where('id', '1').first();
        expect(row.name).toBe('Old Data');
    });

    it('should not delete existing columns', async () => {
         // 1. Setup table with extra column
         await knexInstance.schema.createTable('test_obj', (t: any) => {
            t.string('id').primary();
            t.string('name');
            t.string('extra_column'); // Should stay
        });

        // 2. Init with only 'name'
        const objects = [{
            name: 'test_obj',
            fields: {
                name: { type: 'string' }
            }
        }];

        await driver.init(objects);

        const columns = await knexInstance('test_obj').columnInfo();
        expect(columns).toHaveProperty('name');
        expect(columns).toHaveProperty('extra_column'); // Preservation check
    });

    it('should not fail if table creation is repeated', async () => {
        const objects = [{
            name: 'test_obj',
            fields: {
                name: { type: 'string' }
            }
        }];

        // First init
        await driver.init(objects);
        
        // Second init (should be idempotent-ish, or just skip creation)
        await driver.init(objects);

        const exists = await knexInstance.schema.hasTable('test_obj');
        expect(exists).toBe(true);
    });

    it('should create json column for multiple=true fields', async () => {
        const objects = [{
            name: 'multi_test',
            fields: {
                tags: { type: 'select', multiple: true } as any,
                users: { type: 'lookup', reference_to: 'user', multiple: true } as any
            }
        }];

        await driver.init(objects);

        const columns = await knexInstance('multi_test').columnInfo();
        // Types in SQLite might be generic, but verifying we can insert/read array is best.
        
        // Try inserting array data
        await driver.create('multi_test', {
            tags: ['a', 'b'],
            users: ['u1', 'u2']
        });

        const results = await driver.find('multi_test', {});
        const row = results[0];

        // Driver should automatically parse JSON columns for SQLite
        expect(row.tags).toEqual(['a', 'b']);
        expect(row.users).toEqual(['u1', 'u2']);
    });

    it('should create percent column', async () => {
        const objects = [{
            name: 'percent_test',
            fields: {
                completion: { type: 'percent' } as any
            }
        }];

        await driver.init(objects);

        const columns = await knexInstance('percent_test').columnInfo();
        expect(columns).toHaveProperty('completion');
        
        // Insert a percentage
        await driver.create('percent_test', { completion: 0.85 });
        const res = await driver.find('percent_test', {});
        expect(res[0].completion).toBe(0.85);
    });

    it('should handle special fields (formula, summary, auto_number)', async () => {
        const objects = [{
            name: 'special_fields_test',
            fields: {
                // Formula should NOT create a column
                total: { type: 'formula', expression: 'price * qty', data_type: 'number' } as any,
                // Summary should create a numeric column
                child_count: { type: 'summary', summary_object: 'child_obj', summary_type: 'count' } as any,
                // Auto Number should create a string column
                invoice_no: { type: 'auto_number', auto_number_format: 'INV-{0000}' } as any
            }
        }];

        await driver.init(objects);

        const columns = await knexInstance('special_fields_test').columnInfo();
        
        expect(columns).not.toHaveProperty('total');
        expect(columns).toHaveProperty('child_count');
        expect(columns).toHaveProperty('invoice_no');
    });
});
