import { createObjectQLRouter } from '../src';
import { IObjectQL } from '@objectql/core';
import express from 'express';

describe('createObjectQLRouter', () => {
    it('should create a router', () => {
        const mockObjectQL = {} as IObjectQL;
        const router = createObjectQLRouter({ objectql: mockObjectQL });
        expect(router).toBeDefined();
        // Router is a function in Express
        expect(typeof router).toBe('function');
    });
});
