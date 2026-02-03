/**
 * Tests for Memory Storage Backend
 */

import { MemoryStorageBackend } from '../src/memory-backend';

describe('MemoryStorageBackend', () => {
    let backend: MemoryStorageBackend;

    beforeEach(() => {
        backend = new MemoryStorageBackend();
    });

    afterEach(async () => {
        await backend.close();
    });

    describe('Basic Operations', () => {
        it('should store and retrieve values', async () => {
            await backend.set('key1', 'value1');
            const value = await backend.get('key1');
            expect(value).toBe('value1');
        });

        it('should handle complex objects', async () => {
            const obj = { name: 'Test', nested: { value: 123 } };
            await backend.set('obj', obj);
            const retrieved = await backend.get('obj');
            expect(retrieved).toEqual(obj);
        });

        it('should return undefined for missing keys', async () => {
            const value = await backend.get('missing');
            expect(value).toBeUndefined();
        });

        it('should delete keys', async () => {
            await backend.set('delete-me', 'value');
            await backend.delete('delete-me');
            const value = await backend.get('delete-me');
            expect(value).toBeUndefined();
        });

        it('should clear all data', async () => {
            await backend.set('key1', 'value1');
            await backend.set('key2', 'value2');
            await backend.clear();
            
            const keys = await backend.keys();
            expect(keys).toHaveLength(0);
        });
    });

    describe('Pattern Matching', () => {
        beforeEach(async () => {
            await backend.set('user:1:name', 'John');
            await backend.set('user:1:email', 'john@example.com');
            await backend.set('user:2:name', 'Jane');
            await backend.set('admin:1:name', 'Admin');
        });

        it('should list all keys without pattern', async () => {
            const keys = await backend.keys();
            expect(keys).toHaveLength(4);
        });

        it('should match wildcard patterns', async () => {
            const keys = await backend.keys('user:*');
            expect(keys).toContain('user:1:name');
            expect(keys).toContain('user:1:email');
            expect(keys).toContain('user:2:name');
            expect(keys).not.toContain('admin:1:name');
        });

        it('should match single character patterns', async () => {
            const keys = await backend.keys('user:?:name');
            expect(keys).toContain('user:1:name');
            expect(keys).toContain('user:2:name');
            expect(keys).not.toContain('user:1:email');
        });
    });

    describe('TTL Support', () => {
        it('should expire values after TTL', async () => {
            await backend.set('expire', 'value', 1);
            
            let value = await backend.get('expire');
            expect(value).toBe('value');
            
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            value = await backend.get('expire');
            expect(value).toBeUndefined();
        });

        it('should not affect values without TTL', async () => {
            await backend.set('no-ttl', 'value');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const value = await backend.get('no-ttl');
            expect(value).toBe('value');
        });
    });

    describe('Size Limits', () => {
        it('should enforce max keys limit', async () => {
            const smallBackend = new MemoryStorageBackend({ maxKeys: 2 });
            
            await smallBackend.set('key1', 'value1');
            await smallBackend.set('key2', 'value2');
            
            await expect(smallBackend.set('key3', 'value3')).rejects.toThrow('Storage limit reached');
            
            await smallBackend.close();
        });

        it('should allow updating existing keys without hitting limit', async () => {
            const smallBackend = new MemoryStorageBackend({ maxKeys: 2 });
            
            await smallBackend.set('key1', 'value1');
            await smallBackend.set('key2', 'value2');
            await smallBackend.set('key1', 'updated'); // Should work
            
            const value = await smallBackend.get('key1');
            expect(value).toBe('updated');
            
            await smallBackend.close();
        });
    });

    describe('Expiration Cleanup', () => {
        it('should clean up expired entries periodically', async () => {
            const backend = new MemoryStorageBackend({ ttlCheckInterval: 100 });
            
            await backend.set('expire1', 'value1', 0.1);
            await backend.set('expire2', 'value2', 0.1);
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const keys = await backend.keys();
            expect(keys).not.toContain('expire1');
            expect(keys).not.toContain('expire2');
            
            await backend.close();
        });
    });
});
