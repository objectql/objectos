/**
 * WorkflowTemplates — pre-built workflow templates for common processes.
 *
 * Provides a gallery of reusable workflow templates that users can
 * browse, preview, and apply to their objects.
 *
 * Phase J — Task J.6
 */

import { useState } from 'react';
import { FileText, Copy, Eye, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { WorkflowDefinition } from '@/types/workflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: WorkflowDefinition;
  /** Tags for filtering */
  tags: string[];
}

interface WorkflowTemplatesProps {
  templates: WorkflowTemplate[];
  onApplyTemplate: (template: WorkflowTemplate, targetObject: string) => void;
  /** Available object names for applying templates */
  availableObjects?: string[];
}

// Built-in workflow templates
export const builtInTemplates: WorkflowTemplate[] = [
  {
    id: 'approval-simple',
    name: 'Simple Approval',
    description: 'Basic approval workflow: draft → pending → approved/rejected.',
    category: 'Approval',
    tags: ['approval', 'basic'],
    workflow: {
      name: 'simple_approval',
      label: 'Simple Approval',
      object: '',
      stateField: 'status',
      states: [
        { name: 'draft', label: 'Draft', initial: true, color: 'default' },
        { name: 'pending', label: 'Pending Approval', color: 'yellow' },
        { name: 'approved', label: 'Approved', final: true, color: 'green' },
        { name: 'rejected', label: 'Rejected', final: true, color: 'red' },
      ],
      transitions: [
        { name: 'submit', label: 'Submit for Approval', from: 'draft', to: 'pending' },
        { name: 'approve', label: 'Approve', from: 'pending', to: 'approved', guard: 'isApprover' },
        { name: 'reject', label: 'Reject', from: 'pending', to: 'rejected', guard: 'isApprover' },
        { name: 'revise', label: 'Revise', from: 'rejected', to: 'draft' },
      ],
    },
  },
  {
    id: 'multi-stage-approval',
    name: 'Multi-Stage Approval',
    description: 'Three-level approval: manager → director → VP.',
    category: 'Approval',
    tags: ['approval', 'multi-stage', 'enterprise'],
    workflow: {
      name: 'multi_stage_approval',
      label: 'Multi-Stage Approval',
      object: '',
      stateField: 'status',
      states: [
        { name: 'draft', label: 'Draft', initial: true, color: 'default' },
        { name: 'manager_review', label: 'Manager Review', color: 'blue' },
        { name: 'director_review', label: 'Director Review', color: 'purple' },
        { name: 'approved', label: 'Approved', final: true, color: 'green' },
        { name: 'rejected', label: 'Rejected', final: true, color: 'red' },
      ],
      transitions: [
        { name: 'submit', label: 'Submit', from: 'draft', to: 'manager_review' },
        { name: 'manager_approve', label: 'Manager Approve', from: 'manager_review', to: 'director_review', guard: 'isManager' },
        { name: 'director_approve', label: 'Director Approve', from: 'director_review', to: 'approved', guard: 'isDirector' },
        { name: 'reject', label: 'Reject', from: 'manager_review', to: 'rejected' },
        { name: 'director_reject', label: 'Reject', from: 'director_review', to: 'rejected' },
      ],
    },
  },
  {
    id: 'kanban-pipeline',
    name: 'Kanban Pipeline',
    description: 'Standard kanban board: backlog → in progress → review → done.',
    category: 'Project',
    tags: ['kanban', 'project', 'agile'],
    workflow: {
      name: 'kanban_pipeline',
      label: 'Kanban Pipeline',
      object: '',
      stateField: 'status',
      states: [
        { name: 'backlog', label: 'Backlog', initial: true, color: 'default' },
        { name: 'in_progress', label: 'In Progress', color: 'blue' },
        { name: 'review', label: 'In Review', color: 'yellow' },
        { name: 'done', label: 'Done', final: true, color: 'green' },
      ],
      transitions: [
        { name: 'start', label: 'Start Work', from: 'backlog', to: 'in_progress' },
        { name: 'submit_review', label: 'Submit for Review', from: 'in_progress', to: 'review' },
        { name: 'complete', label: 'Complete', from: 'review', to: 'done' },
        { name: 'rework', label: 'Needs Rework', from: 'review', to: 'in_progress' },
      ],
    },
  },
  {
    id: 'sales-pipeline',
    name: 'Sales Pipeline',
    description: 'Sales opportunity stages from prospecting to close.',
    category: 'Sales',
    tags: ['sales', 'crm', 'pipeline'],
    workflow: {
      name: 'sales_pipeline',
      label: 'Sales Pipeline',
      object: '',
      stateField: 'stage',
      states: [
        { name: 'prospecting', label: 'Prospecting', initial: true, color: 'blue' },
        { name: 'qualification', label: 'Qualification', color: 'blue' },
        { name: 'proposal', label: 'Proposal', color: 'yellow' },
        { name: 'negotiation', label: 'Negotiation', color: 'purple' },
        { name: 'closed_won', label: 'Closed Won', final: true, color: 'green' },
        { name: 'closed_lost', label: 'Closed Lost', final: true, color: 'red' },
      ],
      transitions: [
        { name: 'qualify', label: 'Qualify', from: 'prospecting', to: 'qualification' },
        { name: 'propose', label: 'Send Proposal', from: 'qualification', to: 'proposal' },
        { name: 'negotiate', label: 'Negotiate', from: 'proposal', to: 'negotiation' },
        { name: 'close_won', label: 'Close Won', from: 'negotiation', to: 'closed_won' },
        { name: 'close_lost', label: 'Close Lost', from: 'negotiation', to: 'closed_lost' },
      ],
    },
  },
];

export function WorkflowTemplates({
  templates,
  onApplyTemplate,
  availableObjects = [],
}: WorkflowTemplatesProps) {
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null);
  const [selectedObject, setSelectedObject] = useState('');

  const categories = [...new Set(templates.map((t) => t.category))];

  const handleApply = () => {
    if (previewTemplate && selectedObject) {
      onApplyTemplate(previewTemplate, selectedObject);
      setPreviewTemplate(null);
      setSelectedObject('');
    }
  };

  return (
    <>
      <div className="space-y-6" data-testid="workflow-templates">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="mb-3 text-sm font-semibold">{category}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates
                .filter((t) => t.category === category)
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-xs text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="mb-3 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {template.workflow.states.length} states
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {template.workflow.transitions.length} transitions
                        </Badge>
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-xs"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="size-3" />
                          Preview
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 gap-1 text-xs"
                          onClick={() => {
                            setPreviewTemplate(template);
                          }}
                        >
                          <Copy className="size-3" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Template preview / apply dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {/* States preview */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">States</h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.workflow.states.map((state) => (
                    <Badge key={state.name} variant="outline" className="gap-1">
                      {state.initial && <span className="text-green-600">●</span>}
                      {state.final && <span className="text-red-600">◉</span>}
                      {state.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Transitions preview */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Transitions</h4>
                <div className="space-y-1">
                  {previewTemplate.workflow.transitions.map((t) => (
                    <div key={t.name} className="flex items-center gap-1 text-xs">
                      <Badge variant="outline" className="text-[10px]">{t.from}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-[10px]">{t.to}</Badge>
                      <span className="ml-1 text-muted-foreground">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply to object */}
              {availableObjects.length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Apply to object</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={selectedObject}
                    onChange={(e) => setSelectedObject(e.target.value)}
                    aria-label="Target object"
                  >
                    <option value="">Select object...</option>
                    {availableObjects.map((obj) => (
                      <option key={obj} value={obj}>{obj}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            {availableObjects.length > 0 && (
              <Button onClick={handleApply} disabled={!selectedObject} className="gap-1">
                <CheckCircle2 className="size-4" />
                Apply Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
