/**
 * Data Mapping Tests
 */

import {
    DataMapper,
    Transformers,
    transform,
    createTransformConfig,
} from '../src/api/mapping';

describe('DataMapper', () => {
    describe('transform', () => {
        it('should transform simple fields', () => {
            const data = {
                firstName: 'John',
                lastName: 'Doe',
                age: 30,
            };

            const config = createTransformConfig([
                { from: '$.firstName', to: '$.name.first' },
                { from: '$.lastName', to: '$.name.last' },
                { from: '$.age', to: '$.age' },
            ]);

            const result = DataMapper.transform(data, config);

            expect(result).toEqual({
                name: {
                    first: 'John',
                    last: 'Doe',
                },
                age: 30,
            });
        });

        it('should apply transformation functions', () => {
            const data = {
                email: 'test@EXAMPLE.COM',
                name: 'john doe',
            };

            const config = createTransformConfig([
                { from: '$.email', to: '$.email', transform: Transformers.toLowerCase },
                { from: '$.name', to: '$.name', transform: Transformers.toUpperCase },
            ]);

            const result = DataMapper.transform(data, config);

            expect(result).toEqual({
                email: 'test@example.com',
                name: 'JOHN DOE',
            });
        });

        it('should handle nested paths', () => {
            const data = {
                user: {
                    profile: {
                        name: 'John',
                    },
                },
            };

            const config = createTransformConfig([
                { from: '$.user.profile.name', to: '$.userName' },
            ]);

            const result = DataMapper.transform(data, config);

            expect(result).toEqual({
                userName: 'John',
            });
        });

        it('should skip undefined values', () => {
            const data = {
                name: 'John',
            };

            const config = createTransformConfig([
                { from: '$.name', to: '$.name' },
                { from: '$.email', to: '$.email' },
            ]);

            const result = DataMapper.transform(data, config);

            expect(result).toEqual({
                name: 'John',
            });
            expect(result).not.toHaveProperty('email');
        });
    });

    describe('transformArray', () => {
        it('should transform array of objects', () => {
            const data = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
            ];

            const config = createTransformConfig([
                { from: '$.id', to: '$.itemId' },
                { from: '$.name', to: '$.itemName' },
            ]);

            const result = DataMapper.transformArray(data, config);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ itemId: 1, itemName: 'Item 1' });
            expect(result[1]).toEqual({ itemId: 2, itemName: 'Item 2' });
        });
    });

    describe('createMapper', () => {
        it('should create reusable mapper function', () => {
            const config = createTransformConfig([
                { from: '$.x', to: '$.a' },
                { from: '$.y', to: '$.b' },
            ]);

            const mapper = DataMapper.createMapper(config);

            expect(mapper({ x: 1, y: 2 })).toEqual({ a: 1, b: 2 });
            expect(mapper({ x: 3, y: 4 })).toEqual({ a: 3, b: 4 });
        });
    });

    describe('Transformers', () => {
        it('should convert to uppercase', () => {
            expect(Transformers.toUpperCase('hello')).toBe('HELLO');
            expect(Transformers.toUpperCase(123)).toBe(123);
        });

        it('should convert to lowercase', () => {
            expect(Transformers.toLowerCase('HELLO')).toBe('hello');
            expect(Transformers.toLowerCase(123)).toBe(123);
        });

        it('should convert to number', () => {
            expect(Transformers.toNumber('123')).toBe(123);
            expect(Transformers.toNumber('45.67')).toBe(45.67);
            expect(Transformers.toNumber('abc')).toBe('abc');
        });

        it('should convert to string', () => {
            expect(Transformers.toString(123)).toBe('123');
            expect(Transformers.toString(true)).toBe('true');
        });

        it('should convert to boolean', () => {
            expect(Transformers.toBoolean(1)).toBe(true);
            expect(Transformers.toBoolean(0)).toBe(false);
            expect(Transformers.toBoolean('yes')).toBe(true);
        });

        it('should parse JSON', () => {
            expect(Transformers.parseJSON('{"a":1}')).toEqual({ a: 1 });
            expect(Transformers.parseJSON('invalid')).toBe('invalid');
        });

        it('should stringify to JSON', () => {
            expect(Transformers.stringifyJSON({ a: 1 })).toBe('{"a":1}');
        });

        it('should trim whitespace', () => {
            expect(Transformers.trim('  hello  ')).toBe('hello');
            expect(Transformers.trim(123)).toBe(123);
        });

        it('should provide default value', () => {
            const transform = Transformers.defaultValue('default');
            expect(transform(null)).toBe('default');
            expect(transform(undefined)).toBe('default');
            expect(transform('value')).toBe('value');
        });
    });

    describe('transform helper', () => {
        it('should transform data with inline rules', () => {
            const data = { a: 1, b: 2 };
            const result = transform(data, [
                { from: '$.a', to: '$.x' },
                { from: '$.b', to: '$.y' },
            ]);

            expect(result).toEqual({ x: 1, y: 2 });
        });
    });
});
