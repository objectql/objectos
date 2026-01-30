/**
 * Optimized Service Registry
 * 
 * High-performance service registry with O(1) lookups using Map-based indexing.
 * Supports service registration, discovery, and lifecycle management.
 */

import { Logger, createLogger } from './logger';

/**
 * Service metadata
 */
export interface ServiceMetadata {
    /** Service ID */
    id: string;
    /** Service name */
    name: string;
    /** Service version */
    version?: string;
    /** Service type */
    type: string;
    /** Plugin that provides this service */
    providedBy: string;
    /** Service implementation */
    implementation: any;
    /** Service tags for categorization */
    tags?: string[];
    /** Service dependencies */
    dependencies?: string[];
    /** Service metadata */
    metadata?: Record<string, any>;
    /** Registration timestamp */
    registeredAt: Date;
}

/**
 * Service query options
 */
export interface ServiceQueryOptions {
    /** Service type filter */
    type?: string;
    /** Provider plugin filter */
    providedBy?: string;
    /** Tag filter */
    tags?: string[];
    /** Version constraint */
    version?: string;
}

/**
 * Optimized Service Registry
 * 
 * Fast service lookup using multiple indexes for O(1) access.
 */
export class OptimizedRegistry {
    private logger: Logger;
    
    // Primary index: service ID -> service metadata
    private services: Map<string, ServiceMetadata> = new Map();
    
    // Secondary indexes for fast lookups
    private byType: Map<string, Set<string>> = new Map();
    private byProvider: Map<string, Set<string>> = new Map();
    private byTag: Map<string, Set<string>> = new Map();
    private byName: Map<string, Set<string>> = new Map();
    
    // Performance counters
    private lookupCount: number = 0;
    private registrationCount: number = 0;

    constructor() {
        this.logger = createLogger('OptimizedRegistry');
    }

    /**
     * Register a service
     * O(1) operation
     */
    register(service: Omit<ServiceMetadata, 'registeredAt'>): void {
        const metadata: ServiceMetadata = {
            ...service,
            registeredAt: new Date(),
        };

        // Check for duplicate
        if (this.services.has(metadata.id)) {
            this.logger.warn(`Service '${metadata.id}' is already registered, replacing`);
            this.unregister(metadata.id);
        }

        // Add to primary index
        this.services.set(metadata.id, metadata);

        // Add to secondary indexes
        this.addToIndex(this.byType, metadata.type, metadata.id);
        this.addToIndex(this.byProvider, metadata.providedBy, metadata.id);
        this.addToIndex(this.byName, metadata.name, metadata.id);

        if (metadata.tags) {
            for (const tag of metadata.tags) {
                this.addToIndex(this.byTag, tag, metadata.id);
            }
        }

        this.registrationCount++;
        this.logger.debug(`Registered service: ${metadata.id} (${metadata.type})`);
    }

    /**
     * Unregister a service
     * O(1) operation
     */
    unregister(serviceId: string): boolean {
        const service = this.services.get(serviceId);
        if (!service) {
            this.logger.warn(`Service '${serviceId}' not found`);
            return false;
        }

        // Remove from primary index
        this.services.delete(serviceId);

        // Remove from secondary indexes
        this.removeFromIndex(this.byType, service.type, serviceId);
        this.removeFromIndex(this.byProvider, service.providedBy, serviceId);
        this.removeFromIndex(this.byName, service.name, serviceId);

        if (service.tags) {
            for (const tag of service.tags) {
                this.removeFromIndex(this.byTag, tag, serviceId);
            }
        }

        this.logger.debug(`Unregistered service: ${serviceId}`);
        return true;
    }

    /**
     * Get a service by ID
     * O(1) operation
     */
    get(serviceId: string): ServiceMetadata | undefined {
        this.lookupCount++;
        return this.services.get(serviceId);
    }

    /**
     * Get service implementation
     * O(1) operation
     */
    getImplementation<T = any>(serviceId: string): T | undefined {
        this.lookupCount++;
        const service = this.services.get(serviceId);
        return service?.implementation as T | undefined;
    }

    /**
     * Check if a service exists
     * O(1) operation
     */
    has(serviceId: string): boolean {
        this.lookupCount++;
        return this.services.has(serviceId);
    }

    /**
     * Find services by type
     * O(1) index lookup + O(n) filtering
     */
    findByType(type: string): ServiceMetadata[] {
        this.lookupCount++;
        const serviceIds = this.byType.get(type);
        
        if (!serviceIds) {
            return [];
        }

        return Array.from(serviceIds)
            .map(id => this.services.get(id))
            .filter((s): s is ServiceMetadata => s !== undefined);
    }

    /**
     * Find services by provider
     * O(1) index lookup + O(n) filtering
     */
    findByProvider(providerId: string): ServiceMetadata[] {
        this.lookupCount++;
        const serviceIds = this.byProvider.get(providerId);
        
        if (!serviceIds) {
            return [];
        }

        return Array.from(serviceIds)
            .map(id => this.services.get(id))
            .filter((s): s is ServiceMetadata => s !== undefined);
    }

    /**
     * Find services by tag
     * O(1) index lookup + O(n) filtering
     */
    findByTag(tag: string): ServiceMetadata[] {
        this.lookupCount++;
        const serviceIds = this.byTag.get(tag);
        
        if (!serviceIds) {
            return [];
        }

        return Array.from(serviceIds)
            .map(id => this.services.get(id))
            .filter((s): s is ServiceMetadata => s !== undefined);
    }

    /**
     * Find services by name
     * O(1) index lookup + O(n) filtering
     */
    findByName(name: string): ServiceMetadata[] {
        this.lookupCount++;
        const serviceIds = this.byName.get(name);
        
        if (!serviceIds) {
            return [];
        }

        return Array.from(serviceIds)
            .map(id => this.services.get(id))
            .filter((s): s is ServiceMetadata => s !== undefined);
    }

    /**
     * Query services with multiple filters
     * Uses indexes to minimize iteration
     */
    query(options: ServiceQueryOptions): ServiceMetadata[] {
        this.lookupCount++;

        // Start with all services or filtered by fastest index
        let candidates: Set<string>;

        if (options.type) {
            candidates = this.byType.get(options.type) || new Set();
        } else if (options.providedBy) {
            candidates = this.byProvider.get(options.providedBy) || new Set();
        } else if (options.tags && options.tags.length > 0) {
            // Use tag with fewest services
            candidates = this.getSmallestTagSet(options.tags);
        } else {
            candidates = new Set(this.services.keys());
        }

        // Filter candidates
        const results: ServiceMetadata[] = [];

        for (const serviceId of candidates) {
            const service = this.services.get(serviceId);
            if (!service) continue;

            // Apply filters
            if (options.type && service.type !== options.type) continue;
            if (options.providedBy && service.providedBy !== options.providedBy) continue;
            
            if (options.tags && options.tags.length > 0) {
                const serviceTags = new Set(service.tags || []);
                const hasAllTags = options.tags.every(tag => serviceTags.has(tag));
                if (!hasAllTags) continue;
            }

            // Version filtering would go here if implemented
            
            results.push(service);
        }

        return results;
    }

    /**
     * Get all services
     */
    getAll(): ServiceMetadata[] {
        return Array.from(this.services.values());
    }

    /**
     * Get all service types
     */
    getTypes(): string[] {
        return Array.from(this.byType.keys());
    }

    /**
     * Get all tags
     */
    getTags(): string[] {
        return Array.from(this.byTag.keys());
    }

    /**
     * Get registry statistics
     */
    getStats(): {
        totalServices: number;
        totalTypes: number;
        totalProviders: number;
        totalTags: number;
        lookupCount: number;
        registrationCount: number;
    } {
        return {
            totalServices: this.services.size,
            totalTypes: this.byType.size,
            totalProviders: this.byProvider.size,
            totalTags: this.byTag.size,
            lookupCount: this.lookupCount,
            registrationCount: this.registrationCount,
        };
    }

    /**
     * Clear all services
     */
    clear(): void {
        this.services.clear();
        this.byType.clear();
        this.byProvider.clear();
        this.byTag.clear();
        this.byName.clear();
        this.lookupCount = 0;
        this.registrationCount = 0;
        this.logger.debug('Cleared service registry');
    }

    /**
     * Batch register services
     */
    registerBatch(services: Array<Omit<ServiceMetadata, 'registeredAt'>>): void {
        for (const service of services) {
            this.register(service);
        }
        this.logger.info(`Batch registered ${services.length} services`);
    }

    /**
     * Batch unregister services
     */
    unregisterBatch(serviceIds: string[]): number {
        let count = 0;
        for (const id of serviceIds) {
            if (this.unregister(id)) {
                count++;
            }
        }
        this.logger.info(`Batch unregistered ${count} services`);
        return count;
    }

    /**
     * Add to index
     */
    private addToIndex(index: Map<string, Set<string>>, key: string, value: string): void {
        if (!index.has(key)) {
            index.set(key, new Set());
        }
        index.get(key)!.add(value);
    }

    /**
     * Remove from index
     */
    private removeFromIndex(index: Map<string, Set<string>>, key: string, value: string): void {
        const set = index.get(key);
        if (set) {
            set.delete(value);
            if (set.size === 0) {
                index.delete(key);
            }
        }
    }

    /**
     * Get smallest tag set for optimization
     */
    private getSmallestTagSet(tags: string[]): Set<string> {
        let smallest: Set<string> | undefined;
        let smallestSize = Infinity;

        for (const tag of tags) {
            const set = this.byTag.get(tag);
            if (set && set.size < smallestSize) {
                smallest = set;
                smallestSize = set.size;
            }
        }

        return smallest || new Set();
    }
}
