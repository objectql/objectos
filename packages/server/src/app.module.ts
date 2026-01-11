import { Module, MiddlewareConsumer, RequestMethod, NestModule, Inject } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ObjectQLModule } from './objectql/objectql.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, resolve } from 'path';
import { AuthMiddleware } from './auth/auth.middleware.js';
import { ObjectOS } from '@objectos/kernel';
import { createRESTHandler, createMetadataHandler, createNodeHandler, createStudioHandler } from '@objectql/server';

const clientDistPath = resolve(process.cwd(), process.cwd().endsWith('api') ? '../client/dist' : 'packages/client/dist');

@Module({
  imports: [
    ObjectQLModule, 
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: clientDistPath,
      exclude: ['/api/(.*)', '/docs/(.*)', '/studio/(.*)'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(@Inject(ObjectOS) private objectos: ObjectOS) {}

  configure(consumer: MiddlewareConsumer) {
    const restHandler = createRESTHandler(this.objectos);
    const metadataHandler = createMetadataHandler(this.objectos);
    const objectQLHandler = createNodeHandler(this.objectos);
    const studioHandler = createStudioHandler();

    const stripPrefix = (prefix: string, handler: any) => {
      return (req: any, res: any, next: any) => {
        // We do NOT strip prefix for REST API because @objectql/server expects /api/data/:object
        // But we DO strip for others that don't expect it?
        // Let's check:
        // Studio usually expects assets at relative root.
        // ObjectQL Node Handler usually expects POST / (body contains op)
        // Metadata handler likely expects /:type or /:type/:name
        
        // HOWEVER, based on reading @objectql/server/dist/adapters/rest.js, 
        // it explicitly checks: url.match(/^\/api\/data\/([^\/\?]+)(?:\/([^\/\?]+))?(\?.*)?$/)
        // So it REQUIRES the URL to start with /api/data/ !!!
        
        // Therefore, for REST handler, we MUST NOT strip the prefix if it's currently matching /api/data*
        
        // For ObjectQL handler (rpc), it just reads body, so path likely ignored or should be /
        // For Metadata handler, probably expects /:type
        
        if (prefix === '/api/data') {
             // For REST API, do NOT strip, pass through as is.
             // But Wait! NestJS might have already consumed part of it? 
             // "consumer.forRoutes" does NOT strip prefix. req.url is full path.
             // So if we just pass handler, req.url is /api/data/projects
             // And REST handler regex expects ^/api/data/...
             // So for REST handler, we just return handler directly without strip logic.
             return handler(req, res, next);
        }

        if (prefix === '/api/metadata') {
             // Metadata Handler explicitly matches full URLs like /api/metadata/objects.
             // See @objectql/server/dist/metadata.js
             return handler(req, res, next);
        }

        // For others, strip as before
          if (req.originalUrl.startsWith(prefix)) {
             const urlPart = req.originalUrl.substring(prefix.length);
             req.url = urlPart || '/';
             if (req.url.startsWith('?')) {
                 req.url = '/' + req.url;
             }
        }

        // UX Improvement: If visiting JSON-RPC root with GET, show friendly message instead of 405
        if (prefix === '/api/objectql' && req.method === 'GET' && (req.url === '/' || req.url === '')) {
             res.setHeader('Content-Type', 'application/json');
             res.end(JSON.stringify({
                 code: 'OK',
                 message: 'ObjectOS JSON-RPC Server',
                 hint: 'Use POST request with Body: { op, object, args }'
             }));
             return;
        }

        return handler(req, res, next);
      };
    };

    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'api/*', method: RequestMethod.ALL });

    consumer
      .apply(stripPrefix('/api/data', restHandler))
      .forRoutes({ path: 'api/data*', method: RequestMethod.ALL });

    consumer
        .apply(stripPrefix('/api/metadata', metadataHandler))
        .forRoutes({ path: 'api/metadata*', method: RequestMethod.ALL });

    consumer
        .apply(stripPrefix('/api/objectql', objectQLHandler))
        .forRoutes({ path: 'api/objectql*', method: RequestMethod.ALL });
        
    consumer
        .apply(stripPrefix('/studio', studioHandler))
        .forRoutes({ path: 'studio*', method: RequestMethod.ALL });
  }
}
