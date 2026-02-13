/**
 * GraphQL Plugin Types for ObjectOS
 */

import type { GraphQLSchema } from 'graphql';

/**
 * Configuration for the GraphQL plugin
 */
export interface GraphQLConfig {
  /** Enable or disable the GraphQL API (default: true) */
  enabled?: boolean;

  /** API path prefix (default: '/api/v1/graphql') */
  path?: string;

  /** Enable introspection queries (default: true in dev, false in prod) */
  introspection?: boolean;

  /** Maximum query depth to prevent abuse (default: 10) */
  maxDepth?: number;

  /** Maximum query complexity score (default: 1000) */
  maxComplexity?: number;

  /** Default page size for list queries (default: 20) */
  defaultPageSize?: number;

  /** Maximum page size for list queries (default: 100) */
  maxPageSize?: number;

  /** Enable GraphQL Playground at /api/v1/graphql (GET) (default: true in dev) */
  playground?: boolean;
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedGraphQLConfig {
  enabled: boolean;
  path: string;
  introspection: boolean;
  maxDepth: number;
  maxComplexity: number;
  defaultPageSize: number;
  maxPageSize: number;
  playground: boolean;
}

/**
 * Object field definition from metadata
 */
export interface ObjectFieldDef {
  type: string;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  options?: string[];
  default?: any;
  blackbox?: boolean;
  label?: string;
  description?: string;
  reference_to?: string;
}

/**
 * Object definition from metadata
 */
export interface ObjectDef {
  name: string;
  label?: string;
  icon?: string;
  description?: string;
  fields: Record<string, ObjectFieldDef>;
}

/**
 * GraphQL resolver context — passed to every resolver
 */
export interface GraphQLResolverContext {
  /** The ObjectStack broker for data operations */
  broker: any;
  /** Current user info (from auth) */
  user?: { id: string; profile?: string };
  /** Request IP address */
  ip?: string;
  /** Request user agent */
  userAgent?: string;
  /** Session ID */
  sessionId?: string;
  /** Per-request DataLoader factory (O.1.5) */
  dataLoaders?: DataLoaderFactory;
}

/**
 * Result from a paginated list query
 */
export interface PaginatedResult<T = any> {
  data: T[];
  totalCount: number;
  pageSize: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Plugin health report
 */
export interface PluginHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
}

/**
 * Plugin capability manifest
 */
export interface PluginCapabilityManifest {
  id: string;
  provides: string[];
  consumes: string[];
}

/**
 * Plugin security manifest
 */
export interface PluginSecurityManifest {
  permissions: string[];
  dataAccess: string[];
}

/**
 * Plugin startup result
 */
export interface PluginStartupResult {
  success: boolean;
  message?: string;
}

/**
 * Subscription hooks — fired after mutation operations to publish events
 */
export interface SubscriptionHooks {
  afterCreate(objectName: string, record: any, ctx: GraphQLResolverContext): void;
  afterUpdate(objectName: string, record: any, ctx: GraphQLResolverContext): void;
  afterDelete(objectName: string, id: string, ctx: GraphQLResolverContext): void;
}

/**
 * DataLoader factory for per-request batching/caching
 */
export interface DataLoaderFactory {
  getLoader(objectName: string): {
    load(key: string): Promise<any>;
    loadMany(keys: string[]): Promise<any[]>;
  };
  clearAll(): void;
}
