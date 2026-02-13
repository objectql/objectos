/**
 * Tests for Schema Migration Engine
 *
 * Covers SchemaDiffer, MigrationRunnerImpl, and MigrationGenerator.
 */

import { MemoryStorageBackend } from '../src/memory-backend.js';
import { SchemaDiffer } from '../src/schema-differ.js';
import { MigrationRunnerImpl } from '../src/migration-runner.js';
import { MigrationGenerator } from '../src/migration-generator.js';
import type { ColumnDef, Migration, SchemaMap } from '../src/index.js';

// ─── SchemaDiffer ──────────────────────────────────────────────────────────────

describe('SchemaDiffer', () => {
  it('should detect added columns', () => {
    const snapshot: SchemaMap = {
      account: [{ name: 'id', type: 'text' }],
    };
    const current: SchemaMap = {
      account: [
        { name: 'id', type: 'text' },
        { name: 'email', type: 'text', nullable: true },
      ],
    };

    const diffs = new SchemaDiffer(current, snapshot).diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].object).toBe('account');
    expect(diffs[0].changes).toHaveLength(1);
    expect(diffs[0].changes[0]).toEqual({
      type: 'add_column',
      object: 'account',
      column: { name: 'email', type: 'text', nullable: true },
    });
  });

  it('should detect dropped columns', () => {
    const snapshot: SchemaMap = {
      account: [
        { name: 'id', type: 'text' },
        { name: 'legacy', type: 'text' },
      ],
    };
    const current: SchemaMap = {
      account: [{ name: 'id', type: 'text' }],
    };

    const diffs = new SchemaDiffer(current, snapshot).diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].changes[0]).toEqual({
      type: 'drop_column',
      object: 'account',
      column: 'legacy',
    });
  });

  it('should detect altered columns', () => {
    const snapshot: SchemaMap = {
      account: [{ name: 'age', type: 'text' }],
    };
    const current: SchemaMap = {
      account: [{ name: 'age', type: 'number' }],
    };

    const diffs = new SchemaDiffer(current, snapshot).diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].changes[0].type).toBe('alter_column');
  });

  it('should detect new objects', () => {
    const snapshot: SchemaMap = {};
    const current: SchemaMap = {
      contact: [{ name: 'id', type: 'text' }],
    };

    const diffs = new SchemaDiffer(current, snapshot).diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].object).toBe('contact');
    expect(diffs[0].changes[0].type).toBe('add_column');
  });

  it('should detect removed objects', () => {
    const snapshot: SchemaMap = {
      old_table: [{ name: 'id', type: 'text' }],
    };
    const current: SchemaMap = {};

    const diffs = new SchemaDiffer(current, snapshot).diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].object).toBe('old_table');
    expect(diffs[0].changes[0].type).toBe('drop_column');
  });

  it('should return empty diffs for identical schemas', () => {
    const schema: SchemaMap = {
      account: [{ name: 'id', type: 'text' }],
    };

    const diffs = new SchemaDiffer(schema, schema).diff();
    expect(diffs).toHaveLength(0);
  });

  it('should treat nullable difference as an alteration', () => {
    const snapshot: SchemaMap = {
      account: [{ name: 'name', type: 'text', nullable: false }],
    };
    const current: SchemaMap = {
      account: [{ name: 'name', type: 'text', nullable: true }],
    };

    const diffs = new SchemaDiffer(current, snapshot).diff();
    expect(diffs[0].changes[0].type).toBe('alter_column');
  });
});

// ─── MigrationRunnerImpl ───────────────────────────────────────────────────────

describe('MigrationRunnerImpl', () => {
  let backend: MemoryStorageBackend;
  let runner: MigrationRunnerImpl;

  beforeEach(() => {
    backend = new MemoryStorageBackend();
    runner = new MigrationRunnerImpl(backend);
  });

  afterEach(async () => {
    await backend.close();
  });

  describe('schema operations', () => {
    it('should add a column to schema state', async () => {
      const col: ColumnDef = { name: 'email', type: 'text' };
      await runner.addColumn('account', col);

      const stored = await backend.get('_schema:account:columns');
      expect(stored).toEqual([col]);
    });

    it('should drop a column from schema state', async () => {
      await runner.addColumn('account', { name: 'a', type: 'text' });
      await runner.addColumn('account', { name: 'b', type: 'number' });
      await runner.dropColumn('account', 'a');

      const stored = await backend.get('_schema:account:columns');
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('b');
    });

    it('should add an index', async () => {
      await runner.addIndex('account', ['email'], { unique: true });

      const stored = await backend.get('_schema:account:indexes');
      expect(stored).toEqual([{ columns: ['email'], options: { unique: true } }]);
    });

    it('should drop an index', async () => {
      await runner.addIndex('account', ['email'], { unique: true });
      await runner.dropIndex('account', ['email']);

      const stored = await backend.get('_schema:account:indexes');
      expect(stored).toHaveLength(0);
    });
  });

  describe('applyMigration', () => {
    it('should record the migration after up() succeeds', async () => {
      const migration: Migration = {
        version: '20250101000000000',
        name: 'add_email',
        up: async (r) => {
          await r.addColumn('account', { name: 'email', type: 'text' });
        },
        down: async (r) => {
          await r.dropColumn('account', 'email');
        },
      };

      await runner.applyMigration(migration);

      const applied = await runner.getAppliedMigrations();
      expect(applied).toHaveLength(1);
      expect(applied[0].version).toBe('20250101000000000');
      expect(applied[0].name).toBe('add_email');
      expect(applied[0].checksum).toBeTruthy();
    });

    it('should NOT record migration if up() throws', async () => {
      const migration: Migration = {
        version: '20250101000000000',
        name: 'broken',
        up: async () => {
          throw new Error('boom');
        },
        down: async () => {},
      };

      await expect(runner.applyMigration(migration)).rejects.toThrow('boom');

      const applied = await runner.getAppliedMigrations();
      expect(applied).toHaveLength(0);
    });
  });

  describe('rollbackMigration', () => {
    it('should remove the migration record and run down()', async () => {
      const migration: Migration = {
        version: '20250101000000000',
        name: 'add_email',
        up: async (r) => {
          await r.addColumn('account', { name: 'email', type: 'text' });
        },
        down: async (r) => {
          await r.dropColumn('account', 'email');
        },
      };

      await runner.applyMigration(migration);
      await runner.rollbackMigration('20250101000000000', migration);

      const applied = await runner.getAppliedMigrations();
      expect(applied).toHaveLength(0);

      const cols = await backend.get('_schema:account:columns');
      expect(cols).toHaveLength(0);
    });
  });

  describe('getPendingMigrations', () => {
    it('should return migrations not yet applied', async () => {
      const m1: Migration = {
        version: '001',
        name: 'first',
        up: async () => {},
        down: async () => {},
      };
      const m2: Migration = {
        version: '002',
        name: 'second',
        up: async () => {},
        down: async () => {},
      };

      await runner.applyMigration(m1);

      const pending = await runner.getPendingMigrations([m1, m2]);
      expect(pending).toHaveLength(1);
      expect(pending[0].version).toBe('002');
    });
  });
});

// ─── MigrationGenerator ───────────────────────────────────────────────────────

describe('MigrationGenerator', () => {
  let backend: MemoryStorageBackend;
  let runner: MigrationRunnerImpl;
  const generator = new MigrationGenerator();

  beforeEach(() => {
    backend = new MemoryStorageBackend();
    runner = new MigrationRunnerImpl(backend);
  });

  afterEach(async () => {
    await backend.close();
  });

  it('should generate a migration with timestamp version', () => {
    const migration = generator.generate([], 'empty');

    expect(migration.version).toMatch(/^\d{17}$/);
    expect(migration.name).toBe('empty');
  });

  it('should produce working up/down from add_column diff', async () => {
    const migration = generator.generate(
      [
        {
          object: 'account',
          changes: [
            {
              type: 'add_column',
              object: 'account',
              column: { name: 'email', type: 'text' },
            },
          ],
        },
      ],
      'add_email',
    );

    // Apply up
    await migration.up(runner);
    const cols = await backend.get('_schema:account:columns');
    expect(cols).toEqual([{ name: 'email', type: 'text' }]);

    // Apply down
    await migration.down(runner);
    const colsAfter = await backend.get('_schema:account:columns');
    expect(colsAfter).toHaveLength(0);
  });

  it('should produce working up/down from drop_column diff', async () => {
    // Pre-populate
    await runner.addColumn('account', { name: 'legacy', type: 'text' });

    const migration = generator.generate(
      [
        {
          object: 'account',
          changes: [
            {
              type: 'drop_column',
              object: 'account',
              column: 'legacy',
            },
          ],
        },
      ],
      'drop_legacy',
    );

    await migration.up(runner);
    const cols = await backend.get('_schema:account:columns');
    expect(cols).toHaveLength(0);

    // Down restores a stub column
    await migration.down(runner);
    const restored = await backend.get('_schema:account:columns');
    expect(restored).toHaveLength(1);
    expect(restored[0].name).toBe('legacy');
  });

  it('should produce working up/down from add_index diff', async () => {
    const migration = generator.generate(
      [
        {
          object: 'account',
          changes: [
            {
              type: 'add_index',
              object: 'account',
              columns: ['email'],
              options: { unique: true },
            },
          ],
        },
      ],
      'idx_email',
    );

    await migration.up(runner);
    const indexes = await backend.get('_schema:account:indexes');
    expect(indexes).toHaveLength(1);

    await migration.down(runner);
    const indexesAfter = await backend.get('_schema:account:indexes');
    expect(indexesAfter).toHaveLength(0);
  });

  it('should handle alter_column diff (up = drop + add new, down = drop + add old)', async () => {
    await runner.addColumn('account', { name: 'age', type: 'text' });

    const migration = generator.generate(
      [
        {
          object: 'account',
          changes: [
            {
              type: 'alter_column',
              object: 'account',
              column: 'age',
              from: { name: 'age', type: 'text' },
              to: { name: 'age', type: 'number' },
            },
          ],
        },
      ],
      'alter_age',
    );

    await migration.up(runner);
    const cols = await backend.get('_schema:account:columns');
    expect(cols).toEqual([{ name: 'age', type: 'number' }]);

    await migration.down(runner);
    const colsAfter = await backend.get('_schema:account:columns');
    expect(colsAfter).toEqual([{ name: 'age', type: 'text' }]);
  });

  it('should use default name when none provided', () => {
    const migration = generator.generate([]);
    expect(migration.name).toBe('auto_migration');
  });

  it('should integrate with MigrationRunnerImpl end-to-end', async () => {
    const differ = new SchemaDiffer(
      {
        account: [
          { name: 'id', type: 'text' },
          { name: 'email', type: 'text' },
        ],
      },
      { account: [{ name: 'id', type: 'text' }] },
    );
    const diffs = differ.diff();
    const migration = generator.generate(diffs, 'e2e_test');

    await runner.applyMigration(migration);

    const applied = await runner.getAppliedMigrations();
    expect(applied).toHaveLength(1);

    const cols = await backend.get('_schema:account:columns');
    expect(cols).toEqual([{ name: 'email', type: 'text' }]);
  });
});
