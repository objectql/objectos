import { Module, Global } from '@nestjs/common';
import { objectQLProvider } from './objectql.provider.js';

@Global()
@Module({
    providers: [objectQLProvider],
    exports: [objectQLProvider]
})
export class ObjectQLModule {}

