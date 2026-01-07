import { KnexDriver } from '../src';
import knex from 'knex';

const mockChain = (methods: string[]) => {
    const mock: any = {};
    methods.forEach(m => {
        mock[m] = jest.fn().mockReturnThis();
    });
    mock.then = jest.fn((resolve) => resolve([]));
    mock.catch = jest.fn();
    return mock;
};

const mockBuilder = mockChain(['select', 'where', 'orWhere', 'orderBy', 'offset', 'limit', 'insert', 'update', 'delete', 'transacting', 'count']);
const mockFirst = jest.fn();
mockBuilder.first = mockFirst;

jest.mock('knex', () => {
    return jest.fn(() => (tableName: string) => mockBuilder);
});

describe('KnexDriver', () => {
    let driver: KnexDriver;

    beforeEach(() => {
        driver = new KnexDriver({ client: 'sqlite3' });
        jest.clearAllMocks();
    });

    it('should be instantiable', () => {
        expect(driver).toBeDefined();
        expect(driver).toBeInstanceOf(KnexDriver);
    });

    it('should find objects', async () => {
        const query = {
            fields: ['name', 'age'],
            filters: [['age', '>', 18]],
            sort: [['name', 'asc']],
            skip: 10,
            limit: 5
        };
        await driver.find('users', query);
        
        expect(mockBuilder.select).toHaveBeenCalledWith(['name', 'age']);
        expect(mockBuilder.where).toHaveBeenCalledWith('age', '>', 18);
        expect(mockBuilder.orderBy).toHaveBeenCalledWith('name', 'asc');
        expect(mockBuilder.offset).toHaveBeenCalledWith(10);
        expect(mockBuilder.limit).toHaveBeenCalledWith(5);
    });

    it('should apply OR filters correctly', async () => {
        const query = {
            filters: [['age', '>', 18], 'or', ['role', '=', 'admin']]
        };
        await driver.find('users', query);
        expect(mockBuilder.where).toHaveBeenCalledWith('age', '>', 18);
        expect(mockBuilder.orWhere).toHaveBeenCalledWith('role', 'admin');
    });

    it('should find one object by id', async () => {
        mockFirst.mockResolvedValueOnce({ id: 1, name: 'Alice' });
        const result = await driver.findOne('users', 1);
        expect(mockBuilder.where).toHaveBeenCalledWith('id', 1);
        expect(mockFirst).toHaveBeenCalled();
        expect(result).toEqual({ id: 1, name: 'Alice' });
    });

    // Add more tests for insert, update, delete when implemented in src
});
