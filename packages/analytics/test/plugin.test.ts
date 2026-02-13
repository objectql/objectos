/**
 * Analytics Plugin Tests
 *
 * Tests for O.4.1 (aggregation), O.4.2 (reports),
 * O.4.3 (dashboards), and O.4.4 (scheduler).
 */

import { AnalyticsPlugin } from '../src/plugin.js';
import { AggregationEngine } from '../src/aggregation.js';
import { ReportManager } from '../src/reports.js';
import { DashboardManager } from '../src/dashboards.js';
import { ReportScheduler } from '../src/scheduler.js';
import type {
  AggregationPipeline,
  ReportDefinition,
  DashboardDefinition,
  DashboardWidget,
  ScheduledReport,
} from '../src/types.js';

// ─── Test Fixtures ─────────────────────────────────────────────────

const SAMPLE_DATA = [
  {
    id: '1',
    name: 'Alice',
    department: 'Engineering',
    salary: 120000,
    status: 'active',
    tags: ['lead', 'senior'],
  },
  {
    id: '2',
    name: 'Bob',
    department: 'Engineering',
    salary: 95000,
    status: 'active',
    tags: ['mid'],
  },
  {
    id: '3',
    name: 'Charlie',
    department: 'Sales',
    salary: 85000,
    status: 'inactive',
    tags: ['junior'],
  },
  {
    id: '4',
    name: 'Diana',
    department: 'Sales',
    salary: 110000,
    status: 'active',
    tags: ['lead', 'senior'],
  },
  { id: '5', name: 'Eve', department: 'Marketing', salary: 90000, status: 'active', tags: ['mid'] },
];

function createMockBroker(data: Record<string, any>[] = SAMPLE_DATA) {
  return {
    call: jest.fn(async (action: string) => {
      if (action === 'data.find') return data;
      if (action === 'notification.send') return { success: true };
      return [];
    }),
  };
}

function createMockContext() {
  const events: Array<{ event: string; payload: any }> = [];
  const services: Record<string, any> = {};

  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    trigger: jest.fn(async (event: string, payload: any) => {
      events.push({ event, payload });
    }),
    registerService: jest.fn((name: string, service: any) => {
      services[name] = service;
    }),
    getService: jest.fn((name: string) => services[name] ?? null),
    broker: createMockBroker(),
    _events: events,
    _services: services,
  };
}

function createSampleReport(overrides: Partial<ReportDefinition> = {}): ReportDefinition {
  return {
    id: 'report-1',
    name: 'Active Employees',
    description: 'Shows active employees',
    objectName: 'employees',
    stages: [{ type: 'match', body: { status: 'active' } }],
    format: 'table',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createSampleDashboard(overrides: Partial<DashboardDefinition> = {}): DashboardDefinition {
  return {
    id: 'dash-1',
    name: 'HR Dashboard',
    description: 'HR overview',
    widgets: [],
    layout: { columns: 12, rowHeight: 80 },
    owner: 'user-1',
    shared: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createSampleWidget(overrides: Partial<DashboardWidget> = {}): DashboardWidget {
  return {
    id: 'widget-1',
    type: 'metric',
    title: 'Total Employees',
    pipeline: {
      objectName: 'employees',
      stages: [{ type: 'count', body: { as: 'total' } }],
    },
    size: { w: 3, h: 2 },
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

// ─── O.4.1: Aggregation Engine ────────────────────────────────────

describe('O.4.1 — Aggregation Engine', () => {
  let engine: AggregationEngine;
  let broker: any;

  beforeEach(() => {
    engine = new AggregationEngine();
    broker = createMockBroker();
  });

  describe('match stage', () => {
    test('filters by exact value', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'match', body: { status: 'active' } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(4);
      expect(result.data.every((r) => r.status === 'active')).toBe(true);
    });

    test('filters with $gt operator', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'match', body: { salary: { $gt: 100000 } } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(2);
    });

    test('filters with $in operator', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'match', body: { department: { $in: ['Engineering', 'Marketing'] } } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(3);
    });

    test('filters with multiple conditions', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'match', body: { status: 'active', department: 'Engineering' } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('group stage', () => {
    test('groups by field with $sum', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [
          {
            type: 'group',
            body: { _id: 'department', totalSalary: { $sum: 'salary' } },
          },
        ],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(3);
      const eng = result.data.find((r) => r._id === 'Engineering');
      expect(eng?.totalSalary).toBe(215000);
    });

    test('groups with $avg', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [
          {
            type: 'group',
            body: { _id: 'department', avgSalary: { $avg: 'salary' } },
          },
        ],
      };
      const result = await engine.execute(pipeline, broker);
      const eng = result.data.find((r) => r._id === 'Engineering');
      expect(eng?.avgSalary).toBe(107500);
    });

    test('groups with $min and $max', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [
          {
            type: 'group',
            body: {
              _id: 'department',
              minSalary: { $min: 'salary' },
              maxSalary: { $max: 'salary' },
            },
          },
        ],
      };
      const result = await engine.execute(pipeline, broker);
      const eng = result.data.find((r) => r._id === 'Engineering');
      expect(eng?.minSalary).toBe(95000);
      expect(eng?.maxSalary).toBe(120000);
    });

    test('groups with $count', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [
          {
            type: 'group',
            body: { _id: 'department', headcount: { $count: true } },
          },
        ],
      };
      const result = await engine.execute(pipeline, broker);
      const eng = result.data.find((r) => r._id === 'Engineering');
      expect(eng?.headcount).toBe(2);
    });
  });

  describe('sort stage', () => {
    test('sorts ascending', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'sort', body: { salary: 1 } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data[0].name).toBe('Charlie');
      expect(result.data[4].name).toBe('Alice');
    });

    test('sorts descending', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'sort', body: { salary: -1 } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data[0].name).toBe('Alice');
      expect(result.data[4].name).toBe('Charlie');
    });
  });

  describe('limit stage', () => {
    test('limits results', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'limit', body: { n: 2 } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('skip stage', () => {
    test('skips records', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'skip', body: { n: 3 } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('project stage', () => {
    test('includes specified fields', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'project', body: { name: 1, salary: 1 } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(Object.keys(result.data[0])).toEqual(['name', 'salary']);
    });

    test('excludes specified fields', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'project', body: { tags: 0 } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data[0].tags).toBeUndefined();
      expect(result.data[0].name).toBeDefined();
    });
  });

  describe('addFields stage', () => {
    test('adds literal fields', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'addFields', body: { bonus: 5000 } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data.every((r) => r.bonus === 5000)).toBe(true);
    });

    test('adds computed fields with $multiply', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [
          {
            type: 'addFields',
            body: { annualBonus: { $multiply: ['$salary', 0.1] } },
          },
        ],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data[0].annualBonus).toBe(12000);
    });
  });

  describe('count stage', () => {
    test('returns count', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'count', body: { as: 'total' } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toEqual([{ total: 5 }]);
    });
  });

  describe('multi-stage pipelines', () => {
    test('match → group → sort', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [
          { type: 'match', body: { status: 'active' } },
          { type: 'group', body: { _id: 'department', total: { $sum: 'salary' } } },
          { type: 'sort', body: { total: -1 } },
        ],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]._id).toBe('Engineering');
      expect(result.metadata.stagesExecuted).toBe(3);
    });

    test('match → sort → skip → limit', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [
          { type: 'match', body: { status: 'active' } },
          { type: 'sort', body: { salary: -1 } },
          { type: 'skip', body: { n: 1 } },
          { type: 'limit', body: { n: 2 } },
        ],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.data).toHaveLength(2);
      expect(result.metadata.stagesExecuted).toBe(4);
    });
  });

  describe('validation', () => {
    test('rejects empty objectName', () => {
      expect(() =>
        engine.validatePipeline({ objectName: '', stages: [{ type: 'match', body: {} }] }),
      ).toThrow('valid objectName');
    });

    test('rejects empty stages', () => {
      expect(() => engine.validatePipeline({ objectName: 'x', stages: [] })).toThrow(
        'at least one stage',
      );
    });

    test('rejects invalid stage type', () => {
      expect(() =>
        engine.validatePipeline({
          objectName: 'x',
          stages: [{ type: 'invalid' as any, body: {} }],
        }),
      ).toThrow('Invalid stage type');
    });

    test('rejects too many stages', () => {
      const engine2 = new AggregationEngine(2);
      const stages = Array(3).fill({ type: 'match', body: {} });
      expect(() => engine2.validatePipeline({ objectName: 'x', stages })).toThrow(
        'exceeds maximum',
      );
    });

    test('rejects stage without body', () => {
      expect(() =>
        engine.validatePipeline({
          objectName: 'x',
          stages: [{ type: 'match', body: null as any }],
        }),
      ).toThrow('body object');
    });
  });

  describe('metadata', () => {
    test('returns execution metadata', async () => {
      const pipeline: AggregationPipeline = {
        objectName: 'employees',
        stages: [{ type: 'match', body: { status: 'active' } }],
      };
      const result = await engine.execute(pipeline, broker);
      expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.recordsProcessed).toBe(5);
      expect(result.metadata.stagesExecuted).toBe(1);
    });
  });
});

// ─── O.4.2: Report Manager ───────────────────────────────────────

describe('O.4.2 — Report Manager', () => {
  let engine: AggregationEngine;
  let manager: ReportManager;
  let broker: any;

  beforeEach(() => {
    engine = new AggregationEngine();
    manager = new ReportManager(engine);
    broker = createMockBroker();
  });

  describe('CRUD operations', () => {
    test('creates a report', () => {
      const report = manager.create(createSampleReport());
      expect(report.id).toBe('report-1');
      expect(report.name).toBe('Active Employees');
    });

    test('rejects duplicate report ID', () => {
      manager.create(createSampleReport());
      expect(() => manager.create(createSampleReport())).toThrow('already exists');
    });

    test('gets a report by ID', () => {
      manager.create(createSampleReport());
      const report = manager.get('report-1');
      expect(report?.name).toBe('Active Employees');
    });

    test('returns undefined for unknown report', () => {
      expect(manager.get('nonexistent')).toBeUndefined();
    });

    test('updates a report', () => {
      manager.create(createSampleReport());
      const updated = manager.update('report-1', { name: 'Updated Report' });
      expect(updated.name).toBe('Updated Report');
      expect(updated.id).toBe('report-1');
    });

    test('throws on update of unknown report', () => {
      expect(() => manager.update('nonexistent', { name: 'x' })).toThrow('not found');
    });

    test('deletes a report', () => {
      manager.create(createSampleReport());
      expect(manager.delete('report-1')).toBe(true);
      expect(manager.get('report-1')).toBeUndefined();
    });

    test('returns false for deleting unknown report', () => {
      expect(manager.delete('nonexistent')).toBe(false);
    });
  });

  describe('list', () => {
    test('lists all reports', () => {
      manager.create(createSampleReport({ id: 'r1' }));
      manager.create(createSampleReport({ id: 'r2', objectName: 'orders' }));
      expect(manager.list()).toHaveLength(2);
    });

    test('filters by objectName', () => {
      manager.create(createSampleReport({ id: 'r1', objectName: 'employees' }));
      manager.create(createSampleReport({ id: 'r2', objectName: 'orders' }));
      expect(manager.list({ objectName: 'orders' })).toHaveLength(1);
    });

    test('filters by createdBy', () => {
      manager.create(createSampleReport({ id: 'r1', createdBy: 'user-1' }));
      manager.create(createSampleReport({ id: 'r2', createdBy: 'user-2' }));
      expect(manager.list({ createdBy: 'user-2' })).toHaveLength(1);
    });
  });

  describe('execute', () => {
    test('executes a report', async () => {
      manager.create(createSampleReport());
      const result = await manager.execute('report-1', undefined, broker);
      expect(result.reportId).toBe('report-1');
      expect(result.reportName).toBe('Active Employees');
      expect(result.data).toHaveLength(4);
      expect(result.executedAt).toBeTruthy();
    });

    test('throws for unknown report', async () => {
      await expect(manager.execute('nonexistent', undefined, broker)).rejects.toThrow('not found');
    });
  });

  describe('parameter interpolation', () => {
    test('interpolates $param references', async () => {
      const report = createSampleReport({
        stages: [{ type: 'match', body: { status: '$param.status' } }],
        parameters: [{ name: 'status', type: 'string', required: true }],
      });
      manager.create(report);
      const result = await manager.execute('report-1', { status: 'active' }, broker);
      expect(result.data).toHaveLength(4);
    });

    test('uses default parameter values', async () => {
      const report = createSampleReport({
        stages: [{ type: 'match', body: { status: '$param.status' } }],
        parameters: [{ name: 'status', type: 'string', defaultValue: 'active' }],
      });
      manager.create(report);
      const result = await manager.execute('report-1', {}, broker);
      expect(result.data).toHaveLength(4);
    });

    test('throws for missing required parameter', async () => {
      const report = createSampleReport({
        stages: [{ type: 'match', body: { status: '$param.status' } }],
        parameters: [{ name: 'status', type: 'string', required: true }],
      });
      manager.create(report);
      await expect(manager.execute('report-1', {}, broker)).rejects.toThrow('Required parameter');
    });
  });

  describe('validation', () => {
    test('rejects report without id', () => {
      expect(() => manager.create(createSampleReport({ id: '' }))).toThrow('valid id');
    });

    test('rejects report without name', () => {
      expect(() => manager.create(createSampleReport({ name: '' }))).toThrow('valid name');
    });

    test('rejects report without objectName', () => {
      expect(() => manager.create(createSampleReport({ objectName: '' }))).toThrow('objectName');
    });

    test('rejects report without stages', () => {
      expect(() => manager.create(createSampleReport({ stages: [] }))).toThrow('at least one');
    });

    test('rejects report with invalid format', () => {
      expect(() => manager.create(createSampleReport({ format: 'pdf' as any }))).toThrow('format');
    });
  });
});

// ─── O.4.3: Dashboard Manager ─────────────────────────────────────

describe('O.4.3 — Dashboard Manager', () => {
  let engine: AggregationEngine;
  let reportManager: ReportManager;
  let dashManager: DashboardManager;
  let broker: any;

  beforeEach(() => {
    engine = new AggregationEngine();
    reportManager = new ReportManager(engine);
    dashManager = new DashboardManager(engine, reportManager);
    broker = createMockBroker();
  });

  describe('CRUD operations', () => {
    test('creates a dashboard', () => {
      const dash = dashManager.create(createSampleDashboard());
      expect(dash.id).toBe('dash-1');
      expect(dash.name).toBe('HR Dashboard');
    });

    test('rejects duplicate dashboard ID', () => {
      dashManager.create(createSampleDashboard());
      expect(() => dashManager.create(createSampleDashboard())).toThrow('already exists');
    });

    test('gets a dashboard', () => {
      dashManager.create(createSampleDashboard());
      expect(dashManager.get('dash-1')?.name).toBe('HR Dashboard');
    });

    test('returns undefined for unknown dashboard', () => {
      expect(dashManager.get('nonexistent')).toBeUndefined();
    });

    test('updates a dashboard', () => {
      dashManager.create(createSampleDashboard());
      const updated = dashManager.update('dash-1', { name: 'Updated' });
      expect(updated.name).toBe('Updated');
    });

    test('deletes a dashboard', () => {
      dashManager.create(createSampleDashboard());
      expect(dashManager.delete('dash-1')).toBe(true);
      expect(dashManager.get('dash-1')).toBeUndefined();
    });
  });

  describe('list', () => {
    test('lists all dashboards', () => {
      dashManager.create(createSampleDashboard({ id: 'd1', owner: 'user-1' }));
      dashManager.create(createSampleDashboard({ id: 'd2', owner: 'user-2' }));
      expect(dashManager.list()).toHaveLength(2);
    });

    test('filters by userId (includes shared)', () => {
      dashManager.create(createSampleDashboard({ id: 'd1', owner: 'user-1', shared: false }));
      dashManager.create(createSampleDashboard({ id: 'd2', owner: 'user-2', shared: true }));
      dashManager.create(createSampleDashboard({ id: 'd3', owner: 'user-2', shared: false }));
      const result = dashManager.list('user-1');
      expect(result).toHaveLength(2); // own + shared
    });
  });

  describe('widget CRUD', () => {
    test('adds a widget', () => {
      dashManager.create(createSampleDashboard());
      const dash = dashManager.addWidget('dash-1', createSampleWidget());
      expect(dash.widgets).toHaveLength(1);
      expect(dash.widgets[0].id).toBe('widget-1');
    });

    test('rejects duplicate widget ID', () => {
      dashManager.create(createSampleDashboard());
      dashManager.addWidget('dash-1', createSampleWidget());
      expect(() => dashManager.addWidget('dash-1', createSampleWidget())).toThrow('already exists');
    });

    test('removes a widget', () => {
      dashManager.create(createSampleDashboard());
      dashManager.addWidget('dash-1', createSampleWidget());
      const dash = dashManager.removeWidget('dash-1', 'widget-1');
      expect(dash.widgets).toHaveLength(0);
    });

    test('throws removing nonexistent widget', () => {
      dashManager.create(createSampleDashboard());
      expect(() => dashManager.removeWidget('dash-1', 'nonexistent')).toThrow('not found');
    });

    test('updates a widget', () => {
      dashManager.create(createSampleDashboard());
      dashManager.addWidget('dash-1', createSampleWidget());
      const dash = dashManager.updateWidget('dash-1', 'widget-1', { title: 'Updated' });
      expect(dash.widgets[0].title).toBe('Updated');
    });
  });

  describe('execute', () => {
    test('executes a widget with inline pipeline', async () => {
      dashManager.create(createSampleDashboard());
      dashManager.addWidget('dash-1', createSampleWidget());
      const result = await dashManager.executeWidget('dash-1', 'widget-1', broker);
      expect(result.data).toEqual([{ total: 5 }]);
    });

    test('executes a widget with reportId', async () => {
      reportManager.create(createSampleReport());
      dashManager.create(createSampleDashboard());
      dashManager.addWidget(
        'dash-1',
        createSampleWidget({
          id: 'widget-report',
          reportId: 'report-1',
          pipeline: undefined,
        }),
      );
      const result = await dashManager.executeWidget('dash-1', 'widget-report', broker);
      expect(result.data).toHaveLength(4);
    });

    test('executes all dashboard widgets', async () => {
      dashManager.create(createSampleDashboard());
      dashManager.addWidget('dash-1', createSampleWidget({ id: 'w1' }));
      dashManager.addWidget(
        'dash-1',
        createSampleWidget({
          id: 'w2',
          pipeline: {
            objectName: 'employees',
            stages: [{ type: 'match', body: { status: 'active' } }],
          },
        }),
      );
      const results = await dashManager.executeDashboard('dash-1', broker);
      expect(Object.keys(results)).toHaveLength(2);
      expect(results['w1'].data).toEqual([{ total: 5 }]);
      expect(results['w2'].data).toHaveLength(4);
    });

    test('throws for unknown dashboard on execute', async () => {
      await expect(dashManager.executeDashboard('nonexistent', broker)).rejects.toThrow(
        'not found',
      );
    });
  });
});

// ─── O.4.4: Report Scheduler ──────────────────────────────────────

describe('O.4.4 — Report Scheduler', () => {
  let engine: AggregationEngine;
  let reportManager: ReportManager;
  let scheduler: ReportScheduler;
  let broker: any;

  beforeEach(() => {
    engine = new AggregationEngine();
    reportManager = new ReportManager(engine);
    scheduler = new ReportScheduler(reportManager);
    broker = createMockBroker();
  });

  function createSampleSchedule(overrides: Partial<ScheduledReport> = {}): ScheduledReport {
    return {
      id: 'sched-1',
      reportId: 'report-1',
      cron: '0 9 * * *',
      recipients: ['admin@example.com'],
      format: 'json',
      enabled: true,
      lastRun: null,
      nextRun: new Date(Date.now() - 60000).toISOString(), // 1 min ago (due)
      ...overrides,
    };
  }

  describe('schedule management', () => {
    test('creates a schedule', () => {
      const schedule = scheduler.schedule(createSampleSchedule());
      expect(schedule.id).toBe('sched-1');
      expect(schedule.enabled).toBe(true);
    });

    test('rejects schedule without id', () => {
      expect(() => scheduler.schedule(createSampleSchedule({ id: '' }))).toThrow('valid id');
    });

    test('rejects schedule without reportId', () => {
      expect(() => scheduler.schedule(createSampleSchedule({ reportId: '' }))).toThrow('reportId');
    });

    test('rejects schedule without cron', () => {
      expect(() => scheduler.schedule(createSampleSchedule({ cron: '' }))).toThrow(
        'cron expression',
      );
    });

    test('rejects schedule without recipients', () => {
      expect(() => scheduler.schedule(createSampleSchedule({ recipients: [] }))).toThrow(
        'at least one recipient',
      );
    });

    test('unschedules', () => {
      scheduler.schedule(createSampleSchedule());
      expect(scheduler.unschedule('sched-1')).toBe(true);
      expect(scheduler.getSchedule('sched-1')).toBeUndefined();
    });

    test('lists schedules', () => {
      scheduler.schedule(createSampleSchedule({ id: 's1' }));
      scheduler.schedule(createSampleSchedule({ id: 's2' }));
      expect(scheduler.listSchedules()).toHaveLength(2);
    });
  });

  describe('checkDue', () => {
    test('finds due schedules', () => {
      scheduler.schedule(
        createSampleSchedule({
          id: 's-due',
          nextRun: new Date(Date.now() - 60000).toISOString(),
        }),
      );
      scheduler.schedule(
        createSampleSchedule({
          id: 's-future',
          nextRun: new Date(Date.now() + 3600000).toISOString(),
        }),
      );
      const due = scheduler.checkDue();
      expect(due).toHaveLength(1);
      expect(due[0].id).toBe('s-due');
    });

    test('ignores disabled schedules', () => {
      scheduler.schedule(
        createSampleSchedule({
          enabled: false,
          nextRun: new Date(Date.now() - 60000).toISOString(),
        }),
      );
      expect(scheduler.checkDue()).toHaveLength(0);
    });
  });

  describe('runDue', () => {
    test('executes due reports', async () => {
      reportManager.create(createSampleReport());
      scheduler.schedule(
        createSampleSchedule({
          nextRun: new Date(Date.now() - 60000).toISOString(),
        }),
      );
      const executed = await scheduler.runDue(broker);
      expect(executed).toContain('sched-1');
      const schedule = scheduler.getSchedule('sched-1');
      expect(schedule?.lastRun).toBeTruthy();
    });
  });

  describe('parseCron', () => {
    test('parses valid cron expression', () => {
      const parsed = scheduler.parseCron('0 9 * * 1');
      expect(parsed.minute).toEqual({ type: 'value', value: 0 });
      expect(parsed.hour).toEqual({ type: 'value', value: 9 });
      expect(parsed.dayOfMonth).toEqual({ type: 'wildcard' });
      expect(parsed.month).toEqual({ type: 'wildcard' });
      expect(parsed.dayOfWeek).toEqual({ type: 'value', value: 1 });
    });

    test('parses interval syntax', () => {
      const parsed = scheduler.parseCron('*/15 * * * *');
      expect(parsed.minute).toEqual({ type: 'interval', interval: 15 });
    });

    test('rejects invalid cron (wrong field count)', () => {
      expect(() => scheduler.parseCron('0 9 *')).toThrow('expected 5 fields');
    });

    test('rejects invalid cron field value', () => {
      expect(() => scheduler.parseCron('99 9 * * *')).toThrow('Invalid cron field');
    });
  });

  describe('getNextRun', () => {
    test('returns a future ISO date', () => {
      const next = scheduler.getNextRun('* * * * *');
      const date = new Date(next);
      expect(date.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    test('returns correct next run for specific time', () => {
      const next = scheduler.getNextRun('0 0 1 1 *');
      const date = new Date(next);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(1);
    });
  });
});

// ─── Plugin Lifecycle ──────────────────────────────────────────────

describe('Analytics Plugin — Lifecycle', () => {
  let plugin: AnalyticsPlugin;
  let context: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    plugin = new AnalyticsPlugin();
    context = createMockContext();
  });

  test('initializes and registers service', async () => {
    await plugin.init(context as any);
    expect(context.registerService).toHaveBeenCalledWith('analytics', plugin);
    expect(context.trigger).toHaveBeenCalledWith('plugin.initialized', {
      pluginId: '@objectos/analytics',
    });
  });

  test('starts and warns when no HTTP server', async () => {
    await plugin.init(context as any);
    await plugin.start(context as any);
    expect(context.logger.warn).toHaveBeenCalled();
    expect(context.trigger).toHaveBeenCalledWith('plugin.started', {
      pluginId: '@objectos/analytics',
    });
  });

  test('stops cleanly', async () => {
    await plugin.init(context as any);
    await plugin.stop();
    expect(context.logger.info).toHaveBeenCalledWith('[Analytics] Stopped');
  });

  test('returns healthy health report', () => {
    const report = plugin.getHealthReport();
    expect(report.status).toBe('healthy');
  });

  test('returns capabilities', () => {
    const caps = plugin.getCapabilities();
    expect(caps.id).toBe('@objectos/analytics');
    expect(caps.provides).toContain('analytics');
    expect(caps.provides).toContain('analytics.aggregation');
    expect(caps.provides).toContain('analytics.reports');
    expect(caps.provides).toContain('analytics.dashboards');
    expect(caps.provides).toContain('analytics.scheduler');
  });

  test('returns security manifest', () => {
    const security = plugin.getSecurityManifest();
    expect(security.permissions).toContain('analytics.aggregate');
    expect(security.permissions).toContain('analytics.reports.create');
    expect(security.dataAccess).toContain('read');
  });

  test('returns startup result', () => {
    const result = plugin.getStartupResult();
    expect(result.success).toBe(true);
  });

  test('exposes service API getters', async () => {
    await plugin.init(context as any);
    expect(plugin.getEngine()).toBeInstanceOf(AggregationEngine);
    expect(plugin.getReportManager()).toBeInstanceOf(ReportManager);
    expect(plugin.getDashboardManager()).toBeInstanceOf(DashboardManager);
    expect(plugin.getScheduler()).toBeInstanceOf(ReportScheduler);
  });

  test('can be created with custom config', () => {
    const custom = new AnalyticsPlugin({
      maxPipelineStages: 50,
      cacheResults: true,
      cacheTTL: 600,
      scheduledReportsEnabled: false,
    });
    const report = custom.getHealthReport();
    expect(report.details?.config.maxPipelineStages).toBe(50);
    expect(report.details?.config.cacheResults).toBe(true);
  });
});
