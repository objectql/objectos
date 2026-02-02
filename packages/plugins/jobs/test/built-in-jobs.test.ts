/**
 * Built-in Jobs Tests
 * 
 * Tests for built-in job implementations
 */

import {
    createDataCleanupJob,
    createReportJob,
    createBackupJob,
} from '../src/built-in-jobs';
import type { JobContext } from '../src/types';

describe('Built-in Jobs', () => {
    const mockContext: JobContext = {
        jobId: 'test-job-1',
        name: 'test',
        data: {},
        attempt: 1,
        logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createDataCleanupJob', () => {
        it('should create data cleanup job definition', () => {
            const jobDef = createDataCleanupJob({
                objects: ['logs', 'sessions'],
                retentionDays: 30,
            });

            expect(jobDef.name).toBe('data-cleanup');
            expect(jobDef.handler).toBeInstanceOf(Function);
            expect(jobDef.defaultConfig?.timeout).toBe(300000);
        });

        it('should execute cleanup job', async () => {
            const jobDef = createDataCleanupJob({
                objects: ['logs', 'audit_events'],
                retentionDays: 90,
            });

            const context: JobContext = {
                ...mockContext,
                data: {
                    objects: ['logs', 'audit_events'],
                    retentionDays: 90,
                },
            };

            const result = await jobDef.handler(context);

            expect(result).toHaveProperty('logs');
            expect(result).toHaveProperty('audit_events');
            expect(context.logger.info).toHaveBeenCalled();
        });

        it('should handle cleanup errors', async () => {
            const jobDef = createDataCleanupJob({
                objects: ['invalid_object'],
                retentionDays: 30,
            });

            const context: JobContext = {
                ...mockContext,
                data: {
                    objects: ['invalid_object'],
                    retentionDays: 30,
                },
            };

            // Should not throw but log the result
            const result = await jobDef.handler(context);
            expect(result).toBeDefined();
        });
    });

    describe('createReportJob', () => {
        it('should create report generation job definition', () => {
            const jobDef = createReportJob({
                reportType: 'sales-summary',
                format: 'pdf',
            });

            expect(jobDef.name).toBe('report-generation');
            expect(jobDef.handler).toBeInstanceOf(Function);
            expect(jobDef.defaultConfig?.timeout).toBe(600000);
        });

        it('should execute report generation', async () => {
            const jobDef = createReportJob({
                reportType: 'monthly-sales',
                parameters: { month: 'January', year: 2026 },
                format: 'csv',
            });

            const context: JobContext = {
                ...mockContext,
                data: {
                    reportType: 'monthly-sales',
                    parameters: { month: 'January', year: 2026 },
                    format: 'csv',
                },
            };

            const result = await jobDef.handler(context);

            expect(result.status).toBe('success');
            expect(result.destination).toContain('monthly-sales');
            expect(context.logger.info).toHaveBeenCalled();
        });

        it('should default to json format', async () => {
            const jobDef = createReportJob({
                reportType: 'user-report',
            });

            const context: JobContext = {
                ...mockContext,
                data: {
                    reportType: 'user-report',
                },
            };

            const result = await jobDef.handler(context);

            expect(result.reportData.format).toBe('json');
        });

        it('should handle report generation errors', async () => {
            const jobDef = createReportJob({
                reportType: 'error-report',
            });

            // Mock handler to throw error
            const originalHandler = jobDef.handler;
            const errorContext: JobContext = {
                ...mockContext,
                data: null, // Invalid data
            };

            await expect(originalHandler(errorContext)).resolves.toBeDefined();
        });
    });

    describe('createBackupJob', () => {
        it('should create backup job definition', () => {
            const jobDef = createBackupJob({
                destination: '/backups',
                compress: true,
            });

            expect(jobDef.name).toBe('backup');
            expect(jobDef.handler).toBeInstanceOf(Function);
            expect(jobDef.defaultConfig?.timeout).toBe(1800000);
        });

        it('should execute backup job', async () => {
            const jobDef = createBackupJob({
                destination: '/tmp/backups',
                objects: ['users', 'orders'],
                compress: true,
                includeMetadata: true,
            });

            const context: JobContext = {
                ...mockContext,
                data: {
                    destination: '/tmp/backups',
                    objects: ['users', 'orders'],
                    compress: true,
                    includeMetadata: true,
                },
            };

            const result = await jobDef.handler(context);

            expect(result.status).toBe('success');
            expect(result.backupFile).toContain('.tar.gz');
            expect(result.backupInfo.compress).toBe(true);
            expect(context.logger.info).toHaveBeenCalled();
        });

        it('should backup all objects when not specified', async () => {
            const jobDef = createBackupJob({
                destination: '/tmp/backups',
            });

            const context: JobContext = {
                ...mockContext,
                data: {
                    destination: '/tmp/backups',
                },
            };

            const result = await jobDef.handler(context);

            expect(result.backupInfo.objects).toEqual(['all']);
        });

        it('should create uncompressed backup', async () => {
            const jobDef = createBackupJob({
                destination: '/tmp/backups',
                compress: false,
            });

            const context: JobContext = {
                ...mockContext,
                data: {
                    destination: '/tmp/backups',
                    compress: false,
                },
            };

            const result = await jobDef.handler(context);

            expect(result.backupFile).toContain('.json');
        });

        it('should handle backup errors', async () => {
            const jobDef = createBackupJob({
                destination: '/invalid/path',
            });

            const context: JobContext = {
                ...mockContext,
                data: {
                    destination: '/invalid/path',
                },
            };

            // Should complete without throwing
            const result = await jobDef.handler(context);
            expect(result).toBeDefined();
        });
    });
});
