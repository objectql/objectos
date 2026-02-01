#!/usr/bin/env node

/**
 * ObjectOS - Main Entry Point
 * 
 * This replaces the deprecated @objectos/server package.
 * Uses @objectstack/runtime as the microkernel.
 */

import 'reflect-metadata';
import { ObjectKernel } from '@objectstack/runtime';
import { ObjectQLPlugin, DriverPlugin } from '@objectstack/runtime';
import { createServerPlugin } from './plugin';

/**
 * Bootstrap the ObjectOS application
 */
async function bootstrap() {
  // Create kernel instance
  const kernel = new ObjectKernel();

  // Register core plugins
  kernel.use(DriverPlugin({
    driver: process.env.OBJECTQL_DRIVER || 'sqlite',
    connection: process.env.OBJECTQL_CONNECTION || 'objectos.db',
  }));

  kernel.use(ObjectQLPlugin({
    metadata: process.env.OBJECTQL_METADATA_PATH || './metadata',
  }));

  // Register server plugin
  kernel.use(createServerPlugin({
    port: Number(process.env.OBJECTQL_PORT) || 3000,
  }));

  // Bootstrap the kernel
  try {
    await kernel.bootstrap();
    console.log('ObjectOS started successfully');
  } catch (error) {
    console.error('Failed to start ObjectOS:', error);
    process.exit(1);
  }

  // Handle shutdown gracefully
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await kernel.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await kernel.shutdown();
    process.exit(0);
  });
}

// Run the bootstrap function
bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});
