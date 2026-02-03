/**
 * Service Registry Implementation
 * 
 * Provides dependency injection container for plugins.
 */

import { ServiceRegistry } from '../types';

export class ServiceRegistryImpl implements ServiceRegistry {
  private services = new Map<string, any>();

  /**
   * Register a service
   */
  register<T = any>(name: string, service: T): void {
    if (this.services.has(name)) {
      throw new Error(`Service '${name}' is already registered`);
    }
    this.services.set(name, service);
  }

  /**
   * Get a service
   */
  get<T = any>(name: string): T | undefined {
    return this.services.get(name);
  }

  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregister a service
   */
  unregister(name: string): void {
    this.services.delete(name);
  }

  /**
   * Get all service names
   */
  list(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
  }
}
