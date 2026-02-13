/**
 * Migration CLI Helper
 *
 * Provides programmatic access to migration commands (up, down, status)
 * that can be invoked by `@objectstack/cli` via `objectstack migrate`.
 *
 * @module packages/storage/src/migration-cli
 * @see docs/guide/technical-debt-resolution.md — TD-2 / M.2.4
 */

import type { StorageBackend, Migration, MigrationRecord } from './types.js';
import { MigrationRunnerImpl } from './migration-runner.js';

export interface MigrateStatusResult {
  applied: MigrationRecord[];
  pending: Migration[];
  total: number;
}

export interface MigrateUpResult {
  applied: string[];
  errors: Array<{ version: string; error: string }>;
}

export interface MigrateDownResult {
  rolledBack: string;
}

/**
 * Migration CLI commands — facade over {@link MigrationRunnerImpl}.
 *
 * Usage:
 * ```ts
 * const cli = new MigrationCLI(backend, allMigrations);
 * const status = await cli.status();
 * const result = await cli.up();
 * const down   = await cli.down();
 * ```
 */
export class MigrationCLI {
  private runner: MigrationRunnerImpl;
  private migrations: Migration[];

  constructor(backend: StorageBackend, migrations: Migration[]) {
    this.runner = new MigrationRunnerImpl(backend);
    this.migrations = migrations.slice().sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Show migration status: applied + pending.
   * Equivalent to `objectstack migrate status`.
   */
  async status(): Promise<MigrateStatusResult> {
    const applied = await this.runner.getAppliedMigrations();
    const pending = await this.runner.getPendingMigrations(this.migrations);
    return {
      applied,
      pending,
      total: this.migrations.length,
    };
  }

  /**
   * Apply all pending migrations in order.
   * Equivalent to `objectstack migrate up`.
   */
  async up(): Promise<MigrateUpResult> {
    const pending = await this.runner.getPendingMigrations(this.migrations);
    const applied: string[] = [];
    const errors: Array<{ version: string; error: string }> = [];

    for (const migration of pending) {
      try {
        await this.runner.applyMigration(migration);
        applied.push(migration.version);
      } catch (err) {
        errors.push({
          version: migration.version,
          error: err instanceof Error ? err.message : String(err),
        });
        break; // Stop on first error
      }
    }

    return { applied, errors };
  }

  /**
   * Rollback the last applied migration.
   * Equivalent to `objectstack migrate down`.
   */
  async down(): Promise<MigrateDownResult> {
    const applied = await this.runner.getAppliedMigrations();
    if (applied.length === 0) {
      throw new Error('No migrations to rollback');
    }

    const last = applied[applied.length - 1];
    const migration = this.migrations.find((m) => m.version === last.version);
    if (!migration) {
      throw new Error(`Migration file for version ${last.version} not found. Cannot rollback.`);
    }

    await this.runner.rollbackMigration(last.version, migration);
    return { rolledBack: last.version };
  }
}
