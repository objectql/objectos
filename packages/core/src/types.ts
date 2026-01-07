import { ObjectRepository } from "./repository";
import { ObjectConfig } from "./metadata";
import { Driver } from "./driver";

export interface IObjectQL {
    getObject(name: string): ObjectConfig | undefined;
    datasource(name: string): Driver;
}

export interface ObjectQLContext {
    // === Identity & Isolation ===
    userId?: string;                        // Current User ID
    spaceId?: string;                       // Multi-tenancy Isolation (Organization ID)
    roles: string[];                        // RBAC Roles

    // === Execution Flags ===
    /**
     * Sudo Mode / System Bypass.
     * - true: Bypasses all permission checks (CRUD, Field Level Security, Record Level Security).
     * - false/undefined: Enforces all permission checks based on 'roles'.
     */
    isSystem?: boolean;

    /**
     * Trigger Control.
     * - true: Skips all lifecycle hooks (beforeCreate, afterUpdate, etc.).
     * - Useful for bulk data imports or raw data correction to prevent side effects.
     * - Requires 'isSystem: true' (Security Safeguard).
     */
    ignoreTriggers?: boolean;

    // === Data Entry Point ===
    /**
     * Returns a repository proxy bound to this context.
     * All operations performed via this proxy inherit userId, spaceId, and transaction.
     */
    object(entityName: string): ObjectRepository;

    /**
     * Execute a function within a transaction.
     * The callback receives a new context 'trxCtx' which inherits userId and spaceId from this context.
     */
    transaction(callback: (trxCtx: ObjectQLContext) => Promise<any>): Promise<any>;

    /**
     * Returns a new context with system privileges (isSystem: true).
     * It shares the same transaction scope as the current context.
     */
    sudo(): ObjectQLContext;
}

export interface ObjectQLContextOptions {
    userId?: string;
    spaceId?: string;
    roles?: string[];
    isSystem?: boolean;
    ignoreTriggers?: boolean;
}
