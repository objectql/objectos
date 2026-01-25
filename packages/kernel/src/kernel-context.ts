/**
 * Kernel Context Implementation
 * 
 * Implements the KernelContext interface from @objectstack/spec/kernel.
 * Provides static environment information available at boot time.
 */

import type { KernelContext } from '@objectstack/spec/kernel';
import { randomUUID } from 'crypto';

/**
 * Creates a KernelContext instance with default values.
 * 
 * @param options - Partial context options to override defaults
 * @returns Complete KernelContext instance
 */
export function createKernelContext(options: Partial<KernelContext> = {}): KernelContext {
    return {
        instanceId: options.instanceId || randomUUID(),
        mode: options.mode || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
        version: options.version || require('../../package.json').version,
        appName: options.appName,
        cwd: options.cwd || process.cwd(),
        workspaceRoot: options.workspaceRoot,
        startTime: options.startTime || Date.now(),
        features: options.features || {},
    };
}

/**
 * KernelContextManager
 * 
 * Manages the kernel context throughout the application lifecycle.
 */
export class KernelContextManager {
    private context: KernelContext;

    constructor(options: Partial<KernelContext> = {}) {
        this.context = createKernelContext(options);
    }

    /**
     * Get the current kernel context.
     */
    getContext(): KernelContext {
        return { ...this.context };
    }

    /**
     * Get the instance ID.
     */
    getInstanceId(): string {
        return this.context.instanceId;
    }

    /**
     * Get the runtime mode.
     */
    getMode(): KernelContext['mode'] {
        return this.context.mode;
    }

    /**
     * Check if a feature flag is enabled.
     */
    isFeatureEnabled(feature: string): boolean {
        return this.context.features[feature] === true;
    }

    /**
     * Enable a feature flag.
     */
    enableFeature(feature: string): void {
        this.context.features[feature] = true;
    }

    /**
     * Disable a feature flag.
     */
    disableFeature(feature: string): void {
        this.context.features[feature] = false;
    }

    /**
     * Get uptime in milliseconds.
     */
    getUptime(): number {
        return Date.now() - this.context.startTime;
    }
}
