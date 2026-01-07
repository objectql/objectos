import { MetadataRegistry } from '../src/registry';
import { MetadataLoader } from '../src/loader';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('MetadataRegistry', () => {
    it('should register and retrieve metadata', () => {
        const registry = new MetadataRegistry();
        registry.register('test', {
            type: 'test',
            id: 'item1',
            content: { value: 1 }
        });

        const item = registry.get('test', 'item1');
        expect(item).toEqual({ value: 1 });
        
        const list = registry.list('test');
        expect(list).toHaveLength(1);
        expect(list[0]).toEqual({ value: 1 });
    });

    it('should unregister metadata', () => {
        const registry = new MetadataRegistry();
        registry.register('test', { type: 'test', id: 'item1', content: {} });
        registry.unregister('test', 'item1');
        expect(registry.get('test', 'item1')).toBeUndefined();
    });
});

describe('MetadataLoader', () => {
    it('should load files using plugins', () => {
        const registry = new MetadataRegistry();
        const loader = new MetadataLoader(registry);
        
        loader.use({
            name: 'test-plugin',
            glob: ['**/*.test.yml'],
            handler: (ctx) => {
                const doc = yaml.load(ctx.content) as any;
                ctx.registry.register('test', {
                    type: 'test',
                    id: doc.name,
                    path: ctx.file,
                    content: doc
                });
            }
        });

        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);

        const item = registry.get('test', 'test-item');
        expect(item).toBeDefined();
        expect(item.value).toBe(123);
    });
});
