/**
 * Error Handler
 * 
 * Provides structured error handling with error classification,
 * recovery strategies, and detailed error reporting.
 */

import { Logger, createLogger } from './logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
    VALIDATION = 'validation',
    DEPENDENCY = 'dependency',
    LIFECYCLE = 'lifecycle',
    RUNTIME = 'runtime',
    PERMISSION = 'permission',
    NETWORK = 'network',
    TIMEOUT = 'timeout',
    UNKNOWN = 'unknown',
}

/**
 * Error recovery strategy
 */
export enum RecoveryStrategy {
    NONE = 'none',
    RETRY = 'retry',
    ROLLBACK = 'rollback',
    DISABLE_PLUGIN = 'disable_plugin',
    RESTART = 'restart',
}

/**
 * Structured error information
 */
export interface ErrorInfo {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Error severity */
    severity: ErrorSeverity;
    /** Error category */
    category: ErrorCategory;
    /** Suggested recovery strategy */
    recovery: RecoveryStrategy;
    /** Plugin ID if error is plugin-related */
    pluginId?: string;
    /** Original error */
    original?: Error;
    /** Additional context */
    context?: Record<string, any>;
    /** Stack trace */
    stack?: string;
    /** Timestamp */
    timestamp: Date;
}

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
    /** Whether to automatically retry on recoverable errors */
    autoRetry?: boolean;
    /** Maximum retry attempts */
    maxRetries?: number;
    /** Retry delay in milliseconds */
    retryDelay?: number;
    /** Whether to log errors */
    logErrors?: boolean;
}

/**
 * Structured Error class
 */
export class StructuredError extends Error {
    public readonly code: string;
    public readonly severity: ErrorSeverity;
    public readonly category: ErrorCategory;
    public readonly recovery: RecoveryStrategy;
    public readonly pluginId?: string;
    public readonly context?: Record<string, any>;
    public readonly timestamp: Date;

    constructor(info: Partial<ErrorInfo> & { message: string }) {
        super(info.message);
        this.name = 'StructuredError';
        this.code = info.code || 'UNKNOWN_ERROR';
        this.severity = info.severity || ErrorSeverity.MEDIUM;
        this.category = info.category || ErrorCategory.UNKNOWN;
        this.recovery = info.recovery || RecoveryStrategy.NONE;
        this.pluginId = info.pluginId;
        this.context = info.context;
        this.timestamp = info.timestamp || new Date();

        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StructuredError);
        }
    }

    toJSON(): ErrorInfo {
        return {
            code: this.code,
            message: this.message,
            severity: this.severity,
            category: this.category,
            recovery: this.recovery,
            pluginId: this.pluginId,
            context: this.context,
            stack: this.stack,
            timestamp: this.timestamp,
        };
    }
}

/**
 * Error Handler
 * 
 * Handles errors with classification, logging, and recovery suggestions.
 */
export class ErrorHandler {
    private logger: Logger;
    private options: Required<ErrorHandlerOptions>;
    private errorLog: ErrorInfo[] = [];
    private errorCallbacks: Set<(error: ErrorInfo) => void> = new Set();
    private maxLogSize: number = 1000;

    constructor(options?: ErrorHandlerOptions) {
        this.logger = createLogger('ErrorHandler');
        this.options = {
            autoRetry: options?.autoRetry ?? false,
            maxRetries: options?.maxRetries ?? 3,
            retryDelay: options?.retryDelay ?? 1000,
            logErrors: options?.logErrors ?? true,
        };
    }

    /**
     * Handle an error
     */
    handle(error: Error | StructuredError, context?: Record<string, any>): ErrorInfo {
        let errorInfo: ErrorInfo;

        if (error instanceof StructuredError) {
            errorInfo = error.toJSON();
            if (context) {
                errorInfo.context = { ...errorInfo.context, ...context };
            }
        } else {
            errorInfo = this.classifyError(error, context);
        }

        // Log error
        if (this.options.logErrors) {
            this.logError(errorInfo);
        }

        // Store in error log
        this.storeError(errorInfo);

        // Notify callbacks
        this.notifyCallbacks(errorInfo);

        return errorInfo;
    }

    /**
     * Classify an error
     */
    private classifyError(error: Error, context?: Record<string, any>): ErrorInfo {
        let category = ErrorCategory.UNKNOWN;
        let severity = ErrorSeverity.MEDIUM;
        let recovery = RecoveryStrategy.NONE;
        let code = 'UNKNOWN_ERROR';

        // Classify based on error message and type
        const message = error.message.toLowerCase();

        if (message.includes('validation') || message.includes('invalid')) {
            category = ErrorCategory.VALIDATION;
            severity = ErrorSeverity.LOW;
            code = 'VALIDATION_ERROR';
        } else if (message.includes('dependency') || message.includes('missing')) {
            category = ErrorCategory.DEPENDENCY;
            severity = ErrorSeverity.HIGH;
            recovery = RecoveryStrategy.RETRY;
            code = 'DEPENDENCY_ERROR';
        } else if (message.includes('timeout')) {
            category = ErrorCategory.TIMEOUT;
            severity = ErrorSeverity.MEDIUM;
            recovery = RecoveryStrategy.RETRY;
            code = 'TIMEOUT_ERROR';
        } else if (message.includes('permission') || message.includes('forbidden')) {
            category = ErrorCategory.PERMISSION;
            severity = ErrorSeverity.MEDIUM;
            code = 'PERMISSION_ERROR';
        } else if (message.includes('network') || message.includes('fetch')) {
            category = ErrorCategory.NETWORK;
            severity = ErrorSeverity.MEDIUM;
            recovery = RecoveryStrategy.RETRY;
            code = 'NETWORK_ERROR';
        } else if (message.includes('lifecycle') || message.includes('init')) {
            category = ErrorCategory.LIFECYCLE;
            severity = ErrorSeverity.HIGH;
            recovery = RecoveryStrategy.ROLLBACK;
            code = 'LIFECYCLE_ERROR';
        }

        return {
            code,
            message: error.message,
            severity,
            category,
            recovery,
            original: error,
            context,
            stack: error.stack,
            timestamp: new Date(),
        };
    }

    /**
     * Log error based on severity
     */
    private logError(info: ErrorInfo): void {
        const prefix = info.pluginId ? `[Plugin: ${info.pluginId}]` : '';
        const message = `${prefix} [${info.category}] ${info.message}`;

        switch (info.severity) {
            case ErrorSeverity.CRITICAL:
                this.logger.error(message, info.original || new Error(info.message));
                break;
            case ErrorSeverity.HIGH:
                this.logger.error(message, info.original || new Error(info.message));
                break;
            case ErrorSeverity.MEDIUM:
                this.logger.warn(message);
                break;
            case ErrorSeverity.LOW:
                this.logger.debug(message);
                break;
        }
    }

    /**
     * Store error in log
     */
    private storeError(info: ErrorInfo): void {
        this.errorLog.push(info);

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
    }

    /**
     * Notify error callbacks
     */
    private notifyCallbacks(info: ErrorInfo): void {
        for (const callback of this.errorCallbacks) {
            try {
                callback(info);
            } catch (error) {
                this.logger.error('Error in error callback', error as Error);
            }
        }
    }

    /**
     * Execute function with error handling and retry
     */
    async withRetry<T>(
        fn: () => Promise<T>,
        options?: {
            maxRetries?: number;
            retryDelay?: number;
            onRetry?: (attempt: number, error: Error) => void;
        }
    ): Promise<T> {
        const maxRetries = options?.maxRetries ?? this.options.maxRetries;
        const retryDelay = options?.retryDelay ?? this.options.retryDelay;

        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;

                if (attempt < maxRetries) {
                    this.logger.debug(`Retry attempt ${attempt + 1}/${maxRetries} after error: ${lastError.message}`);
                    
                    if (options?.onRetry) {
                        options.onRetry(attempt + 1, lastError);
                    }

                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    this.logger.error(`All ${maxRetries} retry attempts failed`);
                }
            }
        }

        throw lastError;
    }

    /**
     * Create a structured error
     */
    createError(
        message: string,
        options?: Partial<Omit<ErrorInfo, 'message' | 'timestamp'>>
    ): StructuredError {
        return new StructuredError({
            message,
            ...options,
        });
    }

    /**
     * Register error callback
     */
    onError(callback: (error: ErrorInfo) => void): void {
        this.errorCallbacks.add(callback);
    }

    /**
     * Unregister error callback
     */
    offError(callback: (error: ErrorInfo) => void): void {
        this.errorCallbacks.delete(callback);
    }

    /**
     * Get error log
     */
    getErrorLog(options?: {
        category?: ErrorCategory;
        severity?: ErrorSeverity;
        pluginId?: string;
        limit?: number;
    }): ErrorInfo[] {
        let filtered = [...this.errorLog];

        if (options?.category) {
            filtered = filtered.filter(e => e.category === options.category);
        }

        if (options?.severity) {
            filtered = filtered.filter(e => e.severity === options.severity);
        }

        if (options?.pluginId) {
            filtered = filtered.filter(e => e.pluginId === options.pluginId);
        }

        if (options?.limit) {
            filtered = filtered.slice(-options.limit);
        }

        return filtered;
    }

    /**
     * Get error statistics
     */
    getStats(): {
        total: number;
        byCategory: Record<ErrorCategory, number>;
        bySeverity: Record<ErrorSeverity, number>;
    } {
        const stats = {
            total: this.errorLog.length,
            byCategory: {} as Record<ErrorCategory, number>,
            bySeverity: {} as Record<ErrorSeverity, number>,
        };

        // Initialize counters
        for (const category of Object.values(ErrorCategory)) {
            stats.byCategory[category] = 0;
        }
        for (const severity of Object.values(ErrorSeverity)) {
            stats.bySeverity[severity] = 0;
        }

        // Count errors
        for (const error of this.errorLog) {
            stats.byCategory[error.category]++;
            stats.bySeverity[error.severity]++;
        }

        return stats;
    }

    /**
     * Clear error log
     */
    clearLog(): void {
        this.errorLog = [];
        this.logger.debug('Cleared error log');
    }
}
