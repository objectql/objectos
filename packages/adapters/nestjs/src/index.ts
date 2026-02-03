import { DynamicModule, Module, Global, Inject, Provider, Controller, Post, Get, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ObjectKernel } from '@objectstack/runtime';

export const OBJECT_KERNEL = 'OBJECT_KERNEL';

// --- Service ---

@Injectable()
export class ObjectStackService {
  constructor(@Inject(OBJECT_KERNEL) private readonly kernel: any) {}

  getKernel() {
    return this.kernel;
  }

  async executeGraphQL(query: string, variables: any, request: any) {
    return this.kernel.graphql(query, variables, { request });
  }

  async call(action: string, params: any, request: any) {
    return this.kernel.broker.call(action, params, { request });
  }
}

// --- Controller ---

@Controller('api')
export class ObjectStackController {
  constructor(private readonly service: ObjectStackService) {}

  private success(data: any, meta?: any) {
    return { success: true, data, meta };
  }

  @Post('graphql')
  async graphql(@Body() body: any, @Req() req: any) {
    const { query, variables } = body;
    return this.service.executeGraphQL(query, variables, req);
  }

  // Auth
  @Post('auth/login')
  async login(@Body() body: any, @Req() req: any) {
    // Auth endpoints often return direct token response as per Spec example
    return this.service.call('auth.login', body, req);
  }

  // Metadata
  @Get('metadata')
  async listObjects(@Req() req: any) {
    const data = await this.service.call('metadata.objects', {}, req);
    return this.success(data);
  }

  @Get('metadata/:objectName')
  async getObject(@Param('objectName') objectName: string, @Req() req: any) {
    const data = await this.service.call('metadata.getObject', { objectName }, req);
    return this.success(data);
  }

  // Data
  @Post('data/:objectName/query')
  async query(@Param('objectName') objectName: string, @Body() body: any, @Req() req: any) {
    const result = await this.service.call('data.query', { object: objectName, ...body }, req);
    return this.success(result.data, { count: result.count, limit: body.limit, skip: body.skip });
  }

  @Get('data/:objectName/:id')
  async get(@Param('objectName') objectName: string, @Param('id') id: string, @Query() query: any, @Req() req: any) {
    const data = await this.service.call('data.get', { object: objectName, id, ...query }, req);
    return this.success(data);
  }

  @Post('data/:objectName')
  async create(@Param('objectName') objectName: string, @Body() body: any, @Req() req: any) {
    const data = await this.service.call('data.create', { object: objectName, data: body }, req);
    return this.success(data);
  }

  @Patch('data/:objectName/:id')
  async update(@Param('objectName') objectName: string, @Param('id') id: string, @Body() body: any, @Req() req: any) {
    const data = await this.service.call('data.update', { object: objectName, id, data: body }, req);
    return this.success(data);
  }

  @Delete('data/:objectName/:id')
  async delete(@Param('objectName') objectName: string, @Param('id') id: string, @Req() req: any) {
    await this.service.call('data.delete', { object: objectName, id }, req);
    return this.success({ id, deleted: true });
  }

  @Post('data/:objectName/batch')
  async batch(@Param('objectName') objectName: string, @Body() body: any, @Req() req: any) {
    const data = await this.service.call('data.batch', { object: objectName, operations: body.operations }, req);
    return this.success(data);
  }
}

// --- Module ---

@Global()
@Module({})
export class ObjectStackModule {
  static forRoot(kernel: ObjectKernel): DynamicModule {
    const kernelProvider: Provider = {
      provide: OBJECT_KERNEL,
      useValue: kernel,
    };

    return {
      module: ObjectStackModule,
      controllers: [ObjectStackController],
      providers: [kernelProvider, ObjectStackService],
      exports: [kernelProvider, ObjectStackService],
    };
  }
}
