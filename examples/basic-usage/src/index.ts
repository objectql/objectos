import { ObjectQL } from '@objectql/core';
import { MongoDriver } from '@objectql/driver-mongo';
import { KnexDriver } from '@objectql/driver-knex';

const app = new ObjectQL({
  datasources: {
    // Environment A: Cloud / Prototype (MongoDB)
    design: new MongoDriver({ url: process.env.MONGO_URL }),
    
    // Environment B: On-Premise / Production (PostgreSQL)
    runtime: new KnexDriver({ client: 'pg', connection: process.env.PG_URL })
  }
});

// Example: Find orders with amount > 1000 and expand customer details
const query = {
  entity: 'orders',
  fields: ['id', 'order_no', 'amount', 'created_at'],
  filters: [
    ['status', '=', 'paid'],
    'and',
    ['amount', '>', 1000]
  ],
  sort: [['created_at', 'desc']],
  expand: {
    customer: {
      fields: ['name', 'email']
    }
  }
};

(async () => {
    // Option A: Execute on MongoDB
    // ObjectQL compiles this to an Aggregation Pipeline
    const resultsMongo = await app.datasource('design').find(query);
    console.log('Mongo Results:', resultsMongo);

    // Option B: Execute on PostgreSQL
    // ObjectQL compiles this to a SQL query with JSONB operators and JOINs
    const resultsSql = await app.datasource('runtime').find(query);
    console.log('SQL Results:', resultsSql);
})();
