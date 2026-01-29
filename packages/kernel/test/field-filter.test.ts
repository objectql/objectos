/**
 * Field Filter Tests
 */

import { FieldFilter } from '../src/permissions/field-permissions';

describe('FieldFilter', () => {
    let filter: FieldFilter;

    beforeEach(() => {
        filter = new FieldFilter();
    });

    describe('filterFields', () => {
        it('should filter object to include only visible fields', () => {
            const data = {
                id: '123',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                salary: 100000,
                ssn: '123-45-6789',
            };

            const visibleFields = ['id', 'first_name', 'last_name', 'email'];
            const filtered = filter.filterFields(data, visibleFields);

            expect(filtered).toHaveProperty('id', '123');
            expect(filtered).toHaveProperty('first_name', 'John');
            expect(filtered).toHaveProperty('last_name', 'Doe');
            expect(filtered).toHaveProperty('email', 'john@example.com');
            expect(filtered).not.toHaveProperty('salary');
            expect(filtered).not.toHaveProperty('ssn');
        });

        it('should return empty object when no fields are visible', () => {
            const data = {
                id: '123',
                name: 'Test',
            };

            const visibleFields: string[] = [];
            const filtered = filter.filterFields(data, visibleFields);

            expect(Object.keys(filtered)).toHaveLength(0);
        });

        it('should handle null data gracefully', () => {
            const filtered = filter.filterFields(null, ['field1']);
            expect(filtered).toBeNull();
        });

        it('should handle undefined data gracefully', () => {
            const filtered = filter.filterFields(undefined, ['field1']);
            expect(filtered).toBeUndefined();
        });

        it('should handle non-object data gracefully', () => {
            const filtered = filter.filterFields('string', ['field1']);
            expect(filtered).toBe('string');
        });

        it('should only include fields that exist in data', () => {
            const data = {
                id: '123',
                name: 'Test',
            };

            const visibleFields = ['id', 'name', 'email', 'phone'];
            const filtered = filter.filterFields(data, visibleFields);

            expect(filtered).toHaveProperty('id');
            expect(filtered).toHaveProperty('name');
            expect(filtered).not.toHaveProperty('email');
            expect(filtered).not.toHaveProperty('phone');
            expect(Object.keys(filtered)).toHaveLength(2);
        });

        it('should preserve field values including falsy values', () => {
            const data = {
                id: '123',
                name: '',
                count: 0,
                active: false,
                value: null,
            };

            const visibleFields = ['id', 'name', 'count', 'active', 'value'];
            const filtered = filter.filterFields(data, visibleFields);

            expect(filtered.id).toBe('123');
            expect(filtered.name).toBe('');
            expect(filtered.count).toBe(0);
            expect(filtered.active).toBe(false);
            expect(filtered.value).toBeNull();
        });

        it('should handle array input gracefully by returning it unchanged', () => {
            const data = [
                { id: '1', name: 'Test1' },
                { id: '2', name: 'Test2' },
            ];

            const visibleFields = ['id', 'name'];
            const filtered = filter.filterFields(data, visibleFields);

            // Should return the array unchanged, not convert it to an object
            expect(Array.isArray(filtered)).toBe(true);
            expect(filtered).toBe(data);
        });
    });

    describe('filterFieldsArray', () => {
        it('should filter all records in an array', () => {
            const dataArray = [
                {
                    id: '1',
                    first_name: 'John',
                    last_name: 'Doe',
                    salary: 100000,
                },
                {
                    id: '2',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    salary: 120000,
                },
            ];

            const visibleFields = ['id', 'first_name', 'last_name'];
            const filtered = filter.filterFieldsArray(dataArray, visibleFields);

            expect(filtered).toHaveLength(2);
            expect(filtered[0]).toHaveProperty('id', '1');
            expect(filtered[0]).toHaveProperty('first_name', 'John');
            expect(filtered[0]).toHaveProperty('last_name', 'Doe');
            expect(filtered[0]).not.toHaveProperty('salary');
            expect(filtered[1]).toHaveProperty('id', '2');
            expect(filtered[1]).toHaveProperty('first_name', 'Jane');
            expect(filtered[1]).toHaveProperty('last_name', 'Smith');
            expect(filtered[1]).not.toHaveProperty('salary');
        });

        it('should return empty array for empty input array', () => {
            const dataArray: any[] = [];
            const visibleFields = ['id', 'name'];
            const filtered = filter.filterFieldsArray(dataArray, visibleFields);

            expect(filtered).toEqual([]);
        });

        it('should handle non-array input gracefully', () => {
            const filtered = filter.filterFieldsArray('not an array' as any, ['field1']);
            expect(filtered).toBe('not an array');
        });

        it('should handle array with mixed data types', () => {
            const dataArray = [
                { id: '1', name: 'Test' },
                null,
                { id: '2', name: 'Test2' },
                undefined,
                'string',
            ];

            const visibleFields = ['id', 'name'];
            const filtered = filter.filterFieldsArray(dataArray, visibleFields);

            expect(filtered).toHaveLength(5);
            expect(filtered[0]).toEqual({ id: '1', name: 'Test' });
            expect(filtered[1]).toBeNull();
            expect(filtered[2]).toEqual({ id: '2', name: 'Test2' });
            expect(filtered[3]).toBeUndefined();
            expect(filtered[4]).toBe('string');
        });
    });
});
