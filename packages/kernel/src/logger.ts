/**
 * Logger Implementation
 * 
 * Provides structured logging that conforms to the @objectstack/spec/system Logger interface.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Record<string, any>;
    error?: Error;
}

/**
 * Logger interface
 */
export interface Logger {
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error | Record<string, any>): void;
}

/**
 * Console-based Logger implementation.
 */
export class ConsoleLogger implements Logger {
    private prefix: string;
    private minLevel: LogLevel;

    constructor(prefix: string = '', minLevel: LogLevel = 'info') {
        this.prefix = prefix;
        this.minLevel = minLevel;
    }

    debug(message: string, context?: Record<string, any>): void {
        if (this.shouldLog('debug')) {
            this.log('debug', message, context);
        }
    }

    info(message: string, context?: Record<string, any>): void {
        if (this.shouldLog('info')) {
            this.log('info', message, context);
        }
    }

    warn(message: string, context?: Record<string, any>): void {
        if (this.shouldLog('warn')) {
            this.log('warn', message, context);
        }
    }

    error(message: string, error?: Error | Record<string, any>): void {
        if (this.shouldLog('error')) {
            if (error instanceof Error) {
                this.log('error', message, { error: error.message, stack: error.stack });
            } else {
                this.log('error', message, error);
            }
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.minLevel);
    }

    private log(level: LogLevel, message: string, context?: Record<string, any>): void {
        const timestamp = new Date().toISOString();
        const prefixedMessage = this.prefix ? `[${this.prefix}] ${message}` : message;
        
        const logEntry: LogEntry = {
            level,
            message: prefixedMessage,
            timestamp: new Date(),
            context,
        };

        switch (level) {
            case 'debug':
                console.debug(`[${timestamp}] DEBUG: ${prefixedMessage}`, context || '');
                break;
            case 'info':
                console.info(`[${timestamp}] INFO: ${prefixedMessage}`, context || '');
                break;
            case 'warn':
                console.warn(`[${timestamp}] WARN: ${prefixedMessage}`, context || '');
                break;
            case 'error':
                console.error(`[${timestamp}] ERROR: ${prefixedMessage}`, context || '');
                break;
        }
    }
}

/**
 * Creates a logger instance for a plugin or component.
 */
export function createLogger(name: string, minLevel?: LogLevel): Logger {
    return new ConsoleLogger(name, minLevel);
}
