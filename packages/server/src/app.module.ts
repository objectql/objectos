import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ObjectQLModule } from './objectql/objectql.module';

@Module({
  imports: [ObjectQLModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
