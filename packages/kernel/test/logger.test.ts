/**
 * Logger Tests
 */

import { ConsoleLogger, createLogger } from '../src/logger';

describe('Logger', () => {
    describe('ConsoleLogger', () => {
        let consoleSpy: any;

        beforeEach(() => {
            consoleSpy = {
                debug: jest.spyOn(console, 'debug').mockImplementation(),
                info: jest.spyOn(console, 'info').mockImplementation(),
                warn: jest.spyOn(console, 'warn').mockImplementation(),
                error: jest.spyOn(console, 'error').mockImplementation(),
            };
        });

        afterEach(() => {
            consoleSpy.debug.mockRestore();
            consoleSpy.info.mockRestore();
            consoleSpy.warn.mockRestore();
            consoleSpy.error.mockRestore();
        });

        it('should log debug messages', () => {
            const logger = new ConsoleLogger('test', 'debug');
            logger.debug('Test debug message', { extra: 'data' });
            
            expect(consoleSpy.debug).toHaveBeenCalled();
        });

        it('should log info messages', () => {
            const logger = new ConsoleLogger('test');
            logger.info('Test info message');
            
            expect(consoleSpy.info).toHaveBeenCalled();
        });

        it('should log warn messages', () => {
            const logger = new ConsoleLogger('test');
            logger.warn('Test warn message');
            
            expect(consoleSpy.warn).toHaveBeenCalled();
        });

        it('should log error messages', () => {
            const logger = new ConsoleLogger('test');
            logger.error('Test error message', new Error('Test error'));
            
            expect(consoleSpy.error).toHaveBeenCalled();
        });

        it('should respect log level', () => {
            const logger = new ConsoleLogger('test', 'warn');
            
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warn message');
            
            expect(consoleSpy.debug).not.toHaveBeenCalled();
            expect(consoleSpy.info).not.toHaveBeenCalled();
            expect(consoleSpy.warn).toHaveBeenCalled();
        });

        it('should add prefix to messages', () => {
            const logger = new ConsoleLogger('MyPlugin');
            logger.info('Test message');
            
            const callArgs = consoleSpy.info.mock.calls[0];
            expect(callArgs[0]).toContain('[MyPlugin]');
        });
    });

    describe('createLogger', () => {
        it('should create a logger instance', () => {
            const logger = createLogger('test');
            
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
        });
    });
});
