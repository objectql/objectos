# @objectos/server (DEPRECATED)

> ⚠️ **DEPRECATED**: This package is deprecated and will be removed in future versions.
> 
> **Use `@objectos/plugin-server` instead.**

## Migration Guide

The `@objectos/server` package has been deprecated in favor of a plugin-based architecture.

### What Changed?

- **Old Architecture**: Standalone NestJS server package
- **New Architecture**: Server functionality as a runtime plugin

### Migration Steps

1. **Replace package dependency:**
   ```json
   // Before
   "@objectos/server": "^0.2.0"
   
   // After
   "@objectos/plugin-server": "workspace:*"
   ```

2. **Update your startup code:**
   ```typescript
   // Before (packages/server/src/main.ts)
   import { NestFactory } from '@nestjs/core';
   import { AppModule } from './app.module';
   
   async function bootstrap() {
     const app = await NestFactory.create(AppModule);
     await app.listen(3000);
   }
   bootstrap();
   
   // After (use runtime kernel)
   import { ObjectKernel } from '@objectstack/runtime';
   import { ServerPlugin } from '@objectos/plugin-server';
   
   async function bootstrap() {
     const kernel = new ObjectKernel();
     kernel.use(ServerPlugin);
     await kernel.bootstrap();
   }
   bootstrap();
   ```

3. **Update npm scripts:**
   ```json
   {
     "scripts": {
       "dev": "pnpm --filter @objectos/plugin-server dev",
       "start": "node packages/plugins/server/dist/bootstrap.js"
     }
   }
   ```

### Key Benefits

The new plugin-based server provides:

1. **Lifecycle Management**: Server starts/stops with kernel
2. **Service Registry**: Access other plugins via dependency injection
3. **Event System**: React to kernel events
4. **Modularity**: Server is just another plugin
5. **Testing**: Mock the server plugin in tests

### Migration Timeline

- **v0.2.x**: Kernel and server are deprecated but still functional
- **v0.3.x**: Kernel and server will show warnings
- **v0.4.x**: Kernel and server will be removed

### Need Help?

- See the [Server Plugin Documentation](../plugins/server/README.md)
- Check the [Migration Guide](../../docs/guide/migration-from-server.md)
- Open an issue on [GitHub](https://github.com/objectstack-ai/objectos/issues)
