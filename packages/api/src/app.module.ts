import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ObjectQLModule } from './objectql/objectql.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, resolve } from 'path';
import { DataController } from './controllers/data.controller';
import { MetadataController } from './controllers/metadata.controller';
import { AuthMiddleware } from './auth/auth.middleware';

const clientDistPath = resolve(process.cwd(), process.cwd().endsWith('api') ? '../client/dist' : 'packages/client/dist');

@Module({
  imports: [
    ObjectQLModule, 
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: clientDistPath,
      exclude: ['/api/(.*)', '/docs/(.*)'],
    }),
  ],
  controllers: [AppController, DataController, MetadataController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'api/v6/*', method: RequestMethod.ALL });
  }
}
