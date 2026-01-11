import { Controller, Get, Param, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ObjectOS } from '@objectos/kernel';

@Controller('api/metadata')
export class MetadataController {
    
    constructor(@Inject(ObjectOS) private objectql: ObjectOS) {}

    @Get(':type/:name')
    async getMetadata(@Param('type') type: string, @Param('name') name: string) {
        
    }

}
