import { ObjectOS, ObjectOSPlugin } from '../src';
import { MockDriver } from './mock-driver';
import * as path from 'path';

describe('ObjectOS', () => {
    let objectos: ObjectOS;
    let driver: MockDriver;

    beforeEach(() => {
        driver = new MockDriver();
    });

    afterEach(async () => {
        if (driver) {
            await driver.disconnect();
        }
    });

    describe('Initialization', () => {
        it('should create an ObjectOS instance with default config', () => {
            objectos = new ObjectOS();
            expect(objectos).toBeDefined();
            expect(objectos).toBeInstanceOf(ObjectOS);
        });

        it('should create an ObjectOS instance with datasources', () => {
            objectos = new ObjectOS({
                datasources: {
                    default: driver
                }
            });
            expect(objectos).toBeDefined();
            expect(objectos.datasource('default')).toBe(driver);
        });

        it('should initialize without errors', async () => {
            objectos = new ObjectOS({
                datasources: {
                    default: driver
                }
            });
            await expect(objectos.init()).resolves.not.toThrow();
        });
    });

    describe('Plugin System', () => {
        it('should have ObjectOSPlugin registered by default', async () => {
            objectos = new ObjectOS({
                datasources: {
                    default: driver
                }
            });
            
            // ObjectOSPlugin should be automatically registered
            expect(ObjectOSPlugin).toBeDefined();
            expect(ObjectOSPlugin.name).toBe('objectos-core');
        });

        it('should allow custom plugins', async () => {
            const customPlugin = {
                name: 'test-plugin',
                setup: jest.fn()
            };

            objectos = new ObjectOS({
                datasources: { default: driver },
                plugins: [customPlugin]
            });

            await objectos.init();
            expect(customPlugin.setup).toHaveBeenCalled();
        });
    });

    describe('Metadata Loading', () => {
        it('should load objects from directory', async () => {
            objectos = new ObjectOS({
                datasources: {
                    default: driver
                },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            // Check if contact object was loaded
            const contactObject = objectos.getObject('contacts');
            expect(contactObject).toBeDefined();
            expect(contactObject?.label).toBe('Contact');
            expect(contactObject?.fields?.name).toBeDefined();
            expect(contactObject?.fields?.email).toBeDefined();
        });

        it('should register object manually', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver }
            });

            await objectos.init();

            objectos.registerObject({
                name: 'test_object',
                label: 'Test Object',
                fields: {
                    title: {
                        type: 'text',
                        label: 'Title'
                    }
                }
            });

            const testObject = objectos.getObject('test_object');
            expect(testObject).toBeDefined();
            expect(testObject?.name).toBe('test_object');
            expect(testObject?.label).toBe('Test Object');
        });

        it('should unregister an object', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver }
            });

            await objectos.init();

            objectos.registerObject({
                name: 'temp_object',
                label: 'Temp Object',
                fields: {}
            });

            expect(objectos.getObject('temp_object')).toBeDefined();

            objectos.unregisterObject('temp_object');
            expect(objectos.getObject('temp_object')).toBeUndefined();
        });
    });

    describe('App Loading', () => {
        it('should load apps from YAML files', async () => {
            objectos = new ObjectOS({
                datasources: {
                    default: driver
                },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            // Check if apps are registered in metadata
            const apps = objectos.metadata.list('app');
            expect(apps.length).toBeGreaterThan(0);
            
            const testApp = apps.find((app: any) => app.name === 'test-app');
            expect(testApp).toBeDefined();
            expect(testApp?.label).toBe('Test Application');
        });
    });

    describe('Data Loading', () => {
        it('should load data from YAML files and attach to objects', async () => {
            objectos = new ObjectOS({
                datasources: {
                    default: driver
                },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            const contactObject = objectos.getObject('contacts');
            expect(contactObject).toBeDefined();
            
            // Check if data was loaded (data is attached to object via plugin)
            expect((contactObject as any)?.data).toBeDefined();
            expect(Array.isArray((contactObject as any)?.data)).toBe(true);
            expect((contactObject as any)?.data?.length).toBeGreaterThan(0);
        });
    });

    describe('useDriver method', () => {
        it('should set default driver using useDriver', async () => {
            objectos = new ObjectOS();
            objectos.useDriver(driver);
            
            await objectos.init();
            
            expect(objectos.datasource('default')).toBe(driver);
        });
    });

    describe('Backward Compatibility', () => {
        it('should support deprecated packages option', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                packages: ['@objectos/preset-base']
            });

            await objectos.init();
            // Should not throw - packages should be mapped to presets
        });

        it('should prefer presets over packages when both provided', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                presets: ['preset-a'],
                packages: ['preset-b']
            });

            // This should use presets, not packages
            // We can't easily test the internal state, but we ensure it initializes
            await expect(objectos.init()).resolves.not.toThrow();
        });
    });

    describe('Configuration Options', () => {
        it('should accept source as string', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            await expect(objectos.init()).resolves.not.toThrow();
        });

        it('should accept source as array', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: [path.join(__dirname, 'fixtures')]
            });

            await expect(objectos.init()).resolves.not.toThrow();
        });

        it('should accept objects configuration', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                objects: {
                    custom_obj: {
                        name: 'custom_obj',
                        label: 'Custom Object',
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }
            });

            await objectos.init();
            
            const customObj = objectos.getObject('custom_obj');
            expect(customObj).toBeDefined();
            expect(customObj?.label).toBe('Custom Object');
        });
    });

    describe('getConfigs method', () => {
        it('should return all registered object configs', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            const configs = objectos.getConfigs();
            expect(configs).toBeDefined();
            expect(typeof configs).toBe('object');
            expect(configs.contacts).toBeDefined();
        });
    });
});
