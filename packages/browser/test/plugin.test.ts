/**
 * Browser Runtime Plugin Tests
 */

import { BrowserRuntimePlugin } from '../src/plugin';
import { SQLiteWASMDriver } from '../src/database/sqlite-wasm-driver';

describe('BrowserRuntimePlugin', () => {
  let plugin: BrowserRuntimePlugin;

  beforeEach(() => {
    plugin = new BrowserRuntimePlugin({
      database: {
        name: 'test.db',
        useOPFS: false // Disable OPFS for testing
      },
      serviceWorker: {
        enabled: false // Disable SW for testing
      },
      worker: {
        enabled: false // Disable worker for testing
      }
    });
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin name', () => {
      expect(plugin.name).toBe('com.objectos.browser-runtime');
    });

    it('should have correct version', () => {
      expect(plugin.version).toBe('0.1.0');
    });

    it('should have no dependencies', () => {
      expect(plugin.dependencies).toEqual([]);
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', () => {
      const customPlugin = new BrowserRuntimePlugin({
        database: {
          name: 'custom.db',
          useOPFS: true
        }
      });

      expect(customPlugin).toBeDefined();
    });

    it('should use default configuration when not provided', () => {
      const defaultPlugin = new BrowserRuntimePlugin();
      expect(defaultPlugin).toBeDefined();
    });
  });
});

describe('SQLiteWASMDriver', () => {
  let driver: SQLiteWASMDriver;

  beforeEach(() => {
    driver = new SQLiteWASMDriver({
      name: 'test.db',
      useOPFS: false
    });
  });

  afterEach(async () => {
    if (driver) {
      await driver.disconnect();
    }
  });

  describe('Initialization', () => {
    it('should create driver instance', () => {
      expect(driver).toBeDefined();
      expect(driver).toBeInstanceOf(SQLiteWASMDriver);
    });
  });

  // Note: Actual database tests would require a browser environment
  // These are placeholder tests that would need to be run in a browser context
});
