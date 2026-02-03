/**
 * Tests for ServiceRegistry
 */

import { ServiceRegistryImpl } from '../core/ServiceRegistry';

describe('ServiceRegistry', () => {
  let registry: ServiceRegistryImpl;

  beforeEach(() => {
    registry = new ServiceRegistryImpl();
  });

  describe('register', () => {
    it('should register a service', () => {
      const service = { name: 'test' };
      registry.register('test', service);
      
      expect(registry.has('test')).toBe(true);
      expect(registry.get('test')).toBe(service);
    });

    it('should throw error if service already registered', () => {
      registry.register('test', {});
      
      expect(() => {
        registry.register('test', {});
      }).toThrow("Service 'test' is already registered");
    });
  });

  describe('get', () => {
    it('should return registered service', () => {
      const service = { name: 'test' };
      registry.register('test', service);
      
      expect(registry.get('test')).toBe(service);
    });

    it('should return undefined for non-existent service', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered service', () => {
      registry.register('test', {});
      expect(registry.has('test')).toBe(true);
    });

    it('should return false for non-existent service', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove a registered service', () => {
      registry.register('test', {});
      registry.unregister('test');
      
      expect(registry.has('test')).toBe(false);
    });
  });

  describe('list', () => {
    it('should return all service names', () => {
      registry.register('service1', {});
      registry.register('service2', {});
      registry.register('service3', {});
      
      const names = registry.list();
      expect(names).toHaveLength(3);
      expect(names).toContain('service1');
      expect(names).toContain('service2');
      expect(names).toContain('service3');
    });

    it('should return empty array when no services', () => {
      expect(registry.list()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all services', () => {
      registry.register('service1', {});
      registry.register('service2', {});
      
      registry.clear();
      
      expect(registry.list()).toEqual([]);
    });
  });
});
