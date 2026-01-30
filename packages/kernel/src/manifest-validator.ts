/**
 * Manifest Validator
 * 
 * Validates plugin manifests against the @objectstack/spec schema using Zod.
 * Ensures all required fields are present and properly formatted.
 */

import { z } from 'zod';
import type { ObjectStackManifest } from '@objectstack/spec/system';
import { Logger, createLogger } from './logger';

/**
 * Validation error details
 */
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
}

/**
 * Zod schema for ObjectStack manifest
 * Based on @objectstack/spec/system
 */
const ManifestSchema = z.object({
    // Required fields
    id: z.string()
        .min(1, 'Plugin ID is required')
        .regex(/^[a-z0-9-._]+$/, 'Plugin ID must contain only lowercase letters, numbers, hyphens, dots, and underscores'),
    
    version: z.string()
        .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, 'Version must follow semver format (e.g., 1.0.0)'),
    
    type: z.enum(['plugin', 'preset', 'driver', 'theme'])
        .describe('Type of the package'),
    
    name: z.string()
        .min(1, 'Plugin name is required'),
    
    // Optional fields
    description: z.string().optional(),
    
    author: z.union([
        z.string(),
        z.object({
            name: z.string(),
            email: z.string().email().optional(),
            url: z.string().url().optional(),
        })
    ]).optional(),
    
    license: z.string().optional(),
    
    homepage: z.string().url().optional(),
    
    repository: z.union([
        z.string().url(),
        z.object({
            type: z.string(),
            url: z.string().url(),
        })
    ]).optional(),
    
    keywords: z.array(z.string()).optional(),
    
    // Permissions required by the plugin
    permissions: z.array(z.string()).optional(),
    
    // Plugin capabilities and extensions
    contributes: z.object({
        // Objects contributed by this plugin
        objects: z.array(z.string()).optional(),
        
        // Services contributed by this plugin
        services: z.array(z.string()).optional(),
        
        // Events contributed by this plugin
        events: z.array(z.string()).optional(),
        
        // API endpoints contributed by this plugin
        api: z.array(z.object({
            method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
            path: z.string(),
            handler: z.string().optional(),
        })).optional(),
        
        // Dependencies (other plugins this plugin requires)
        dependencies: z.union([
            z.array(z.string()),
            z.record(z.string(), z.string())
        ]).optional(),
        
        // Commands contributed by this plugin
        commands: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().optional(),
        })).optional(),
        
        // Menu items contributed by this plugin
        menus: z.array(z.object({
            id: z.string(),
            label: z.string(),
            icon: z.string().optional(),
            url: z.string().optional(),
        })).optional(),
    }).optional(),
    
    // Engine compatibility
    engines: z.object({
        objectos: z.string().optional(),
        node: z.string().optional(),
    }).optional(),
    
    // Configuration schema
    config: z.record(z.string(), z.any()).optional(),
    
    // Allow additional properties for extensibility
}).passthrough();

/**
 * Manifest Validator
 * 
 * Validates plugin manifests to ensure they conform to the spec.
 */
export class ManifestValidator {
    private logger: Logger;
    private strictMode: boolean;

    constructor(options: { strictMode?: boolean } = {}) {
        this.logger = createLogger('ManifestValidator');
        this.strictMode = options.strictMode ?? true;
    }

    /**
     * Validate a plugin manifest
     */
    validate(manifest: any): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: string[] = [];

        // Basic type check
        if (typeof manifest !== 'object' || manifest === null) {
            return {
                valid: false,
                errors: [{
                    field: 'manifest',
                    message: 'Manifest must be an object',
                    value: manifest,
                }],
                warnings: [],
            };
        }

        // Validate against Zod schema
        const result = ManifestSchema.safeParse(manifest);

        if (!result.success) {
            for (const issue of result.error.issues) {
                errors.push({
                    field: issue.path.join('.') || 'root',
                    message: issue.message,
                    value: issue.path.reduce((obj, key) => obj?.[key], manifest),
                });
            }
        }

        // Additional semantic validations
        if (result.success || !this.strictMode) {
            const semanticErrors = this.validateSemantics(manifest);
            errors.push(...semanticErrors);
        }

        // Generate warnings for best practices
        const bestPracticeWarnings = this.checkBestPractices(manifest);
        warnings.push(...bestPracticeWarnings);

        const isValid = errors.length === 0;

        if (!isValid) {
            this.logger.debug(`Manifest validation failed for '${manifest.id}' with ${errors.length} error(s)`);
        }

        return {
            valid: isValid,
            errors,
            warnings,
        };
    }

    /**
     * Validate semantic correctness beyond schema
     */
    private validateSemantics(manifest: any): ValidationError[] {
        const errors: ValidationError[] = [];

        // Check for duplicate permissions
        if (manifest.permissions && Array.isArray(manifest.permissions)) {
            const uniquePerms = new Set(manifest.permissions);
            if (uniquePerms.size !== manifest.permissions.length) {
                errors.push({
                    field: 'permissions',
                    message: 'Duplicate permissions detected',
                    value: manifest.permissions,
                });
            }
        }

        // Check for duplicate events
        if (manifest.contributes?.events && Array.isArray(manifest.contributes.events)) {
            const uniqueEvents = new Set(manifest.contributes.events);
            if (uniqueEvents.size !== manifest.contributes.events.length) {
                errors.push({
                    field: 'contributes.events',
                    message: 'Duplicate events detected',
                    value: manifest.contributes.events,
                });
            }
        }

        // Validate API endpoints
        if (manifest.contributes?.api && Array.isArray(manifest.contributes.api)) {
            const paths = new Set<string>();
            for (const endpoint of manifest.contributes.api) {
                const key = `${endpoint.method}:${endpoint.path}`;
                if (paths.has(key)) {
                    errors.push({
                        field: 'contributes.api',
                        message: `Duplicate API endpoint: ${key}`,
                        value: endpoint,
                    });
                }
                paths.add(key);
            }
        }

        // Validate version format
        if (manifest.version) {
            if (!this.isValidSemver(manifest.version)) {
                errors.push({
                    field: 'version',
                    message: 'Invalid semver version format',
                    value: manifest.version,
                });
            }
        }

        // Validate dependencies (if object format)
        const contributes = manifest.contributes as any;
        if (contributes?.dependencies && typeof contributes.dependencies === 'object' && !Array.isArray(contributes.dependencies)) {
            for (const [depId, depVersion] of Object.entries(contributes.dependencies)) {
                if (typeof depVersion === 'string' && !this.isValidSemverRange(depVersion)) {
                    errors.push({
                        field: `contributes.dependencies.${depId}`,
                        message: 'Invalid semver version range',
                        value: depVersion,
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Check best practices and generate warnings
     */
    private checkBestPractices(manifest: any): string[] {
        const warnings: string[] = [];

        // Recommend description
        if (!manifest.description || manifest.description.trim() === '') {
            warnings.push('Consider adding a description to help users understand the plugin');
        }

        // Recommend author
        if (!manifest.author) {
            warnings.push('Consider adding author information');
        }

        // Recommend license
        if (!manifest.license) {
            warnings.push('Consider specifying a license');
        }

        // Recommend keywords for discoverability
        if (!manifest.keywords || manifest.keywords.length === 0) {
            warnings.push('Consider adding keywords for better discoverability');
        }

        // Warn if no permissions specified
        if (!manifest.permissions || manifest.permissions.length === 0) {
            warnings.push('No permissions specified - plugin may have limited functionality');
        }

        // Warn if using prerelease version
        if (manifest.version && manifest.version.includes('-')) {
            warnings.push('Using a prerelease version - consider using a stable version for production');
        }

        return warnings;
    }

    /**
     * Validate semver version format
     */
    private isValidSemver(version: string): boolean {
        const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
        return semverRegex.test(version);
    }

    /**
     * Validate semver version range format
     */
    private isValidSemverRange(range: string): boolean {
        // Simple validation for common range formats
        const rangeRegex = /^(\^|~|>=|<=|>|<|=)?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\s*\|\|\s*(\^|~|>=|<=|>|<|=)?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?)*$/;
        return rangeRegex.test(range.trim());
    }

    /**
     * Validate and throw on error
     */
    validateOrThrow(manifest: any): void {
        const result = this.validate(manifest);
        
        if (!result.valid) {
            const errorMessages = result.errors.map(
                err => `  - ${err.field}: ${err.message}`
            );
            throw new Error(
                `Manifest validation failed:\n${errorMessages.join('\n')}`
            );
        }

        // Log warnings
        if (result.warnings.length > 0) {
            this.logger.warn(`Manifest warnings for '${manifest.id}':\n${result.warnings.map(w => `  - ${w}`).join('\n')}`);
        }
    }

    /**
     * Batch validate multiple manifests
     */
    validateBatch(manifests: any[]): Map<string, ValidationResult> {
        const results = new Map<string, ValidationResult>();

        for (const manifest of manifests) {
            const id = manifest?.id || 'unknown';
            const result = this.validate(manifest);
            results.set(id, result);
        }

        return results;
    }
}

/**
 * Convenience function to validate a manifest
 */
export function validateManifest(manifest: any, options?: { strictMode?: boolean }): ValidationResult {
    const validator = new ManifestValidator(options);
    return validator.validate(manifest);
}
