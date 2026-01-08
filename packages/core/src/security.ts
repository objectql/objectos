import { ObjectQLContext } from './types';
import { PolicyConfig, RoleConfig, PolicyStatement } from './metadata';
import { UnifiedQuery, FilterCriterion } from './query';

export class SecurityEngine {
    private policies: Map<string, PolicyConfig> = new Map();
    private roles: Map<string, RoleConfig> = new Map();

    constructor() {}

    registerPolicy(policy: PolicyConfig) {
        this.policies.set(policy.name, policy);
    }

    registerRole(role: RoleConfig) {
        this.roles.set(role.name, role);
    }

    /**
     * Resolves all permissions for a specific user role set.
     * Merges policies from all roles (Union).
     */
    getPermissions(userRoles: string[], objectName: string): ResolvedPermission {
        if (!userRoles || userRoles.length === 0) {
            return { allowed: false };
        }

        const effectiveStatements: PolicyStatement[] = [];

        // 1. Gather all applicable statements
        for (const roleName of userRoles) {
            const role = this.roles.get(roleName);
            if (!role) continue;

            // Managed Policies
            if (role.policies) {
                for (const policyName of role.policies) {
                    const policy = this.policies.get(policyName);
                    if (policy) {
                        const statements = policy.statements.filter(s => s.object === objectName || s.object === '*');
                        effectiveStatements.push(...statements);
                    }
                }
            }

            // Inline Policies
            if (role.inline_policies) {
                const statements = role.inline_policies.filter(s => s.object === objectName || s.object === '*');
                effectiveStatements.push(...statements);
            }
        }

        // 2. Resolve (Union)
        // If no statements found -> Deny
        if (effectiveStatements.length === 0) {
            return { allowed: false };
        }

        const resolved: ResolvedPermission = {
            allowed: false,
            actions: new Set(),
            filters: []
        };

        for (const stmt of effectiveStatements) {
            // Merge Actions
            for (const action of stmt.actions) {
                resolved.actions!.add(action);
            }

            // Merge Filters (OR logic)
            // If multiple policies apply, the user has access if ANY of them grants access.
            // But complex RLS merging (OR) is tricky.
            // Simplified Logic: 
            // If we have filters from multiple sources, we join them with OR.
            // (FilterA) OR (FilterB)
            if (stmt.filters && stmt.filters.length > 0) {
                 resolved.filters!.push(stmt.filters);
            }
        }
        
        if (resolved.actions!.size > 0) {
            resolved.allowed = true;
        }

        return resolved;
    }

    /**
     * Checks if the operation is allowed and returns the RLS filters to apply.
     */
    check(ctx: ObjectQLContext, objectName: string, action: 'read' | 'create' | 'update' | 'delete'): { allowed: boolean, filters?: any[] } {
        // System bypass
        if (ctx.isSystem) return { allowed: true };
        
        // No roles -> Deny
        if (!ctx.roles || ctx.roles.length === 0) return { allowed: false };

        const perm = this.getPermissions(ctx.roles, objectName);

        if (!perm.allowed) return { allowed: false };

        const hasWildcard = perm.actions!.has('*');
        const hasAction = perm.actions!.has(action);

        if (!hasWildcard && !hasAction) return { allowed: false };

        // Construct final RLS filter
        // If we have multiple filter sets, it means (Set1) OR (Set2)
        // because permissions are additive.
        let finalFilter = undefined;

        if (perm.filters && perm.filters.length > 0) {
            if (perm.filters.length === 1) {
                finalFilter = perm.filters[0];
            } else {
                // Combine with OR
                finalFilter = ['or', ...perm.filters];
            }
        }

        return { allowed: true, filters: finalFilter };
    }
}

interface ResolvedPermission {
    allowed: boolean;
    actions?: Set<string>;
    filters?: any[][]; // Array of filter groups (which are arrays)
}
