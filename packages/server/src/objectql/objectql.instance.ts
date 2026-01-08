import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-knex';

export const objectql = new ObjectQL({
  datasources: {
      default: new KnexDriver({ 
          client: 'pg',
          connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/objectql'
      })
  },
  packages: [
      '@example/project-management'
  ]
});
