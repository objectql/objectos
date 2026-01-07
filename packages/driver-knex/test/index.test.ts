import { KnexDriver } from '../src';
import knex from 'knex';

jest.mock('knex', () => {
    return jest.fn(() => ({
        // Mock knex instance methods if needed
    }));
});

describe('KnexDriver', () => {
    it('should be instantiable', () => {
        const driver = new KnexDriver({ client: 'sqlite3' });
        expect(driver).toBeDefined();
        expect(driver).toBeInstanceOf(KnexDriver);
    });
});
