/**
 * Plugin Tests
 */

// Mock @objectql/core to avoid ES module issues
jest.mock('@objectql/core', () => ({
  ObjectQL: jest.fn().mockImplementation((config: any) => ({
    init: jest.fn().mockResolvedValue(undefined),
    config,
    initialized: false,
  })),
}));

import { ObjectKernel, ObjectQLPlugin, DriverPlugin } from '../src';

describe('ObjectQLPlugin', () => {
  let kernel: ObjectKernel;

  beforeEach(() => {
    kernel = new ObjectKernel();
  });

  afterEach(async () => {
    await kernel.shutdown();
  });

  it('should register ObjectQL service', async () => {
    kernel.use(new ObjectQLPlugin());
    await kernel.bootstrap();

    expect(kernel.hasService('objectql')).toBe(true);
    const ql = kernel.getService('objectql');
    expect(ql).toBeDefined();
  });

  it('should use custom ObjectQL instance', async () => {
    const { ObjectQL } = require('@objectql/core');
    const customQL = new ObjectQL({});
    
    kernel.use(new ObjectQLPlugin(customQL));
    await kernel.bootstrap();

    const ql = kernel.getService('objectql');
    expect(ql).toBe(customQL);
  });
});

describe('DriverPlugin', () => {
  let kernel: ObjectKernel;

  beforeEach(() => {
    kernel = new ObjectKernel();
  });

  afterEach(async () => {
    await kernel.shutdown();
  });

  it('should depend on ObjectQL plugin', () => {
    const mockDriver = {
      query: jest.fn(),
    };

    const plugin = new DriverPlugin(mockDriver, 'test');
    expect(plugin.dependencies).toContain('com.objectstack.engine.objectql');
  });

  it('should register driver with ObjectQL', async () => {
    const mockDriver = {
      query: jest.fn(),
    };

    kernel.use(new ObjectQLPlugin());
    kernel.use(new DriverPlugin(mockDriver, 'test'));
    
    await kernel.bootstrap();

    const ql = kernel.getService('objectql');
    expect((ql as any).datasources).toBeDefined();
    expect((ql as any).datasources.test).toBe(mockDriver);
  });

  it('should call connect on driver if available', async () => {
    const connectMock = jest.fn();
    const mockDriver = {
      query: jest.fn(),
      connect: connectMock,
    };

    kernel.use(new ObjectQLPlugin());
    kernel.use(new DriverPlugin(mockDriver, 'test'));
    
    await kernel.bootstrap();

    expect(connectMock).toHaveBeenCalled();
  });

  it('should call disconnect on driver during shutdown', async () => {
    const disconnectMock = jest.fn();
    const mockDriver = {
      query: jest.fn(),
      disconnect: disconnectMock,
    };

    kernel.use(new ObjectQLPlugin());
    kernel.use(new DriverPlugin(mockDriver, 'test'));
    
    await kernel.bootstrap();
    await kernel.shutdown();

    expect(disconnectMock).toHaveBeenCalled();
  });
});
