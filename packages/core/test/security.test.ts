import { SecurityEngine } from '../src/security';
import { PolicyConfig, RoleConfig } from '../src/metadata';
import { ObjectQLContext } from '../src/types';

describe('SecurityEngine', () => {
    let security: SecurityEngine;

    beforeEach(() => {
        security = new SecurityEngine();
    });

    it('should deny access if no roles provided', () => {
        const ctx: any = { roles: [], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        expect(result.allowed).toBe(false);
    });

    it('should deny access if role has no permission', () => {
        const role: RoleConfig = { name: 'guest', inline_policies: [] };
        security.registerRole(role);

        const ctx: any = { roles: ['guest'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        expect(result.allowed).toBe(false);
    });

    it('should allow access via inline policy', () => {
        const role: RoleConfig = {
            name: 'admin',
            inline_policies: [
                { object: 'project', actions: ['read'] }
            ]
        };
        security.registerRole(role);

        const ctx: any = { roles: ['admin'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        expect(result.allowed).toBe(true);
    });

    it('should allow access via managed policy', () => {
        const policy: PolicyConfig = {
            name: 'read_access',
            statements: [
                { object: 'project', actions: ['read'] }
            ]
        };
        const role: RoleConfig = {
            name: 'viewer',
            policies: ['read_access']
        };
        security.registerPolicy(policy);
        security.registerRole(role);

        const ctx: any = { roles: ['viewer'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        expect(result.allowed).toBe(true);
    });

    it('should return RLS filters', () => {
        const policy: PolicyConfig = {
            name: 'owner_only',
            statements: [
                {
                    object: 'project',
                    actions: ['read'],
                    filters: [['owner', '=', '$user.id']]
                }
            ]
        };
        const role: RoleConfig = {
            name: 'user',
            policies: ['owner_only']
        };
        security.registerPolicy(policy);
        security.registerRole(role);

        const ctx: any = { roles: ['user'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');
        
        expect(result.allowed).toBe(true);
        expect(result.filters).toEqual([['owner', '=', '$user.id']]);
    });

    it('should merge RLS filters from multiple policies with OR', () => {
        // Policy 1: Own projects
        const p1: PolicyConfig = {
            name: 'own_projects',
            statements: [{ object: 'project', actions: ['read'], filters: [['owner', '=', 'me']] }]
        };
        // Policy 2: Public projects
        const p2: PolicyConfig = {
            name: 'public_projects',
            statements: [{ object: 'project', actions: ['read'], filters: [['public', '=', true]] }]
        };
        
        const role: RoleConfig = {
            name: 'hybrid',
            policies: ['own_projects', 'public_projects']
        };

        security.registerPolicy(p1);
        security.registerPolicy(p2);
        security.registerRole(role);

        const ctx: any = { roles: ['hybrid'], object: {} as any, transaction: {} as any, sudo: () => ctx };
        const result = security.check(ctx, 'project', 'read');

        
        expect(result.allowed).toBe(true);
        // Expecting ['or', filter1, filter2]
        // Note: The order depends on iteration order, which is insertion order in Maps generally.
        expect(result.filters).toHaveLength(3);
        expect(result.filters![0]).toBe('or');
    });
});
