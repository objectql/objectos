import { ObjectQL } from '@objectql/core';
const oql = new ObjectQL({ datasources: {} });
console.log('ObjectQL instance keys:', Object.keys(oql));
console.log('ObjectQL prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(oql)));
