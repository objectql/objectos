/**
 * Version Manager
 * 
 * Manages plugin versions, compatibility checking, and migration support.
 * Implements semver version comparison and validation.
 */

import { Logger, createLogger } from './logger';

/**
 * Version comparison result
 */
export type VersionComparison = -1 | 0 | 1; // less than, equal, greater than

/**
 * Version constraint
 */
export interface VersionConstraint {
    /** Constraint operator */
    operator: '^' | '~' | '>=' | '<=' | '>' | '<' | '=' | '*';
    /** Version string */
    version: string;
}

/**
 * Version info
 */
export interface VersionInfo {
    raw: string;
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
}

/**
 * Migration function
 */
export type MigrationFunction = (oldVersion: string, newVersion: string, data?: any) => Promise<any>;

/**
 * Version Manager
 * 
 * Handles version comparison, compatibility checking, and migrations.
 */
export class VersionManager {
    private logger: Logger;
    private migrations: Map<string, Map<string, MigrationFunction>> = new Map();

    constructor() {
        this.logger = createLogger('VersionManager');
    }

    /**
     * Parse a version string into components
     */
    parse(versionString: string): VersionInfo {
        // Remove leading 'v' if present
        const cleaned = versionString.replace(/^v/, '');

        // Parse semver: major.minor.patch[-prerelease][+build]
        const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
        const match = cleaned.match(regex);

        if (!match) {
            throw new Error(`Invalid version string: ${versionString}`);
        }

        return {
            raw: cleaned,
            major: parseInt(match[1], 10),
            minor: parseInt(match[2], 10),
            patch: parseInt(match[3], 10),
            prerelease: match[4],
            build: match[5],
        };
    }

    /**
     * Compare two versions
     * 
     * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
     */
    compare(version1: string, version2: string): VersionComparison {
        const v1 = this.parse(version1);
        const v2 = this.parse(version2);

        // Compare major
        if (v1.major !== v2.major) {
            return (v1.major > v2.major ? 1 : -1) as VersionComparison;
        }

        // Compare minor
        if (v1.minor !== v2.minor) {
            return (v1.minor > v2.minor ? 1 : -1) as VersionComparison;
        }

        // Compare patch
        if (v1.patch !== v2.patch) {
            return (v1.patch > v2.patch ? 1 : -1) as VersionComparison;
        }

        // Compare prerelease
        if (v1.prerelease !== v2.prerelease) {
            // Release version is greater than prerelease
            if (!v1.prerelease) return 1;
            if (!v2.prerelease) return -1;

            // Compare prerelease strings
            return (v1.prerelease > v2.prerelease ? 1 : -1) as VersionComparison;
        }

        return 0;
    }

    /**
     * Check if a version satisfies a constraint
     */
    satisfies(version: string, constraint: string): boolean {
        const parsed = this.parseConstraint(constraint);

        // Wildcard always matches
        if (parsed.operator === '*') {
            return true;
        }

        const comparison = this.compare(version, parsed.version);

        switch (parsed.operator) {
            case '=':
                return comparison === 0;
            case '>':
                return comparison === 1;
            case '>=':
                return comparison >= 0;
            case '<':
                return comparison === -1;
            case '<=':
                return comparison <= 0;
            case '^':
                return this.satisfiesCaretRange(version, parsed.version);
            case '~':
                return this.satisfiesTildeRange(version, parsed.version);
            default:
                return false;
        }
    }

    /**
     * Check if version is within caret range (^)
     * ^1.2.3 := >=1.2.3 <2.0.0
     */
    private satisfiesCaretRange(version: string, constraint: string): boolean {
        const v = this.parse(version);
        const c = this.parse(constraint);

        // Same major version
        if (v.major !== c.major) {
            return false;
        }

        // If major is 0, must match minor
        if (c.major === 0) {
            if (v.minor !== c.minor) {
                return false;
            }
            // If minor is also 0, must match patch
            if (c.minor === 0) {
                return v.patch >= c.patch;
            }
        }

        // Version must be >= constraint
        return this.compare(version, constraint) >= 0;
    }

    /**
     * Check if version is within tilde range (~)
     * ~1.2.3 := >=1.2.3 <1.3.0
     */
    private satisfiesTildeRange(version: string, constraint: string): boolean {
        const v = this.parse(version);
        const c = this.parse(constraint);

        // Same major and minor version
        if (v.major !== c.major || v.minor !== c.minor) {
            return false;
        }

        // Patch must be >= constraint
        return v.patch >= c.patch;
    }

    /**
     * Parse a version constraint
     */
    private parseConstraint(constraint: string): VersionConstraint {
        const trimmed = constraint.trim();

        if (trimmed === '*') {
            return { operator: '*', version: '0.0.0' };
        }

        // Match operator
        const operatorMatch = trimmed.match(/^([\^~><=]+)?(.+)$/);
        if (!operatorMatch) {
            throw new Error(`Invalid constraint: ${constraint}`);
        }

        const operator = (operatorMatch[1] || '=') as VersionConstraint['operator'];
        const version = operatorMatch[2].trim();

        return { operator, version };
    }

    /**
     * Check if two versions are compatible (same major version)
     */
    isCompatible(version1: string, version2: string): boolean {
        try {
            const v1 = this.parse(version1);
            const v2 = this.parse(version2);

            // Compatible if same major version (semver rule)
            return v1.major === v2.major;
        } catch (error) {
            this.logger.error('Error checking version compatibility', error as Error);
            return false;
        }
    }

    /**
     * Get the latest version from a list
     */
    getLatest(versions: string[]): string | null {
        if (versions.length === 0) {
            return null;
        }

        return versions.reduce((latest, current) => {
            return this.compare(current, latest) > 0 ? current : latest;
        });
    }

    /**
     * Check if a version is a prerelease
     */
    isPrerelease(version: string): boolean {
        try {
            const parsed = this.parse(version);
            return !!parsed.prerelease;
        } catch (error) {
            return false;
        }
    }

    /**
     * Increment version
     */
    increment(version: string, type: 'major' | 'minor' | 'patch'): string {
        const parsed = this.parse(version);

        switch (type) {
            case 'major':
                return `${parsed.major + 1}.0.0`;
            case 'minor':
                return `${parsed.major}.${parsed.minor + 1}.0`;
            case 'patch':
                return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
        }
    }

    /**
     * Register a migration function for a version transition
     */
    registerMigration(
        pluginId: string,
        fromVersion: string,
        toVersion: string,
        migration: MigrationFunction
    ): void {
        if (!this.migrations.has(pluginId)) {
            this.migrations.set(pluginId, new Map());
        }

        const key = `${fromVersion}->${toVersion}`;
        this.migrations.get(pluginId)!.set(key, migration);

        this.logger.debug(`Registered migration for '${pluginId}': ${key}`);
    }

    /**
     * Run migrations for a plugin version upgrade
     */
    async migrate(
        pluginId: string,
        fromVersion: string,
        toVersion: string,
        data?: any
    ): Promise<any> {
        const pluginMigrations = this.migrations.get(pluginId);
        if (!pluginMigrations) {
            this.logger.debug(`No migrations registered for '${pluginId}'`);
            return data;
        }

        // Try direct migration
        const directKey = `${fromVersion}->${toVersion}`;
        if (pluginMigrations.has(directKey)) {
            this.logger.info(`Running migration for '${pluginId}': ${directKey}`);
            return await pluginMigrations.get(directKey)!(fromVersion, toVersion, data);
        }

        // Try step-by-step migration
        // This would require finding a path through intermediate versions
        this.logger.warn(`No direct migration found for '${pluginId}': ${directKey}`);
        return data;
    }

    /**
     * Validate version string format
     */
    isValid(version: string): boolean {
        try {
            this.parse(version);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Format version info as string
     */
    format(info: VersionInfo): string {
        let version = `${info.major}.${info.minor}.${info.patch}`;

        if (info.prerelease) {
            version += `-${info.prerelease}`;
        }

        if (info.build) {
            version += `+${info.build}`;
        }

        return version;
    }
}

/**
 * Convenience functions
 */

/**
 * Compare two versions
 */
export function compareVersions(v1: string, v2: string): VersionComparison {
    const manager = new VersionManager();
    return manager.compare(v1, v2);
}

/**
 * Check if version satisfies constraint
 */
export function satisfiesVersion(version: string, constraint: string): boolean {
    const manager = new VersionManager();
    return manager.satisfies(version, constraint);
}

/**
 * Check if two versions are compatible
 */
export function areVersionsCompatible(v1: string, v2: string): boolean {
    const manager = new VersionManager();
    return manager.isCompatible(v1, v2);
}
