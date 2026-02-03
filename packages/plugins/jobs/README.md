# @objectos/plugin-jobs

Robust Background Job Queue and Scheduler for ObjectOS.

## Overview

A wrapper around BullMQ (Redis) designed for mission-critical business processes. It handles asynchronous tasks like email sending, report generation, and data import/export.

## Features

- ✅ **Queues**: Multiple priority queues (Critical, High, Default, Low).
- ✅ **Scheduling**: Cron-like recurring jobs ("Every Monday at 9am").
- ✅ **Reliability**: Automatic retries with exponential backoff.
- ✅ **Concurrency**: Configurable worker concurrency per queue.
- ✅ **Sandboxing**: Jobs run in isolated contexts (safe from crashing main process).

## Usage

```typescript
import { JobsPlugin, Job } from '@objectos/plugin-jobs';

// Define a Job Processor
@Job('send-email')
export class EmailJob {
  async handle(data: any) {
    await send(data.to, data.body);
  }
}

// Dispatch
await JobsPlugin.dispatch('send-email', { to: 'user@example.com' });
```

## Development Plan

- [ ] **Job Dashboard**: Embed BullBoard or similar UI into ObjectOS Admin.
- [ ] **Job Dependencies**: "Run Job B only after Job A succeeds".
- [ ] **Batch Processing**: Handle large arrays of jobs as a single batch with progress.
- [ ] **Rate Limiting**: specific limits for external API calls (e.g., "Max 5 SMS per second").
