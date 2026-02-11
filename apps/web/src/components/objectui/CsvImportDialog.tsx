/**
 * CsvImportDialog — bulk data import via CSV upload with field mapping.
 *
 * Allows users to upload a CSV file, map columns to object fields,
 * preview the data, and import records in bulk.
 *
 * Phase I — Task I.6
 */

import { useState, useCallback } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ObjectDefinition } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

interface CsvImportDialogProps {
  objectDef: ObjectDefinition;
  onImport: (records: Record<string, unknown>[]) => void;
  isLoading?: boolean;
}

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

function parseCsv(text: string): ParsedCsv {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) =>
    line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')),
  );
  return { headers, rows };
}

export function CsvImportDialog({
  objectDef,
  onImport,
  isLoading = false,
}: CsvImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCsv | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fields = resolveFields(objectDef.fields, ['id', 'created_at', 'updated_at']);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);

      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.headers.length === 0) {
          setError('CSV file appears to be empty.');
          return;
        }
        setParsedData(parsed);

        // Auto-map columns by name matching
        const autoMapping: Record<string, string> = {};
        for (const header of parsed.headers) {
          const lower = header.toLowerCase().replace(/[_\s-]/g, '');
          const match = fields.find(
            (f) =>
              f.name.toLowerCase().replace(/[_\s-]/g, '') === lower ||
              (f.label && f.label.toLowerCase().replace(/[_\s-]/g, '') === lower),
          );
          if (match) {
            autoMapping[header] = match.name;
          }
        }
        setColumnMapping(autoMapping);
      };
      reader.readAsText(file);
    },
    [fields],
  );

  const handleImport = () => {
    if (!parsedData) return;

    const records = parsedData.rows.map((row) => {
      const record: Record<string, unknown> = {};
      parsedData.headers.forEach((header, idx) => {
        const fieldName = columnMapping[header];
        if (fieldName && row[idx] !== undefined) {
          record[fieldName] = row[idx];
        }
      });
      return record;
    });

    const validRecords = records.filter((r) => Object.keys(r).length > 0);
    onImport(validRecords);
    setOpen(false);
    setParsedData(null);
    setColumnMapping({});
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setParsedData(null);
      setColumnMapping({});
      setError(null);
    }
  };

  const mappedCount = Object.values(columnMapping).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="size-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {objectDef.pluralLabel ?? objectDef.label ?? objectDef.name}</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map columns to fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload */}
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
              data-testid="csv-file-input"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}

          {/* Column mapping */}
          {parsedData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Column mapping</p>
                <Badge variant="secondary">
                  {mappedCount}/{parsedData.headers.length} mapped
                </Badge>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">CSV Column</th>
                      <th className="px-3 py-2 text-left font-medium">Maps to Field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.headers.map((header) => (
                      <tr key={header} className="border-b">
                        <td className="px-3 py-2">{header}</td>
                        <td className="px-3 py-2">
                          <select
                            className="h-8 w-full rounded border border-input bg-background px-2 text-sm"
                            value={columnMapping[header] ?? ''}
                            onChange={(e) =>
                              setColumnMapping((prev) => ({
                                ...prev,
                                [header]: e.target.value,
                              }))
                            }
                            aria-label={`Map column ${header}`}
                          >
                            <option value="">Skip</option>
                            {fields.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Preview ({parsedData.rows.length} rows)
                </p>
                <p className="text-xs text-muted-foreground">
                  First row: {parsedData.rows[0]?.join(', ') ?? 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !parsedData || mappedCount === 0}
          >
            {isLoading ? 'Importing...' : `Import ${parsedData?.rows.length ?? 0} records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
