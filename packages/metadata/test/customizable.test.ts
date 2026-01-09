import { MetadataRegistry } from '../src/registry';
import { ObjectConfig } from '../src/types';

describe('Metadata Customizable Protection', () => {
    let registry: MetadataRegistry;

    beforeEach(() => {
        registry = new MetadataRegistry();
    });

    describe('Object-level customizable flag', () => {
        it('should allow registering and unregistering customizable objects', () => {
            const customObject: ObjectConfig = {
                name: 'custom_object',
                fields: {},
                customizable: true
            };

            registry.register('object', {
                type: 'object',
                id: 'custom_object',
                content: customObject
            });

            const retrieved = registry.get<ObjectConfig>('object', 'custom_object');
            expect(retrieved).toBeDefined();
            expect(retrieved?.customizable).toBe(true);

            // Should allow unregister
            expect(() => {
                registry.unregister('object', 'custom_object');
            }).not.toThrow();
        });

        it('should prevent unregistering non-customizable objects', () => {
            const systemObject: ObjectConfig = {
                name: 'user',
                fields: {},
                customizable: false
            };

            registry.register('object', {
                type: 'object',
                id: 'user',
                content: systemObject
            });

            // Should throw error when trying to unregister
            expect(() => {
                registry.unregister('object', 'user');
            }).toThrow(/Cannot delete system object 'user'/);
        });

        it('should prevent unregistering package with non-customizable objects', () => {
            const systemObject: ObjectConfig = {
                name: 'session',
                fields: {},
                customizable: false
            };

            registry.register('object', {
                type: 'object',
                id: 'session',
                package: 'better-auth',
                content: systemObject
            });

            // Should throw error when trying to unregister package
            expect(() => {
                registry.unregisterPackage('better-auth');
            }).toThrow(/Cannot unregister package 'better-auth'/);
        });

        it('should validate object customizable status', () => {
            const systemObject: ObjectConfig = {
                name: 'account',
                fields: {},
                customizable: false
            };

            registry.register('object', {
                type: 'object',
                id: 'account',
                content: systemObject
            });

            // Should throw error for non-customizable object
            expect(() => {
                registry.validateObjectCustomizable('account');
            }).toThrow(/Cannot modify system object 'account'/);
        });

        it('should allow validation for non-existent objects', () => {
            // Should return true for objects that don't exist yet
            expect(registry.validateObjectCustomizable('new_object')).toBe(true);
        });

        it('should allow validation for customizable objects', () => {
            const customObject: ObjectConfig = {
                name: 'project',
                fields: {},
                customizable: true
            };

            registry.register('object', {
                type: 'object',
                id: 'project',
                content: customObject
            });

            expect(registry.validateObjectCustomizable('project')).toBe(true);
        });
    });

    describe('Field-level customizable flag', () => {
        it('should prevent modification of non-customizable fields', () => {
            const objectWithSystemFields: ObjectConfig = {
                name: 'user',
                fields: {
                    name: {
                        type: 'text',
                        customizable: true
                    },
                    createdAt: {
                        type: 'datetime',
                        customizable: false
                    },
                    updatedAt: {
                        type: 'datetime',
                        customizable: false
                    }
                }
            };

            registry.register('object', {
                type: 'object',
                id: 'user',
                content: objectWithSystemFields
            });

            // Should throw error for non-customizable fields
            expect(() => {
                registry.validateFieldCustomizable('user', 'createdAt');
            }).toThrow(/Cannot modify system field 'createdAt'/);

            expect(() => {
                registry.validateFieldCustomizable('user', 'updatedAt');
            }).toThrow(/Cannot modify system field 'updatedAt'/);
        });

        it('should allow modification of customizable fields', () => {
            const objectWithCustomFields: ObjectConfig = {
                name: 'project',
                fields: {
                    title: {
                        type: 'text',
                        customizable: true
                    },
                    description: {
                        type: 'textarea',
                        // customizable defaults to true
                    }
                }
            };

            registry.register('object', {
                type: 'object',
                id: 'project',
                content: objectWithCustomFields
            });

            // Should not throw for customizable fields
            expect(registry.validateFieldCustomizable('project', 'title')).toBe(true);
            expect(registry.validateFieldCustomizable('project', 'description')).toBe(true);
        });

        it('should allow validation for non-existent fields', () => {
            const obj: ObjectConfig = {
                name: 'task',
                fields: {}
            };

            registry.register('object', {
                type: 'object',
                id: 'task',
                content: obj
            });

            // Should return true for fields that don't exist yet
            expect(registry.validateFieldCustomizable('task', 'new_field')).toBe(true);
        });

        it('should allow validation for fields in non-existent objects', () => {
            // Should return true for fields in objects that don't exist yet
            expect(registry.validateFieldCustomizable('non_existent', 'field')).toBe(true);
        });
    });

    describe('Better-auth integration scenarios', () => {
        it('should protect better-auth user object from deletion', () => {
            const userObject: ObjectConfig = {
                name: 'user',
                customizable: false,
                fields: {
                    email: { type: 'email' },
                    password: { type: 'password' },
                    createdAt: { type: 'datetime', customizable: false },
                    updatedAt: { type: 'datetime', customizable: false }
                }
            };

            registry.register('object', {
                type: 'object',
                id: 'user',
                package: 'better-auth',
                content: userObject
            });

            // Cannot delete the object
            expect(() => {
                registry.unregister('object', 'user');
            }).toThrow(/Cannot delete system object 'user'/);

            // Cannot modify the object
            expect(() => {
                registry.validateObjectCustomizable('user');
            }).toThrow(/Cannot modify system object 'user'/);

            // Cannot modify system fields
            expect(() => {
                registry.validateFieldCustomizable('user', 'createdAt');
            }).toThrow(/Cannot modify system field 'createdAt'/);
        });

        it('should protect better-auth session object', () => {
            const sessionObject: ObjectConfig = {
                name: 'session',
                customizable: false,
                fields: {
                    token: { type: 'text' },
                    expiresAt: { type: 'datetime' }
                }
            };

            registry.register('object', {
                type: 'object',
                id: 'session',
                package: 'better-auth',
                content: sessionObject
            });

            expect(() => {
                registry.unregister('object', 'session');
            }).toThrow(/Cannot delete system object 'session'/);
        });

        it('should allow adding custom fields to user objects if object is customizable', () => {
            // Even if the object itself is customizable, some fields might not be
            const userObject: ObjectConfig = {
                name: 'user',
                customizable: true, // Allow adding custom fields to user object
                fields: {
                    email: { type: 'email', customizable: false }, // But core fields are protected
                    createdAt: { type: 'datetime', customizable: false },
                    customField: { type: 'text', customizable: true }
                }
            };

            registry.register('object', {
                type: 'object',
                id: 'user',
                content: userObject
            });

            // Can modify the object (e.g., add new fields)
            expect(registry.validateObjectCustomizable('user')).toBe(true);

            // Cannot modify protected fields
            expect(() => {
                registry.validateFieldCustomizable('user', 'email');
            }).toThrow(/Cannot modify system field 'email'/);

            // Can modify custom fields
            expect(registry.validateFieldCustomizable('user', 'customField')).toBe(true);
        });
    });
});
