import { ObjectQL, ObjectConfig, UnifiedQuery } from '@objectql/core';
import { createObjectQLRouter } from '@objectql/express';
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import config from './objectql.config';

const app = new ObjectQL({
  datasources: config.datasources,
  packages: config.packages
});

console.log(`ObjectQL Server started with ${config.packages.length} packages.`);

const projectObj = app.getObject('projects');
if (!projectObj) {
    console.error("Project object not found after loading!");
}

// Example: Find orders with amount > 1000 and expand customer details
const query: UnifiedQuery = {
  fields: ['name', 'status', 'priority'],
  filters: [
    ['status', '=', 'in_progress'],
    'and',
    ['priority', '=', 'high']
  ],
  sort: [['name', 'desc']],
  // Note: Expansion requires relationship support. 
  // If 'tasks' looks up 'project', we can query tasks and expand project.
  // Querying project and expanding tasks usually requires a defined detail relationship.
  // Keeping simplified for now.
};


(async () => {
    try {
        console.log("Starting server...");
        
        // --- 1. Seed Data (Optional, reused from previous logic) ---
        // Create some dummy data (System context to bypass hooks/setup data)
        const systemCtx = app.createContext({ isSystem: true });
        
        try {
            await systemCtx.object('projects').create({
                name: 'Website Redesign',
                status: 'in_progress',
                priority: 'high',
                owner: 'u-123'
            });
             await systemCtx.object('projects').create({
                name: 'Mobile App',
                status: 'planned',
                priority: 'high',
                owner: 'u-999'
            });
        } catch (e) {
            console.log("Error seeding data (might already exist):", e);
        }

        // --- 2. Start Express Server ---
        const server = express();
        server.use(cors());
        server.use(express.json());
        
        // Serve static files
        server.use(express.static(path.join(__dirname, '../public')));

        // Mount ObjectQL API
        // Example: /api/projects
        server.use('/api', createObjectQLRouter({
            objectql: app,
            swagger: {
                enabled: true,
                path: '/docs'
            },
            getContext: (req, res) => {
                // Simulate Authentication: Read User ID from header
                const userId = req.headers['x-user-id'] as string;
                if (userId === 'admin') {
                     return app.createContext({ isSystem: true });
                }
                return app.createContext({
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
