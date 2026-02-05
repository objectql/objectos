/**
 * Workflow Loader
 * 
 * Loads workflow definitions from YAML files in the file system
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parseWorkflowYAML } from './parser';
import type { WorkflowDefinition } from './types';

/**
 * Load workflows from a directory recursively
 */
export async function loadWorkflows(dirPath: string): Promise<WorkflowDefinition[]> {
    const definitions: WorkflowDefinition[] = [];
    
    // Check if dir exists
    try {
        await fs.access(dirPath);
    } catch {
        // Directory doesn't exist, just return empty list
        return [];
    }
    
    // Helper to scan recursively
    async function scan(currentPath: string) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            
            if (entry.isDirectory()) {
                await scan(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))) {
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const definition = parseWorkflowYAML(content);
                    definitions.push(definition);
                } catch (error) {
                    console.error(`Error loading workflow from ${fullPath}:`, error);
                    // Continue scanning other files
                }
            }
        }
    }
    
    await scan(dirPath);
    return definitions;
}
