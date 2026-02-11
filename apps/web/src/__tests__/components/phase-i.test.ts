/**
 * Tests for Phase I components — Rich Data Experience.
 *
 * Validates exports and basic structure of all Phase I components.
 */
import { describe, it, expect } from 'vitest';
import { InlineEditCell } from '@/components/objectui/InlineEditCell';
import { BulkActionBar } from '@/components/objectui/BulkActionBar';
import { SavedViewsPanel } from '@/components/objectui/SavedViewsPanel';
import { CloneRecordDialog } from '@/components/objectui/CloneRecordDialog';
import { CsvImportDialog } from '@/components/objectui/CsvImportDialog';
import { CsvExportButton } from '@/components/objectui/CsvExportButton';
import { LookupAutocomplete } from '@/components/objectui/LookupAutocomplete';

describe('Phase I component exports', () => {
  it('exports InlineEditCell (I.1)', () => {
    expect(InlineEditCell).toBeTypeOf('function');
  });

  it('exports BulkActionBar (I.2)', () => {
    expect(BulkActionBar).toBeTypeOf('function');
  });

  it('exports SavedViewsPanel (I.3)', () => {
    expect(SavedViewsPanel).toBeTypeOf('function');
  });

  it('exports CloneRecordDialog (I.5)', () => {
    expect(CloneRecordDialog).toBeTypeOf('function');
  });

  it('exports CsvImportDialog (I.6)', () => {
    expect(CsvImportDialog).toBeTypeOf('function');
  });

  it('exports CsvExportButton (I.6)', () => {
    expect(CsvExportButton).toBeTypeOf('function');
  });

  it('exports LookupAutocomplete (I.7)', () => {
    expect(LookupAutocomplete).toBeTypeOf('function');
  });
});
