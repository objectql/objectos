import { ObjectOS } from '../src';
import { MockDriver } from './mock-driver';
import * as path from 'path';

describe('Object Extension and Override', () => {
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

    describe('Field Override', () => {
        it('should override field properties', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: [
                    path.join(__dirname, 'fixtures/base'),
                    path.join(__dirname, 'fixtures/extended')
                ]
            });

            await objectos.init();

            const product = objectos.getObject('product');
            expect(product).toBeDefined();

            // Check overridden label
            expect(product?.label).toBe('Extended Product');
            expect(product?.description).toBe('Extended product with additional features');

            // Check field override: sku required changed to false
            expect(product?.fields.sku.required).toBe(false);
            expect(product?.fields.sku.unique).toBe(true); // Should still be unique

            // Check price override
            expect(product?.fields.price.min).toBe(-10000);
        });
    });

    describe('Field Deletion', () => {
        it('should delete fields when set to null', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: [
                    path.join(__dirname, 'fixtures/base'),
                    path.join(__dirname, 'fixtures/extended')
                ]
            });

            await objectos.init();

            const product = objectos.getObject('product');
            expect(product).toBeDefined();

            // Check that category field is deleted
            expect(product?.fields).not.toHaveProperty('category');

            // Check that other fields still exist
            expect(product?.fields).toHaveProperty('name');
            expect(product?.fields).toHaveProperty('sku');
            expect(product?.fields).toHaveProperty('price');
        });
    });

    describe('Field Extension', () => {
        it('should add new fields', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: [
                    path.join(__dirname, 'fixtures/base'),
                    path.join(__dirname, 'fixtures/extended')
                ]
            });

            await objectos.init();

            const product = objectos.getObject('product');
            expect(product).toBeDefined();

            // Check new fields
            expect(product?.fields).toHaveProperty('brand');
            expect(product?.fields.brand.type).toBe('text');
            expect(product?.fields.brand.label).toBe('Brand Name');

            expect(product?.fields).toHaveProperty('manufacturer');
            expect(product?.fields).toHaveProperty('tags');
        });
    });

    describe('Field Sub-Property Extension', () => {
        it('should extend field properties without replacing entire field', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: [
                    path.join(__dirname, 'fixtures/base'),
                    path.join(__dirname, 'fixtures/extended')
                ]
            });

            await objectos.init();

            const product = objectos.getObject('product');
            expect(product).toBeDefined();

            // Check stock field - label should be overridden, but type should remain
            expect(product?.fields.stock.type).toBe('number');
            expect(product?.fields.stock.label).toBe('Inventory Count');
            expect(product?.fields.stock.help_text).toBe('Current stock quantity in warehouse');
            expect(product?.fields.stock.min).toBe(0); // Original min should remain
        });
    });

    describe('Complete Integration', () => {
        it('should handle all operations together', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver },
                source: [
                    path.join(__dirname, 'fixtures/base'),
                    path.join(__dirname, 'fixtures/extended')
                ]
            });

            await objectos.init();

            const product = objectos.getObject('product');
            expect(product).toBeDefined();

            // Count fields
            const fieldNames = Object.keys(product?.fields || {});
            
            // Base had: name, sku, description, price, category, stock (6 fields)
            // Extended: removed category, added brand, manufacturer, tags
            // Expected: name, sku, description, price, stock, brand, manufacturer, tags (8 fields)
            expect(fieldNames).toHaveLength(8);

            // Verify each expected field exists
            expect(fieldNames).toContain('name');
            expect(fieldNames).toContain('sku');
            expect(fieldNames).toContain('description');
            expect(fieldNames).toContain('price');
            expect(fieldNames).toContain('stock');
            expect(fieldNames).toContain('brand');
            expect(fieldNames).toContain('manufacturer');
            expect(fieldNames).toContain('tags');

            // Verify deleted field is gone
            expect(fieldNames).not.toContain('category');
        });
    });

    describe('Programmatic Override', () => {
        it('should allow programmatic object extension', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver }
            });

            await objectos.init();

            // Register base object
            objectos.registerObject({
                name: 'task',
                label: 'Task',
                fields: {
                    title: {
                        type: 'text',
                        label: 'Title',
                        required: true
                    },
                    status: {
                        type: 'select',
                        label: 'Status',
                        options: [
                            { label: 'Todo', value: 'todo' },
                            { label: 'Done', value: 'done' }
                        ]
                    }
                }
            });

            // Extend it
            objectos.registerObject({
                name: 'task',
                label: 'Extended Task',
                fields: {
                    title: {
                        required: false  // Override
                    } as any,
                    priority: {  // Add new field
                        type: 'select',
                        label: 'Priority',
                        options: [
                            { label: 'Low', value: 'low' },
                            { label: 'High', value: 'high' }
                        ]
                    } as any,
                    status: null as any  // Delete field
                }
            });

            const task = objectos.getObject('task');
            expect(task).toBeDefined();
            expect(task?.label).toBe('Extended Task');
            expect(task?.fields.title.required).toBe(false);
            expect(task?.fields).toHaveProperty('priority');
            expect(task?.fields).not.toHaveProperty('status');
        });
    });

    describe('Multiple Extension Layers', () => {
        it('should handle multiple layers of extension', async () => {
            objectos = new ObjectOS({
                datasources: { default: driver }
            });

            await objectos.init();

            // Layer 1: Base
            objectos.registerObject({
                name: 'contact',
                label: 'Contact',
                fields: {
                    name: {
                        type: 'text',
                        label: 'Name',
                        required: true
                    },
                    email: {
                        type: 'email',
                        label: 'Email'
                    }
                }
            });

            // Layer 2: First extension
            objectos.registerObject({
                name: 'contact',
                fields: {
                    phone: {
                        type: 'text',
                        label: 'Phone'
                    } as any,
                    name: {
                        max_length: 100
                    } as any
                }
            });

            // Layer 3: Second extension
            objectos.registerObject({
                name: 'contact',
                label: 'Customer Contact',
                fields: {
                    company: {
                        type: 'text',
                        label: 'Company'
                    } as any,
                    email: null as any  // Delete email
                }
            });

            const contact = objectos.getObject('contact');
            expect(contact).toBeDefined();
            expect(contact?.label).toBe('Customer Contact');
            
            // Check merged fields
            expect(contact?.fields).toHaveProperty('name');
            expect(contact?.fields.name.required).toBe(true);
            expect(contact?.fields.name.max_length).toBe(100);
            
            expect(contact?.fields).toHaveProperty('phone');
            expect(contact?.fields).toHaveProperty('company');
            expect(contact?.fields).not.toHaveProperty('email');
        });
    });
});
