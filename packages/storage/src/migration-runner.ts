/**
 * Migration Runner
 *
 * Applies and rolls back {@link Migration} objects, persisting
 * {@link MigrationRecord} entries in a {@link StorageBackend} under
 * the `_migrations:` key prefix.
 */

import type {
    ColumnDef,
    IndexOptions,
    Migration,
    MigrationRecord,
    MigrationRunner as IMigrationRunner,
    StorageBackend,
} from './types.js';

/** Key prefix used to store migration records. */
const MIGRATIONS_PREFIX = '_migrations:';

/**
 * Compute a simple numeric hash of a string.
 * Produces a deterministic hex string suitable for change-detection checksums.
 */
function simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const ch = input.charCodeAt(i);
        hash = ((hash << 5) - hash + ch) | 0;
    }
    // Convert to unsigned 32-bit hex
    return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Concrete implementation of {@link IMigrationRunner} backed by a
 * {@link StorageBackend}.
 */
export class MigrationRunnerImpl implements IMigrationRunner {
    private backend: StorageBackend;
    /** Accumulated operations recorded during a migration run. */
    private operations: Array<{
        type: 'addColumn' | 'dropColumn' | 'addIndex' | 'dropIndex';
        object: string;
        detail: unknown;
    }> = [];

    constructor(backend: StorageBackend) {
        this.backend = backend;
    }

    // ── MigrationRunner interface ──────────────────────────────────────

    async addColumn(object: string, column: ColumnDef): Promise<void> {
        this.operations.push({ type: 'addColumn', object, detail: column });
        const key = `_schema:${object}:columns`;
        const columns: ColumnDef[] = (await this.backend.get(key)) ?? [];
        columns.push(column);
        await this.backend.set(key, columns);
    }

    async dropColumn(object: string, columnName: string): Promise<void> {
        this.operations.push({ type: 'dropColumn', object, detail: columnName });
        const key = `_schema:${object}:columns`;
        const columns: ColumnDef[] = (await this.backend.get(key)) ?? [];
        const filtered = columns.filter(c => c.name !== columnName);
        await this.backend.set(key, filtered);
    }

    async addIndex(object: string, columns: string[], options?: IndexOptions): Promise<void> {
        this.operations.push({ type: 'addIndex', object, detail: { columns, options } });
        const key = `_schema:${object}:indexes`;
        const indexes: Array<{ columns: string[]; options?: IndexOptions }> =
            (await this.backend.get(key)) ?? [];
        indexes.push({ columns, options });
        await this.backend.set(key, indexes);
    }

    async dropIndex(object: string, columns: string[]): Promise<void> {
        this.operations.push({ type: 'dropIndex', object, detail: columns });
        const key = `_schema:${object}:indexes`;
        const indexes: Array<{ columns: string[]; options?: IndexOptions }> =
            (await this.backend.get(key)) ?? [];
        const colKey = columns.slice().sort().join(',');
        const filtered = indexes.filter(
            idx => idx.columns.slice().sort().join(',') !== colKey,
        );
        await this.backend.set(key, filtered);
    }

    // ── Public orchestration API ───────────────────────────────────────

    /**
     * Apply a single migration.
     * If the `up()` function throws, the migration record is **not** written.
     */
    async applyMigration(migration: Migration): Promise<void> {
        this.operations = [];

        // Execute the up function — if it throws we bail out
        await migration.up(this);

        const record: MigrationRecord = {
            id: `${migration.version}:${migration.name}`,
            version: migration.version,
            name: migration.name,
            appliedAt: new Date().toISOString(),
            checksum: simpleHash(migration.up.toString() + migration.down.toString()),
        };

        await this.backend.set(`${MIGRATIONS_PREFIX}${migration.version}`, record);
    }

    /**
     * Rollback a previously-applied migration identified by version.
     * The matching {@link Migration} must be supplied so its `down()` can run.
     */
    async rollbackMigration(version: string, migration: Migration): Promise<void> {
        this.operations = [];
        await migration.down(this);
        await this.backend.delete(`${MIGRATIONS_PREFIX}${version}`);
    }

    /**
     * Return all migration records that have been applied, sorted by version.
     */
    async getAppliedMigrations(): Promise<MigrationRecord[]> {
        const keys = await this.backend.keys(`${MIGRATIONS_PREFIX}*`);
        const records: MigrationRecord[] = [];

        for (const key of keys) {
            const record = await this.backend.get(key) as MigrationRecord | undefined;
            if (record) {
                records.push(record);
            }
        }

        return records.sort((a, b) => a.version.localeCompare(b.version));
    }

    /**
     * Determine which migrations from `allMigrations` have not yet been applied.
     */
    async getPendingMigrations(allMigrations: Migration[]): Promise<Migration[]> {
        const applied = await this.getAppliedMigrations();
        const appliedVersions = new Set(applied.map(r => r.version));
        return allMigrations.filter(m => !appliedVersions.has(m.version));
    }
}
