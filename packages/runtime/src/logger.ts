/**
 * @objectstack/runtime - Simple Console Logger
 */

import type { Logger } from './types';

export class ConsoleLogger implements Logger {
  constructor(private prefix: string = '') {}

  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG]${this.prefix ? ` [${this.prefix}]` : ''} ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(`[INFO]${this.prefix ? ` [${this.prefix}]` : ''} ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN]${this.prefix ? ` [${this.prefix}]` : ''} ${message}`, ...args);
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    console.error(`[ERROR]${this.prefix ? ` [${this.prefix}]` : ''} ${message}`, error, ...args);
  }
}

export function createLogger(prefix: string): Logger {
  return new ConsoleLogger(prefix);
}
