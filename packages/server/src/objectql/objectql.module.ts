import { Module, MiddlewareConsumer, RequestMethod, OnModuleInit } from '@nestjs/common';
import { createObjectQLRouter } from '@objectql/api';
import { objectql } from './objectql.instance';

@Module({
    exports: []
})
export class ObjectQLModule implements OnModuleInit {
    async onModuleInit() {
        await objectql.init();
        console.log('ObjectQL Initialized');
    }

    configure(consumer: MiddlewareConsumer) {
        const router = createObjectQLRouter({
            objectql,
            swagger: {
                enabled: true,
                path: '/docs'
            },
            getContext: (req) => {
                // simple auth simulation
                const userId = req.headers['x-user-id'] as string;
                if (userId === 'admin') {
                     return objectql.createContext({ isSystem: true });
                }
                return objectql.createContext({
                    userId: userId
                });
            }
        });

        consumer
            .apply((req: any, res: any, next: any) => {
                if (req.url.startsWith('/api')) {
                    req.url = req.url.replace(/^\/api/, '') || '/';
                }
                router(req, res, next);
            })
            .forRoutes('api');
    }
}
