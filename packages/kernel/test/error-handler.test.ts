/**
 * Error Handler Tests
 */

import {
    ErrorHandler,
    StructuredError,
    ErrorSeverity,
    ErrorCategory,
    RecoveryStrategy,
    ErrorInfo,
} from '../src/error-handler';

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;

    beforeEach(() => {
        errorHandler = new ErrorHandler({ logErrors: false });
    });

    describe('Error Handling and Classification', () => {
        it('should handle a basic error', () => {
            const error = new Error('Test error');
            const result = errorHandler.handle(error);

            expect(result).toMatchObject({
                message: 'Test error',
                category: ErrorCategory.UNKNOWN,
                severity: ErrorSeverity.MEDIUM,
                recovery: RecoveryStrategy.NONE,
            });
            expect(result.timestamp).toBeInstanceOf(Date);
        });

        it('should classify validation errors', () => {
            const error = new Error('Validation failed: invalid input');
            const result = errorHandler.handle(error);

            expect(result.category).toBe(ErrorCategory.VALIDATION);
            expect(result.severity).toBe(ErrorSeverity.LOW);
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        it('should classify dependency errors', () => {
            const error = new Error('Dependency missing: required module not found');
            const result = errorHandler.handle(error);

            expect(result.category).toBe(ErrorCategory.DEPENDENCY);
            expect(result.severity).toBe(ErrorSeverity.HIGH);
            expect(result.recovery).toBe(RecoveryStrategy.RETRY);
            expect(result.code).toBe('DEPENDENCY_ERROR');
        });

        it('should classify timeout errors', () => {
            const error = new Error('Operation timeout after 30s');
            const result = errorHandler.handle(error);

            expect(result.category).toBe(ErrorCategory.TIMEOUT);
            expect(result.severity).toBe(ErrorSeverity.MEDIUM);
            expect(result.recovery).toBe(RecoveryStrategy.RETRY);
            expect(result.code).toBe('TIMEOUT_ERROR');
        });

        it('should classify permission errors', () => {
            const error = new Error('Permission denied: forbidden access');
            const result = errorHandler.handle(error);

            expect(result.category).toBe(ErrorCategory.PERMISSION);
            expect(result.severity).toBe(ErrorSeverity.MEDIUM);
            expect(result.code).toBe('PERMISSION_ERROR');
        });

        it('should classify network errors', () => {
            const error = new Error('Network connection failed');
            const result = errorHandler.handle(error);

            expect(result.category).toBe(ErrorCategory.NETWORK);
            expect(result.severity).toBe(ErrorSeverity.MEDIUM);
            expect(result.recovery).toBe(RecoveryStrategy.RETRY);
            expect(result.code).toBe('NETWORK_ERROR');
        });

        it('should classify lifecycle errors', () => {
            const error = new Error('Plugin initialization failed');
            const result = errorHandler.handle(error);

            expect(result.category).toBe(ErrorCategory.LIFECYCLE);
            expect(result.severity).toBe(ErrorSeverity.HIGH);
            expect(result.recovery).toBe(RecoveryStrategy.ROLLBACK);
            expect(result.code).toBe('LIFECYCLE_ERROR');
        });

        it('should handle error with context', () => {
            const error = new Error('Test error');
            const context = { pluginId: 'test-plugin', userId: '123' };
            const result = errorHandler.handle(error, context);

            expect(result.context).toEqual(context);
        });

        it('should capture stack trace', () => {
            const error = new Error('Test error');
            const result = errorHandler.handle(error);

            expect(result.stack).toBeDefined();
            expect(typeof result.stack).toBe('string');
        });
    });

    describe('Structured Error Creation', () => {
        it('should create structured error with default values', () => {
            const error = new StructuredError({ message: 'Test error' });

            expect(error.message).toBe('Test error');
            expect(error.code).toBe('UNKNOWN_ERROR');
            expect(error.severity).toBe(ErrorSeverity.MEDIUM);
            expect(error.category).toBe(ErrorCategory.UNKNOWN);
            expect(error.recovery).toBe(RecoveryStrategy.NONE);
        });

        it('should create structured error with custom values', () => {
            const error = new StructuredError({
                message: 'Custom error',
                code: 'CUSTOM_ERROR',
                severity: ErrorSeverity.CRITICAL,
                category: ErrorCategory.RUNTIME,
                recovery: RecoveryStrategy.RESTART,
                pluginId: 'test-plugin',
            });

            expect(error.code).toBe('CUSTOM_ERROR');
            expect(error.severity).toBe(ErrorSeverity.CRITICAL);
            expect(error.category).toBe(ErrorCategory.RUNTIME);
            expect(error.recovery).toBe(RecoveryStrategy.RESTART);
            expect(error.pluginId).toBe('test-plugin');
        });

        it('should convert structured error to JSON', () => {
            const error = new StructuredError({
                message: 'Test error',
                code: 'TEST_ERROR',
                context: { key: 'value' },
            });

            const json = error.toJSON();

            expect(json).toMatchObject({
                message: 'Test error',
                code: 'TEST_ERROR',
                context: { key: 'value' },
            });
            expect(json.timestamp).toBeInstanceOf(Date);
        });

        it('should handle structured error in handler', () => {
            const structuredError = new StructuredError({
                message: 'Structured test',
                code: 'STRUCT_ERROR',
                severity: ErrorSeverity.HIGH,
                category: ErrorCategory.RUNTIME,
            });

            const result = errorHandler.handle(structuredError);

            expect(result.code).toBe('STRUCT_ERROR');
            expect(result.severity).toBe(ErrorSeverity.HIGH);
            expect(result.category).toBe(ErrorCategory.RUNTIME);
        });

        it('should merge context in structured error', () => {
            const structuredError = new StructuredError({
                message: 'Test',
                context: { original: 'data' },
            });

            const result = errorHandler.handle(structuredError, { additional: 'context' });

            expect(result.context).toEqual({
                original: 'data',
                additional: 'context',
            });
        });

        it('should use createError helper', () => {
            const error = errorHandler.createError('Helper error', {
                code: 'HELPER_ERROR',
                severity: ErrorSeverity.LOW,
            });

            expect(error).toBeInstanceOf(StructuredError);
            expect(error.message).toBe('Helper error');
            expect(error.code).toBe('HELPER_ERROR');
            expect(error.severity).toBe(ErrorSeverity.LOW);
        });
    });

    describe('Error Logging at Different Severity Levels', () => {
        it('should log critical errors with error level', () => {
            const handlerWithLogging = new ErrorHandler({ logErrors: true });
            const error = new StructuredError({
                message: 'Critical error',
                severity: ErrorSeverity.CRITICAL,
            });

            // Should not throw
            handlerWithLogging.handle(error);
        });

        it('should log high severity errors with error level', () => {
            const handlerWithLogging = new ErrorHandler({ logErrors: true });
            const error = new StructuredError({
                message: 'High severity error',
                severity: ErrorSeverity.HIGH,
            });

            handlerWithLogging.handle(error);
        });

        it('should log medium severity errors with warn level', () => {
            const handlerWithLogging = new ErrorHandler({ logErrors: true });
            const error = new StructuredError({
                message: 'Medium severity error',
                severity: ErrorSeverity.MEDIUM,
            });

            handlerWithLogging.handle(error);
        });

        it('should log low severity errors with debug level', () => {
            const handlerWithLogging = new ErrorHandler({ logErrors: true });
            const error = new StructuredError({
                message: 'Low severity error',
                severity: ErrorSeverity.LOW,
            });

            handlerWithLogging.handle(error);
        });

        it('should include plugin ID in log prefix', () => {
            const handlerWithLogging = new ErrorHandler({ logErrors: true });
            const error = new StructuredError({
                message: 'Plugin error',
                pluginId: 'test-plugin',
            });

            handlerWithLogging.handle(error);
        });

        it('should not log when logErrors is false', () => {
            const error = new Error('Test error');
            
            // Should handle without logging
            errorHandler.handle(error);
        });
    });

    describe('Error Callbacks', () => {
        it('should call registered callback on error', () => {
            const callback = jest.fn();
            errorHandler.onError(callback);

            const error = new Error('Test error');
            errorHandler.handle(error);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Test error',
                })
            );
        });

        it('should call multiple callbacks', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            errorHandler.onError(callback1);
            errorHandler.onError(callback2);

            const error = new Error('Test error');
            errorHandler.handle(error);

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should remove callbacks', () => {
            const callback = jest.fn();
            errorHandler.onError(callback);
            errorHandler.offError(callback);

            const error = new Error('Test error');
            errorHandler.handle(error);

            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle callback errors gracefully', () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Callback error');
            });
            const successCallback = jest.fn();

            errorHandler.onError(errorCallback);
            errorHandler.onError(successCallback);

            const error = new Error('Test error');
            errorHandler.handle(error);

            // Both should be called despite error
            expect(errorCallback).toHaveBeenCalled();
            expect(successCallback).toHaveBeenCalled();
        });

        it('should pass error info to callbacks', () => {
            let receivedError: ErrorInfo | undefined;
            errorHandler.onError((error) => {
                receivedError = error;
            });

            const error = new Error('Test error');
            errorHandler.handle(error);

            expect(receivedError).toBeDefined();
            if (receivedError) {
                expect(receivedError.message).toBe('Test error');
            }
        });
    });

    describe('Retry Mechanism', () => {
        it('should execute function without retry on success', async () => {
            const fn = jest.fn().mockResolvedValue('success');

            const result = await errorHandler.withRetry(fn);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce(new Error('Attempt 1 failed'))
                .mockRejectedValueOnce(new Error('Attempt 2 failed'))
                .mockResolvedValue('success');

            const result = await errorHandler.withRetry(fn, { maxRetries: 3 });

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should throw after max retries', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

            await expect(
                errorHandler.withRetry(fn, { maxRetries: 2 })
            ).rejects.toThrow('Always fails');

            expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
        });

        it('should use default max retries from constructor', async () => {
            const handlerWithRetries = new ErrorHandler({ maxRetries: 5, retryDelay: 10 });
            const fn = jest.fn().mockRejectedValue(new Error('Fails'));

            await expect(handlerWithRetries.withRetry(fn)).rejects.toThrow('Fails');

            expect(fn).toHaveBeenCalledTimes(6); // initial + 5 retries
        }, 10000);

        it('should wait between retries', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockResolvedValue('success');

            const startTime = Date.now();
            await errorHandler.withRetry(fn, { maxRetries: 2, retryDelay: 100 });
            const duration = Date.now() - startTime;

            expect(duration).toBeGreaterThanOrEqual(100);
        });

        it('should call onRetry callback', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockResolvedValue('success');

            const onRetry = jest.fn();

            await errorHandler.withRetry(fn, { maxRetries: 3, onRetry });

            expect(onRetry).toHaveBeenCalledTimes(2);
            expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error));
            expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error));
        });

        it('should handle async functions', async () => {
            const fn = jest.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'async success';
            });

            const result = await errorHandler.withRetry(fn);

            expect(result).toBe('async success');
        });

        it('should use custom retry delay', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce(new Error('Fail'))
                .mockResolvedValue('success');

            const startTime = Date.now();
            await errorHandler.withRetry(fn, { retryDelay: 50 });
            const duration = Date.now() - startTime;

            expect(duration).toBeGreaterThanOrEqual(50);
        });
    });

    describe('Error Statistics', () => {
        it('should track total errors', () => {
            errorHandler.handle(new Error('Error 1'));
            errorHandler.handle(new Error('Error 2'));
            errorHandler.handle(new Error('Error 3'));

            const stats = errorHandler.getStats();
            expect(stats.total).toBe(3);
        });

        it('should count errors by category', () => {
            errorHandler.handle(new Error('Validation error'));
            errorHandler.handle(new Error('Another validation issue'));
            errorHandler.handle(new Error('Timeout error'));

            const stats = errorHandler.getStats();
            expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(2);
            expect(stats.byCategory[ErrorCategory.TIMEOUT]).toBe(1);
        });

        it('should count errors by severity', () => {
            errorHandler.handle(new StructuredError({
                message: 'Critical',
                severity: ErrorSeverity.CRITICAL,
            }));
            errorHandler.handle(new StructuredError({
                message: 'High',
                severity: ErrorSeverity.HIGH,
            }));
            errorHandler.handle(new StructuredError({
                message: 'High 2',
                severity: ErrorSeverity.HIGH,
            }));

            const stats = errorHandler.getStats();
            expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
            expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(2);
        });

        it('should initialize all categories and severities to 0', () => {
            const stats = errorHandler.getStats();

            for (const category of Object.values(ErrorCategory)) {
                expect(stats.byCategory[category]).toBe(0);
            }

            for (const severity of Object.values(ErrorSeverity)) {
                expect(stats.bySeverity[severity]).toBe(0);
            }
        });

        it('should maintain accurate counts', () => {
            for (let i = 0; i < 10; i++) {
                errorHandler.handle(new Error('Validation error'));
            }

            const stats = errorHandler.getStats();
            expect(stats.total).toBe(10);
            expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(10);
        });
    });

    describe('Error Log Filtering', () => {
        beforeEach(() => {
            errorHandler.handle(new StructuredError({
                message: 'Validation 1',
                category: ErrorCategory.VALIDATION,
                severity: ErrorSeverity.LOW,
                pluginId: 'plugin-1',
            }));
            errorHandler.handle(new StructuredError({
                message: 'Timeout 1',
                category: ErrorCategory.TIMEOUT,
                severity: ErrorSeverity.MEDIUM,
                pluginId: 'plugin-1',
            }));
            errorHandler.handle(new StructuredError({
                message: 'Network 1',
                category: ErrorCategory.NETWORK,
                severity: ErrorSeverity.HIGH,
                pluginId: 'plugin-2',
            }));
        });

        it('should get all errors without filter', () => {
            const errors = errorHandler.getErrorLog();
            expect(errors.length).toBe(3);
        });

        it('should filter by category', () => {
            const errors = errorHandler.getErrorLog({ category: ErrorCategory.VALIDATION });
            expect(errors.length).toBe(1);
            expect(errors[0].category).toBe(ErrorCategory.VALIDATION);
        });

        it('should filter by severity', () => {
            const errors = errorHandler.getErrorLog({ severity: ErrorSeverity.MEDIUM });
            expect(errors.length).toBe(1);
            expect(errors[0].severity).toBe(ErrorSeverity.MEDIUM);
        });

        it('should filter by plugin ID', () => {
            const errors = errorHandler.getErrorLog({ pluginId: 'plugin-1' });
            expect(errors.length).toBe(2);
            expect(errors.every(e => e.pluginId === 'plugin-1')).toBe(true);
        });

        it('should limit results', () => {
            const errors = errorHandler.getErrorLog({ limit: 2 });
            expect(errors.length).toBe(2);
        });

        it('should combine filters', () => {
            const errors = errorHandler.getErrorLog({
                category: ErrorCategory.VALIDATION,
                pluginId: 'plugin-1',
            });
            expect(errors.length).toBe(1);
            expect(errors[0].category).toBe(ErrorCategory.VALIDATION);
            expect(errors[0].pluginId).toBe('plugin-1');
        });

        it('should return most recent errors with limit', () => {
            errorHandler.handle(new Error('Latest error'));

            const errors = errorHandler.getErrorLog({ limit: 1 });
            expect(errors[0].message).toBe('Latest error');
        });

        it('should return empty array when no matches', () => {
            const errors = errorHandler.getErrorLog({ pluginId: 'non-existent' });
            expect(errors).toEqual([]);
        });
    });

    describe('Error Log Management', () => {
        it('should store errors in log', () => {
            errorHandler.handle(new Error('Error 1'));
            errorHandler.handle(new Error('Error 2'));

            const log = errorHandler.getErrorLog();
            expect(log.length).toBe(2);
        });

        it('should maintain log size limit', () => {
            // Access private maxLogSize through handler
            const maxSize = (errorHandler as any).maxLogSize;

            // Generate more errors than the limit
            for (let i = 0; i < maxSize + 100; i++) {
                errorHandler.handle(new Error(`Error ${i}`));
            }

            const log = errorHandler.getErrorLog();
            expect(log.length).toBe(maxSize);
        });

        it('should keep most recent errors when exceeding limit', () => {
            const maxSize = (errorHandler as any).maxLogSize;

            for (let i = 0; i < maxSize + 10; i++) {
                errorHandler.handle(new Error(`Error ${i}`));
            }

            const log = errorHandler.getErrorLog();
            const lastError = log[log.length - 1];
            expect(lastError.message).toBe(`Error ${maxSize + 9}`);
        });

        it('should clear error log', () => {
            errorHandler.handle(new Error('Error 1'));
            errorHandler.handle(new Error('Error 2'));

            errorHandler.clearLog();

            const log = errorHandler.getErrorLog();
            expect(log.length).toBe(0);

            const stats = errorHandler.getStats();
            expect(stats.total).toBe(0);
        });

        it('should preserve errors after retrieval', () => {
            errorHandler.handle(new Error('Error 1'));

            const log1 = errorHandler.getErrorLog();
            const log2 = errorHandler.getErrorLog();

            expect(log1.length).toBe(log2.length);
        });
    });

    describe('Error Context and Metadata', () => {
        it('should store original error', () => {
            const originalError = new Error('Original');
            const result = errorHandler.handle(originalError);

            expect(result.original).toBe(originalError);
        });

        it('should add timestamp to errors', () => {
            const beforeTime = new Date();
            const result = errorHandler.handle(new Error('Test'));
            const afterTime = new Date();

            expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });

        it('should preserve custom context', () => {
            const context = {
                userId: '123',
                action: 'create',
                resource: 'order',
                metadata: { count: 5 },
            };

            const result = errorHandler.handle(new Error('Test'), context);

            expect(result.context).toEqual(context);
        });

        it('should handle null context', () => {
            const result = errorHandler.handle(new Error('Test'));
            expect(result.context).toBeUndefined();
        });
    });

    describe('Constructor Options', () => {
        it('should respect autoRetry option', () => {
            const handler = new ErrorHandler({ autoRetry: true });
            expect((handler as any).options.autoRetry).toBe(true);
        });

        it('should respect maxRetries option', () => {
            const handler = new ErrorHandler({ maxRetries: 10 });
            expect((handler as any).options.maxRetries).toBe(10);
        });

        it('should respect retryDelay option', () => {
            const handler = new ErrorHandler({ retryDelay: 500 });
            expect((handler as any).options.retryDelay).toBe(500);
        });

        it('should use default options', () => {
            const handler = new ErrorHandler();
            expect((handler as any).options.autoRetry).toBe(false);
            expect((handler as any).options.maxRetries).toBe(3);
            expect((handler as any).options.retryDelay).toBe(1000);
            expect((handler as any).options.logErrors).toBe(true);
        });
    });
});
