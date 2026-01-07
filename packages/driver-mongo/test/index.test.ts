import { MongoDriver } from '../src';
import { MongoClient } from 'mongodb';

jest.mock('mongodb', () => {
    return {
        MongoClient: jest.fn().mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: jest.fn().mockReturnValue({}),
        })),
    };
});

describe('MongoDriver', () => {
    it('should be instantiable', () => {
        const driver = new MongoDriver({ url: 'mongodb://localhost:27017' });
        expect(driver).toBeDefined();
        expect(driver).toBeInstanceOf(MongoDriver);
    });
});
