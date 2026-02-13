/**
 * Migration Generator
 *
 * Transforms an array of {@link SchemaDiff} into a ready-to-run
 * {@link Migration} object with auto-generated version strings and
 * inverse `down()` operations.
 */

import type { Migration, MigrationRunner, SchemaDiff } from './types.js';

export class MigrationGenerator {
  /**
   * Generate a {@link Migration} from a set of schema diffs.
   *
   * @param diffs  - schema differences to encode
   * @param name   - human-readable migration name (default: `'auto_migration'`)
   * @returns a Migration whose `up`/`down` replay the diffs
   */
  generate(diffs: SchemaDiff[], name = 'auto_migration'): Migration {
    const version = this.generateVersion();

    return {
      version,
      name,
      up: this.buildUp(diffs),
      down: this.buildDown(diffs),
    };
  }

  /** Timestamp-based version string (YYYYMMDDHHmmssSSS). */
  private generateVersion(): string {
    const now = new Date();
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    return (
      `${now.getFullYear()}` +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds()) +
      pad(now.getMilliseconds(), 3)
    );
  }

  /** Build the forward migration function from diffs. */
  private buildUp(diffs: SchemaDiff[]): (runner: MigrationRunner) => Promise<void> {
    return async (runner: MigrationRunner) => {
      for (const diff of diffs) {
        for (const change of diff.changes) {
          switch (change.type) {
            case 'add_column':
              await runner.addColumn(change.object, change.column);
              break;
            case 'drop_column':
              await runner.dropColumn(change.object, change.column);
              break;
            case 'alter_column':
              // Alter = drop old + add new
              await runner.dropColumn(change.object, change.column);
              await runner.addColumn(change.object, change.to);
              break;
            case 'add_index':
              await runner.addIndex(change.object, change.columns, change.options);
              break;
            case 'drop_index':
              await runner.dropIndex(change.object, change.columns);
              break;
          }
        }
      }
    };
  }

  /** Build the inverse (rollback) migration function from diffs. */
  private buildDown(diffs: SchemaDiff[]): (runner: MigrationRunner) => Promise<void> {
    return async (runner: MigrationRunner) => {
      // Process diffs in reverse order for correct rollback
      for (let i = diffs.length - 1; i >= 0; i--) {
        const diff = diffs[i];
        for (let j = diff.changes.length - 1; j >= 0; j--) {
          const change = diff.changes[j];
          switch (change.type) {
            case 'add_column':
              // Undo add → drop
              await runner.dropColumn(change.object, change.column.name);
              break;
            case 'drop_column':
              // Cannot fully restore without original ColumnDef — add stub
              await runner.addColumn(change.object, {
                name: change.column,
                type: 'text',
                nullable: true,
              });
              break;
            case 'alter_column':
              // Undo alter → restore original
              await runner.dropColumn(change.object, change.column);
              await runner.addColumn(change.object, change.from);
              break;
            case 'add_index':
              await runner.dropIndex(change.object, change.columns);
              break;
            case 'drop_index':
              await runner.addIndex(change.object, change.columns);
              break;
          }
        }
      }
    };
  }
}
