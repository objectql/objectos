/**
 * Scoped Storage Tests
 */

import { InMemoryScopedStorage, StorageManager } from '../src/scoped-storage';

describe('ScopedStorage', () => {
    describe('InMemoryScopedStorage', () => {
        it('should store and retrieve values', async () => {
            const storage = new InMemoryScopedStorage('test-plugin');
            
            await storage.set('key1', 'value1');
            const value = await storage.get('key1');
            
            expect(value).toBe('value1');
        });

        it('should delete values', async () => {
            const storage = new InMemoryScopedStorage('test-plugin');
            
            await storage.set('key1', 'value1');
            await storage.delete('key1');
            const value = await storage.get('key1');
            
            expect(value).toBeUndefined();
        });

        it('should isolate storage between plugins', async () => {
            const storage1 = new InMemoryScopedStorage('plugin1');
            const storage2 = new InMemoryScopedStorage('plugin2');
            
            await storage1.set('key1', 'value1');
            await storage2.set('key1', 'value2');
            
            const value1 = await storage1.get('key1');
            const value2 = await storage2.get('key1');
            
            expect(value1).toBe('value1');
            expect(value2).toBe('value2');
        });

        it('should list keys for a plugin', async () => {
            const storage = new InMemoryScopedStorage('test-plugin');
            
            await storage.set('key1', 'value1');
            await storage.set('key2', 'value2');
            
            const keys = await storage.keys();
            
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys.length).toBe(2);
        });

        it('should clear all data for a plugin', async () => {
            const storage = new InMemoryScopedStorage('test-plugin');
            
            await storage.set('key1', 'value1');
            await storage.set('key2', 'value2');
            await storage.clear();
            
            const keys = await storage.keys();
            expect(keys.length).toBe(0);
        });
    });

    describe('StorageManager', () => {
        it('should create scoped storage for plugins', () => {
            const manager = new StorageManager();
            const storage1 = manager.createScopedStorage('plugin1');
            const storage2 = manager.createScopedStorage('plugin2');
            
            expect(storage1).toBeDefined();
            expect(storage2).toBeDefined();
            expect(storage1).not.toBe(storage2);
        });

        it('should provide global storage', () => {
            const manager = new StorageManager();
            const globalStorage = manager.getGlobalStorage();
            
            expect(globalStorage).toBeDefined();
            expect(globalStorage instanceof Map).toBe(true);
        });
    });
});
