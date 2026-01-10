import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { objectql } from '../objectql/objectql.instance';

@Controller('api/v6/metadata')
export class MetadataController {
    
    @Get(':type/:name')
    async getMetadata(@Param('type') type: string, @Param('name') name: string) {
        try {
            const meta = objectql.metadata.get(type, name);
            if (!meta) {
                 throw new HttpException(`Metadata ${type}:${name} not found`, HttpStatus.NOT_FOUND);
            }
            return meta;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get(':type')
    async listMetadata(@Param('type') type: string) {
        try {
            return objectql.metadata.list(type);
        } catch (error: any) {
             throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
