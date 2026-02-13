/**
 * In-Memory Job Storage
 *
 * Simple in-memory implementation of job storage.
 * For production use, implement a persistent storage adapter (Redis, PostgreSQL, etc.)
 */

import type { Job, JobStorage, JobQueryOptions, JobQueueStats, JobStatus } from './types.js';

export class InMemoryJobStorage implements JobStorage {
  private jobs: Map<string, Job> = new Map();

  async save(job: Job): Promise<void> {
    this.jobs.set(job.id, { ...job });
  }

  async get(id: string): Promise<Job | null> {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }

  async update(id: string, updates: Partial<Job>): Promise<void> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }
    this.jobs.set(id, { ...job, ...updates });
  }

  async delete(id: string): Promise<void> {
    this.jobs.delete(id);
  }

  async query(options: JobQueryOptions = {}): Promise<Job[]> {
    let results = Array.from(this.jobs.values());

    // Filter by name
    if (options.name) {
      results = results.filter((job) => job.name === options.name);
    }

    // Filter by status
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      results = results.filter((job) => statuses.includes(job.status));
    }

    // Filter by priority
    if (options.priority) {
      results = results.filter((job) => job.priority === options.priority);
    }

    // Sort results
    if (options.sortBy) {
      const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (options.sortBy) {
          case 'createdAt':
            aVal = a.createdAt.getTime();
            bVal = b.createdAt.getTime();
            break;
          case 'priority': {
            const priorityOrder: Record<string, number> = {
              critical: 4,
              high: 3,
              normal: 2,
              low: 1,
            };
            aVal = priorityOrder[a.priority as string] || 0;
            bVal = priorityOrder[b.priority as string] || 0;
            break;
          }
          case 'nextRun':
            aVal = a.nextRun?.getTime() || 0;
            bVal = b.nextRun?.getTime() || 0;
            break;
          default:
            return 0;
        }

        return (aVal - bVal) * sortOrder;
      });
    }

    // Apply pagination
    if (options.skip) {
      results = results.slice(options.skip);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results.map((job) => ({ ...job }));
  }

  async getStats(): Promise<JobQueueStats> {
    const jobs = Array.from(this.jobs.values());

    const stats: JobQueueStats = {
      total: jobs.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      scheduled: 0,
    };

    for (const job of jobs) {
      switch (job.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'running':
          stats.running++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case 'scheduled':
          stats.scheduled++;
          break;
      }
    }

    return stats;
  }

  async getNextPending(): Promise<Job | null> {
    const jobs = Array.from(this.jobs.values());

    // Filter pending jobs
    const pendingJobs = jobs.filter((job) => job.status === 'pending');

    if (pendingJobs.length === 0) {
      return null;
    }

    // Sort by priority (critical > high > normal > low) then by createdAt
    pendingJobs.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff =
        (priorityOrder[b.priority as string] || 0) - (priorityOrder[a.priority as string] || 0);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return { ...pendingJobs[0] };
  }

  async getScheduledDue(): Promise<Job[]> {
    const now = new Date();
    const jobs = Array.from(this.jobs.values());

    return jobs
      .filter((job) => job.status === 'scheduled' && job.nextRun && job.nextRun <= now)
      .map((job) => ({ ...job }));
  }

  /**
   * Clear all jobs (for testing)
   */
  async clear(): Promise<void> {
    this.jobs.clear();
  }

  /**
   * Get all jobs (for testing)
   */
  async getAll(): Promise<Job[]> {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }
}
