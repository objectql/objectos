/**
 * Record-Level Security (RLS) Evaluator
 * 
 * Combines Organization-Wide Defaults (OWD) with Sharing Rules
 * to determine the effective record-level access for a user on an object.
 * 
 * Evaluation order:
 * 1. Check OWD — if public_read_write, grant full access
 * 2. Check OWD — if public_read_only, grant read access
 * 3. Check OWD — if private, restrict to owner-only
 * 4. Apply sharing rules — extend access beyond OWD
 */

import type {
    RLSConfig,
    RLSEvaluationResult,
    PermissionContext,
    OrganizationDefault,
} from './types.js';
import { SharingRuleEngine } from './sharing-rules.js';

/**
 * RLS Evaluator
 * 
 * Evaluates record-level security by combining Organization-Wide Defaults
 * with Sharing Rules from the SharingRuleEngine.
 */
export class RLSEvaluator {
    private sharingEngine: SharingRuleEngine;
    private orgDefaults: Map<string, OrganizationDefault> = new Map();

    constructor(sharingEngine: SharingRuleEngine) {
        this.sharingEngine = sharingEngine;
    }

    /**
     * Register an organization-wide default for an object
     */
    setOrgDefault(orgDefault: OrganizationDefault): void {
        this.orgDefaults.set(orgDefault.objectName, orgDefault);
    }

    /**
     * Get the organization-wide default for an object
     */
    getOrgDefault(objectName: string): OrganizationDefault | undefined {
        return this.orgDefaults.get(objectName);
    }

    /**
     * Apply a full RLSConfig — sets OWD and loads sharing rules
     */
    applyConfig(config: RLSConfig): void {
        this.setOrgDefault(config.orgDefault);
        for (const rule of config.sharingRules) {
            this.sharingEngine.addRule(rule);
        }
    }

    /**
     * Evaluate record-level security for a user on an object
     * 
     * Returns the effective access level and any filters to apply.
     */
    evaluate(
        context: PermissionContext,
        objectName: string,
    ): RLSEvaluationResult {
        const orgDefault = this.orgDefaults.get(objectName);

        // If no OWD defined, default to private (most restrictive)
        const accessLevel = orgDefault?.internalAccess ?? 'private';

        // 1. Public Read/Write — full access, no filters needed
        if (accessLevel === 'public_read_write') {
            return {
                hasAccess: true,
                accessLevel: 'full',
                filters: {},
                appliedRules: [],
            };
        }

        // 2. Public Read-Only — read access to all, but write only to own
        if (accessLevel === 'public_read_only') {
            // Sharing rules can upgrade to read_write
            const sharingResult = this.sharingEngine.evaluate(context, objectName);
            if (sharingResult.granted && sharingResult.accessLevel === 'read_write') {
                return {
                    hasAccess: true,
                    accessLevel: 'read_write',
                    filters: sharingResult.filters,
                    appliedRules: sharingResult.matchedRules.map(r => r.name),
                };
            }
            return {
                hasAccess: true,
                accessLevel: 'read_only',
                filters: {},
                appliedRules: [],
            };
        }

        // 3. Private — owner-only baseline, sharing rules can extend
        const sharingResult = this.sharingEngine.evaluate(context, objectName);

        if (sharingResult.granted) {
            // Merge owner filter with sharing rule filters
            const ownerFilter = { owner: context.userId };
            const combinedFilters: Record<string, any> = {
                $or: [
                    ownerFilter,
                    ...(sharingResult.filters.$or || [sharingResult.filters]),
                ],
            };

            return {
                hasAccess: true,
                accessLevel: sharingResult.accessLevel === 'read_write' ? 'read_write' : 'read_only',
                filters: combinedFilters,
                appliedRules: sharingResult.matchedRules.map(r => r.name),
            };
        }

        // No sharing rules matched — restrict to owner-only
        return {
            hasAccess: true,
            accessLevel: 'owner_only',
            filters: { owner: context.userId },
            appliedRules: [],
        };
    }

    /**
     * Clear all OWD registrations
     */
    clear(): void {
        this.orgDefaults.clear();
    }
}
