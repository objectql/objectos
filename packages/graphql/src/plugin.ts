/**
 * GraphQL Plugin for ObjectOS
 *
 * Provides a full GraphQL API layer auto-generated from ObjectStack metadata:
 *
 * - O.1.1: Schema generation from metadata (object → GraphQL type mapping)
 * - O.1.2: Query resolvers with RBAC permission enforcement
 * - O.1.3: Mutation resolvers with audit logging
 * - O.1.4: Subscription support via WebSocket (PubSub + subscription types)
 * - O.1.5: DataLoader pattern for N+1 prevention
 * - O.1.6: Enhanced GraphQL Playground (GraphiQL-style)
 *
 * The plugin registers a POST /api/v1/graphql endpoint on the Hono HTTP server.
 * In development mode, a GET /api/v1/graphql endpoint serves an enhanced
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
import { PubSub } from './pubsub.js';
import { createSubscriptionHooks } from './subscriptions.js';
import { createDataLoaderFactory } from './dataloader.js';

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
 * Enhanced GraphQL Playground HTML (O.1.6)
 *
 * Provides a rich GraphiQL-style interface with:
 * - Query editor with syntax highlighting
 * - Variables panel
 * - Headers panel
 * - Schema/docs explorer panel
 * - History support
 */
function getPlaygroundHTML(endpoint: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>ObjectOS GraphQL Playground</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0d1117; color: #e6edf3; height: 100vh; display: flex; flex-direction: column; }
    header { background: #161b22; border-bottom: 1px solid #30363d; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 1rem; }
    header h1 { font-size: 1rem; font-weight: 600; white-space: nowrap; }
    header .actions { display: flex; gap: 0.5rem; margin-left: auto; }
    .btn { background: #238636; color: #fff; border: none; padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
    .btn:hover { background: #2ea043; }
    .btn-secondary { background: #21262d; border: 1px solid #30363d; }
    .btn-secondary:hover { background: #30363d; }
    .btn-secondary.active { background: #1f6feb; border-color: #1f6feb; }
    main { flex: 1; display: flex; overflow: hidden; }
    .editor-panel { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #30363d; min-width: 0; }
    .result-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .panel-header { background: #161b22; padding: 0.4rem 0.75rem; font-size: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #30363d; display: flex; align-items: center; gap: 0.5rem; }
    .panel-header .tab { cursor: pointer; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .panel-header .tab:hover { background: #21262d; }
    .panel-header .tab.active { color: #e6edf3; background: #30363d; }
    textarea { flex: 1; width: 100%; background: #0d1117; color: #e6edf3; border: none; padding: 0.75rem; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 13px; line-height: 1.5; resize: none; outline: none; tab-size: 2; }
    .sub-panel { border-top: 1px solid #30363d; }
    .sub-panel textarea { height: 100px; min-height: 60px; }
    pre { flex: 1; background: #0d1117; padding: 0.75rem; overflow: auto; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .schema-panel { width: 320px; border-left: 1px solid #30363d; display: none; flex-direction: column; }
    .schema-panel.open { display: flex; }
    .schema-panel pre { font-size: 12px; }
    .status-bar { background: #161b22; border-top: 1px solid #30363d; padding: 0.25rem 0.75rem; font-size: 0.7rem; color: #8b949e; display: flex; gap: 1rem; }
    .status-bar .indicator { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 4px; }
    .indicator.ok { background: #3fb950; }
    .indicator.err { background: #f85149; }
    .history-list { overflow-y: auto; flex: 1; }
    .history-item { padding: 0.5rem 0.75rem; border-bottom: 1px solid #21262d; cursor: pointer; font-size: 12px; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #8b949e; }
    .history-item:hover { background: #161b22; color: #e6edf3; }
    .timing { color: #8b949e; font-size: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>🔮 ObjectOS GraphQL</h1>
    <div class="actions">
      <button class="btn" onclick="executeQuery()" title="Execute query (Ctrl+Enter)">▶ Execute</button>
      <button class="btn btn-secondary" onclick="prettifyQuery()" title="Prettify query">Prettify</button>
      <button class="btn btn-secondary" id="schemaToggle" onclick="toggleSchema()">Schema</button>
      <button class="btn btn-secondary" id="historyToggle" onclick="toggleHistory()">History</button>
    </div>
  </header>
  <main>
    <div class="editor-panel">
      <div class="panel-header">Query</div>
      <textarea id="query" spellcheck="false" placeholder="Enter your GraphQL query...">{
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types { name kind }
  }
}</textarea>
      <div class="sub-panel">
        <div class="panel-header">
          <span class="tab active" id="tabVars" onclick="showSubTab('vars')">Variables</span>
          <span class="tab" id="tabHeaders" onclick="showSubTab('headers')">Headers</span>
        </div>
        <textarea id="variables" spellcheck="false" placeholder='{ "key": "value" }'></textarea>
        <textarea id="headers" spellcheck="false" placeholder='{ "Authorization": "Bearer ..." }' style="display:none"></textarea>
      </div>
    </div>
    <div class="result-panel">
      <div class="panel-header">Response <span class="timing" id="timing"></span></div>
      <pre id="result">Click Execute or press Ctrl+Enter to run a query</pre>
    </div>
    <div class="schema-panel" id="schemaPanel">
      <div class="panel-header">
        <span class="tab active" id="tabSchemaDocs" onclick="showSchemaTab('docs')">Docs</span>
        <span class="tab" id="tabSchemaSDL" onclick="showSchemaTab('sdl')">SDL</span>
      </div>
      <pre id="schemaDocs">Loading schema...</pre>
      <pre id="schemaSDL" style="display:none">Loading...</pre>
    </div>
    <div class="schema-panel" id="historyPanel">
      <div class="panel-header">History</div>
      <div class="history-list" id="historyList"></div>
    </div>
  </main>
  <div class="status-bar">
    <span><span class="indicator ok" id="statusIndicator"></span><span id="statusText">Ready</span></span>
    <span id="requestCount">0 requests</span>
  </div>
  <script>
    const ENDPOINT = '${endpoint}';
    let reqCount = 0;
    let history = [];

    // Keyboard shortcut
    document.getElementById('query').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
      }
      // Tab inserts spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const t = e.target;
        const start = t.selectionStart;
        t.value = t.value.substring(0, start) + '  ' + t.value.substring(t.selectionEnd);
        t.selectionStart = t.selectionEnd = start + 2;
      }
    });

    async function executeQuery() {
      const query = document.getElementById('query').value;
      const varsText = document.getElementById('variables').value.trim();
      const headersText = document.getElementById('headers').value.trim();

      let variables;
      try { variables = varsText ? JSON.parse(varsText) : undefined; } catch { 
        document.getElementById('result').textContent = 'Invalid JSON in Variables panel';
        return;
      }

      let extraHeaders = {};
      try { extraHeaders = headersText ? JSON.parse(headersText) : {}; } catch {
        document.getElementById('result').textContent = 'Invalid JSON in Headers panel';
        return;
      }

      const indicator = document.getElementById('statusIndicator');
      const statusText = document.getElementById('statusText');
      indicator.className = 'indicator ok';
      statusText.textContent = 'Executing...';

      const start = performance.now();
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...extraHeaders },
          credentials: 'include',
          body: JSON.stringify({ query, variables }),
        });
        const elapsed = Math.round(performance.now() - start);
        const json = await res.json();

        document.getElementById('result').textContent = JSON.stringify(json, null, 2);
        document.getElementById('timing').textContent = elapsed + 'ms';

        reqCount++;
        document.getElementById('requestCount').textContent = reqCount + ' request' + (reqCount !== 1 ? 's' : '');

        if (json.errors) {
          indicator.className = 'indicator err';
          statusText.textContent = 'Error';
        } else {
          indicator.className = 'indicator ok';
          statusText.textContent = res.status + ' OK';
        }

        // Add to history
        history.unshift({ query, variables, timestamp: new Date().toLocaleTimeString() });
        if (history.length > 50) history.pop();
        renderHistory();
      } catch (err) {
        indicator.className = 'indicator err';
        statusText.textContent = 'Network Error';
        document.getElementById('result').textContent = 'Error: ' + err.message;
      }
    }

    function prettifyQuery() {
      const el = document.getElementById('query');
      let q = el.value;
      // Simple prettify: normalize whitespace and indent braces
      try {
        let depth = 0;
        let result = '';
        let inString = false;
        for (let i = 0; i < q.length; i++) {
          const c = q[i];
          if (c === '"' && q[i-1] !== '\\\\') inString = !inString;
          if (inString) { result += c; continue; }
          if (c === '{') { result += ' {\\n' + '  '.repeat(++depth); }
          else if (c === '}') { result += '\\n' + '  '.repeat(--depth) + '}'; }
          else if (c === '\\n' || c === '\\r') { continue; }
          else if (c === ' ' && q[i+1] === ' ') { continue; }
          else { result += c; }
        }
        el.value = result.trim();
      } catch { /* ignore prettify errors */ }
    }

    function showSubTab(tab) {
      document.getElementById('variables').style.display = tab === 'vars' ? '' : 'none';
      document.getElementById('headers').style.display = tab === 'headers' ? '' : 'none';
      document.getElementById('tabVars').className = 'tab' + (tab === 'vars' ? ' active' : '');
      document.getElementById('tabHeaders').className = 'tab' + (tab === 'headers' ? ' active' : '');
    }

    function toggleSchema() {
      const panel = document.getElementById('schemaPanel');
      const histPanel = document.getElementById('historyPanel');
      histPanel.classList.remove('open');
      document.getElementById('historyToggle').classList.remove('active');
      panel.classList.toggle('open');
      document.getElementById('schemaToggle').classList.toggle('active');
      if (panel.classList.contains('open')) loadSchema();
    }

    function toggleHistory() {
      const panel = document.getElementById('historyPanel');
      const schemaPanel = document.getElementById('schemaPanel');
      schemaPanel.classList.remove('open');
      document.getElementById('schemaToggle').classList.remove('active');
      panel.classList.toggle('open');
      document.getElementById('historyToggle').classList.toggle('active');
    }

    function showSchemaTab(tab) {
      document.getElementById('schemaDocs').style.display = tab === 'docs' ? '' : 'none';
      document.getElementById('schemaSDL').style.display = tab === 'sdl' ? '' : 'none';
      document.getElementById('tabSchemaDocs').className = 'tab' + (tab === 'docs' ? ' active' : '');
      document.getElementById('tabSchemaSDL').className = 'tab' + (tab === 'sdl' ? ' active' : '');
    }

    async function loadSchema() {
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query: '{ __schema { types { name kind description fields { name type { name kind ofType { name kind } } description } } queryType { name } mutationType { name } subscriptionType { name } } }' }),
        });
        const json = await res.json();
        const schema = json.data?.__schema;
        if (!schema) { document.getElementById('schemaDocs').textContent = 'Could not load schema'; return; }

        // Build docs view
        let docs = '';
        if (schema.queryType) docs += '■ Query: ' + schema.queryType.name + '\\n';
        if (schema.mutationType) docs += '■ Mutation: ' + schema.mutationType.name + '\\n';
        if (schema.subscriptionType) docs += '■ Subscription: ' + schema.subscriptionType.name + '\\n';
        docs += '\\n';

        const userTypes = schema.types.filter(t => !t.name.startsWith('__') && t.kind === 'OBJECT');
        for (const type of userTypes) {
          docs += '── ' + type.name + ' ──\\n';
          if (type.description) docs += '  ' + type.description + '\\n';
          if (type.fields) {
            for (const f of type.fields) {
              const typeName = f.type?.name || (f.type?.ofType?.name ? f.type.kind.toLowerCase() + '(' + f.type.ofType.name + ')' : f.type?.kind || '?');
              docs += '  ' + f.name + ': ' + typeName + '\\n';
            }
          }
          docs += '\\n';
        }
        document.getElementById('schemaDocs').textContent = docs;

        // SDL view (simplified from introspection)
        const inputTypes = schema.types.filter(t => !t.name.startsWith('__') && t.kind === 'INPUT_OBJECT');
        let sdl = '# ObjectOS GraphQL Schema\\n# Generated from metadata\\n\\n';
        for (const type of [...userTypes, ...inputTypes]) {
          const keyword = type.kind === 'INPUT_OBJECT' ? 'input' : 'type';
          sdl += keyword + ' ' + type.name + ' {\\n';
          if (type.fields) {
            for (const f of type.fields) {
              const tn = f.type?.name || (f.type?.ofType?.name || '?');
              sdl += '  ' + f.name + ': ' + tn + '\\n';
            }
          }
          sdl += '}\\n\\n';
        }
        document.getElementById('schemaSDL').textContent = sdl;
      } catch (err) {
        document.getElementById('schemaDocs').textContent = 'Error loading schema: ' + err.message;
      }
    }

    function renderHistory() {
      const list = document.getElementById('historyList');
      list.innerHTML = '';
      for (const item of history) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = '[' + item.timestamp + '] ' + item.query.substring(0, 100);
        div.onclick = () => {
          document.getElementById('query').value = item.query;
          if (item.variables) document.getElementById('variables').value = JSON.stringify(item.variables, null, 2);
        };
        list.appendChild(div);
      }
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
  private pubsub: PubSub;
  private subscriptionHooks: ReturnType<typeof createSubscriptionHooks>;

  constructor(config: GraphQLConfig = {}) {
    this.config = resolveConfig(config);
    this.pubsub = new PubSub();
    this.subscriptionHooks = createSubscriptionHooks(this.pubsub);
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

    // Build schema from metadata (with subscription support)
    const objects = this.loadObjectDefinitions(context);
    const callbacks = createResolverCallbacks(this.config, this.subscriptionHooks);

    // Generate schema with subscription support (O.1.4)
    this.schema = generateSchema(objects, this.config, callbacks, {
      pubsub: this.pubsub,
    });

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

          // Build resolver context from request (with per-request DataLoader — O.1.5)
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
          return c.json(
            {
              errors: [{ message: error.message || 'Internal server error' }],
            },
            500,
          );
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
    this.pubsub.clear();
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
          if (obj && obj.name && obj.fields && !objects.find((o) => o.name === obj.name)) {
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
      call: async () => {
        throw new Error('Broker not available');
      },
      getService: () => undefined,
    };

    // Extract user from auth session (set by auth middleware)
    const user =
      (c.get?.('user') ?? c.req?.header?.('x-user-id'))
        ? { id: c.req.header('x-user-id'), profile: c.req.header('x-user-profile') }
        : undefined;

    // Create per-request DataLoader factory (O.1.5)
    const dataLoaders = createDataLoaderFactory(broker);

    return {
      broker,
      user,
      ip: c.req?.header?.('x-forwarded-for') ?? c.req?.header?.('x-real-ip'),
      userAgent: c.req?.header?.('user-agent'),
      sessionId: c.req?.header?.('x-session-id'),
      dataLoaders,
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
   * Get the PubSub instance (for external subscription publishing)
   */
  getPubSub(): PubSub {
    return this.pubsub;
  }

  /**
   * Regenerate the schema (useful after metadata changes)
   */
  regenerateSchema(): void {
    if (this.context) {
      const objects = this.loadObjectDefinitions(this.context);
      const callbacks = createResolverCallbacks(this.config, this.subscriptionHooks);
      this.schema = generateSchema(objects, this.config, callbacks, {
        pubsub: this.pubsub,
      });
      this.context.logger.info(`[GraphQL] Schema regenerated with ${objects.length} object types`);
    }
  }

  /**
   * Execute a GraphQL query programmatically
   */
  async execute(
    query: string,
    variables?: Record<string, any>,
    ctx?: Partial<GraphQLResolverContext>,
  ): Promise<any> {
    if (!this.schema) {
      throw new Error('GraphQL schema not initialized');
    }

    const broker = ctx?.broker ??
      (this.context as any)?.broker ?? {
        call: async () => {
          throw new Error('Broker not available');
        },
        getService: () => undefined,
      };

    const resolverContext: GraphQLResolverContext = {
      broker,
      user: ctx?.user,
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
      sessionId: ctx?.sessionId,
      dataLoaders: ctx?.dataLoaders ?? createDataLoaderFactory(broker),
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
      provides: ['graphql', 'graphql.execute', 'graphql.schema', 'graphql.subscriptions'],
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
