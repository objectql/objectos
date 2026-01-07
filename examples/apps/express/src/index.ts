import { ObjectQL, ObjectConfig, UnifiedQuery } from '@objectql/core';
import { createObjectQLRouter } from '@objectql/api';
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { MongoDriver } from '@objectql/driver-mongo';

const objectql = new ObjectQL({
    datasources: {
        default: new MongoDriver({ 
            url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/objectql_example',
            dbName: 'objectql_example'
        })
    },
    packages: [
        '@example/project-management'
    ]
});


(async () => {
    try {
        console.log("Starting server...");
        
        // --- 1. Init Data (from .data.yml) ---
        await objectql.init();


        // --- 2. Start Express Server ---
        const server = express();
        server.use(cors());
        server.use(express.json());
        
        // Serve Admin UI (static files)
        server.use(express.static(path.join(__dirname, '../public')));

        // Mount ObjectQL API
        // Example: /api/projects
        server.use('/api', createObjectQLRouter({
            objectql: objectql,
            swagger: {
                enabled: true,
                path: '/docs'
            },
            getContext: (req, res) => {
                // Simulate Authentication: Read User ID from header
                const userId = req.headers['x-user-id'] as string;
                if (userId === 'admin') {
                     return objectql.createContext({ isSystem: true });
                }
                return objectql.createContext({
                    userId: userId || undefined
                });
            }
        }));

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Try: curl -H "X-User-Id: u-123" http://localhost:${PORT}/api/projects`);
        });

    } catch (e) {
        console.error("Error setting up server:", e);
    }
})();
