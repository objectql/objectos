/**
 * O.4.4 — Scheduled Report Generation
 *
 * Manages cron-based scheduled report execution with delivery
 * to recipients via the notification service.
 */

import type { ScheduledReport } from './types.js';
import { ReportManager } from './reports.js';

/**
 * Parsed cron expression fields
 */
interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

/**
 * A single cron field (wildcard, specific value, or interval)
 */
interface CronField {
  type: 'wildcard' | 'value' | 'interval';
  value?: number;
  interval?: number;
}

/**
 * Report Scheduler — manages cron-based scheduled report execution
 */
export class ReportScheduler {
  private schedules = new Map<string, ScheduledReport>();
  private reportManager: ReportManager;

  constructor(reportManager: ReportManager) {
    this.reportManager = reportManager;
  }

  /**
   * Create a scheduled report
   */
  schedule(config: ScheduledReport): ScheduledReport {
    if (!config.id || typeof config.id !== 'string') {
      throw new Error('Schedule must have a valid id');
    }
    if (!config.reportId || typeof config.reportId !== 'string') {
      throw new Error('Schedule must reference a reportId');
    }
    if (!config.cron || typeof config.cron !== 'string') {
      throw new Error('Schedule must have a cron expression');
    }
    if (!Array.isArray(config.recipients) || config.recipients.length === 0) {
      throw new Error('Schedule must have at least one recipient');
    }

    // Validate cron
    this.parseCron(config.cron);

    const schedule: ScheduledReport = {
      ...config,
      enabled: config.enabled !== false,
      lastRun: config.lastRun ?? null,
      nextRun: config.nextRun || this.getNextRun(config.cron),
    };

    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  /**
   * Remove a schedule
   */
  unschedule(scheduleId: string): boolean {
    return this.schedules.delete(scheduleId);
  }

  /**
   * Get a schedule by ID
   */
  getSchedule(scheduleId: string): ScheduledReport | undefined {
    return this.schedules.get(scheduleId);
  }

  /**
   * List all schedules
   */
  listSchedules(): ScheduledReport[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Find schedules that are due to run now
   */
  checkDue(): ScheduledReport[] {
    const now = new Date();
    return Array.from(this.schedules.values()).filter(s => {
      if (!s.enabled) return false;
      const nextRun = new Date(s.nextRun);
      return nextRun <= now;
    });
  }

  /**
   * Execute all due reports and update their lastRun/nextRun
   */
  async runDue(broker?: any): Promise<string[]> {
    const due = this.checkDue();
    const executed: string[] = [];

    for (const schedule of due) {
      try {
        // Execute the report
        const result = await this.reportManager.execute(schedule.reportId, undefined, broker);

        // Try to deliver via notification service
        if (broker) {
          try {
            await broker.call('notification.send', {
              type: 'email',
              recipients: schedule.recipients,
              subject: `Scheduled Report: ${result.reportName}`,
              body: JSON.stringify(result.data),
              format: schedule.format,
            });
          } catch {
            // Notification delivery failure is non-fatal
          }
        }

        // Update schedule times
        const now = new Date().toISOString();
        schedule.lastRun = now;
        schedule.nextRun = this.getNextRun(schedule.cron);

        executed.push(schedule.id);
      } catch {
        // Report execution failure — skip this schedule
      }
    }

    return executed;
  }

  /**
   * Parse a cron expression into its component fields
   *
   * Format: minute hour day-of-month month day-of-week
   * Supports: * (wildcard), numbers, and * /n (interval)
   */
  parseCron(expression: string): ParsedCron {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: expected 5 fields, got ${parts.length}`);
    }

    return {
      minute: this.parseCronField(parts[0], 0, 59),
      hour: this.parseCronField(parts[1], 0, 23),
      dayOfMonth: this.parseCronField(parts[2], 1, 31),
      month: this.parseCronField(parts[3], 1, 12),
      dayOfWeek: this.parseCronField(parts[4], 0, 6),
    };
  }

  /**
   * Calculate the next run time from a cron expression
   */
  getNextRun(cron: string): string {
    const parsed = this.parseCron(cron);
    const now = new Date();
    const next = new Date(now);

    // Start from the next minute
    next.setSeconds(0, 0);
    next.setMinutes(next.getMinutes() + 1);

    // Search forward up to 366 days
    const limit = 366 * 24 * 60;
    for (let i = 0; i < limit; i++) {
      if (this.matchesCron(next, parsed)) {
        return next.toISOString();
      }
      next.setMinutes(next.getMinutes() + 1);
    }

    // No matching time found within 366 days — cron will never trigger
    throw new Error(`Cron expression "${cron}" does not match any time within the next 366 days`);
  }

  /**
   * Check if a date matches a parsed cron expression
   */
  private matchesCron(date: Date, cron: ParsedCron): boolean {
    return (
      this.matchesField(date.getMinutes(), cron.minute) &&
      this.matchesField(date.getHours(), cron.hour) &&
      this.matchesField(date.getDate(), cron.dayOfMonth) &&
      this.matchesField(date.getMonth() + 1, cron.month) &&
      this.matchesField(date.getDay(), cron.dayOfWeek)
    );
  }

  /**
   * Check if a value matches a single cron field
   */
  private matchesField(value: number, field: CronField): boolean {
    switch (field.type) {
      case 'wildcard':
        return true;
      case 'value':
        return value === field.value;
      case 'interval':
        return field.interval! > 0 && value % field.interval! === 0;
      default:
        return false;
    }
  }

  /**
   * Parse a single cron field token
   */
  private parseCronField(token: string, min: number, max: number): CronField {
    if (token === '*') {
      return { type: 'wildcard' };
    }

    if (token.startsWith('*/')) {
      const interval = parseInt(token.slice(2), 10);
      if (isNaN(interval) || interval <= 0) {
        throw new Error(`Invalid cron interval: ${token}`);
      }
      return { type: 'interval', interval };
    }

    const num = parseInt(token, 10);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`Invalid cron field value: ${token} (expected ${min}-${max})`);
    }
    return { type: 'value', value: num };
  }
}
