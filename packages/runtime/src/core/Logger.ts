/**
 * Logger Implementation
 * 
 * Provides logging functionality for plugins.
 */

import { Logger } from '../types';

export class LoggerImpl implements Logger {
  constructor(
    private name: string,
    private debugEnabled: boolean = false
  ) {}

  /**
   * Format log message with timestamp and context
   */
  private format(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const argsStr = args.length > 0 ? ' ' + JSON.stringify(args) : '';
    return `[${timestamp}] [${level}] [${this.name}] ${message}${argsStr}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.debugEnabled) {
      console.debug(this.format('DEBUG', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    console.info(this.format('INFO', message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.format('WARN', message, ...args));
  }

  error(message: string, error?: Error, ...args: any[]): void {
    const errorStr = error ? `\n${error.stack}` : '';
    console.error(this.format('ERROR', message, ...args) + errorStr);
  }
}
