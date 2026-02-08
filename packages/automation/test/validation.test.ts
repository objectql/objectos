/**
 * Spec Validation Tests
 */

import { validateWorkflowRule, validateWorkflowAction } from '../src/validation.js';
import { executeSandboxedWithPolicy, DEFAULT_SANDBOX_POLICY } from '../src/sandbox.js';
import type { SandboxPolicy } from '../src/sandbox.js';

describe('validateWorkflowRule()', () => {
    it('should accept a valid WorkflowRule', () => {
        const rule = {
            name: 'auto_close_resolved',
            objectName: 'case',
            triggerType: 'on_update',
            criteria: 'status == "resolved"',
            actions: [
                { name: 'close_case', type: 'field_update', field: 'status', value: 'closed' },
            ],
        };
        const result = validateWorkflowRule(rule);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject a rule missing required fields', () => {
        const rule = { name: 'incomplete' };
        const result = validateWorkflowRule(rule);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject a rule with invalid triggerType', () => {
        const rule = {
            name: 'bad_trigger',
            objectName: 'account',
            triggerType: 'on_hover', // invalid
        };
        const result = validateWorkflowRule(rule);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('triggerType'))).toBe(true);
    });

    it('should accept a rule without actions (actions are optional)', () => {
        const rule = {
            name: 'monitor_only',
            objectName: 'lead',
            triggerType: 'on_create',
        };
        const result = validateWorkflowRule(rule);
        expect(result.valid).toBe(true);
    });

    it('should accept a rule with multiple actions', () => {
        const rule = {
            name: 'multi_action',
            objectName: 'order',
            triggerType: 'on_create',
            actions: [
                { name: 'set_default', type: 'field_update', field: 'status', value: 'new' },
                { name: 'notify_team', type: 'email_alert', template: 'new_order', recipients: ['team@example.com'] },
            ],
        };
        const result = validateWorkflowRule(rule);
        expect(result.valid).toBe(true);
    });
});

describe('validateWorkflowAction()', () => {
    it('should accept a valid field_update action', () => {
        const action = { name: 'set_status', type: 'field_update', field: 'status', value: 'active' };
        const result = validateWorkflowAction(action);
        expect(result.valid).toBe(true);
    });

    it('should accept a valid email_alert action', () => {
        const action = { name: 'alert', type: 'email_alert', template: 'welcome', recipients: ['admin@test.com'] };
        const result = validateWorkflowAction(action);
        expect(result.valid).toBe(true);
    });

    it('should accept a valid http_call action', () => {
        const action = { name: 'webhook', type: 'http_call', url: 'https://example.com/hook' };
        const result = validateWorkflowAction(action);
        expect(result.valid).toBe(true);
    });

    it('should reject an action with unknown type', () => {
        const action = { name: 'bad', type: 'fly_to_moon' };
        const result = validateWorkflowAction(action);
        expect(result.valid).toBe(false);
    });

    it('should reject an action missing required fields', () => {
        const action = { type: 'field_update' }; // missing name and field
        const result = validateWorkflowAction(action);
        expect(result.valid).toBe(false);
    });
});

describe('executeSandboxedWithPolicy()', () => {
    it('should reject execution when policy disables scripts', async () => {
        const policy: SandboxPolicy = { ...DEFAULT_SANDBOX_POLICY, enabled: false };
        const result = await executeSandboxedWithPolicy('1 + 1', {}, {}, policy);
        expect(result.success).toBe(false);
        expect(result.error).toContain('disabled by sandbox policy');
    });

    it('should execute when policy enables scripts', async () => {
        const policy: SandboxPolicy = { ...DEFAULT_SANDBOX_POLICY, enabled: true };
        const result = await executeSandboxedWithPolicy('1 + 2', {}, {}, policy);
        expect(result.success).toBe(true);
        expect(result.result).toBe(3);
    });

    it('should clamp timeout to policy maximum', async () => {
        const policy: SandboxPolicy = { ...DEFAULT_SANDBOX_POLICY, enabled: true, maxTimeout: 100 };
        // Script requests 5000ms but policy caps at 100ms
        const result = await executeSandboxedWithPolicy(
            'while(true) {}',
            {},
            { timeout: 5000 },
            policy,
        );
        expect(result.success).toBe(false);
    });

    it('should reject scripts with dangerous patterns', async () => {
        const policy: SandboxPolicy = { ...DEFAULT_SANDBOX_POLICY, enabled: true };
        const result = await executeSandboxedWithPolicy('require("fs")', {}, {}, policy);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Script validation failed');
    });
});
