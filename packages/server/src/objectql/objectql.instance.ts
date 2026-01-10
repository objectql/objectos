import { ObjectOS } from '@objectos/kernel';
import { KnexDriver } from '@objectql/driver-knex';

export const objectql = new ObjectOS({
  datasources: {
      default: new KnexDriver({ 
          client: 'sqlite3',
          connection: {
              filename: ':memory:'
          },
          useNullAsDefault: true
      })
  },
  packages: [
      '@objectos/preset-base'
  ]
});
