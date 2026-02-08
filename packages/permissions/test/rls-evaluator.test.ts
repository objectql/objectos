/**
 * RLS Evaluator Tests
 * 
 * Tests for record-level security evaluation combining OWD + Sharing Rules.
 */

import { RLSEvaluator } from '../src/rls-evaluator.js';
import { SharingRuleEngine } from '../src/sharing-rules.js';
import type { PermissionContext, OrganizationDefault, SharingRule, RLSConfig } from '../src/types.js';

describe('RLSEvaluator', () => {
    let sharingEngine: SharingRuleEngine;
    let evaluator: RLSEvaluator;

    beforeEach(() => {
        sharingEngine = new SharingRuleEngine();
        evaluator = new RLSEvaluator(sharingEngine);
    });

    const baseContext: PermissionContext = {
        userId: 'user_1',
        profileName: 'standard',
        roleName: 'sales_rep',
        metadata: { groups: ['west_team'], territories: ['us_west'] },
    };

    describe('Organization-Wide Defaults', () => {
        it('should grant full access when OWD is public_read_write', () => {
            evaluator.setOrgDefault({
                objectName: 'account',
                internalAccess: 'public_read_write',
                externalAccess: 'private',
            });

            const result = evaluator.evaluate(baseContext, 'account');
            expect(result.hasAccess).toBe(true);
            expect(result.accessLevel).toBe('full');
            expect(Object.keys(result.filters)).toHaveLength(0);
        });

        it('should grant read_only when OWD is public_read_only', () => {
            evaluator.setOrgDefault({
                objectName: 'report',
                internalAccess: 'public_read_only',
                externalAccess: 'private',
            });

            const result = evaluator.evaluate(baseContext, 'report');
            expect(result.hasAccess).toBe(true);
            expect(result.accessLevel).toBe('read_only');
        });

        it('should restrict to owner_only when OWD is private and no sharing rules', () => {
            evaluator.setOrgDefault({
                objectName: 'opportunity',
                internalAccess: 'private',
                externalAccess: 'private',
            });

            const result = evaluator.evaluate(baseContext, 'opportunity');
            expect(result.hasAccess).toBe(true);
            expect(result.accessLevel).toBe('owner_only');
            expect(result.filters).toEqual({ owner: 'user_1' });
        });

        it('should default to private when no OWD is configured', () => {
            const result = evaluator.evaluate(baseContext, 'unknown_object');
            expect(result.accessLevel).toBe('owner_only');
            expect(result.filters).toEqual({ owner: 'user_1' });
        });
    });

    describe('Sharing Rules Integration', () => {
        beforeEach(() => {
            evaluator.setOrgDefault({
                objectName: 'opportunity',
                internalAccess: 'private',
                externalAccess: 'private',
            });
        });

        it('should extend access via role-based sharing rule', () => {
            const rule: SharingRule = {
                name: 'share_opps_with_managers',
                label: 'Share Opps with Managers',
                objectName: 'opportunity',
                type: 'owner_based',
                ownedByType: 'role',
                ownedByValues: ['sales_rep'],
                sharedWithType: 'role',
                sharedWithValues: ['sales_rep'],
                accessLevel: 'read_write',
            };
            sharingEngine.addRule(rule);

            const result = evaluator.evaluate(baseContext, 'opportunity');
            expect(result.hasAccess).toBe(true);
            expect(result.accessLevel).toBe('read_write');
            expect(result.appliedRules).toContain('share_opps_with_managers');
        });

        it('should extend access via group-based sharing rule', () => {
            const rule: SharingRule = {
                name: 'share_with_west_team',
                label: 'Share with West Team',
                objectName: 'opportunity',
                type: 'criteria_based',
                criteria: { region: 'west' },
                sharedWithType: 'group',
                sharedWithValues: ['west_team'],
                accessLevel: 'read_only',
            };
            sharingEngine.addRule(rule);

            const result = evaluator.evaluate(baseContext, 'opportunity');
            expect(result.hasAccess).toBe(true);
            expect(result.accessLevel).toBe('read_only');
            expect(result.filters.$or).toBeDefined();
        });

        it('should combine owner filter with sharing rule filters', () => {
            const rule: SharingRule = {
                name: 'share_west',
                label: 'Share West',
                objectName: 'opportunity',
                type: 'criteria_based',
                criteria: { region: 'west' },
                sharedWithType: 'group',
                sharedWithValues: ['west_team'],
                accessLevel: 'read_only',
            };
            sharingEngine.addRule(rule);

            const result = evaluator.evaluate(baseContext, 'opportunity');
            // Filters should include both owner filter and sharing rule criteria
            expect(result.filters.$or).toBeDefined();
            expect(result.filters.$or).toContainEqual({ owner: 'user_1' });
        });
    });

    describe('Public Read-Only + Sharing Rules upgrade', () => {
        it('should upgrade to read_write when sharing rule grants it', () => {
            evaluator.setOrgDefault({
                objectName: 'document',
                internalAccess: 'public_read_only',
                externalAccess: 'private',
            });

            const rule: SharingRule = {
                name: 'doc_editors',
                label: 'Document Editors',
                objectName: 'document',
                type: 'owner_based',
                ownedByType: 'group',
                ownedByValues: ['editors'],
                sharedWithType: 'role',
                sharedWithValues: ['sales_rep'],
                accessLevel: 'read_write',
            };
            sharingEngine.addRule(rule);

            const result = evaluator.evaluate(baseContext, 'document');
            expect(result.accessLevel).toBe('read_write');
            expect(result.appliedRules).toContain('doc_editors');
        });
    });

    describe('applyConfig()', () => {
        it('should apply a full RLSConfig at once', () => {
            const config: RLSConfig = {
                objectName: 'case',
                orgDefault: {
                    objectName: 'case',
                    internalAccess: 'private',
                    externalAccess: 'private',
                },
                sharingRules: [
                    {
                        name: 'share_cases',
                        label: 'Share Cases',
                        objectName: 'case',
                        type: 'criteria_based',
                        criteria: { priority: 'high' },
                        sharedWithType: 'role',
                        sharedWithValues: ['sales_rep'],
                        accessLevel: 'read_only',
                    },
                ],
            };

            evaluator.applyConfig(config);

            const result = evaluator.evaluate(baseContext, 'case');
            expect(result.hasAccess).toBe(true);
            expect(result.appliedRules).toContain('share_cases');
        });
    });

    describe('clear()', () => {
        it('should clear all OWD registrations', () => {
            evaluator.setOrgDefault({
                objectName: 'account',
                internalAccess: 'public_read_write',
                externalAccess: 'private',
            });

            evaluator.clear();

            // After clear, should default to private behavior
            const result = evaluator.evaluate(baseContext, 'account');
            expect(result.accessLevel).toBe('owner_only');
        });
    });
});
