/**
 * Dependency Resolver
 * 
 * Resolves plugin dependencies using semver and topological sorting.
 * Ensures plugins are loaded in the correct order based on their dependencies.
 */

import type { ObjectStackManifest } from '@objectstack/spec/system';
import { Logger, createLogger } from './logger';

/**
 * Dependency graph node
 */
interface DependencyNode {
    id: string;
    manifest: ObjectStackManifest;
    dependencies: string[];
    dependents: Set<string>;
}

/**
 * Dependency resolution result
 */
export interface DependencyResolutionResult {
    /** Plugins in the order they should be loaded */
    loadOrder: string[];
    /** Circular dependencies detected */
    cycles: string[][];
    /** Missing dependencies */
    missing: Map<string, string[]>;
}

/**
 * Dependency validation error
 */
export class DependencyError extends Error {
    constructor(
        message: string,
        public readonly type: 'CIRCULAR' | 'MISSING' | 'VERSION_CONFLICT',
        public readonly plugins?: string[]
    ) {
        super(message);
        this.name = 'DependencyError';
    }
}

/**
 * Dependency Resolver
 * 
 * Analyzes plugin dependencies and determines safe loading order.
 */
export class DependencyResolver {
    private logger: Logger;
    private nodes: Map<string, DependencyNode> = new Map();

    constructor() {
        this.logger = createLogger('DependencyResolver');
    }

    /**
     * Add a plugin to the dependency graph
     */
    addPlugin(manifest: ObjectStackManifest): void {
        const dependencies = this.extractDependencies(manifest);
        
        const node: DependencyNode = {
            id: manifest.id,
            manifest,
            dependencies,
            dependents: new Set(),
        };

        this.nodes.set(manifest.id, node);
        this.logger.debug(`Added plugin '${manifest.id}' with ${dependencies.length} dependencies`);
    }

    /**
     * Extract dependency IDs from manifest
     */
    private extractDependencies(manifest: ObjectStackManifest): string[] {
        const deps: string[] = [];

        // Check contributes.dependencies (spec-compliant location)
        const contributes = manifest.contributes as any;
        if (contributes?.dependencies) {
            if (Array.isArray(contributes.dependencies)) {
                deps.push(...contributes.dependencies);
            } else if (typeof contributes.dependencies === 'object') {
                deps.push(...Object.keys(contributes.dependencies));
            }
        }

        // Check top-level dependencies (legacy support)
        if ((manifest as any).dependencies) {
            const legacyDeps = (manifest as any).dependencies;
            if (Array.isArray(legacyDeps)) {
                deps.push(...legacyDeps);
            } else if (typeof legacyDeps === 'object') {
                deps.push(...Object.keys(legacyDeps));
            }
        }

        return [...new Set(deps)]; // Remove duplicates
    }

    /**
     * Resolve dependencies and return load order
     */
    resolve(): DependencyResolutionResult {
        // Build dependency edges
        this.buildDependencyGraph();

        // Detect circular dependencies
        const cycles = this.detectCycles();
        if (cycles.length > 0) {
            this.logger.warn(`Detected ${cycles.length} circular dependency cycle(s)`);
        }

        // Detect missing dependencies
        const missing = this.detectMissing();
        if (missing.size > 0) {
            this.logger.warn(`Detected ${missing.size} plugin(s) with missing dependencies`);
        }

        // Perform topological sort
        const loadOrder = this.topologicalSort();

        return {
            loadOrder,
            cycles,
            missing,
        };
    }

    /**
     * Build the dependency graph by creating edges between nodes
     */
    private buildDependencyGraph(): void {
        for (const node of this.nodes.values()) {
            for (const depId of node.dependencies) {
                const depNode = this.nodes.get(depId);
                if (depNode) {
                    depNode.dependents.add(node.id);
                }
            }
        }
    }

    /**
     * Detect circular dependencies using DFS
     */
    private detectCycles(): string[][] {
        const cycles: string[][] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const path: string[] = [];

        const dfs = (nodeId: string): boolean => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const node = this.nodes.get(nodeId);
            if (!node) return false;

            for (const depId of node.dependencies) {
                if (!visited.has(depId)) {
                    if (dfs(depId)) {
                        return true;
                    }
                } else if (recursionStack.has(depId)) {
                    // Found a cycle
                    const cycleStart = path.indexOf(depId);
                    const cycle = path.slice(cycleStart);
                    cycles.push([...cycle, depId]);
                    return true;
                }
            }

            path.pop();
            recursionStack.delete(nodeId);
            return false;
        };

        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                dfs(nodeId);
            }
        }

        return cycles;
    }

    /**
     * Detect missing dependencies
     */
    private detectMissing(): Map<string, string[]> {
        const missing = new Map<string, string[]>();

        for (const node of this.nodes.values()) {
            const missingDeps = node.dependencies.filter(
                depId => !this.nodes.has(depId)
            );

            if (missingDeps.length > 0) {
                missing.set(node.id, missingDeps);
            }
        }

        return missing;
    }

    /**
     * Perform topological sort using Kahn's algorithm
     * Returns plugins in the order they should be loaded
     */
    private topologicalSort(): string[] {
        const result: string[] = [];
        const inDegree = new Map<string, number>();

        // Calculate in-degree for each node
        for (const node of this.nodes.values()) {
            if (!inDegree.has(node.id)) {
                inDegree.set(node.id, 0);
            }
            for (const depId of node.dependencies) {
                if (this.nodes.has(depId)) {
                    const currentDegree = inDegree.get(node.id) || 0;
                    inDegree.set(node.id, currentDegree + 1);
                }
            }
        }

        // Queue of nodes with no dependencies
        const queue: string[] = [];
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }

        // Process queue
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            result.push(nodeId);

            const node = this.nodes.get(nodeId);
            if (!node) continue;

            // Reduce in-degree of dependents
            for (const dependentId of node.dependents) {
                const currentDegree = inDegree.get(dependentId) || 0;
                const newDegree = currentDegree - 1;
                inDegree.set(dependentId, newDegree);

                if (newDegree === 0) {
                    queue.push(dependentId);
                }
            }
        }

        // If not all nodes are processed, there's a cycle
        if (result.length !== this.nodes.size) {
            this.logger.warn(
                `Topological sort incomplete: ${result.length}/${this.nodes.size} plugins sorted. ` +
                `This indicates circular dependencies.`
            );
        }

        return result;
    }

    /**
     * Validate that all dependencies can be resolved
     * Throws DependencyError if validation fails
     */
    validate(): void {
        const result = this.resolve();

        // Check for missing dependencies
        if (result.missing.size > 0) {
            const errors: string[] = [];
            for (const [pluginId, missingDeps] of result.missing.entries()) {
                errors.push(`Plugin '${pluginId}' requires: ${missingDeps.join(', ')}`);
            }
            throw new DependencyError(
                `Missing dependencies:\n${errors.join('\n')}`,
                'MISSING',
                Array.from(result.missing.keys())
            );
        }

        // Check for circular dependencies
        if (result.cycles.length > 0) {
            const cycleDescriptions = result.cycles.map(
                cycle => cycle.join(' -> ')
            );
            throw new DependencyError(
                `Circular dependencies detected:\n${cycleDescriptions.join('\n')}`,
                'CIRCULAR',
                result.cycles[0]
            );
        }
    }

    /**
     * Get the dependency graph as a string for debugging
     */
    getGraphDescription(): string {
        const lines: string[] = ['Dependency Graph:'];
        
        for (const node of this.nodes.values()) {
            const deps = node.dependencies.length > 0 
                ? ` -> [${node.dependencies.join(', ')}]`
                : ' (no dependencies)';
            lines.push(`  ${node.id}${deps}`);
        }

        return lines.join('\n');
    }

    /**
     * Clear the dependency graph
     */
    clear(): void {
        this.nodes.clear();
    }
}
