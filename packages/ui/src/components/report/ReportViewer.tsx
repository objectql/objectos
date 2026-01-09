/**
 * ReportViewer Component
 * Displays executed report results in various formats
 */

import React from 'react';
import type { ReportDefinition, ReportResult } from '@objectql/metadata';

export interface ReportViewerProps {
  /** Report definition being displayed */
  report: ReportDefinition;
  
  /** Report execution results */
  data: any[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Total count (may differ from data.length if paginated) */
  totalCount?: number;
  
  /** Callback to refresh report */
  onRefresh?: () => void;
  
  /** Callback to export report */
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
}

export function ReportViewer({
  report,
  data,
  loading = false,
  error,
  totalCount,
  onRefresh,
  onExport
}: ReportViewerProps) {
  if (loading) {
    return (
      <div className="report-viewer p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-viewer p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-viewer">
      {/* Report Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{report.label}</h2>
            {report.description && (
              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              {totalCount !== undefined ? totalCount : data.length} records
              {report.type !== 'tabular' && ` • ${report.type} report`}
            </div>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Refresh
              </button>
            )}
            {onExport && (
              <div className="relative group">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Export
                </button>
                <div className="hidden group-hover:block absolute right-0 mt-1 w-32 bg-white border rounded shadow-lg z-10">
                  <button
                    onClick={() => onExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => onExport('excel')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => onExport('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-6">
        {report.type === 'tabular' && (
          <TabularReportView report={report} data={data} />
        )}
        {report.type === 'summary' && (
          <SummaryReportView report={report} data={data} />
        )}
        {report.type === 'matrix' && (
          <MatrixReportView report={report} data={data} />
        )}
      </div>
    </div>
  );
}

// Tabular report view
function TabularReportView({ 
  report, 
  data 
}: { 
  report: ReportDefinition; 
  data: any[];
}) {
  const visibleColumns = report.columns.filter(c => c.visible !== false);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-50 border-b">
          <tr>
            {visibleColumns.map((column, index) => {
              const alignmentClass =
                column.align === 'center'
                  ? 'text-center'
                  : column.align === 'right'
                  ? 'text-right'
                  : 'text-left';

              return (
                <th
                  key={index}
                  className={`px-4 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider ${alignmentClass}`}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {visibleColumns.map((column, colIndex) => {
                const alignmentClass =
                  column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                    ? 'text-right'
                    : 'text-left';

                return (
                  <td
                    key={colIndex}
                    className={`px-4 py-3 text-sm ${alignmentClass}`}
                  >
                    {getNestedValue(row, column.field)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Summary report view
function SummaryReportView({ 
  report, 
  data 
}: { 
  report: ReportDefinition; 
  data: any[];
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data to display
      </div>
    );
  }

  // Group data by grouping fields
  const groupedData = groupBy(data, report.groupings?.[0]?.field || '');

  return (
    <div className="space-y-4">
      {Object.entries(groupedData).map(([groupKey, groupRows]) => (
        <div key={groupKey} className="border rounded">
          <div className="bg-gray-100 px-4 py-2 font-semibold">
            {report.groupings?.[0]?.label || 'Group'}: {groupKey}
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({(groupRows as any[]).length} records)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {report.columns.map((column, index) => {
                    const alignmentClass =
                      column.align === 'right'
                        ? 'text-right'
                        : column.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    return (
                      <th
                        key={index}
                        className={`px-4 py-2 text-xs font-medium text-gray-700 ${alignmentClass}`}
                      >
                        {column.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(groupRows as any[]).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {report.columns.map((column, colIndex) => {
                      const alignmentClass =
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      return (
                        <td
                          key={colIndex}
                          className={`px-4 py-2 text-sm ${alignmentClass}`}
                        >
                          {getNestedValue(row, column.field)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {report.aggregations && (
                <tfoot className="bg-gray-50 border-t font-semibold">
                  <tr>
                    <td className="px-4 py-2 text-sm" colSpan={Math.max(1, report.columns.length - report.aggregations.length)}>
                      Subtotal
                    </td>
                    {report.aggregations.map((agg, index) => (
                      <td
                        key={index}
                        className="px-4 py-2 text-sm text-right"
                      >
                        {calculateAggregation(groupRows as any[], agg.field, agg.function)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// Matrix report view (simplified pivot table)
function MatrixReportView({ 
  report, 
  data 
}: { 
  report: ReportDefinition; 
  data: any[];
}) {
  if (!report.matrix || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data to display
      </div>
    );
  }

  // This is a simplified implementation
  // A real implementation would need more complex pivot logic
  const { rowGrouping, columnGrouping, measure } = report.matrix;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
              {rowGrouping.label || rowGrouping.field}
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase" colSpan={3}>
              {columnGrouping.label || columnGrouping.field}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2 text-center text-sm text-gray-500" colSpan={4}>
              Matrix pivot implementation in progress...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return '-';
    }
  }
  
  return value !== null && value !== undefined ? String(value) : '-';
}

// Helper function to group data
function groupBy(data: any[], field: string): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  for (const item of data) {
    const key = String(getNestedValue(item, field));
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  
  return groups;
}

// Helper function to calculate aggregations
function calculateAggregation(
  data: any[], 
  field: string, 
  func: string
): string {
  const values = data.map(item => {
    const val = getNestedValue(item, field);
    return val === '-' ? 0 : Number(val) || 0;
  });

  let result: number;

  if (values.length === 0) {
    result = 0;
  } else {
    switch (func) {
      case 'count':
        result = values.length;
        break;
      case 'sum':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
      default:
        result = 0;
    }
  }
  return result.toFixed(2);
}
