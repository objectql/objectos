/**
 * ReportBuilder Component
 * Visual interface for creating and editing multi-table reports
 */

import React, { useState, useEffect } from 'react';
import type { ReportDefinition, ReportColumn, ReportType } from '@objectql/metadata';

export interface ReportBuilderProps {
  /** Initial report definition (for editing existing reports) */
  initialReport?: ReportDefinition;
  
  /** Available objects that can be used in reports */
  availableObjects?: string[];
  
  /** Callback when report is saved */
  onSave?: (report: ReportDefinition) => void;
  
  /** Callback when report is run/previewed */
  onPreview?: (report: ReportDefinition) => void;
  
  /** Callback when builder is closed */
  onClose?: () => void;
}

export function ReportBuilder({
  initialReport,
  availableObjects = [],
  onSave,
  onPreview,
  onClose
}: ReportBuilderProps) {
  const [report, setReport] = useState<ReportDefinition>(
    initialReport || {
      name: '',
      label: '',
      type: 'tabular',
      object: '',
      columns: []
    }
  );

  const [activeTab, setActiveTab] = useState<'columns' | 'filters' | 'grouping' | 'chart'>('columns');

  const handleSave = () => {
    if (onSave) {
      onSave(report);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(report);
    }
  };

  const handleReportTypeChange = (type: ReportType) => {
    setReport({ ...report, type });
  };

  const handleObjectChange = (objectName: string) => {
    setReport({ ...report, object: objectName, columns: [] });
  };

  const handleColumnAdd = (column: ReportColumn) => {
    setReport({
      ...report,
      columns: [...report.columns, column]
    });
  };

  const handleColumnRemove = (index: number) => {
    setReport({
      ...report,
      columns: report.columns.filter((_, i) => i !== index)
    });
  };

  const handleColumnUpdate = (index: number, column: ReportColumn) => {
    const newColumns = [...report.columns];
    newColumns[index] = column;
    setReport({ ...report, columns: newColumns });
  };

  return (
    <div className="report-builder">
      {/* Header */}
      <div className="report-builder-header bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={report.label}
              onChange={(e) => setReport({ ...report, label: e.target.value })}
              placeholder="Report Name"
              className="text-2xl font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
            />
            <input
              type="text"
              value={report.description || ''}
              onChange={(e) => setReport({ ...report, description: e.target.value })}
              placeholder="Add description..."
              className="text-sm text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mt-1 block w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              disabled={!report.object || report.columns.length === 0}
            >
              Preview
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!report.name || !report.object || report.columns.length === 0}
            >
              Save
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="mt-4 flex gap-2">
          <label className="text-sm font-medium text-gray-700">Report Type:</label>
          <select
            value={report.type}
            onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="tabular">Tabular (List)</option>
            <option value="summary">Summary (Grouped)</option>
            <option value="matrix">Matrix (Pivot)</option>
          </select>

          <label className="text-sm font-medium text-gray-700 ml-4">Object:</label>
          <select
            value={report.object}
            onChange={(e) => handleObjectChange(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Select object...</option>
            {availableObjects.map(obj => (
              <option key={obj} value={obj}>{obj}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="report-builder-content flex h-[calc(100vh-200px)]">
        {/* Tabs */}
        <div className="flex-1 border-r">
          <div className="border-b">
            <nav className="flex gap-1 px-6 pt-4">
              <TabButton
                active={activeTab === 'columns'}
                onClick={() => setActiveTab('columns')}
              >
                Columns
              </TabButton>
              <TabButton
                active={activeTab === 'filters'}
                onClick={() => setActiveTab('filters')}
              >
                Filters
              </TabButton>
              {report.type === 'summary' && (
                <TabButton
                  active={activeTab === 'grouping'}
                  onClick={() => setActiveTab('grouping')}
                >
                  Grouping
                </TabButton>
              )}
              <TabButton
                active={activeTab === 'chart'}
                onClick={() => setActiveTab('chart')}
              >
                Chart
              </TabButton>
            </nav>
          </div>

          <div className="p-6 overflow-y-auto h-full">
            {activeTab === 'columns' && (
              <ColumnsTab
                columns={report.columns}
                onAdd={handleColumnAdd}
                onRemove={handleColumnRemove}
                onUpdate={handleColumnUpdate}
              />
            )}
            {activeTab === 'filters' && (
              <div className="text-gray-500">
                Filter builder coming soon...
              </div>
            )}
            {activeTab === 'grouping' && (
              <div className="text-gray-500">
                Grouping configuration coming soon...
              </div>
            )}
            {activeTab === 'chart' && (
              <div className="text-gray-500">
                Chart configuration coming soon...
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-96 bg-gray-50 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="bg-white rounded border p-4">
            <p className="text-sm text-gray-500 text-center">
              Click "Preview" to see report results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab button component
function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 ${
        active 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-gray-600 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

// Columns tab component
function ColumnsTab({
  columns,
  onAdd,
  onRemove,
  onUpdate
}: {
  columns: ReportColumn[];
  onAdd: (column: ReportColumn) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, column: ReportColumn) => void;
}) {
  const [newColumnField, setNewColumnField] = useState('');
  const [newColumnLabel, setNewColumnLabel] = useState('');

  const handleAdd = () => {
    if (newColumnField && newColumnLabel) {
      onAdd({
        field: newColumnField,
        label: newColumnLabel,
        visible: true
      });
      setNewColumnField('');
      setNewColumnLabel('');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Report Columns</h3>
      
      {/* Add new column */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h4 className="text-sm font-medium mb-3">Add Column</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={newColumnField}
            onChange={(e) => setNewColumnField(e.target.value)}
            placeholder="Field path (e.g., project.name)"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={newColumnLabel}
            onChange={(e) => setNewColumnLabel(e.target.value)}
            placeholder="Column label"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!newColumnField || !newColumnLabel}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            Add Column
          </button>
        </div>
      </div>

      {/* Column list */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium mb-2">Selected Columns ({columns.length})</h4>
        {columns.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No columns added yet. Add your first column above.
          </p>
        ) : (
          columns.map((column, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border rounded hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{column.label}</div>
                <div className="text-xs text-gray-500">{column.field}</div>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="text-red-600 hover:text-red-800 text-sm ml-2"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
