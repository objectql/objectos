/**
 * GraphQL Plugin for ObjectOS
 *
 * Provides a full GraphQL API layer auto-generated from ObjectStack metadata:
 *
 * - O.1.1: Schema generation from metadata (object → GraphQL type mapping)
 * - O.1.2: Query resolvers with RBAC permission enforcement
 * - O.1.3: Mutation resolvers with audit logging
 *
 * The plugin registers a POST /api/v1/graphql endpoint on the Hono HTTP server.
 * In development mode, a GET /api/v1/graphql endpoint serves a simple
 * GraphQL Playground HTML page.
 *
 * @example
 * ```typescript
 * import { GraphQLPlugin } from '@objectos/graphql';
 *
 * new GraphQLPlugin({ playground: true });
 * ```
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import { graphql, getIntrospectionQuery, GraphQLSchema } from 'graphql';
import type {
  GraphQLConfig,
  ResolvedGraphQLConfig,
  GraphQLResolverContext,
  ObjectDef,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
import { generateSchema } from './schema-generator.js';
import { createResolverCallbacks } from './resolvers.js';

/**
 * Resolve user configuration with defaults
 */
function resolveConfig(config: GraphQLConfig = {}): ResolvedGraphQLConfig {
  const isDev = process.env.NODE_ENV !== 'production';
  return {
    enabled: config.enabled ?? true,
    path: config.path ?? '/api/v1/graphql',
    introspection: config.introspection ?? isDev,
    maxDepth: config.maxDepth ?? 10,
    maxComplexity: config.maxComplexity ?? 1000,
    defaultPageSize: config.defaultPageSize ?? 20,
    maxPageSize: config.maxPageSize ?? 100,
    playground: config.playground ?? isDev,
  };
}

/**
 * Simple GraphQL Playground HTML
 */
function getPlaygroundHTML(endpoint: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>ObjectOS GraphQL Playground</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0d1117; color: #e6edf3; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 1.5rem; border-bottom: 1px solid #30363d; padding-bottom: 1rem; }
    textarea { width: 100%; height: 200px; background: #161b22; color: #e6edf3; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; font-family: monospace; font-size: 14px; resize: vertical; }
    button { background: #238636; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 0.5rem; }
    button:hover { background: #2ea043; }
    pre { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; overflow: auto; max-height: 400px; font-size: 13px; }
    .label { color: #8b949e; font-size: 0.85rem; margin-bottom: 0.25rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔮 ObjectOS GraphQL Playground</h1>
    <div class="label">Query</div>
    <textarea id="query">{ __schema { queryType { name } mutationType { name } types { name kind } } }</textarea>
    <button onclick="run()">▶ Execute</button>
    <div class="label" style="margin-top:1rem">Response</div>
    <pre id="result">Click Execute to run a query</pre>
  </div>
  <script>
    async function run() {
      const query = document.getElementById('query').value;
      const res = await fetch('${endpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      document.getElementById('result').textContent = JSON.stringify(json, null, 2);
    }
  </script>
</body>
</html>`;
}

/**
 * GraphQL Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class GraphQLPlugin implements Plugin {
  name = '@objectos/graphql';
  version = '0.1.0';
  dependencies: string[] = [];

  private config: ResolvedGraphQLConfig;
  private schema?: GraphQLSchema;
  private context?: PluginContext;
  private startedAt?: number;
  private requestCount = 0;
  private errorCount = 0;

  constructor(config: GraphQLConfig = {}) {
    this.config = resolveConfig(config);
  }

  /**
   * Initialize plugin — build schema from metadata and register service
   */
  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    this.startedAt = Date.now();

    // Register GraphQL service
    context.registerService('graphql', this);

    context.logger.info('[GraphQL] Initialized successfully');
    await context.trigger('plugin.initialized', { pluginId: this.name });
  };

  /**
   * Start plugin — register HTTP routes for the GraphQL endpoint
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[GraphQL] Starting...');

    if (!this.config.enabled) {
      context.logger.info('[GraphQL] Disabled by config');
      return;
    }

    // Build schema from metadata
    const objects = this.loadObjectDefinitions(context);
    const callbacks = createResolverCallbacks(this.config);
    this.schema = generateSchema(objects, this.config, callbacks);

    context.logger.info(`[GraphQL] Schema generated with ${objects.length} object types`);

    // Register HTTP routes
    const httpServer = context.getService('http.server') as any;
    const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;

    if (rawApp) {
      const path = this.config.path;

      // POST /api/v1/graphql — execute GraphQL query
      rawApp.post(path, async (c: any) => {
        this.requestCount++;
        try {
          const body = await c.req.json();
          const { query, variables, operationName } = body;

          if (!query || typeof query !== 'string') {
            return c.json({ errors: [{ message: 'Query string is required' }] }, 400);
          }

          // Check introspection restriction
          if (!this.config.introspection && query.includes('__schema')) {
            return c.json({ errors: [{ message: 'Introspection is disabled' }] }, 403);
          }

          // Build resolver context from request
          const resolverContext = this.buildResolverContext(c, context);

          const result = await graphql({
            schema: this.schema!,
            source: query,
            variableValues: variables,
            operationName,
            contextValue: resolverContext,
          });

          if (result.errors?.length) {
            this.errorCount++;
          }

          return c.json(result);
        } catch (error: any) {
          this.errorCount++;
          context.logger.error(`[GraphQL] Execution error: ${(error as Error)?.message || error}`);
          return c.json({
            errors: [{ message: error.message || 'Internal server error' }],
          }, 500);
        }
      });

      // GET /api/v1/graphql — serve playground (dev only)
      if (this.config.playground) {
        rawApp.get(path, (c: any) => {
          return c.html(getPlaygroundHTML(path));
        });
      }

      // GET /api/v1/graphql/schema — introspection endpoint
      if (this.config.introspection) {
        rawApp.get(`${path}/schema`, async (c: any) => {
          try {
            const result = await graphql({
              schema: this.schema!,
              source: getIntrospectionQuery(),
            });
            return c.json(result);
          } catch (error: any) {
            return c.json({ errors: [{ message: error.message }] }, 500);
          }
        });
      }

      context.logger.info(`[GraphQL] Routes registered at ${path}`);
    } else {
      context.logger.warn('[GraphQL] HTTP server not available — routes not registered');
    }

    context.logger.info('[GraphQL] Started successfully');
    await context.trigger('plugin.started', { pluginId: this.name });
  }

  /**
   * Stop plugin
   */
  async stop(): Promise<void> {
    this.schema = undefined;
    this.context?.logger.info('[GraphQL] Stopped');
  }

  /**
   * Load object definitions from metadata
   */
  private loadObjectDefinitions(context: PluginContext): ObjectDef[] {
    const objects: ObjectDef[] = [];

    try {
      // Try to get object metadata via the broker
      const broker = (context as any).broker;
      if (broker) {
        // ObjectStack runtime stores metadata on the broker
        const meta = broker.getService?.('meta') ?? broker.metadata;
        if (meta) {
          const objectList = meta.getItems?.('object') ?? meta.objects ?? [];
          for (const obj of objectList) {
            if (obj && obj.name && obj.fields) {
              objects.push({
                name: obj.name,
                label: obj.label,
                description: obj.description,
                icon: obj.icon,
                fields: obj.fields,
              });
            }
          }
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      context.logger.warn(`[GraphQL] Could not load metadata: ${msg}`);
    }

    // Also load from YAML object definitions in the metadata patterns
    try {
      const objectqlService = context.getService('objectql') as any;
      if (objectqlService) {
        const allObjects = objectqlService.getObjects?.() ?? [];
        for (const obj of allObjects) {
          if (obj && obj.name && obj.fields && !objects.find(o => o.name === obj.name)) {
            objects.push({
              name: obj.name,
              label: obj.label,
              description: obj.description,
              icon: obj.icon,
              fields: obj.fields,
            });
          }
        }
      }
    } catch {
      // objectql service may not be available
    }

    return objects;
  }

  /**
   * Build resolver context from Hono request context
   */
  private buildResolverContext(c: any, context: PluginContext): GraphQLResolverContext {
    const broker = (context as any).broker ?? {
      call: async () => { throw new Error('Broker not available'); },
      getService: () => undefined,
    };

    // Extract user from auth session (set by auth middleware)
    const user = c.get?.('user') ?? c.req?.header?.('x-user-id')
      ? { id: c.req.header('x-user-id'), profile: c.req.header('x-user-profile') }
      : undefined;

    return {
      broker,
      user,
      ip: c.req?.header?.('x-forwarded-for') ?? c.req?.header?.('x-real-ip'),
      userAgent: c.req?.header?.('user-agent'),
      sessionId: c.req?.header?.('x-session-id'),
    };
  }

  // ─── Service API ─────────────────────────────────────────────────

  /**
   * Get the generated GraphQL schema
   */
  getSchema(): GraphQLSchema | undefined {
    return this.schema;
  }

  /**
   * Regenerate the schema (useful after metadata changes)
   */
  regenerateSchema(): void {
    if (this.context) {
      const objects = this.loadObjectDefinitions(this.context);
      const callbacks = createResolverCallbacks(this.config);
      this.schema = generateSchema(objects, this.config, callbacks);
      this.context.logger.info(`[GraphQL] Schema regenerated with ${objects.length} object types`);
    }
  }

  /**
   * Execute a GraphQL query programmatically
   */
  async execute(query: string, variables?: Record<string, any>, ctx?: Partial<GraphQLResolverContext>): Promise<any> {
    if (!this.schema) {
      throw new Error('GraphQL schema not initialized');
    }

    const resolverContext: GraphQLResolverContext = {
      broker: ctx?.broker ?? ((this.context as any)?.broker ?? {
        call: async () => { throw new Error('Broker not available'); },
        getService: () => undefined,
      }),
      user: ctx?.user,
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
      sessionId: ctx?.sessionId,
    };

    return graphql({
      schema: this.schema,
      source: query,
      variableValues: variables,
      contextValue: resolverContext,
    });
  }

  // ─── Lifecycle Inspection ────────────────────────────────────────

  /**
   * Health check
   */
  getHealthReport(): PluginHealthReport {
    return {
      status: this.schema ? 'healthy' : 'degraded',
      message: this.schema
        ? `GraphQL operational (${this.requestCount} requests, ${this.errorCount} errors)`
        : 'Schema not generated',
      details: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        schemaGenerated: !!this.schema,
      },
    };
  }

  /**
   * Capability manifest
   */
  getCapabilities(): PluginCapabilityManifest {
    return {
      id: this.name,
      provides: ['graphql', 'graphql.execute', 'graphql.schema'],
      consumes: ['http.server', 'permissions', 'audit', 'objectql', 'meta'],
    };
  }

  /**
   * Security manifest
   */
  getSecurityManifest(): PluginSecurityManifest {
    return {
      permissions: ['graphql.execute', 'graphql.introspect'],
      dataAccess: ['read', 'create', 'update', 'delete'],
    };
  }

  /**
   * Startup result
   */
  getStartupResult(): PluginStartupResult {
    return {
      success: !!this.schema,
      message: this.schema ? 'GraphQL plugin started' : 'Schema generation pending',
    };
  }
}
