/**
 * Spec Validation for Automation Rules
 *
 * Uses Zod schemas from @objectstack/spec to validate
 * WorkflowRule and WorkflowAction configurations natively.
 */

import { WorkflowRuleSchema, WorkflowActionSchema } from '@objectstack/spec/automation';

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the input is valid */
  valid: boolean;
  /** Validation errors (empty if valid) */
  errors: string[];
}

/**
 * Validate a WorkflowRule against the @objectstack/spec schema
 *
 * @param rule - The rule object to validate
 * @returns Validation result with errors if invalid
 */
export function validateWorkflowRule(rule: unknown): ValidationResult {
  const result = WorkflowRuleSchema.safeParse(rule);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });

  return { valid: false, errors };
}

/**
 * Validate a single WorkflowAction against the @objectstack/spec schema
 *
 * @param action - The action object to validate
 * @returns Validation result with errors if invalid
 */
export function validateWorkflowAction(action: unknown): ValidationResult {
  const result = WorkflowActionSchema.safeParse(action);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });

  return { valid: false, errors };
}
