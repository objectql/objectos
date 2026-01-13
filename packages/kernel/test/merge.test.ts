import { 
    mergeObjectConfig, 
    mergeFieldConfig, 
    mergeFields, 
    isDeleted,
    DELETED_MARKER 
} from '../src/utils/merge';
import { ObjectConfig, FieldConfig } from '@objectql/types';

describe('Merge Utilities', () => {
    describe('isDeleted', () => {
        it('should return true for null', () => {
            expect(isDeleted(null)).toBe(true);
        });

        it('should return true for undefined', () => {
            expect(isDeleted(undefined)).toBe(true);
        });

        it('should return true for { _deleted: true }', () => {
            expect(isDeleted({ _deleted: true })).toBe(true);
        });

        it('should return false for regular objects', () => {
            expect(isDeleted({ type: 'text' })).toBe(false);
        });

        it('should return false for { _deleted: false }', () => {
            expect(isDeleted({ _deleted: false })).toBe(false);
        });
    });

    describe('mergeFieldConfig', () => {
        it('should return null when override is null', () => {
            const base: FieldConfig = {
                type: 'text',
                label: 'Name',
                required: true
            };
            expect(mergeFieldConfig(base, null)).toBeNull();
        });

        it('should return null when override is { _deleted: true }', () => {
            const base: FieldConfig = {
                type: 'text',
                label: 'Name'
            };
            expect(mergeFieldConfig(base, { _deleted: true })).toBeNull();
        });

        it('should override field properties', () => {
            const base: FieldConfig = {
                type: 'text',
                label: 'Name',
                required: true
            };
            const override = {
                required: false,
                label: 'Full Name'
            };
            const result = mergeFieldConfig(base, override);
            expect(result).toEqual({
                type: 'text',
                label: 'Full Name',
                required: false
            });
        });

        it('should add new properties', () => {
            const base: FieldConfig = {
                type: 'text',
                label: 'Name'
            };
            const override = {
                required: true,
                max_length: 100
            };
            const result = mergeFieldConfig(base, override);
            expect(result).toEqual({
                type: 'text',
                label: 'Name',
                required: true,
                max_length: 100
            });
        });

        it('should delete specific properties when set to null', () => {
            const base: FieldConfig = {
                type: 'text',
                label: 'Name',
                required: true,
                max_length: 100
            };
            const override = {
                required: null,
                max_length: null
            };
            const result = mergeFieldConfig(base, override);
            expect(result).toEqual({
                type: 'text',
                label: 'Name'
            });
        });

        it('should deep merge nested objects', () => {
            const base: FieldConfig = {
                type: 'text',
                label: 'Name',
                validation: {
                    rules: [{ type: 'min_length', value: 3 }]
                } as any
            };
            const override = {
                validation: {
                    rules: [{ type: 'max_length', value: 100 }]
                }
            };
            const result = mergeFieldConfig(base, override);
            expect(result?.validation).toEqual({
                rules: [{ type: 'max_length', value: 100 }]
            });
        });

        it('should override arrays completely', () => {
            const base: FieldConfig = {
                type: 'select',
                label: 'Status',
                options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' }
                ]
            };
            const override = {
                options: [
                    { label: 'New', value: 'new' },
                    { label: 'Active', value: 'active' },
                    { label: 'Archived', value: 'archived' }
                ]
            };
            const result = mergeFieldConfig(base, override);
            expect(result?.options).toEqual([
                { label: 'New', value: 'new' },
                { label: 'Active', value: 'active' },
                { label: 'Archived', value: 'archived' }
            ]);
        });
    });

    describe('mergeFields', () => {
        it('should add new fields', () => {
            const base = {
                name: {
                    type: 'text' as const,
                    label: 'Name'
                }
            };
            const override = {
                email: {
                    type: 'email' as const,
                    label: 'Email'
                }
            };
            const result = mergeFields(base, override);
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('email');
        });

        it('should override existing fields', () => {
            const base = {
                name: {
                    type: 'text' as const,
                    label: 'Name',
                    required: true
                }
            };
            const override = {
                name: {
                    required: false,
                    max_length: 100
                }
            };
            const result = mergeFields(base, override);
            expect(result.name).toEqual({
                type: 'text',
                label: 'Name',
                required: false,
                max_length: 100
            });
        });

        it('should delete fields when set to null', () => {
            const base = {
                name: {
                    type: 'text' as const,
                    label: 'Name'
                },
                email: {
                    type: 'email' as const,
                    label: 'Email'
                }
            };
            const override = {
                email: null
            };
            const result = mergeFields(base, override);
            expect(result).toHaveProperty('name');
            expect(result).not.toHaveProperty('email');
        });

        it('should delete fields when set to { _deleted: true }', () => {
            const base = {
                name: {
                    type: 'text' as const,
                    label: 'Name'
                },
                email: {
                    type: 'email' as const,
                    label: 'Email'
                }
            };
            const override = {
                email: { _deleted: true }
            };
            const result = mergeFields(base, override);
            expect(result).toHaveProperty('name');
            expect(result).not.toHaveProperty('email');
        });
    });

    describe('mergeObjectConfig', () => {
        it('should override top-level properties', () => {
            const base: ObjectConfig = {
                name: 'contacts',
                label: 'Contact',
                icon: 'user',
                fields: {}
            };
            const override: Partial<ObjectConfig> = {
                label: 'Customer',
                icon: 'users',
                description: 'Customer records'
            };
            const result = mergeObjectConfig(base, override);
            expect(result.label).toBe('Customer');
            expect(result.icon).toBe('users');
            expect(result.description).toBe('Customer records');
        });

        it('should merge fields', () => {
            const base: ObjectConfig = {
                name: 'contacts',
                label: 'Contact',
                fields: {
                    name: {
                        type: 'text',
                        label: 'Name'
                    }
                }
            };
            const override: Partial<ObjectConfig> = {
                fields: {
                    email: {
                        type: 'email',
                        label: 'Email'
                    }
                }
            };
            const result = mergeObjectConfig(base, override);
            expect(result.fields).toHaveProperty('name');
            expect(result.fields).toHaveProperty('email');
        });

        it('should delete fields in merged object', () => {
            const base: ObjectConfig = {
                name: 'contacts',
                label: 'Contact',
                fields: {
                    name: {
                        type: 'text',
                        label: 'Name'
                    },
                    phone: {
                        type: 'text',
                        label: 'Phone'
                    }
                }
            };
            const override: Partial<ObjectConfig> = {
                fields: {
                    phone: null as any
                }
            };
            const result = mergeObjectConfig(base, override);
            expect(result.fields).toHaveProperty('name');
            expect(result.fields).not.toHaveProperty('phone');
        });

        it('should merge indexes', () => {
            const base: ObjectConfig = {
                name: 'contacts',
                label: 'Contact',
                fields: {},
                indexes: {
                    email_idx: {
                        fields: ['email'],
                        unique: true
                    }
                }
            };
            const override: Partial<ObjectConfig> = {
                indexes: {
                    name_idx: {
                        fields: ['name']
                    }
                }
            };
            const result = mergeObjectConfig(base, override);
            expect(result.indexes).toHaveProperty('email_idx');
            expect(result.indexes).toHaveProperty('name_idx');
        });

        it('should merge actions', () => {
            const base: ObjectConfig = {
                name: 'contacts',
                label: 'Contact',
                fields: {},
                actions: {
                    send_email: {
                        label: 'Send Email'
                    } as any
                }
            };
            const override: Partial<ObjectConfig> = {
                actions: {
                    send_sms: {
                        label: 'Send SMS'
                    } as any
                }
            };
            const result = mergeObjectConfig(base, override);
            expect(result.actions).toHaveProperty('send_email');
            expect(result.actions).toHaveProperty('send_sms');
        });

        it('should handle complete object extension scenario', () => {
            // Base object from preset
            const base: ObjectConfig = {
                name: 'user',
                label: 'User',
                fields: {
                    name: {
                        type: 'text',
                        label: 'Name',
                        required: true
                    },
                    email: {
                        type: 'email',
                        label: 'Email',
                        required: true
                    },
                    role: {
                        type: 'select',
                        label: 'Role',
                        options: [
                            { label: 'User', value: 'user' },
                            { label: 'Admin', value: 'admin' }
                        ]
                    }
                }
            };

            // Override from application
            const override: Partial<ObjectConfig> = {
                label: 'System User',
                description: 'Application users with extended profile',
                fields: {
                    // Override: make name not required
                    name: {
                        required: false,
                        max_length: 100
                    } as any,
                    // Delete: remove role field
                    role: null as any,
                    // Add: new fields
                    department: {
                        type: 'text',
                        label: 'Department'
                    } as any,
                    phone: {
                        type: 'text',
                        label: 'Phone Number'
                    } as any
                }
            };

            const result = mergeObjectConfig(base, override);

            // Check top-level properties
            expect(result.label).toBe('System User');
            expect(result.description).toBe('Application users with extended profile');

            // Check field override
            expect(result.fields.name.required).toBe(false);
            expect(result.fields.name.max_length).toBe(100);

            // Check field deletion
            expect(result.fields).not.toHaveProperty('role');

            // Check field addition
            expect(result.fields).toHaveProperty('department');
            expect(result.fields).toHaveProperty('phone');

            // Check unchanged fields
            expect(result.fields.email.required).toBe(true);
        });
    });
});
