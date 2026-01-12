import React from 'react';
import { ObjectGridTable } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

/**
 * Example usage of ObjectGridTable component
 * This demonstrates how to use the metadata-driven AG Grid table
 */

// Define object metadata
const taskObjectConfig: ObjectConfig = {
  name: 'task',
  label: 'Task',
  description: 'Task management object',
  fields: {
    _id: {
      name: '_id',
      label: 'ID',
      type: 'text',
      readonly: true,
      hidden: true,
    },
    title: {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    description: {
      name: 'description',
      label: 'Description',
      type: 'textarea',
    },
    status: {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'To Do', value: 'todo' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Done', value: 'done' },
      ],
      defaultValue: 'todo',
    },
    priority: {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    assignee: {
      name: 'assignee',
      label: 'Assignee',
      type: 'lookup',
      reference_to: 'user',
    },
    is_completed: {
      name: 'is_completed',
      label: 'Completed',
      type: 'boolean',
      defaultValue: false,
    },
    due_date: {
      name: 'due_date',
      label: 'Due Date',
      type: 'date',
    },
    created_at: {
      name: 'created_at',
      label: 'Created At',
      type: 'datetime',
      readonly: true,
    },
    progress: {
      name: 'progress',
      label: 'Progress',
      type: 'percent',
      min: 0,
      max: 100,
    },
    budget: {
      name: 'budget',
      label: 'Budget',
      type: 'currency',
    },
    email: {
      name: 'email',
      label: 'Contact Email',
      type: 'email',
    },
    reference_url: {
      name: 'reference_url',
      label: 'Reference URL',
      type: 'url',
    },
  },
};

// Sample data
const sampleData = [
  {
    _id: '1',
    title: 'Implement AG Grid metadata integration',
    description: 'Create ObjectGridTable component that uses ObjectConfig',
    status: 'in_progress',
    priority: 'high',
    assignee: { _id: 'user1', name: 'John Doe' },
    is_completed: false,
    due_date: new Date('2026-01-15'),
    created_at: new Date('2026-01-10'),
    progress: 75,
    budget: 5000,
    email: 'john@example.com',
    reference_url: 'https://github.com/objectql/objectos',
  },
  {
    _id: '2',
    title: 'Write documentation',
    description: 'Document the new ObjectGridTable component',
    status: 'todo',
    priority: 'medium',
    assignee: { _id: 'user2', name: 'Jane Smith' },
    is_completed: false,
    due_date: new Date('2026-01-20'),
    created_at: new Date('2026-01-11'),
    progress: 0,
    budget: 2000,
    email: 'jane@example.com',
    reference_url: 'https://docs.objectos.dev',
  },
  {
    _id: '3',
    title: 'Review and test',
    description: 'Test all field type renderers',
    status: 'done',
    priority: 'high',
    assignee: { _id: 'user1', name: 'John Doe' },
    is_completed: true,
    due_date: new Date('2026-01-12'),
    created_at: new Date('2026-01-08'),
    progress: 100,
    budget: 1500,
    email: 'john@example.com',
    reference_url: 'https://testing.objectos.dev',
  },
];

export default function ExampleObjectGridTable() {
  const handleSelectionChanged = (selectedRows: any[]) => {
    console.log('Selected rows:', selectedRows);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">ObjectGridTable Example</h1>
      <p className="text-muted-foreground mb-6">
        This table is automatically generated from ObjectQL metadata. 
        Each field type is rendered with an appropriate cell renderer.
      </p>
      
      <ObjectGridTable
        objectConfig={taskObjectConfig}
        data={sampleData}
        height={600}
        pagination={true}
        pageSize={10}
        rowSelection="multiple"
        onSelectionChanged={handleSelectionChanged}
      />
    </div>
  );
}
