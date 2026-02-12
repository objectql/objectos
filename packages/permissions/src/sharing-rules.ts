/**
 * Sharing Rule Engine for ObjectOS
 * 
 * Implements criteria-based and owner-based sharing rules
 * that extend access beyond the role hierarchy.
 * 
 * @see SharingRule type in ./types.ts
 */

import type {
    SharingRule,
    SharingAccessLevel,
    PermissionContext,
} from './types.js';

/**
 * Result of evaluating sharing rules for a user + object
 */
export interface SharingRuleResult {
    /** Whether any sharing rule grants access */
    granted: boolean;
    /** Highest access level granted */
    accessLevel?: SharingAccessLevel;
    /** Rules that matched */
    matchedRules: SharingRule[];
    /** Additional record filters to apply */
    filters: Record<string, any>;
}

/**
 * Sharing Rule Engine
 * 
 * Evaluates sharing rules to determine if a user
 * gets extended access to records beyond their default permissions.
 */
export class SharingRuleEngine {
    private rules: Map<string, SharingRule[]> = new Map();

    /**
     * Register a sharing rule
     */
    addRule(rule: SharingRule): void {
        const objectRules = this.rules.get(rule.objectName) || [];
        objectRules.push(rule);
        // Sort by priority (lower = higher priority)
        objectRules.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
        this.rules.set(rule.objectName, objectRules);
    }

    /**
     * Remove a sharing rule by name
     */
    removeRule(objectName: string, ruleName: string): boolean {
        const objectRules = this.rules.get(objectName);
        if (!objectRules) return false;
        const idx = objectRules.findIndex(r => r.name === ruleName);
        if (idx === -1) return false;
        objectRules.splice(idx, 1);
        return true;
    }

    /**
     * Get all rules for an object
     */
    getRules(objectName: string): SharingRule[] {
        return this.rules.get(objectName) || [];
    }

    /**
     * Get all registered rules
     */
    getAllRules(): SharingRule[] {
        const all: SharingRule[] = [];
        for (const rules of this.rules.values()) {
            all.push(...rules);
        }
        return all;
    }

    /**
     * Evaluate sharing rules for a given user context and object
     * 
     * Returns:
     * - Whether any rule grants access
     * - The highest access level (read_only or read_write)
     * - Record filters to apply for the matched rules
     */
    evaluate(
        context: PermissionContext,
        objectName: string,
    ): SharingRuleResult {
        const objectRules = this.rules.get(objectName) || [];
        const activeRules = objectRules.filter(r => r.isActive !== false);

        const matchedRules: SharingRule[] = [];
        let highestAccess: SharingAccessLevel | undefined;
        const filters: Record<string, any> = {};

        for (const rule of activeRules) {
            const isMatch = this.matchesRule(rule, context);
            if (isMatch) {
                matchedRules.push(rule);

                // Determine highest access level
                if (!highestAccess || rule.accessLevel === 'read_write') {
                    highestAccess = rule.accessLevel;
                }

                // Build filters based on rule type
                if (rule.type === 'owner_based' && rule.ownedByValues) {
                    // Owner-based: records owned by users in the specified groups
                    filters.$or = filters.$or || [];
                    filters.$or.push({ owner_role: { $in: rule.ownedByValues } });
                } else if (rule.type === 'criteria_based' && rule.criteria) {
                    // Criteria-based: records matching the criteria
                    filters.$or = filters.$or || [];
                    filters.$or.push(rule.criteria);
                }
            }
        }

        return {
            granted: matchedRules.length > 0,
            accessLevel: highestAccess,
            matchedRules,
            filters,
        };
    }

    /**
     * Check if a user context matches a sharing rule's target
     */
    private matchesRule(rule: SharingRule, context: PermissionContext): boolean {
        const { roleName, metadata } = context;

        switch (rule.sharedWithType) {
            case 'role':
                return !!roleName && rule.sharedWithValues.includes(roleName);

            case 'role_and_subordinates':
                // Check if user's role is in the target or a subordinate
                // Uses hierarchyPath from metadata if available
                if (!roleName) return false;
                if (rule.sharedWithValues.includes(roleName)) return true;
                // Check subordinate roles via hierarchy path
                {
                    const hierarchyPath = metadata?.hierarchyPath as string | undefined;
                    if (hierarchyPath) {
                        return rule.sharedWithValues.some(targetRole =>
                            hierarchyPath.includes(targetRole)
                        );
                    }
                }
                return false;

            case 'group': {
                const userGroups = (metadata?.groups || []) as string[];
                return rule.sharedWithValues.some(g => userGroups.includes(g));
            }

            case 'territory': {
                const userTerritories = (metadata?.territories || []) as string[];
                return rule.sharedWithValues.some(t => userTerritories.includes(t));
            }

            default:
                return false;
        }
    }

    /**
     * Clear all rules
     */
    clear(): void {
        this.rules.clear();
    }

    /**
     * Clear rules for a specific object
     */
    clearObject(objectName: string): void {
        this.rules.delete(objectName);
    }
}
