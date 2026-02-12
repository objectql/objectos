/**
 * FlowEditor — visual drag-and-drop workflow designer.
 *
 * Provides a visual editor for creating and modifying workflow definitions
 * using an interactive state-transition diagram. States can be added,
 * removed, and transitions configured visually.
 *
 * Phase J — Task J.1
 */

import { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { WorkflowDefinition, WorkflowState, WorkflowTransition } from '@/types/workflow';

interface FlowEditorProps {
  workflow: WorkflowDefinition;
  onSave?: (workflow: WorkflowDefinition) => void;
  /** Whether the editor is in read-only mode */
  readOnly?: boolean;
}

const STATE_COLORS: WorkflowState['color'][] = ['default', 'blue', 'green', 'yellow', 'red', 'purple'];

const colorClasses: Record<NonNullable<WorkflowState['color']>, string> = {
  default: 'bg-muted border-muted-foreground/30',
  blue: 'bg-blue-100 border-blue-300 dark:bg-blue-900/50 dark:border-blue-700',
  green: 'bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-700',
  yellow: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/50 dark:border-yellow-700',
  red: 'bg-red-100 border-red-300 dark:bg-red-900/50 dark:border-red-700',
  purple: 'bg-purple-100 border-purple-300 dark:bg-purple-900/50 dark:border-purple-700',
};

export function FlowEditor({ workflow, onSave, readOnly = false }: FlowEditorProps) {
  const [editedWorkflow, setEditedWorkflow] = useState<WorkflowDefinition>({ ...workflow });
  const [showAddState, setShowAddState] = useState(false);
  const [showAddTransition, setShowAddTransition] = useState(false);
  const [newStateName, setNewStateName] = useState('');
  const [newStateLabel, setNewStateLabel] = useState('');
  const [newStateColor, setNewStateColor] = useState<WorkflowState['color']>('default');
  const [transitionFrom, setTransitionFrom] = useState('');
  const [transitionTo, setTransitionTo] = useState('');
  const [transitionLabel, setTransitionLabel] = useState('');

  const hasChanges = useMemo(
    () => JSON.stringify(editedWorkflow) !== JSON.stringify(workflow),
    [editedWorkflow, workflow],
  );

  const handleAddState = useCallback(() => {
    if (!newStateName.trim() || !newStateLabel.trim()) return;
    const newState: WorkflowState = {
      name: newStateName.trim().toLowerCase().replace(/\s+/g, '_'),
      label: newStateLabel.trim(),
      color: newStateColor,
    };
    setEditedWorkflow((prev) => ({
      ...prev,
      states: [...prev.states, newState],
    }));
    setNewStateName('');
    setNewStateLabel('');
    setNewStateColor('default');
    setShowAddState(false);
  }, [newStateName, newStateLabel, newStateColor]);

  const handleRemoveState = useCallback((stateName: string) => {
    setEditedWorkflow((prev) => ({
      ...prev,
      states: prev.states.filter((s) => s.name !== stateName),
      transitions: prev.transitions.filter((t) => t.from !== stateName && t.to !== stateName),
    }));
  }, []);

  const handleAddTransition = useCallback(() => {
    if (!transitionFrom || !transitionTo || !transitionLabel.trim()) return;
    const newTransition: WorkflowTransition = {
      name: transitionLabel.trim().toLowerCase().replace(/\s+/g, '_'),
      label: transitionLabel.trim(),
      from: transitionFrom,
      to: transitionTo,
    };
    setEditedWorkflow((prev) => ({
      ...prev,
      transitions: [...prev.transitions, newTransition],
    }));
    setTransitionFrom('');
    setTransitionTo('');
    setTransitionLabel('');
    setShowAddTransition(false);
  }, [transitionFrom, transitionTo, transitionLabel]);

  const handleRemoveTransition = useCallback((transitionName: string) => {
    setEditedWorkflow((prev) => ({
      ...prev,
      transitions: prev.transitions.filter((t) => t.name !== transitionName),
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(editedWorkflow);
  }, [editedWorkflow, onSave]);

  return (
    <Card data-testid="flow-editor">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{editedWorkflow.label}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Object: {editedWorkflow.object} · {editedWorkflow.states.length} states · {editedWorkflow.transitions.length} transitions
            </p>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddState(true)} className="gap-1.5">
                <Plus className="size-4" />
                Add State
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddTransition(true)} className="gap-1.5">
                <ArrowRight className="size-4" />
                Add Transition
              </Button>
              {onSave && (
                <Button size="sm" onClick={handleSave} disabled={!hasChanges} className="gap-1.5">
                  <Save className="size-4" />
                  Save
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* States grid */}
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-semibold">States</h4>
          <div className="flex flex-wrap gap-3">
            {editedWorkflow.states.map((state) => (
              <div
                key={state.name}
                className={`relative rounded-lg border-2 px-4 py-3 ${colorClasses[state.color ?? 'default']}`}
                data-testid={`state-${state.name}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{state.label}</span>
                  {state.initial && <Badge variant="outline" className="text-[10px]">Start</Badge>}
                  {state.final && <Badge variant="outline" className="text-[10px]">End</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{state.name}</p>
                {!readOnly && !state.initial && (
                  <button
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
                    onClick={() => handleRemoveState(state.name)}
                    aria-label={`Remove state ${state.label}`}
                    style={{ opacity: undefined }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0'; }}
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transitions list */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">Transitions</h4>
          {editedWorkflow.transitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transitions defined.</p>
          ) : (
            <div className="space-y-2">
              {editedWorkflow.transitions.map((transition) => (
                <div
                  key={transition.name}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  data-testid={`transition-${transition.name}`}
                >
                  <Badge variant="outline">{transition.from}</Badge>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <Badge variant="outline">{transition.to}</Badge>
                  <span className="flex-1 font-medium">{transition.label}</span>
                  {transition.guard && (
                    <Badge variant="secondary" className="text-xs">
                      Guard: {transition.guard}
                    </Badge>
                  )}
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleRemoveTransition(transition.name)}
                      aria-label={`Remove transition ${transition.label}`}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Add state dialog */}
      <Dialog open={showAddState} onOpenChange={setShowAddState}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add State</DialogTitle>
            <DialogDescription>Add a new state to the workflow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Label</label>
              <Input
                value={newStateLabel}
                onChange={(e) => {
                  setNewStateLabel(e.target.value);
                  setNewStateName(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                }}
                placeholder="e.g., In Review"
                aria-label="State label"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Name (ID)</label>
              <Input
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="e.g., in_review"
                aria-label="State name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {STATE_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`size-8 rounded-md border-2 ${colorClasses[color!]} ${newStateColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => setNewStateColor(color)}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddState(false)}>Cancel</Button>
            <Button onClick={handleAddState} disabled={!newStateName.trim() || !newStateLabel.trim()}>
              Add State
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add transition dialog */}
      <Dialog open={showAddTransition} onOpenChange={setShowAddTransition}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transition</DialogTitle>
            <DialogDescription>Define a new transition between states.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Label</label>
              <Input
                value={transitionLabel}
                onChange={(e) => setTransitionLabel(e.target.value)}
                placeholder="e.g., Approve"
                aria-label="Transition label"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">From State</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={transitionFrom}
                  onChange={(e) => setTransitionFrom(e.target.value)}
                  aria-label="From state"
                >
                  <option value="">Select...</option>
                  {editedWorkflow.states.map((s) => (
                    <option key={s.name} value={s.name}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">To State</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={transitionTo}
                  onChange={(e) => setTransitionTo(e.target.value)}
                  aria-label="To state"
                >
                  <option value="">Select...</option>
                  {editedWorkflow.states.map((s) => (
                    <option key={s.name} value={s.name}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTransition(false)}>Cancel</Button>
            <Button onClick={handleAddTransition} disabled={!transitionFrom || !transitionTo || !transitionLabel.trim()}>
              Add Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
