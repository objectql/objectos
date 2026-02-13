/**
 * Schema Differ
 *
 * Compares a "current" schema (e.g. from YAML definitions) against a
 * "snapshot" schema and produces an array of {@link SchemaDiff} describing
 * the structural changes.
 */

import type { ColumnDef, SchemaChange, SchemaDiff } from './types.js';

/**
 * Lightweight schema description keyed by object name.
 * Each object maps to an array of {@link ColumnDef}.
 */
export interface SchemaMap {
  [objectName: string]: ColumnDef[];
}

export class SchemaDiffer {
  private current: SchemaMap;
  private snapshot: SchemaMap;

  constructor(current: SchemaMap, snapshot: SchemaMap) {
    this.current = current;
    this.snapshot = snapshot;
  }

  /**
   * Compute diffs between current and snapshot schemas.
   * Returns only objects that have at least one change.
   */
  diff(): SchemaDiff[] {
    const diffs: SchemaDiff[] = [];
    const allObjects = new Set([...Object.keys(this.current), ...Object.keys(this.snapshot)]);

    for (const objectName of allObjects) {
      const changes = this.diffObject(objectName);
      if (changes.length > 0) {
        diffs.push({ object: objectName, changes });
      }
    }

    return diffs;
  }

  /** Compare columns for a single object. */
  private diffObject(objectName: string): SchemaChange[] {
    const currentCols = this.current[objectName] ?? [];
    const snapshotCols = this.snapshot[objectName] ?? [];

    const currentMap = new Map(currentCols.map((c) => [c.name, c]));
    const snapshotMap = new Map(snapshotCols.map((c) => [c.name, c]));
    const changes: SchemaChange[] = [];

    // Detect added and altered columns
    for (const [name, col] of currentMap) {
      const prev = snapshotMap.get(name);
      if (!prev) {
        changes.push({ type: 'add_column', object: objectName, column: col });
      } else if (!this.columnsEqual(prev, col)) {
        changes.push({
          type: 'alter_column',
          object: objectName,
          column: name,
          from: prev,
          to: col,
        });
      }
    }

    // Detect dropped columns
    for (const [name] of snapshotMap) {
      if (!currentMap.has(name)) {
        changes.push({ type: 'drop_column', object: objectName, column: name });
      }
    }

    return changes;
  }

  /** Deep-equal check for two column definitions. */
  private columnsEqual(a: ColumnDef, b: ColumnDef): boolean {
    return (
      a.name === b.name &&
      a.type === b.type &&
      (a.nullable ?? false) === (b.nullable ?? false) &&
      JSON.stringify(a.defaultValue) === JSON.stringify(b.defaultValue)
    );
  }
}
