/**
 * Tests for DependencyResolver
 */

import { DependencyResolver } from '../utils/DependencyResolver';
import { DependencyError } from '../types';

describe('DependencyResolver', () => {
  describe('resolve', () => {
    it('should resolve simple dependency chain', () => {
      const nodes = [
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: ['a'] },
        { id: 'c', dependencies: ['b'] }
      ];
      
      const result = DependencyResolver.resolve(nodes);
      
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should resolve complex dependency graph', () => {
      const nodes = [
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: ['a'] },
        { id: 'c', dependencies: ['a'] },
        { id: 'd', dependencies: ['b', 'c'] }
      ];
      
      const result = DependencyResolver.resolve(nodes);
      
      // 'a' must come first, 'd' must come last
      expect(result[0]).toBe('a');
      expect(result[3]).toBe('d');
      
      // 'b' and 'c' can be in any order, but both before 'd'
      const bIndex = result.indexOf('b');
      const cIndex = result.indexOf('c');
      const dIndex = result.indexOf('d');
      
      expect(bIndex).toBeLessThan(dIndex);
      expect(cIndex).toBeLessThan(dIndex);
    });

    it('should handle multiple independent chains', () => {
      const nodes = [
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: ['a'] },
        { id: 'x', dependencies: [] },
        { id: 'y', dependencies: ['x'] }
      ];
      
      const result = DependencyResolver.resolve(nodes);
      
      expect(result).toHaveLength(4);
      expect(result.indexOf('a')).toBeLessThan(result.indexOf('b'));
      expect(result.indexOf('x')).toBeLessThan(result.indexOf('y'));
    });

    it('should throw error on circular dependency', () => {
      const nodes = [
        { id: 'a', dependencies: ['b'] },
        { id: 'b', dependencies: ['a'] }
      ];
      
      expect(() => {
        DependencyResolver.resolve(nodes);
      }).toThrow(DependencyError);
    });

    it('should throw error on self-dependency', () => {
      const nodes = [
        { id: 'a', dependencies: ['a'] }
      ];
      
      expect(() => {
        DependencyResolver.resolve(nodes);
      }).toThrow(DependencyError);
    });

    it('should throw error on missing dependency', () => {
      const nodes = [
        { id: 'a', dependencies: ['nonexistent'] }
      ];
      
      expect(() => {
        DependencyResolver.resolve(nodes);
      }).toThrow(DependencyError);
    });
  });

  describe('buildGraph', () => {
    it('should build graph from manifests', () => {
      const manifests = [
        { id: 'a', dependencies: {} as Record<string, string> },
        { id: 'b', dependencies: { a: '^1.0.0' } },
        { id: 'c', dependencies: { b: '^1.0.0' } }
      ];
      
      const graph = DependencyResolver.buildGraph(manifests);
      
      expect(graph).toEqual([
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: ['a'] },
        { id: 'c', dependencies: ['b'] }
      ]);
    });

    it('should handle manifests without dependencies', () => {
      const manifests: Array<{ id: string; dependencies?: Record<string, string> }> = [
        { id: 'a' },
        { id: 'b' }
      ];
      
      const graph = DependencyResolver.buildGraph(manifests);
      
      expect(graph).toEqual([
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: [] }
      ]);
    });
  });
});
