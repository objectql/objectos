/**
 * AutomationRulesBuilder — visual rule builder for triggers and actions.
 *
 * Displays automation rules with their triggers, conditions, and actions.
 * Provides a read-only visual representation of the rule configuration
 * with toggle for active/inactive state.
 */

import { Zap, ZapOff, ArrowRight, Filter, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { AutomationRule, AutomationTriggerType, AutomationActionType } from '@/types/workflow';

interface AutomationRulesBuilderProps {
  rules: AutomationRule[];
  onToggleActive?: (ruleId: string, active: boolean) => void;
}

const triggerLabels: Record<AutomationTriggerType, string> = {
  record_created: 'Record Created',
  record_updated: 'Record Updated',
  record_deleted: 'Record Deleted',
  field_changed: 'Field Changed',
  workflow_transition: 'Workflow Transition',
  schedule: 'Schedule',
  manual: 'Manual',
};

const actionLabels: Record<AutomationActionType, string> = {
  update_record: 'Update Record',
  create_record: 'Create Record',
  send_email: 'Send Email',
  send_notification: 'Send Notification',
  call_webhook: 'Call Webhook',
  run_workflow: 'Run Workflow',
  assign_record: 'Assign Record',
};

const operatorLabels: Record<string, string> = {
  equals: '=',
  not_equals: '≠',
  contains: 'contains',
  greater_than: '>',
  less_than: '<',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

export function AutomationRulesBuilder({ rules, onToggleActive }: AutomationRulesBuilderProps) {
  if (rules.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12"
        data-testid="automation-rules-empty"
      >
        <Zap className="mb-2 size-8 text-muted-foreground" />
        <p className="text-lg font-medium">No automation rules</p>
        <p className="text-sm text-muted-foreground">
          Automation rules will appear here once they are configured.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="automation-rules-builder">
      {rules.map((rule) => (
        <Card key={rule.id} className={rule.active ? '' : 'opacity-60'}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {rule.active ? (
                  <Zap className="size-4 text-yellow-500" />
                ) : (
                  <ZapOff className="size-4 text-muted-foreground" />
                )}
                <CardTitle className="text-sm font-medium">{rule.name}</CardTitle>
              </div>
              {rule.description && (
                <p className="text-xs text-muted-foreground">{rule.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={rule.active ? 'default' : 'secondary'}>
                {rule.active ? 'Active' : 'Inactive'}
              </Badge>
              {onToggleActive && (
                <button
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => onToggleActive(rule.id, !rule.active)}
                >
                  {rule.active ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {/* Visual flow: Trigger → Conditions → Actions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Trigger */}
              <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 dark:bg-blue-900/30">
                <Play className="size-3 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {triggerLabels[rule.trigger.type]}
                </span>
                {rule.trigger.field && (
                  <span className="text-blue-600 dark:text-blue-400">({rule.trigger.field})</span>
                )}
              </div>

              {/* Conditions */}
              {rule.conditions.length > 0 && (
                <>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <div className="flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-1 dark:bg-yellow-900/30">
                    <Filter className="size-3 text-yellow-600" />
                    {rule.conditions.map((c, i) => (
                      <span key={i} className="text-yellow-700 dark:text-yellow-300">
                        {i > 0 && ' AND '}
                        {c.field} {operatorLabels[c.operator] ?? c.operator} {c.value}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Actions */}
              <ArrowRight className="size-3 text-muted-foreground" />
              <div className="flex flex-wrap items-center gap-1">
                {rule.actions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 dark:bg-green-900/30"
                  >
                    <Zap className="size-3 text-green-600" />
                    <span className="text-green-700 dark:text-green-300">
                      {action.label || actionLabels[action.type]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Object: <strong>{rule.object}</strong>
              </span>
              <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
              {rule.updatedAt !== rule.createdAt && (
                <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
