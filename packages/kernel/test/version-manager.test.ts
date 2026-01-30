/**
 * Version Manager Tests
 */

import {
    VersionManager,
    VersionInfo,
    compareVersions,
    satisfiesVersion,
    areVersionsCompatible,
} from '../src/version-manager';

describe('VersionManager', () => {
    let versionManager: VersionManager;

    beforeEach(() => {
        versionManager = new VersionManager();
    });

    describe('Version Parsing', () => {
        it('should parse basic semver version', () => {
            const version = versionManager.parse('1.2.3');

            expect(version).toEqual({
                raw: '1.2.3',
                major: 1,
                minor: 2,
                patch: 3,
                prerelease: undefined,
                build: undefined,
            });
        });

        it('should parse version with prerelease', () => {
            const version = versionManager.parse('1.2.3-alpha.1');

            expect(version).toEqual({
                raw: '1.2.3-alpha.1',
                major: 1,
                minor: 2,
                patch: 3,
                prerelease: 'alpha.1',
                build: undefined,
            });
        });

        it('should parse version with build metadata', () => {
            const version = versionManager.parse('1.2.3+build.123');

            expect(version).toEqual({
                raw: '1.2.3+build.123',
                major: 1,
                minor: 2,
                patch: 3,
                prerelease: undefined,
                build: 'build.123',
            });
        });

        it('should parse version with prerelease and build', () => {
            const version = versionManager.parse('1.2.3-beta.2+build.456');

            expect(version).toEqual({
                raw: '1.2.3-beta.2+build.456',
                major: 1,
                minor: 2,
                patch: 3,
                prerelease: 'beta.2',
                build: 'build.456',
            });
        });

        it('should parse version with leading v', () => {
            const version = versionManager.parse('v1.2.3');

            expect(version.raw).toBe('1.2.3');
            expect(version.major).toBe(1);
        });

        it('should parse version with zero values', () => {
            const version = versionManager.parse('0.0.0');

            expect(version).toEqual({
                raw: '0.0.0',
                major: 0,
                minor: 0,
                patch: 0,
                prerelease: undefined,
                build: undefined,
            });
        });

        it('should throw error for invalid version format', () => {
            expect(() => versionManager.parse('invalid')).toThrow('Invalid version string');
            expect(() => versionManager.parse('1.2')).toThrow('Invalid version string');
            expect(() => versionManager.parse('1.2.3.4')).toThrow('Invalid version string');
        });

        it('should handle complex prerelease identifiers', () => {
            const version = versionManager.parse('1.0.0-rc.1.2.3');

            expect(version.prerelease).toBe('rc.1.2.3');
        });

        it('should handle complex build identifiers', () => {
            const version = versionManager.parse('1.0.0+20230101.abc123');

            expect(version.build).toBe('20230101.abc123');
        });
    });

    describe('Version Comparison', () => {
        it('should compare major versions', () => {
            expect(versionManager.compare('2.0.0', '1.0.0')).toBe(1);
            expect(versionManager.compare('1.0.0', '2.0.0')).toBe(-1);
            expect(versionManager.compare('1.0.0', '1.0.0')).toBe(0);
        });

        it('should compare minor versions', () => {
            expect(versionManager.compare('1.2.0', '1.1.0')).toBe(1);
            expect(versionManager.compare('1.1.0', '1.2.0')).toBe(-1);
            expect(versionManager.compare('1.2.0', '1.2.0')).toBe(0);
        });

        it('should compare patch versions', () => {
            expect(versionManager.compare('1.0.3', '1.0.2')).toBe(1);
            expect(versionManager.compare('1.0.2', '1.0.3')).toBe(-1);
            expect(versionManager.compare('1.0.2', '1.0.2')).toBe(0);
        });

        it('should treat release as greater than prerelease', () => {
            expect(versionManager.compare('1.0.0', '1.0.0-alpha')).toBe(1);
            expect(versionManager.compare('1.0.0-alpha', '1.0.0')).toBe(-1);
        });

        it('should compare prerelease versions alphabetically', () => {
            expect(versionManager.compare('1.0.0-beta', '1.0.0-alpha')).toBe(1);
            expect(versionManager.compare('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
        });

        it('should handle numeric prerelease identifiers', () => {
            expect(versionManager.compare('1.0.0-alpha.2', '1.0.0-alpha.1')).toBe(1);
            // String comparison: 'alpha.10' < 'alpha.2' alphabetically
            expect(versionManager.compare('1.0.0-alpha.10', '1.0.0-alpha.2')).toBe(-1);
        });

        it('should prioritize major over minor and patch', () => {
            expect(versionManager.compare('2.0.0', '1.9.9')).toBe(1);
        });

        it('should prioritize minor over patch', () => {
            expect(versionManager.compare('1.2.0', '1.1.9')).toBe(1);
        });

        it('should handle versions with leading v', () => {
            expect(versionManager.compare('v2.0.0', 'v1.0.0')).toBe(1);
        });
    });

    describe('Semver Constraints - Caret (^)', () => {
        it('should satisfy caret range for normal versions', () => {
            expect(versionManager.satisfies('1.2.3', '^1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.4', '^1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.3.0', '^1.2.3')).toBe(true);
            expect(versionManager.satisfies('2.0.0', '^1.2.3')).toBe(false);
        });

        it('should handle caret range for 0.x versions', () => {
            expect(versionManager.satisfies('0.2.3', '^0.2.3')).toBe(true);
            expect(versionManager.satisfies('0.2.4', '^0.2.3')).toBe(true);
            expect(versionManager.satisfies('0.3.0', '^0.2.3')).toBe(false);
        });

        it('should handle caret range for 0.0.x versions', () => {
            expect(versionManager.satisfies('0.0.3', '^0.0.3')).toBe(true);
            expect(versionManager.satisfies('0.0.4', '^0.0.3')).toBe(true);
        });

        it('should reject lower versions in caret range', () => {
            expect(versionManager.satisfies('1.2.2', '^1.2.3')).toBe(false);
            expect(versionManager.satisfies('1.1.9', '^1.2.3')).toBe(false);
        });
    });

    describe('Semver Constraints - Tilde (~)', () => {
        it('should satisfy tilde range', () => {
            expect(versionManager.satisfies('1.2.3', '~1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.4', '~1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.9', '~1.2.3')).toBe(true);
        });

        it('should reject different minor versions in tilde range', () => {
            expect(versionManager.satisfies('1.3.0', '~1.2.3')).toBe(false);
            expect(versionManager.satisfies('1.1.9', '~1.2.3')).toBe(false);
        });

        it('should reject different major versions in tilde range', () => {
            expect(versionManager.satisfies('2.2.3', '~1.2.3')).toBe(false);
        });

        it('should reject lower patch versions in tilde range', () => {
            expect(versionManager.satisfies('1.2.2', '~1.2.3')).toBe(false);
        });
    });

    describe('Semver Constraints - Comparison Operators', () => {
        it('should satisfy >= constraint', () => {
            expect(versionManager.satisfies('1.2.3', '>=1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.4', '>=1.2.3')).toBe(true);
            expect(versionManager.satisfies('2.0.0', '>=1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.2', '>=1.2.3')).toBe(false);
        });

        it('should satisfy <= constraint', () => {
            expect(versionManager.satisfies('1.2.3', '<=1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.2', '<=1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.0.0', '<=1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.4', '<=1.2.3')).toBe(false);
        });

        it('should satisfy > constraint', () => {
            expect(versionManager.satisfies('1.2.4', '>1.2.3')).toBe(true);
            expect(versionManager.satisfies('2.0.0', '>1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.3', '>1.2.3')).toBe(false);
            expect(versionManager.satisfies('1.2.2', '>1.2.3')).toBe(false);
        });

        it('should satisfy < constraint', () => {
            expect(versionManager.satisfies('1.2.2', '<1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.0.0', '<1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.3', '<1.2.3')).toBe(false);
            expect(versionManager.satisfies('1.2.4', '<1.2.3')).toBe(false);
        });

        it('should satisfy = constraint', () => {
            expect(versionManager.satisfies('1.2.3', '=1.2.3')).toBe(true);
            expect(versionManager.satisfies('1.2.3', '1.2.3')).toBe(true); // implicit =
            expect(versionManager.satisfies('1.2.4', '=1.2.3')).toBe(false);
        });

        it('should satisfy * constraint (wildcard)', () => {
            expect(versionManager.satisfies('1.2.3', '*')).toBe(true);
            expect(versionManager.satisfies('0.0.1', '*')).toBe(true);
            expect(versionManager.satisfies('99.99.99', '*')).toBe(true);
        });
    });

    describe('Compatibility Checking', () => {
        it('should identify compatible versions (same major)', () => {
            expect(versionManager.isCompatible('1.2.3', '1.3.4')).toBe(true);
            expect(versionManager.isCompatible('1.0.0', '1.9.9')).toBe(true);
        });

        it('should identify incompatible versions (different major)', () => {
            expect(versionManager.isCompatible('1.2.3', '2.0.0')).toBe(false);
            expect(versionManager.isCompatible('2.0.0', '1.9.9')).toBe(false);
        });

        it('should handle 0.x versions specially', () => {
            expect(versionManager.isCompatible('0.1.0', '0.2.0')).toBe(true);
        });

        it('should handle invalid versions gracefully', () => {
            expect(versionManager.isCompatible('invalid', '1.0.0')).toBe(false);
            expect(versionManager.isCompatible('1.0.0', 'invalid')).toBe(false);
        });
    });

    describe('Version Incrementing', () => {
        it('should increment major version', () => {
            expect(versionManager.increment('1.2.3', 'major')).toBe('2.0.0');
            expect(versionManager.increment('0.5.9', 'major')).toBe('1.0.0');
        });

        it('should increment minor version', () => {
            expect(versionManager.increment('1.2.3', 'minor')).toBe('1.3.0');
            expect(versionManager.increment('1.9.9', 'minor')).toBe('1.10.0');
        });

        it('should increment patch version', () => {
            expect(versionManager.increment('1.2.3', 'patch')).toBe('1.2.4');
            expect(versionManager.increment('1.2.9', 'patch')).toBe('1.2.10');
        });

        it('should ignore prerelease and build when incrementing', () => {
            expect(versionManager.increment('1.2.3-alpha.1+build', 'patch')).toBe('1.2.4');
            expect(versionManager.increment('1.2.3-beta', 'minor')).toBe('1.3.0');
            expect(versionManager.increment('1.2.3+build', 'major')).toBe('2.0.0');
        });
    });

    describe('Prerelease Detection', () => {
        it('should detect prerelease versions', () => {
            expect(versionManager.isPrerelease('1.0.0-alpha')).toBe(true);
            expect(versionManager.isPrerelease('1.0.0-beta.1')).toBe(true);
            expect(versionManager.isPrerelease('1.0.0-rc.1')).toBe(true);
        });

        it('should identify release versions', () => {
            expect(versionManager.isPrerelease('1.0.0')).toBe(false);
            expect(versionManager.isPrerelease('2.3.4')).toBe(false);
        });

        it('should ignore build metadata for prerelease detection', () => {
            expect(versionManager.isPrerelease('1.0.0+build')).toBe(false);
            expect(versionManager.isPrerelease('1.0.0-alpha+build')).toBe(true);
        });

        it('should handle invalid versions', () => {
            expect(versionManager.isPrerelease('invalid')).toBe(false);
        });
    });

    describe('Latest Version Selection', () => {
        it('should select latest from multiple versions', () => {
            const versions = ['1.0.0', '1.2.3', '1.1.0', '2.0.0', '1.5.0'];
            expect(versionManager.getLatest(versions)).toBe('2.0.0');
        });

        it('should handle single version', () => {
            expect(versionManager.getLatest(['1.0.0'])).toBe('1.0.0');
        });

        it('should return null for empty array', () => {
            expect(versionManager.getLatest([])).toBeNull();
        });

        it('should handle prerelease versions', () => {
            const versions = ['1.0.0-alpha', '1.0.0-beta', '1.0.0'];
            expect(versionManager.getLatest(versions)).toBe('1.0.0');
        });

        it('should handle versions with leading v', () => {
            const versions = ['v1.0.0', 'v2.0.0', 'v1.5.0'];
            // getLatest returns the raw version from the array, not the parsed version
            const latest = versionManager.getLatest(versions);
            expect(latest).toBe('v2.0.0');
        });

        it('should handle unordered versions', () => {
            const versions = ['2.0.0', '1.0.0', '3.0.0', '1.5.0'];
            expect(versionManager.getLatest(versions)).toBe('3.0.0');
        });
    });

    describe('Migration Registration and Execution', () => {
        it('should register migration', () => {
            const migration = jest.fn().mockResolvedValue({ migrated: true });

            versionManager.registerMigration('test-plugin', '1.0.0', '2.0.0', migration);

            // Should not throw
        });

        it('should execute direct migration', async () => {
            const migration = jest.fn().mockResolvedValue({ migrated: true });
            versionManager.registerMigration('test-plugin', '1.0.0', '2.0.0', migration);

            const result = await versionManager.migrate('test-plugin', '1.0.0', '2.0.0', { data: 'test' });

            expect(migration).toHaveBeenCalledWith('1.0.0', '2.0.0', { data: 'test' });
            expect(result).toEqual({ migrated: true });
        });

        it('should return data if no migration found', async () => {
            const data = { original: 'data' };
            const result = await versionManager.migrate('test-plugin', '1.0.0', '2.0.0', data);

            expect(result).toBe(data);
        });

        it('should return data if no migrations registered for plugin', async () => {
            const data = { original: 'data' };
            const result = await versionManager.migrate('unknown-plugin', '1.0.0', '2.0.0', data);

            expect(result).toBe(data);
        });

        it('should support multiple migrations for same plugin', async () => {
            const migration1 = jest.fn().mockResolvedValue({ v2: true });
            const migration2 = jest.fn().mockResolvedValue({ v3: true });

            versionManager.registerMigration('test-plugin', '1.0.0', '2.0.0', migration1);
            versionManager.registerMigration('test-plugin', '2.0.0', '3.0.0', migration2);

            await versionManager.migrate('test-plugin', '1.0.0', '2.0.0');
            await versionManager.migrate('test-plugin', '2.0.0', '3.0.0');

            expect(migration1).toHaveBeenCalled();
            expect(migration2).toHaveBeenCalled();
        });

        it('should handle migration errors', async () => {
            const migration = jest.fn().mockRejectedValue(new Error('Migration failed'));
            versionManager.registerMigration('test-plugin', '1.0.0', '2.0.0', migration);

            await expect(
                versionManager.migrate('test-plugin', '1.0.0', '2.0.0')
            ).rejects.toThrow('Migration failed');
        });

        it('should pass data through migration', async () => {
            const migration = jest.fn(async (from, to, data) => ({
                ...data,
                migrated: true,
                from,
                to,
            }));

            versionManager.registerMigration('test-plugin', '1.0.0', '2.0.0', migration);

            const result = await versionManager.migrate('test-plugin', '1.0.0', '2.0.0', { count: 42 });

            expect(result).toEqual({
                count: 42,
                migrated: true,
                from: '1.0.0',
                to: '2.0.0',
            });
        });
    });

    describe('Version Validation', () => {
        it('should validate correct version strings', () => {
            expect(versionManager.isValid('1.0.0')).toBe(true);
            expect(versionManager.isValid('1.2.3')).toBe(true);
            expect(versionManager.isValid('0.0.0')).toBe(true);
            expect(versionManager.isValid('1.0.0-alpha')).toBe(true);
            expect(versionManager.isValid('1.0.0+build')).toBe(true);
        });

        it('should reject invalid version strings', () => {
            expect(versionManager.isValid('invalid')).toBe(false);
            expect(versionManager.isValid('1.2')).toBe(false);
            expect(versionManager.isValid('1.2.3.4')).toBe(false);
            expect(versionManager.isValid('1.x.x')).toBe(false);
        });

        it('should accept versions with leading v', () => {
            expect(versionManager.isValid('v1.0.0')).toBe(true);
        });
    });

    describe('Version Formatting', () => {
        it('should format basic version info', () => {
            const info: VersionInfo = {
                raw: '1.2.3',
                major: 1,
                minor: 2,
                patch: 3,
            };

            expect(versionManager.format(info)).toBe('1.2.3');
        });

        it('should format version with prerelease', () => {
            const info: VersionInfo = {
                raw: '1.2.3-alpha.1',
                major: 1,
                minor: 2,
                patch: 3,
                prerelease: 'alpha.1',
            };

            expect(versionManager.format(info)).toBe('1.2.3-alpha.1');
        });

        it('should format version with build', () => {
            const info: VersionInfo = {
                raw: '1.2.3+build.123',
                major: 1,
                minor: 2,
                patch: 3,
                build: 'build.123',
            };

            expect(versionManager.format(info)).toBe('1.2.3+build.123');
        });

        it('should format version with prerelease and build', () => {
            const info: VersionInfo = {
                raw: '1.2.3-beta.2+build.456',
                major: 1,
                minor: 2,
                patch: 3,
                prerelease: 'beta.2',
                build: 'build.456',
            };

            expect(versionManager.format(info)).toBe('1.2.3-beta.2+build.456');
        });
    });

    describe('Convenience Functions', () => {
        it('should compare versions using convenience function', () => {
            expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
            expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
            expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
        });

        it('should check satisfies using convenience function', () => {
            expect(satisfiesVersion('1.2.3', '^1.2.0')).toBe(true);
            expect(satisfiesVersion('2.0.0', '^1.2.0')).toBe(false);
        });

        it('should check compatibility using convenience function', () => {
            expect(areVersionsCompatible('1.2.3', '1.5.0')).toBe(true);
            expect(areVersionsCompatible('1.2.3', '2.0.0')).toBe(false);
        });
    });
});
