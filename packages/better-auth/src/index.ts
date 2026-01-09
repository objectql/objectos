import * as path from 'path';

/**
 * Better-Auth integration package for ObjectQL
 * 
 * This package provides object definitions for Better-Auth's multi-tenant
 * organization management system, including:
 * 
 * - user: System users for authentication
 * - account: External authentication accounts (OAuth, etc.)
 * - session: User authentication sessions
 * - verification: Verification tokens for email/phone
 * - organization: Organizations for multi-tenant apps
 * - member: Organization membership
 * - invitation: Organization invitations
 * - base: Airtable-like Base (data workspace container)
 * - base_member: Base-level membership and permissions
 * 
 * These object definitions follow Better-Auth's schema specifications
 * and can be loaded into ObjectQL's metadata registry.
 */

export const BetterAuthPackage = {
    name: '@objectql/better-auth',
    path: __dirname
};

/**
 * List of object definition files provided by this package
 */
export const objectDefinitions = [
    'user.object.yml',
    'account.object.yml', 
    'session.object.yml',
    'verification.object.yml',
    'organization.object.yml',
    'member.object.yml',
    'invitation.object.yml',
    'base.object.yml',
    'base_member.object.yml'
];

/**
 * Get the full path to an object definition file
 * @param filename The object definition filename
 * @returns Full path to the file
 */
export function getObjectDefinitionPath(filename: string): string {
    return path.join(__dirname, filename);
}

/**
 * Get all object definition paths
 * @returns Array of full paths to all object definition files
 */
export function getAllObjectDefinitionPaths(): string[] {
    return objectDefinitions.map(f => getObjectDefinitionPath(f));
}
