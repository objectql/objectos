import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, Req } from '@nestjs/common';
import { objectql } from '../objectql/objectql.instance';

@Controller('api/v6/data/:objectName')
export class DataController {
    
    private getContext(req: any) {
        const user = req.user || {};
        return objectql.createContext({
            userId: user.userId || user.id || user.sub,
            spaceId: user.spaceId,
            roles: user.roles,
            isSystem: user.isSystem
        });
    }

    @Get()
    async find(
        @Param('objectName') objectName: string,
        @Query() query: any,
        @Req() req: any
    ) {
        try {
            const context = this.getContext(req);
            const repo = context.object(objectName);
            
            // Transform query parameters
            const findOptions: any = {};
            
            // 1. Filters: filters=["status","=","active"] or JSON string
            if (query.filters) {
                try {
                    findOptions.filters = typeof query.filters === 'string' 
                        ? JSON.parse(query.filters) 
                        : query.filters;
                } catch (e) {
                    throw new HttpException('Invalid filters format', HttpStatus.BAD_REQUEST);
                }
            }

            // 2. Select: select=name,amount,owner
            if (query.select) {
                findOptions.fields = query.select.split(',');
            }

            // 3. Expand: expand=owner,company
            if (query.expand) {
                 // ObjectQL expects array of strings for expand usually, or formatted string
                 findOptions.expand = query.expand.split(',');
            }

            // 4. Sort: sort=amount:desc,created:asc
            if (query.sort) {
                findOptions.sort = query.sort;
            }

            // 5. Pagination: skip=0&limit=20
            if (query.skip) findOptions.skip = parseInt(query.skip);
            if (query.limit || query.top) findOptions.top = parseInt(query.limit || query.top);
            
            // Add count parameter
            if (query.count) findOptions.count = true;

            const results = await repo.find(findOptions);
            return results;
        } catch (error: any) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get(':id')
    async findOne(
        @Param('objectName') objectName: string,
        @Param('id') id: string,
        @Query('expand') expand: string,
        @Query('select') select: string,
        @Req() req: any
    ) {
        try {
            const context = this.getContext(req);
            const repo = context.object(objectName);
            const options: any = {};
            
            if (expand) options.expand = expand.split(',');
            if (select) options.fields = select.split(',');

            // If options has expand or fields, we might need to use find with ID filter
            // But repo.findOne supports options as second argument?
            // Checking signature: findOne(idOrQuery)
            // It seems findOne in repo might handle ID or Query. 
            // If we want options, better to construct a query with ID.
            
            let query: any = {};
            if (Object.keys(options).length > 0) {
                 query = { ...options };
            }
            // Passing ID to findOne is supported, but extra options?
            // If findOne(id) returns promise<any>, maybe it doesn't support options directly
            // Let's use find with filters for specific ID if options are present.
            
            // Actually, looks like I can't pass options to findOne(id).
            // Let's use findOne({ filters: [['_id', '=', id]], ...options })
            
            const result = await repo.findOne({
                filters: [['_id', '=', id]],
                ...options
            });

            if (!result) {
                throw new HttpException('Record not found', HttpStatus.NOT_FOUND);
            }
            return result;
        } catch (error: any) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Post()
    async create(
        @Param('objectName') objectName: string,
        @Body() body: any,
        @Req() req: any
    ) {
        try {
            const context = this.getContext(req);
            const repo = context.object(objectName);
            const result = await repo.create(body);
            return result;
        } catch (error: any) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Put(':id')
    async update(
        @Param('objectName') objectName: string,
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any
    ) {
        try {
            const context = this.getContext(req);
            const repo = context.object(objectName);
            const result = await repo.update(id, body);
            return result;
        } catch (error: any) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Delete(':id')
    async delete(
        @Param('objectName') objectName: string,
        @Param('id') id: string,
        @Req() req: any
    ) {
        try {
            const context = this.getContext(req);
            const repo = context.object(objectName);
            const result = await repo.delete(id);
            return result;
        } catch (error: any) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
