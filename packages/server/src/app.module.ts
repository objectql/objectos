import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ViewsController } from './views/views.controller';
import { ObjectQLModule } from './objectql/objectql.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ObjectQLModule, 
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../ui/dist'),
      serveRoot: '/assets/ui',
      renderPath: '/assets/ui/*' // Prevent fallback to index.html for api or other routes
    }),
  ],
  controllers: [AppController, ViewsController],
  providers: [AppService],
})
export class AppModule {}
