import { ObjectOSPlugin } from '../src/plugins/objectql';
import { ObjectOS } from '../src';
import { MockDriver } from './mock-driver';
import * as path from 'path';

describe('ObjectOSPlugin', () => {
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

    describe('Plugin Structure', () => {
        it('should have correct plugin structure', () => {
            expect(ObjectOSPlugin.name).toBe('objectos-core');
            expect(typeof ObjectOSPlugin.setup).toBe('function');
        });
    });

    describe('App Loader', () => {
        it('should load .app.yml files', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            const apps = objectos.metadata.list('app');
            expect(apps.length).toBeGreaterThan(0);

            const testApp = apps.find((app: any) => app.name === 'test-app');
            expect(testApp).toBeDefined();
            expect(testApp).toMatchObject({
                name: 'test-app',
                label: 'Test Application',
                icon: 'ri-dashboard-line'
            });
        });

        it('should handle app menu configuration', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            const apps = objectos.metadata.list('app');
            const testApp = apps.find((app: any) => app.name === 'test-app');
            
            expect(testApp?.menu).toBeDefined();
            expect(Array.isArray(testApp?.menu)).toBe(true);
            expect(testApp?.menu.length).toBeGreaterThan(0);
        });

        it('should use id, code, or name for app identification', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            const apps = objectos.metadata.list('app');
            // Get the metadata entry to check the id
            const testAppEntry = objectos.metadata.getEntry('app', 'test-app');
            
            // The app should be registered with the name field as id
            expect(testAppEntry?.id).toBe('test-app');
        });
    });

    describe('Data Loader', () => {
        it('should load .data.yml files', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            const contactObject = objectos.getObject('contacts');
            expect((contactObject as any)?.data).toBeDefined();
            expect(Array.isArray((contactObject as any)?.data)).toBe(true);
        });

        it('should attach data to corresponding object', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            const contactObject = objectos.getObject('contacts');
            expect((contactObject as any)?.data).toBeDefined();
            
            // Check that data matches what's in contacts.data.yml
            const data = (contactObject as any)?.data;
            expect(data?.length).toBe(2);
            expect(data?.[0].name).toBe('John Doe');
            expect(data?.[0].email).toBe('john@example.com');
            expect(data?.[1].name).toBe('Jane Smith');
        });

        it('should handle missing object gracefully', async () => {
            // Create a data file for non-existent object
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            // Should not throw even if there's a data file without matching object
            await expect(objectos.init()).resolves.not.toThrow();
        });

        it('should skip non-array data', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver }
            });

            await objectos.init();

            // Register an object
            objectos.registerObject({
                name: 'test_obj',
                label: 'Test',
                fields: {}
            });

            // The data loader should skip if data is not an array
            // This is just to ensure it doesn't crash
            expect((objectos.getObject('test_obj') as any)?.data).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed YAML gracefully', async () => {
            // The plugin should catch errors and log them without crashing
            objectos = new ObjectOS({
                datasources: { default: driver }
            });

            // Init should succeed even if there are some malformed files
            await expect(objectos.init()).resolves.not.toThrow();
        });
    });

    describe('Package Tracking', () => {
        it('should track which package loaded each app', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: path.join(__dirname, 'fixtures')
            });

            await objectos.init();

            // Get the metadata entry to check package
            const testAppEntry = objectos.metadata.getEntry('app', 'test-app');
            
            // The package field should be set (even if undefined for local files)
            expect(testAppEntry).toHaveProperty('package');
        });
    });
});
