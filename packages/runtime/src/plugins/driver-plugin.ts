/**
 * @objectstack/runtime - DriverPlugin
 * 
 * Registers a database driver with ObjectQL.
 */

import type { Plugin, PluginContext } from '../types';
import type { ObjectQL } from '@objectql/core';

export class DriverPlugin implements Plugin {
  name: string;
  version = '1.0.0';
  dependencies = ['com.objectstack.engine.objectql'];

  private driver: any;
  private driverName: string;

  /**
   * Create a DriverPlugin.
   * 
   * @param driver - The database driver instance
   * @param driverName - Name for the driver (e.g., 'memory', 'postgres', 'mongodb')
   */
  constructor(driver: any, driverName: string = 'default') {
    this.driver = driver;
    this.driverName = driverName;
    this.name = `com.objectstack.driver.${driverName}`;
  }

  async init(ctx: PluginContext): Promise<void> {
    ctx.logger.info(`Initializing Driver plugin (${this.driverName})...`);
    
    // Get ObjectQL from service registry
    const ql = ctx.getService<ObjectQL>('objectql');
    
    // Register the driver
    (ql as any).datasources = (ql as any).datasources || {};
    (ql as any).datasources[this.driverName] = this.driver;
    
    ctx.logger.info(`Driver plugin (${this.driverName}) initialized`);
  }

  async start(ctx: PluginContext): Promise<void> {
    ctx.logger.info(`Starting Driver plugin (${this.driverName})...`);
    
    // Connect to database if needed
    if (this.driver.connect && typeof this.driver.connect === 'function') {
      await this.driver.connect();
    }
    
    ctx.logger.info(`Driver plugin (${this.driverName}) started`);
  }

  async destroy(): Promise<void> {
    // Disconnect from database if needed
    if (this.driver.disconnect && typeof this.driver.disconnect === 'function') {
      await this.driver.disconnect();
    }
  }
}
