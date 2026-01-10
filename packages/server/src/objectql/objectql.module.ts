import { Module, MiddlewareConsumer, RequestMethod, OnModuleInit } from '@nestjs/common';
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
    }
}
