import { ObjectQL, ObjectConfig } from '@objectql/core';
import { MongoDriver } from '@objectql/driver-mongo';
import { KnexDriver } from '@objectql/driver-knex';

const projectObj: ObjectConfig = {
  name: 'projects',
  label: 'Project',
  fields: {
    name: { type: 'text', required: true, label: 'Name' },
    status: {
      type: 'select',
      options: ['planned', 'in_progress', 'completed'],
      defaultValue: 'planned'
    },
    priority: {
      type: 'select',
      options: ['low', 'normal', 'high'],
      defaultValue: 'normal'
    },
    description: { type: 'textarea' }
  }
};

const taskObj: ObjectConfig = {
  name: 'tasks',
  label: 'Task',
  fields: {
    name: { type: 'text', required: true },
    project: { type: 'lookup', reference_to: 'projects' },
    due_date: { type: 'date' },
    completed: { type: 'boolean', defaultValue: false }
  }
};

const app = new ObjectQL({
  objects: {
    projects: projectObj,
    tasks: taskObj
  },
  datasources: {
    // Environment A: Cloud / Prototype (MongoDB)
    default: new MongoDriver({ url: process.env.MONGO_URL }),
  }
});

// Example: Find orders with amount > 1000 and expand customer details
const query = {
  entity: 'projects',
  fields: ['name', 'status', 'priority'],
  filters: [
    ['status', '=', 'in_progress'],
    'and',
    ['priority', '=', 'high']
  ],
  sort: [['name', 'desc']],
  expand: {
    tasks: {
      fields: ['name', 'due_date']
    }
  }
};

(async () => {
    // Option A: Execute on MongoDB
    // ObjectQL compiles this to an Aggregation Pipeline
    const ctx = app.createContext({
      userId: 'u-123'
    });
    const resultsMongo = await ctx.object('projects').find(query);
    console.log('Mongo Results:', resultsMongo);

    // Option B: Execute on PostgreSQL
    // ObjectQL compiles this to a SQL query with JSONB operators and JOINs
    // const resultsSql = await app.datasource('runtime').find(query);
    // console.log('SQL Results:', resultsSql);
})();
