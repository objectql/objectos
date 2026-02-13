/**
 * Permission Set YAML Loader
 *
 * Loads permission sets from YAML files.
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import type { PermissionSet } from './types.js';

/**
 * Load permission sets from a directory
 */
export async function loadPermissionSetsFromDirectory(directory: string): Promise<PermissionSet[]> {
  const permissionSets: PermissionSet[] = [];

  if (!fs.existsSync(directory)) {
    return permissionSets;
  }

  const files = fs.readdirSync(directory);
  const yamlFiles = files.filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));

  for (const file of yamlFiles) {
    const filePath = path.join(directory, file);
    const permissionSet = await loadPermissionSetFromFile(filePath);
    if (permissionSet) {
      permissionSets.push(permissionSet);
    }
  }

  return permissionSets;
}

/**
 * Load a single permission set from a YAML file
 */
export async function loadPermissionSetFromFile(filePath: string): Promise<PermissionSet | null> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content) as any;

    if (!data || !data.name || !data.objectName) {
      throw new Error(`Invalid permission set in ${filePath}: missing name or objectName`);
    }

    const permissionSet: PermissionSet = {
      name: data.name,
      label: data.label,
      description: data.description,
      objectName: data.objectName,
      profiles: data.profiles || {},
      fieldPermissions: data.fieldPermissions || {},
    };

    return permissionSet;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error(`Error loading permission set from ${filePath}:`, errorObj.message);
    return null;
  }
}

/**
 * Load permission set from YAML string
 */
export function loadPermissionSetFromYAML(yamlContent: string): PermissionSet {
  const data = yaml.load(yamlContent) as any;

  if (!data || !data.name || !data.objectName) {
    throw new Error('Invalid permission set: missing name or objectName');
  }

  return {
    name: data.name,
    label: data.label,
    description: data.description,
    objectName: data.objectName,
    profiles: data.profiles || {},
    fieldPermissions: data.fieldPermissions || {},
  };
}
