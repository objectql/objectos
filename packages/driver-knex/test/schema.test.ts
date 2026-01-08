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
});
