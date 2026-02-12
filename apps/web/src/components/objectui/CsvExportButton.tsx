/**
 * CsvExportButton — export records to CSV file.
 *
 * Generates a CSV file from the current record set and triggers a download.
 *
 * Phase I — Task I.6
 */

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ObjectDefinition, RecordData } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

interface CsvExportButtonProps {
  objectDef: ObjectDefinition;
  records: RecordData[];
  /** Custom filename (without .csv extension) */
  filename?: string;
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function CsvExportButton({
  objectDef,
  records,
  filename,
}: CsvExportButtonProps) {
  const handleExport = () => {
    const fields = resolveFields(objectDef.fields);

    // Build CSV header
    const headers = fields.map((f) => escapeCsvValue(f.label));

    // Build CSV rows
    const rows = records.map((record) =>
      fields.map((f) => escapeCsvValue(record[f.name])),
    );

    // Combine into CSV string
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
      '\n',
    );

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename ?? objectDef.name}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleExport}
      disabled={records.length === 0}
      data-testid="csv-export-button"
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
