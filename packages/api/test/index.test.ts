import { createObjectQLRouter } from '../src';
import { IObjectQL } from '@objectql/core';
import express from 'express';
import request from 'supertest';

describe('createObjectQLRouter', () => {
    let mockObjectQL: any;
    let mockRepo: any;
    let mockGetContext: jest.Mock;
    let app: express.Express;

    beforeEach(() => {
        // Mock Repository methods
        mockRepo = {
            find: jest.fn().mockResolvedValue([{ id: 1, name: 'Test' }]),
            findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
            count: jest.fn().mockResolvedValue(10),
            aggregate: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({ id: 2, name: 'New' }),
            createMany: jest.fn().mockResolvedValue([{ id: 2, name: 'New' }]),
            update: jest.fn().mockResolvedValue({ id: 1, name: 'Updated' }),
            delete: jest.fn().mockResolvedValue(undefined),
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 }),
            call: jest.fn().mockResolvedValue({ result: 'ok' })
        };

        mockObjectQL = {
            init: jest.fn(),
            getConfigs: jest.fn().mockReturnValue({ user: { name: 'user', fields: {} } })
        };

        // Mock getContext to return a context that returns our mockRepo
        mockGetContext = jest.fn().mockResolvedValue({
            object: jest.fn().mockReturnValue(mockRepo),
            roles: [],
            transaction: jest.fn(),
            sudo: jest.fn()
        });

        app = express();
        app.use(express.json()); // Important for POST/PUT tests
    });

    it('should create a router', () => {
        const router = createObjectQLRouter({ objectql: mockObjectQL });
        expect(router).toBeDefined();
        expect(typeof router).toBe('function');
    });

    it('should mount swagger if enabled', async () => {
        const router = createObjectQLRouter({ 
            objectql: mockObjectQL,
            swagger: { enabled: true }
        });
        
        app.use(router);
        expect(router).toBeDefined();
    });

    describe('REST API Endpoints', () => {
        beforeEach(() => {
            const router = createObjectQLRouter({ 
                objectql: mockObjectQL,
                getContext: mockGetContext
            });
            app.use('/api', router);
        });

        it('GET /_schema should return configs', async () => {
            const res = await request(app).get('/api/_schema');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ user: { name: 'user', fields: {} } });
            expect(mockObjectQL.getConfigs).toHaveBeenCalled();
        });

        it('GET /:objectName/count should return count', async () => {
            const res = await request(app)
                .get('/api/users/count')
                .query({ filters: JSON.stringify([['age', '>', 20]]) });
            
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ count: 10 });
            expect(mockRepo.count).toHaveBeenCalledWith([['age', '>', 20]]);
        });

        it('GET /:objectName should list objects', async () => {
            const res = await request(app)
                .get('/api/users')
                .query({ 
                    limit: 10, 
                    skip: 0, 
                    sort: 'name:asc', 
                    fields: 'id,name' 
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
                limit: 10,
                skip: 0,
                // sort parsing: 'name:asc' -> [['name', 'asc']]
                sort: [['name', 'asc']],
                fields: ['id', 'name']
            }));
        });

        it('GET /:objectName/:id should get one object', async () => {
            const res = await request(app).get('/api/users/1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ id: 1, name: 'Test' });
            expect(mockRepo.findOne).toHaveBeenCalledWith('1');
        });

        it('POST /:objectName should create object', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ name: 'New' });
            
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ id: 2, name: 'New' });
            expect(mockRepo.create).toHaveBeenCalledWith({ name: 'New' });
        });

        it('PUT /:objectName/:id should update object', async () => {
            const res = await request(app)
                .put('/api/users/1')
                .send({ name: 'Updated' });
            
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ id: 1, name: 'Updated' });
            expect(mockRepo.update).toHaveBeenCalledWith('1', { name: 'Updated' });
        });

        it('DELETE /:objectName/:id should delete object', async () => {
            const res = await request(app).delete('/api/users/1');
            expect(res.status).toBe(204);
            expect(mockRepo.delete).toHaveBeenCalledWith('1');
        });

        it('POST /:objectName/:id/:actionName should execute action', async () => {
            const res = await request(app)
                .post('/api/users/1/activate')
                .send({ reason: 'testing' });
            
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ result: 'ok' });
            expect(mockRepo.call).toHaveBeenCalledWith('activate', { id: '1', reason: 'testing' });
        });
    });
});
