import React, { useState } from 'react';
import { ObjectForm } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

/**
 * Example usage of ObjectForm component
 * This demonstrates how to use the metadata-driven form
 */

// Define object metadata
const taskObjectConfig: ObjectConfig = {
  name: 'task',
  label: 'Task',
  description: 'Task management object',
  fields: {
    title: {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      max_length: 200,
    },
    description: {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      help_text: 'Provide a detailed description of the task',
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
      required: true,
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
      defaultValue: 'medium',
    },
    assignee: {
      name: 'assignee',
      label: 'Assignee',
      type: 'lookup',
      reference_to: 'user',
      help_text: 'Select a user to assign this task to',
    },
    is_completed: {
      name: 'is_completed',
      label: 'Mark as Completed',
      type: 'boolean',
      defaultValue: false,
    },
    due_date: {
      name: 'due_date',
      label: 'Due Date',
      type: 'date',
    },
    progress: {
      name: 'progress',
      label: 'Progress (%)',
      type: 'percent',
      min: 0,
      max: 100,
      defaultValue: 0,
    },
    estimated_hours: {
      name: 'estimated_hours',
      label: 'Estimated Hours',
      type: 'number',
      min: 0,
      help_text: 'Estimated time to complete this task',
    },
    budget: {
      name: 'budget',
      label: 'Budget',
      type: 'currency',
      min: 0,
    },
    contact_email: {
      name: 'contact_email',
      label: 'Contact Email',
      type: 'email',
    },
    reference_url: {
      name: 'reference_url',
      label: 'Reference URL',
      type: 'url',
      help_text: 'Link to external resources or documentation',
    },
  },
};

export default function ExampleObjectForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Example: Editing an existing task
  const initialValues = {
    title: 'Implement ObjectForm component',
    description: 'Create a metadata-driven form component similar to ObjectGridTable',
    status: 'in_progress',
    priority: 'high',
    is_completed: false,
    progress: 75,
    estimated_hours: 8,
    budget: 2000,
    contact_email: 'developer@example.com',
    reference_url: 'https://github.com/objectql/objectos',
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Form submitted:', data);
    setSubmittedData(data);
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    console.log('Form cancelled');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">ObjectForm Example</h1>
        <p className="text-muted-foreground">
          This form is automatically generated from ObjectQL metadata. 
          All fields are validated based on their type and configuration.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
        <ObjectForm
          objectConfig={taskObjectConfig}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitText="Update Task"
          columns={2}
        />
      </div>

      {submittedData && (
        <div className="bg-muted border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Submitted Data</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Task (Empty Form)</h2>
        <ObjectForm
          objectConfig={taskObjectConfig}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitText="Create Task"
          columns={2}
        />
      </div>
    </div>
  );
}
