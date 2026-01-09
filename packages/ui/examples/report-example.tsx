/**
 * Visual Report Builder Example
 * Demonstrates how to use ObjectQL's visual reporting system
 */

import React, { useState } from 'react';
import { ReportBuilder, ReportViewer } from '@objectql/ui';
import type { ReportDefinition } from '@objectql/metadata';
import { ReportCompiler } from '@objectql/core';

// Example: Complete report builder and viewer application
export function ReportingExample() {
  const [mode, setMode] = useState<'list' | 'build' | 'view'>('list');
  const [currentReport, setCurrentReport] = useState<ReportDefinition | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Sample report definitions
  const sampleReports: ReportDefinition[] = [
    {
      name: 'active_tasks',
      label: 'Active Tasks',
      description: 'List of all incomplete tasks',
      type: 'tabular',
      object: 'tasks',
      columns: [
        { field: 'name', label: 'Task Name', width: 300 },
        { field: 'project.name', label: 'Project', width: 200 },
        { field: 'assigned_to', label: 'Assignee', width: 150 },
        { field: 'priority', label: 'Priority', width: 100 },
        { field: 'due_date', label: 'Due Date', width: 120 }
      ],
      filters: [
        ['completed', '=', false]
      ],
      sort: [['due_date', 'asc']]
    },
    {
      name: 'tasks_by_project',
      label: 'Tasks by Project',
      description: 'Summary of tasks grouped by project',
      type: 'summary',
      object: 'tasks',
      columns: [
        { field: 'project.name', label: 'Project', width: 250 },
        { field: 'priority', label: 'Priority', width: 100 },
        { field: 'id', label: 'Count', width: 100 }
      ],
      groupings: [
        { field: 'project.name', sort: 'asc', showSubtotals: true },
        { field: 'priority', sort: 'desc' }
      ],
      aggregations: [
        { field: 'id', function: 'count', label: 'Task Count' },
        { field: 'estimated_hours', function: 'sum', label: 'Total Hours' }
      ],
      chart: {
        type: 'bar',
        groupBy: 'priority',
        measure: 'id',
        aggregation: 'count',
        title: 'Tasks by Priority'
      }
    }
  ];

  const handleRunReport = async (report: ReportDefinition) => {
    setLoading(true);
    setCurrentReport(report);
    
    try {
      // Compile report to query
      const compiler = new ReportCompiler();
      const query = compiler.compile(report);
      
      // In a real app, you would execute this query against ObjectQL
      // const results = await objectQL.find(report.object, query);
      
      // For demo, use sample data
      const sampleData = generateSampleData(report);
      setReportData(sampleData);
      setMode('view');
    } catch (error) {
      console.error('Error running report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async (report: ReportDefinition) => {
    console.log('Saving report:', report);
    // In a real app, save to backend
    alert(`Report "${report.label}" saved successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ObjectQL Reports</h1>
          <button
            onClick={() => setMode('build')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Report
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {mode === 'list' && (
          <ReportList
            reports={sampleReports}
            onRun={handleRunReport}
            onEdit={(report) => {
              setCurrentReport(report);
              setMode('build');
            }}
          />
        )}

        {mode === 'build' && (
          <ReportBuilder
            initialReport={currentReport || undefined}
            availableObjects={['tasks', 'projects', 'users']}
            onSave={handleSaveReport}
            onPreview={handleRunReport}
            onClose={() => setMode('list')}
          />
        )}

        {mode === 'view' && currentReport && (
          <div>
            <button
              onClick={() => setMode('list')}
              className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              ← Back to Reports
            </button>
            <ReportViewer
              report={currentReport}
              data={reportData}
              loading={loading}
              totalCount={reportData.length}
              onRefresh={() => handleRunReport(currentReport)}
              onExport={(format) => {
                console.log(`Exporting report as ${format}`);
                alert(`Export as ${format} not yet implemented`);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Report list component
function ReportList({
  reports,
  onRun,
  onEdit
}: {
  reports: ReportDefinition[];
  onRun: (report: ReportDefinition) => void;
  onEdit: (report: ReportDefinition) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">My Reports</h2>
      
      {reports.map(report => (
        <div
          key={report.name}
          className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {report.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {report.description}
              </p>
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Type:</span> {report.type}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Object:</span> {report.object}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Columns:</span> {report.columns.length}
                </span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onRun(report)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Run
              </button>
              <button
                onClick={() => onEdit(report)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper to generate sample data for demo
function generateSampleData(report: ReportDefinition): any[] {
  const sampleTasks = [
    {
      id: '1',
      name: 'Implement authentication',
      project: { name: 'Website Redesign', owner: 'Alice' },
      assigned_to: 'Bob',
      priority: 'high',
      due_date: '2024-01-15',
      estimated_hours: 8,
      completed: false
    },
    {
      id: '2',
      name: 'Design landing page',
      project: { name: 'Website Redesign', owner: 'Alice' },
      assigned_to: 'Carol',
      priority: 'medium',
      due_date: '2024-01-20',
      estimated_hours: 12,
      completed: false
    },
    {
      id: '3',
      name: 'Write API documentation',
      project: { name: 'API Development', owner: 'Dave' },
      assigned_to: 'Bob',
      priority: 'low',
      due_date: '2024-01-25',
      estimated_hours: 4,
      completed: false
    },
    {
      id: '4',
      name: 'Set up CI/CD pipeline',
      project: { name: 'API Development', owner: 'Dave' },
      assigned_to: 'Eve',
      priority: 'high',
      due_date: '2024-01-18',
      estimated_hours: 6,
      completed: false
    },
    {
      id: '5',
      name: 'Create test suite',
      project: { name: 'Mobile App', owner: 'Frank' },
      assigned_to: 'Carol',
      priority: 'medium',
      due_date: '2024-01-22',
      estimated_hours: 16,
      completed: false
    }
  ];

  return sampleTasks;
}

export default ReportingExample;
