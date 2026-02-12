/**
 * @objectos/graphql — GraphQL API Layer for ObjectOS
 *
 * Auto-generates a GraphQL schema from ObjectStack metadata with:
 * - RBAC permission enforcement on every query/mutation
 * - Audit logging for all data mutations
 * - Paginated list queries with filtering and sorting
 * - GraphQL Playground for development
 */

export { GraphQLPlugin } from './plugin.js';
export { generateSchema, toPascalCase } from './schema-generator.js';
export { createResolverCallbacks } from './resolvers.js';
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
} from './types.js';
