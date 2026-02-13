/**
 * Sharing Rule Engine Tests
 */

import { SharingRuleEngine } from '../src/sharing-rules.js';
import type { SharingRule, PermissionContext } from '../src/types.js';

describe('SharingRuleEngine', () => {
  let engine: SharingRuleEngine;

  beforeEach(() => {
    engine = new SharingRuleEngine();
  });

  describe('Rule Management', () => {
    it('should add and retrieve rules for an object', () => {
      const rule: SharingRule = {
        name: 'share_with_managers',
        label: 'Share with Managers',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['manager'],
        accessLevel: 'read_only',
      };

      engine.addRule(rule);
      const rules = engine.getRules('orders');
      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('share_with_managers');
    });

    it('should sort rules by priority', () => {
      engine.addRule({
        name: 'low_priority',
        label: 'Low',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['admin'],
        accessLevel: 'read_only',
        priority: 50,
      });
      engine.addRule({
        name: 'high_priority',
        label: 'High',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['admin'],
        accessLevel: 'read_write',
        priority: 10,
      });

      const rules = engine.getRules('orders');
      expect(rules[0].name).toBe('high_priority');
      expect(rules[1].name).toBe('low_priority');
    });

    it('should remove a rule by name', () => {
      engine.addRule({
        name: 'test_rule',
        label: 'Test',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['admin'],
        accessLevel: 'read_only',
      });

      expect(engine.removeRule('orders', 'test_rule')).toBe(true);
      expect(engine.getRules('orders')).toHaveLength(0);
    });

    it('should return false when removing non-existent rule', () => {
      expect(engine.removeRule('orders', 'nonexistent')).toBe(false);
    });

    it('should get all rules across objects', () => {
      engine.addRule({
        name: 'rule1',
        label: 'Rule 1',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['admin'],
        accessLevel: 'read_only',
      });
      engine.addRule({
        name: 'rule2',
        label: 'Rule 2',
        objectName: 'contacts',
        type: 'criteria_based',
        sharedWithType: 'group',
        sharedWithValues: ['sales_team'],
        accessLevel: 'read_write',
        criteria: { status: 'active' },
      });

      const all = engine.getAllRules();
      expect(all).toHaveLength(2);
    });

    it('should clear all rules', () => {
      engine.addRule({
        name: 'rule1',
        label: 'Rule 1',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['admin'],
        accessLevel: 'read_only',
      });
      engine.clear();
      expect(engine.getAllRules()).toHaveLength(0);
    });
  });

  describe('Rule Evaluation', () => {
    it('should grant access for role-based sharing', () => {
      engine.addRule({
        name: 'share_orders',
        label: 'Share Orders',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['sales_manager'],
        accessLevel: 'read_only',
        ownedByValues: ['sales_rep'],
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'sales_manager',
      };

      const result = engine.evaluate(context, 'orders');
      expect(result.granted).toBe(true);
      expect(result.accessLevel).toBe('read_only');
      expect(result.matchedRules).toHaveLength(1);
    });

    it('should deny access when role does not match', () => {
      engine.addRule({
        name: 'share_orders',
        label: 'Share Orders',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['sales_manager'],
        accessLevel: 'read_only',
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'support_rep',
      };

      const result = engine.evaluate(context, 'orders');
      expect(result.granted).toBe(false);
    });

    it('should grant access for group-based sharing', () => {
      engine.addRule({
        name: 'share_with_sales',
        label: 'Share with Sales',
        objectName: 'leads',
        type: 'criteria_based',
        sharedWithType: 'group',
        sharedWithValues: ['sales_team'],
        accessLevel: 'read_write',
        criteria: { status: 'qualified' },
      });

      const context: PermissionContext = {
        userId: 'user2',
        profileName: 'standard',
        roleName: 'sales_rep',
        metadata: { groups: ['sales_team', 'marketing'] },
      };

      const result = engine.evaluate(context, 'leads');
      expect(result.granted).toBe(true);
      expect(result.accessLevel).toBe('read_write');
    });

    it('should pick highest access level from multiple matching rules', () => {
      engine.addRule({
        name: 'read_only_rule',
        label: 'Read',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['manager'],
        accessLevel: 'read_only',
        priority: 20,
      });
      engine.addRule({
        name: 'read_write_rule',
        label: 'Write',
        objectName: 'orders',
        type: 'criteria_based',
        sharedWithType: 'role',
        sharedWithValues: ['manager'],
        accessLevel: 'read_write',
        priority: 10,
        criteria: { region: 'US' },
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'manager',
      };

      const result = engine.evaluate(context, 'orders');
      expect(result.granted).toBe(true);
      expect(result.accessLevel).toBe('read_write');
      expect(result.matchedRules).toHaveLength(2);
    });

    it('should skip inactive rules', () => {
      engine.addRule({
        name: 'inactive_rule',
        label: 'Inactive',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['admin'],
        accessLevel: 'read_write',
        isActive: false,
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'admin',
      };

      const result = engine.evaluate(context, 'orders');
      expect(result.granted).toBe(false);
    });

    it('should handle territory-based sharing', () => {
      engine.addRule({
        name: 'territory_share',
        label: 'Territory',
        objectName: 'accounts',
        type: 'owner_based',
        sharedWithType: 'territory',
        sharedWithValues: ['west_coast'],
        accessLevel: 'read_write',
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        metadata: { territories: ['west_coast', 'east_coast'] },
      };

      const result = engine.evaluate(context, 'accounts');
      expect(result.granted).toBe(true);
    });

    it('should return empty result for object with no rules', () => {
      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'admin',
      };

      const result = engine.evaluate(context, 'nonexistent_object');
      expect(result.granted).toBe(false);
      expect(result.matchedRules).toHaveLength(0);
    });

    it('should build owner-based filters in result', () => {
      engine.addRule({
        name: 'owner_rule',
        label: 'Owner',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role',
        sharedWithValues: ['manager'],
        accessLevel: 'read_only',
        ownedByValues: ['sales_rep', 'junior_rep'],
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'manager',
      };

      const result = engine.evaluate(context, 'orders');
      expect(result.filters.$or).toBeDefined();
      expect(result.filters.$or[0].owner_role.$in).toEqual(['sales_rep', 'junior_rep']);
    });

    it('should build criteria-based filters in result', () => {
      engine.addRule({
        name: 'criteria_rule',
        label: 'Criteria',
        objectName: 'orders',
        type: 'criteria_based',
        sharedWithType: 'role',
        sharedWithValues: ['manager'],
        accessLevel: 'read_only',
        criteria: { status: 'pending', amount: { $gt: 1000 } },
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'manager',
      };

      const result = engine.evaluate(context, 'orders');
      expect(result.filters.$or).toBeDefined();
      expect(result.filters.$or[0]).toEqual({ status: 'pending', amount: { $gt: 1000 } });
    });
  });

  describe('Role Hierarchy Support', () => {
    it('should grant access via role_and_subordinates with hierarchy path', () => {
      engine.addRule({
        name: 'hierarchy_rule',
        label: 'Hierarchy',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role_and_subordinates',
        sharedWithValues: ['vp_sales'],
        accessLevel: 'read_only',
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'sales_rep',
        metadata: { hierarchyPath: '/ceo/vp_sales/sales_manager/sales_rep' },
      };

      const result = engine.evaluate(context, 'orders');
      expect(result.granted).toBe(true);
    });

    it('should deny access when not in hierarchy path', () => {
      engine.addRule({
        name: 'hierarchy_rule',
        label: 'Hierarchy',
        objectName: 'orders',
        type: 'owner_based',
        sharedWithType: 'role_and_subordinates',
        sharedWithValues: ['vp_engineering'],
        accessLevel: 'read_only',
      });

      const context: PermissionContext = {
        userId: 'user1',
        profileName: 'standard',
        roleName: 'sales_rep',
        metadata: { hierarchyPath: '/ceo/vp_sales/sales_manager/sales_rep' },
      };

      const result = engine.evaluate(context, 'orders');
      expect(result.granted).toBe(false);
    });
  });
});
