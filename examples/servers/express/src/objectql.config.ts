import { MongoDriver } from '@objectql/driver-mongo';
import { packageDir as projectManagementParams } from '../../../apps/project-management/dist';
import path from 'path';

export default {
    datasources: {
        default: new MongoDriver({ 
            url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/objectql_example',
            dbName: 'objectql_example'
        })
    },
    packages: [
        projectManagementParams
    ]
};
