/**
 * Shared utility functions for the GraphQL package
 */

/**
 * Convert object name to PascalCase GraphQL type name
 * e.g., "audit_log" → "AuditLog", "permission_set" → "PermissionSet"
 */
export function toPascalCase(name: string): string {
  return name
    .split(/[_\s-]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}
