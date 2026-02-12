/**
 * @objectos/graphql — GraphQL API Layer for ObjectOS
 *
 * Auto-generates a GraphQL schema from ObjectStack metadata with:
 * - RBAC permission enforcement on every query/mutation
 * - Audit logging for all data mutations
 * - Paginated list queries with filtering and sorting
 * - Subscription support via PubSub (O.1.4)
 * - DataLoader pattern for N+1 prevention (O.1.5)
 * - Enhanced GraphQL Playground (O.1.6)
 */

export { GraphQLPlugin } from './plugin.js';
export { generateSchema, toPascalCase, buildObjectType } from './schema-generator.js';
export { createResolverCallbacks } from './resolvers.js';
export { PubSub } from './pubsub.js';
export { buildSubscriptionType, createSubscriptionHooks } from './subscriptions.js';
export { DataLoader, createDataLoaderFactory } from './dataloader.js';
export type { DataLoaderOptions } from './dataloader.js';
export type {
  GraphQLConfig,
  ResolvedGraphQLConfig,
  GraphQLResolverContext,
  ObjectDef,
  ObjectFieldDef,
  PaginatedResult,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
  SubscriptionHooks,
  DataLoaderFactory,
} from './types.js';
