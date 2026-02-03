/**
 * Dependency Resolver
 * 
 * Resolves plugin dependencies and determines load order using topological sorting.
 */

import { DependencyNode, DependencyError } from '../types';

export class DependencyResolver {
  /**
   * Resolve dependencies using topological sort (Kahn's algorithm)
   * 
   * @param nodes - Dependency graph nodes
   * @returns Sorted list of node IDs in dependency order
   * @throws DependencyError if circular dependencies detected
   */
  static resolve(nodes: DependencyNode[]): string[] {
    // Build adjacency list and in-degree map
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const nodeMap = new Map<string, DependencyNode>();

    // Initialize
    for (const node of nodes) {
      nodeMap.set(node.id, node);
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    // Build graph
    for (const node of nodes) {
      for (const dep of node.dependencies) {
        if (!nodeMap.has(dep)) {
          throw new DependencyError(
            `Plugin '${node.id}' depends on '${dep}' which is not available`
          );
        }
        
        graph.get(dep)!.push(node.id);
        inDegree.set(node.id, inDegree.get(node.id)! + 1);
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    // Find all nodes with no incoming edges
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Reduce in-degree of neighbors
      for (const neighbor of graph.get(current)!) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      const remaining = nodes
        .filter(n => !result.includes(n.id))
        .map(n => n.id);
      
      throw new DependencyError(
        `Circular dependency detected: ${remaining.join(', ')}`
      );
    }

    return result;
  }

  /**
   * Validate dependencies exist
   * 
   * @param node - Node to validate
   * @param availableIds - Set of available plugin IDs
   * @throws DependencyError if dependencies are missing
   */
  static validate(node: DependencyNode, availableIds: Set<string>): void {
    for (const dep of node.dependencies) {
      if (!availableIds.has(dep)) {
        throw new DependencyError(
          `Plugin '${node.id}' requires '${dep}' which is not available`
        );
      }
    }
  }

  /**
   * Build dependency graph from manifests
   * 
   * @param manifests - Plugin manifests
   * @returns Dependency graph nodes
   */
  static buildGraph(
    manifests: Array<{ id: string; dependencies?: Record<string, string> }>
  ): DependencyNode[] {
    return manifests.map(m => ({
      id: m.id,
      dependencies: m.dependencies ? Object.keys(m.dependencies) : []
    }));
  }
}
