/**
 * Mock metadata and records for development.
 *
 * Re-exports from `__mocks__/mock-data.ts` so the actual data lives
 * in a tree-shakeable location.  In production builds the DevDataProvider
 * (and its dynamic `import()`) is the only consumer; this barrel file
 * keeps existing test imports working during the migration.
 *
 * @see apps/web/src/providers/dev-data-provider.tsx
 */
export {
  mockAppDefinitions,
  mockObjectDefinitions,
  mockRecords,
  getMockAppDefinition,
  getMockObjectDefinition,
  getMockRecords,
  getMockRecord,
} from './__mocks__/mock-data';
