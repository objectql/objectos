/**
 * @objectstack/runtime - ObjectQLPlugin
 * 
 * Registers the ObjectQL query engine as a service.
 */

import type { Plugin, PluginContext } from '../types';
import { ObjectQL } from '@objectql/core';

export class ObjectQLPlugin implements Plugin {
  name = 'com.objectstack.engine.objectql';
  version = '1.0.0';

  private ql: ObjectQL;

  /**
   * Create an ObjectQLPlugin.
   * 
   * @param ql - Optional custom ObjectQL instance. If not provided, creates a new one.
   */
  constructor(ql?: ObjectQL) {
    this.ql = ql || new ObjectQL({});
  }

  async init(ctx: PluginContext): Promise<void> {
    ctx.logger.info('Initializing ObjectQL plugin...');
    
    // Register ObjectQL instance as a service
    ctx.registerService('objectql', this.ql);
    
    ctx.logger.info('ObjectQL plugin initialized');
  }

  async start(ctx: PluginContext): Promise<void> {
    ctx.logger.info('Starting ObjectQL plugin...');
    
    // Initialize ObjectQL if not already initialized
    if (!(this.ql as any).initialized) {
      await this.ql.init();
    }
    
    ctx.logger.info('ObjectQL plugin started');
  }

  async destroy(): Promise<void> {
    // Cleanup if needed
  }
}
