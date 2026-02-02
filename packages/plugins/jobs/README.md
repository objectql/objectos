# @objectos/plugin-jobs

Background job processing and scheduling plugin for ObjectOS.

## Features

### Job Queue System
- **Background Processing**: Execute jobs asynchronously in the background
- **Concurrent Workers**: Process multiple jobs simultaneously with configurable concurrency
- **Priority Queuing**: Support for low, normal, high, and critical priority levels
- **Job Monitoring**: Track job status, attempts, and execution history

### Job Scheduling
- **Cron Support**: Schedule recurring jobs using cron expressions
- **Flexible Timing**: Support for daily, hourly, weekly, and custom schedules
- **Next Run Calculation**: Automatic calculation of next execution time
- **Schedule Management**: Update or cancel scheduled jobs

### Retry Logic
- **Automatic Retries**: Configurable maximum retry attempts
- **Exponential Backoff**: Intelligent retry delay with exponential backoff
- **Error Handling**: Capture and log job failures
- **Timeout Protection**: Prevent jobs from running indefinitely

### Built-in Jobs
- **Data Cleanup**: Automatically delete old records based on retention policies
- **Report Generation**: Generate reports in various formats (PDF, CSV, XLSX, JSON)
- **Backup Jobs**: Create database backups with compression support

## Installation

```bash
npm install @objectos/plugin-jobs
```

## Usage

### Basic Setup

```typescript
import { createJobsPlugin } from '@objectos/plugin-jobs';

const jobsPlugin = createJobsPlugin({
  enabled: true,
  concurrency: 10,
  defaultMaxRetries: 3,
  defaultRetryDelay: 1000,
  defaultTimeout: 60000,
  enableBuiltInJobs: true,
});

// Add to ObjectOS
const os = new ObjectOS({
  plugins: [jobsPlugin]
});
```

### Register Custom Job Handler

```typescript
import { getJobsAPI } from '@objectos/plugin-jobs';

const jobsAPI = getJobsAPI(app);

jobsAPI.registerHandler({
  name: 'send-email',
  handler: async (context) => {
    const { to, subject, body } = context.data;
    
    context.logger.info(`Sending email to ${to}`);
    
    // Send email logic here
    await emailService.send({ to, subject, body });
    
    return { success: true, messageId: '123' };
  },
  defaultConfig: {
    maxRetries: 3,
    timeout: 30000,
  }
});
```

### Enqueue a Job

```typescript
const job = await jobsAPI.enqueue({
  id: 'email-' + Date.now(),
  name: 'send-email',
  data: {
    to: 'user@example.com',
    subject: 'Welcome!',
    body: 'Thank you for signing up.'
  },
  priority: 'high',
  maxRetries: 3,
  retryDelay: 2000,
  timeout: 30000,
});

console.log(`Job enqueued: ${job.id}`);
```

### Schedule Recurring Job

```typescript
// Schedule a daily cleanup job
const scheduledJob = await jobsAPI.schedule({
  id: 'daily-cleanup',
  name: 'data-cleanup',
  cronExpression: '0 0 * * *', // Daily at midnight
  data: {
    objects: ['audit_logs', 'sessions'],
    retentionDays: 90,
    softDelete: false,
  },
});

console.log(`Next run: ${scheduledJob.nextRun}`);
```

### Query Jobs

```typescript
// Get all pending jobs
const pendingJobs = await jobsAPI.queryJobs({
  status: 'pending',
  limit: 10,
});

// Get failed jobs for a specific job type
const failedJobs = await jobsAPI.queryJobs({
  name: 'send-email',
  status: 'failed',
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// Get high priority jobs
const highPriorityJobs = await jobsAPI.queryJobs({
  priority: 'high',
  status: ['pending', 'running'],
});
```

### Monitor Queue

```typescript
const stats = await jobsAPI.getStats();

console.log(`Total jobs: ${stats.total}`);
console.log(`Pending: ${stats.pending}`);
console.log(`Running: ${stats.running}`);
console.log(`Completed: ${stats.completed}`);
console.log(`Failed: ${stats.failed}`);
console.log(`Scheduled: ${stats.scheduled}`);
```

### Cancel a Job

```typescript
await jobsAPI.cancel('job-123');
```

## Built-in Jobs

### Data Cleanup Job

Automatically delete old records based on retention policies.

```typescript
await jobsAPI.enqueue({
  id: 'cleanup-' + Date.now(),
  name: 'data-cleanup',
  data: {
    objects: ['audit_logs', 'sessions', 'notifications'],
    retentionDays: 90,
    softDelete: false,
  },
});
```

### Report Generation Job

Generate reports in various formats.

```typescript
await jobsAPI.enqueue({
  id: 'report-' + Date.now(),
  name: 'report-generation',
  data: {
    reportType: 'sales-summary',
    parameters: {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      region: 'North America',
    },
    format: 'pdf',
    destination: '/reports/sales-january-2026.pdf',
  },
});
```

### Backup Job

Create database backups with optional compression.

```typescript
await jobsAPI.enqueue({
  id: 'backup-' + Date.now(),
  name: 'backup',
  data: {
    objects: ['users', 'orders', 'products'],
    destination: '/backups',
    compress: true,
    includeMetadata: true,
  },
});
```

## Cron Expression Examples

```typescript
// Every minute
'* * * * *'

// Every hour
'0 * * * *'

// Daily at midnight
'0 0 * * *'

// Daily at 2:30 AM
'30 2 * * *'

// Every Monday at 9 AM
'0 9 * * 1'

// First day of every month
'0 0 1 * *'

// Every 15 minutes
'*/15 * * * *'
```

## Configuration Options

```typescript
interface JobPluginConfig {
  /** Whether job processing is enabled */
  enabled?: boolean;
  
  /** Number of concurrent workers (default: 5) */
  concurrency?: number;
  
  /** Poll interval for checking new jobs in ms (default: 1000) */
  pollInterval?: number;
  
  /** Default maximum retry attempts (default: 3) */
  defaultMaxRetries?: number;
  
  /** Default retry delay in ms (default: 1000) */
  defaultRetryDelay?: number;
  
  /** Default job timeout in ms (default: 60000) */
  defaultTimeout?: number;
  
  /** Custom storage implementation */
  storage?: JobStorage;
  
  /** Whether to enable built-in jobs (default: true) */
  enableBuiltInJobs?: boolean;
}
```

## Job Context

Every job handler receives a context object:

```typescript
interface JobContext {
  /** Unique job ID */
  jobId: string;
  
  /** Job name/type */
  name: string;
  
  /** Job data payload */
  data: any;
  
  /** Current attempt number (1-based) */
  attempt: number;
  
  /** Logger instance */
  logger: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
}
```

## Events

The plugin emits the following events:

- `job.enqueued` - When a job is added to the queue
- `job.started` - When a job starts processing
- `job.completed` - When a job completes successfully
- `job.failed` - When a job fails permanently
- `job.scheduled` - When a recurring job is scheduled
- `job.cancelled` - When a job is cancelled

## Storage

By default, jobs are stored in memory. For production use, implement a custom storage adapter:

```typescript
import { JobStorage } from '@objectos/plugin-jobs';

class RedisJobStorage implements JobStorage {
  async save(job: Job): Promise<void> {
    // Store in Redis
  }
  
  async get(id: string): Promise<Job | null> {
    // Retrieve from Redis
  }
  
  // Implement other methods...
}

const jobsPlugin = createJobsPlugin({
  storage: new RedisJobStorage(),
});
```

## License

AGPL-3.0
