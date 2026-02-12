/**
 * ObjectUI component re-exports.
 *
 * Phase 3 metadata-driven UI controls for the Business App Shell.
 * Phase H bridge components for @object-ui integration.
 * Phase I rich data experience components.
 */

export { MetadataForm } from './MetadataForm';
export { DataGrid } from './DataGrid';
export { KanbanBoard } from './KanbanBoard';
export { ChartWidget } from './ChartWidget';
export { ViewSwitcher, findKanbanField } from './ViewSwitcher';
export { LayoutBuilder } from './LayoutBuilder';
export { ObjectUIExample } from './ObjectUIExample';
export { ObjectPage } from './ObjectPage';
export { ObjectToolbar } from './ObjectToolbar';
export { RelatedList } from './RelatedList';
export { FilterPanel } from './FilterPanel';
export type { FilterValue } from './FilterPanel';

// Phase I — Rich Data Experience
export { InlineEditCell } from './InlineEditCell';
export { BulkActionBar } from './BulkActionBar';
export { SavedViewsPanel } from './SavedViewsPanel';
export type { SavedView } from './SavedViewsPanel';
export { CloneRecordDialog } from './CloneRecordDialog';
export { CsvImportDialog } from './CsvImportDialog';
export { CsvExportButton } from './CsvExportButton';
export { LookupAutocomplete } from './LookupAutocomplete';
