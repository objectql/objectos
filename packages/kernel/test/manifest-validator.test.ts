/**
 * Manifest Validator Tests
 */

import { ManifestValidator, validateManifest } from '../src/manifest-validator';
import type { ObjectStackManifest } from '@objectstack/spec/system';

describe('ManifestValidator', () => {
    let validator: ManifestValidator;

    beforeEach(() => {
        validator = new ManifestValidator();
    });

    const createValidManifest = (): any => ({
        id: 'test-plugin',
        version: '1.0.0',
        type: 'plugin',
        name: 'Test Plugin',
        description: 'A test plugin',
        author: 'Test Author',
        license: 'MIT',
    });

    describe('validate - valid manifests', () => {
        it('should validate a minimal valid manifest', () => {
            const manifest: any = {
                id: 'test-plugin',
                version: '1.0.0',
                type: 'plugin',
                name: 'Test Plugin',
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should validate a complete manifest', () => {
            const manifest: any = {
                id: 'test-plugin',
                version: '1.0.0',
                type: 'plugin',
                name: 'Test Plugin',
                description: 'A comprehensive test plugin',
                author: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    url: 'https://example.com',
                },
                license: 'MIT',
                homepage: 'https://example.com',
                repository: {
                    type: 'git',
                    url: 'https://github.com/test/test-plugin',
                },
                keywords: ['test', 'plugin'],
                permissions: ['system.read', 'data.write'],
                contributes: {
                    objects: ['test_object'],
                    services: ['test-service'],
                    events: ['test.event'],
                    dependencies: ['other-plugin'],
                },
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should validate plugin types', () => {
            const types: Array<'plugin' | 'preset' | 'driver' | 'theme'> = ['plugin', 'preset', 'driver', 'theme'];

            for (const type of types) {
                const manifest = {
                    ...createValidManifest(),
                    type,
                };

                const result = validator.validate(manifest);
                expect(result.valid).toBe(true);
            }
        });

        it('should accept dependencies as array', () => {
            const manifest = {
                ...createValidManifest(),
                contributes: {
                    dependencies: ['plugin-a', 'plugin-b'],
                },
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(true);
        });

        it('should accept dependencies as object', () => {
            const manifest = {
                ...createValidManifest(),
                contributes: {
                    dependencies: {
                        'plugin-a': '^1.0.0',
                        'plugin-b': '~2.0.0',
                    },
                },
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(true);
        });
    });

    describe('validate - invalid manifests', () => {
        it('should reject non-object manifest', () => {
            const result = validator.validate('invalid' as any);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should reject null manifest', () => {
            const result = validator.validate(null as any);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should reject manifest without id', () => {
            const manifest = {
                version: '1.0.0',
                type: 'plugin',
                name: 'Test',
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'id')).toBe(true);
        });

        it('should reject manifest without version', () => {
            const manifest = {
                id: 'test',
                type: 'plugin',
                name: 'Test',
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'version')).toBe(true);
        });

        it('should reject manifest without type', () => {
            const manifest = {
                id: 'test',
                version: '1.0.0',
                name: 'Test',
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'type')).toBe(true);
        });

        it('should reject manifest without name', () => {
            const manifest = {
                id: 'test',
                version: '1.0.0',
                type: 'plugin',
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'name')).toBe(true);
        });

        it('should reject invalid plugin ID format', () => {
            const manifest = {
                ...createValidManifest(),
                id: 'Invalid ID!',
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'id')).toBe(true);
        });

        it('should reject invalid version format', () => {
            const manifest = {
                ...createValidManifest(),
                version: 'invalid',
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'version')).toBe(true);
        });

        it('should reject invalid type', () => {
            const manifest = {
                ...createValidManifest(),
                type: 'invalid-type' as any,
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'type')).toBe(true);
        });

        it('should reject invalid email in author', () => {
            const manifest = {
                ...createValidManifest(),
                author: {
                    name: 'John',
                    email: 'invalid-email',
                },
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
        });

        it('should reject invalid URL in homepage', () => {
            const manifest = {
                ...createValidManifest(),
                homepage: 'not-a-url',
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
        });
    });

    describe('semantic validation', () => {
        it('should detect duplicate permissions', () => {
            const manifest = {
                ...createValidManifest(),
                permissions: ['perm-a', 'perm-b', 'perm-a'],
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'permissions')).toBe(true);
        });

        it('should detect duplicate events', () => {
            const manifest = {
                ...createValidManifest(),
                contributes: {
                    events: ['event-a', 'event-b', 'event-a'],
                },
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'contributes.events')).toBe(true);
        });

        it('should detect duplicate API endpoints', () => {
            const manifest = {
                ...createValidManifest(),
                contributes: {
                    api: [
                        { method: 'GET' as const, path: '/test' },
                        { method: 'GET' as const, path: '/test' },
                    ],
                },
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'contributes.api')).toBe(true);
        });

        it('should validate semver in dependencies', () => {
            const manifest = {
                ...createValidManifest(),
                contributes: {
                    dependencies: {
                        'plugin-a': 'invalid-version',
                    },
                },
            };

            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
        });
    });

    describe('warnings', () => {
        it('should warn about missing description', () => {
            const manifest: any = {
                id: 'test',
                version: '1.0.0',
                type: 'plugin',
                name: 'Test',
            };

            const result = validator.validate(manifest);
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(w => w.includes('description'))).toBe(true);
        });

        it('should warn about missing author', () => {
            const manifest: any = {
                id: 'test',
                version: '1.0.0',
                type: 'plugin',
                name: 'Test',
                description: 'Test plugin',
            };

            const result = validator.validate(manifest);
            expect(result.warnings.some(w => w.includes('author'))).toBe(true);
        });

        it('should warn about prerelease versions', () => {
            const manifest: any = {
                id: 'test',
                version: '1.0.0-beta.1',
                type: 'plugin',
                name: 'Test',
            };

            const result = validator.validate(manifest);
            expect(result.warnings.some(w => w.includes('prerelease'))).toBe(true);
        });
    });

    describe('validateOrThrow', () => {
        it('should not throw for valid manifest', () => {
            const manifest = createValidManifest();
            expect(() => validator.validateOrThrow(manifest)).not.toThrow();
        });

        it('should throw for invalid manifest', () => {
            const manifest = {
                id: 'test',
                // missing required fields
            };

            expect(() => validator.validateOrThrow(manifest)).toThrow();
        });
    });

    describe('validateBatch', () => {
        it('should validate multiple manifests', () => {
            const manifests = [
                createValidManifest(),
                { ...createValidManifest(), id: 'plugin-2' },
                { ...createValidManifest(), id: 'plugin-3' },
            ];

            const results = validator.validateBatch(manifests);
            expect(results.size).toBe(3);
            expect(results.get('test-plugin')?.valid).toBe(true);
            expect(results.get('plugin-2')?.valid).toBe(true);
            expect(results.get('plugin-3')?.valid).toBe(true);
        });

        it('should handle invalid manifests in batch', () => {
            const manifests = [
                createValidManifest(),
                { id: 'invalid' }, // invalid
            ];

            const results = validator.validateBatch(manifests);
            expect(results.size).toBe(2);
            expect(results.get('test-plugin')?.valid).toBe(true);
            expect(results.get('invalid')?.valid).toBe(false);
        });
    });

    describe('strict mode', () => {
        it('should fail in strict mode', () => {
            const strictValidator = new ManifestValidator({ strictMode: true });
            const manifest = { id: 'test' };

            const result = strictValidator.validate(manifest);
            expect(result.valid).toBe(false);
        });

        it('should be lenient in non-strict mode', () => {
            const lenientValidator = new ManifestValidator({ strictMode: false });
            const manifest = createValidManifest();

            const result = lenientValidator.validate(manifest);
            expect(result.valid).toBe(true);
        });
    });

    describe('validateManifest convenience function', () => {
        it('should validate using convenience function', () => {
            const manifest = createValidManifest();
            const result = validateManifest(manifest);
            expect(result.valid).toBe(true);
        });

        it('should pass options to convenience function', () => {
            const manifest = createValidManifest();
            const result = validateManifest(manifest, { strictMode: false });
            expect(result.valid).toBe(true);
        });
    });
});
