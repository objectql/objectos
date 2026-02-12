/**
 * GraphQL Schema Generator for ObjectOS
 *
 * Generates a GraphQL schema from ObjectStack metadata object definitions.
 * Maps ObjectStack field types to GraphQL types and creates:
 * - Object types for each metadata object
 * - Input types for create/update mutations
 * - Filter input types for list queries
 * - Root Query type with find/get operations
 * - Root Mutation type with create/update/delete operations
 */

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLOutputType,
  GraphQLInputType,
} from 'graphql';
import type { ObjectDef, ObjectFieldDef, GraphQLResolverContext, ResolvedGraphQLConfig } from './types.js';
import type { PubSub } from './pubsub.js';
import { buildSubscriptionType } from './subscriptions.js';
import { toPascalCase } from './utils.js';

/**
 * Map ObjectStack field type to GraphQL output type
 */
function mapFieldToGraphQLType(field: ObjectFieldDef): GraphQLOutputType {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'markdown':
    case 'html':
    case 'url':
    case 'email':
    case 'phone':
    case 'color':
    case 'autonumber':
    case 'datetime':
    case 'date':
    case 'time':
    case 'lookup':
    case 'master_detail':
    case 'image':
    case 'file':
    case 'address':
    case 'location':
      return GraphQLString;

    case 'number':
    case 'currency':
    case 'percent':
      return GraphQLFloat;

    case 'boolean':
    case 'toggle':
      return GraphQLBoolean;

    case 'select':
      // Select fields map to String (options are metadata, not schema-level)
      return GraphQLString;

    case 'object':
      // Blackbox objects are stored as JSON strings
      return GraphQLString;

    default:
      return GraphQLString;
  }
}

/**
 * Map ObjectStack field type to GraphQL input type
 */
function mapFieldToGraphQLInputType(field: ObjectFieldDef): GraphQLInputType {
  switch (field.type) {
    case 'number':
    case 'currency':
    case 'percent':
      return GraphQLFloat;

    case 'boolean':
    case 'toggle':
      return GraphQLBoolean;

    default:
      return GraphQLString;
  }
}

/**
 * Build GraphQL object type from an ObjectStack object definition
 */
function buildObjectType(objectDef: ObjectDef): GraphQLObjectType {
  const typeName = toPascalCase(objectDef.name);

  return new GraphQLObjectType({
    name: typeName,
    description: objectDef.description || objectDef.label || `${typeName} object`,
    fields: () => {
      const fields: GraphQLFieldConfigMap<any, GraphQLResolverContext> = {
        _id: { type: GraphQLString, description: 'Unique record identifier' },
      };

      for (const [fieldName, fieldDef] of Object.entries(objectDef.fields)) {
        fields[fieldName] = {
          type: fieldDef.required
            ? new GraphQLNonNull(mapFieldToGraphQLType(fieldDef))
            : mapFieldToGraphQLType(fieldDef),
          description: fieldDef.description || fieldDef.label || undefined,
        };
      }

      // Standard metadata fields
      fields.created_at = { type: GraphQLString, description: 'Creation timestamp' };
      fields.updated_at = { type: GraphQLString, description: 'Last update timestamp' };
      fields.created_by = { type: GraphQLString, description: 'Creator user ID' };
      fields.updated_by = { type: GraphQLString, description: 'Last updater user ID' };

      return fields;
    },
  });
}

/**
 * Build GraphQL input type for creating/updating records
 */
function buildInputType(objectDef: ObjectDef, suffix: string): GraphQLInputObjectType {
  const typeName = toPascalCase(objectDef.name);
  const isCreate = suffix === 'CreateInput';

  return new GraphQLInputObjectType({
    name: `${typeName}${suffix}`,
    description: `Input for ${isCreate ? 'creating' : 'updating'} a ${typeName}`,
    fields: () => {
      const fields: GraphQLInputFieldConfigMap = {};

      for (const [fieldName, fieldDef] of Object.entries(objectDef.fields)) {
        // For create: required fields are NonNull; for update: all fields are optional
        const inputType = mapFieldToGraphQLInputType(fieldDef);
        fields[fieldName] = {
          type: isCreate && fieldDef.required ? new GraphQLNonNull(inputType) : inputType,
          description: fieldDef.description || fieldDef.label || undefined,
        };
      }

      return fields;
    },
  });
}

/**
 * Build a filter input type for list queries
 */
function buildFilterInputType(objectDef: ObjectDef): GraphQLInputObjectType {
  const typeName = toPascalCase(objectDef.name);

  return new GraphQLInputObjectType({
    name: `${typeName}Filter`,
    description: `Filter input for querying ${typeName} records`,
    fields: () => {
      const fields: GraphQLInputFieldConfigMap = {
        _id: { type: GraphQLString, description: 'Filter by record ID' },
      };

      for (const [fieldName, fieldDef] of Object.entries(objectDef.fields)) {
        // Only add filterable fields (non-blackbox)
        if (!fieldDef.blackbox) {
          fields[fieldName] = {
            type: mapFieldToGraphQLInputType(fieldDef),
            description: `Filter by ${fieldName}`,
          };
        }
      }

      return fields;
    },
  });
}

/**
 * Build paginated result type wrapping an object type
 */
function buildPaginatedType(objectDef: ObjectDef, objectType: GraphQLObjectType): GraphQLObjectType {
  const typeName = toPascalCase(objectDef.name);

  return new GraphQLObjectType({
    name: `${typeName}Connection`,
    description: `Paginated list of ${typeName} records`,
    fields: {
      data: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(objectType))), description: 'Records' },
      totalCount: { type: new GraphQLNonNull(GraphQLInt), description: 'Total record count' },
      pageSize: { type: new GraphQLNonNull(GraphQLInt), description: 'Page size used' },
      offset: { type: new GraphQLNonNull(GraphQLInt), description: 'Offset used' },
      hasMore: { type: new GraphQLNonNull(GraphQLBoolean), description: 'Whether more records exist' },
    },
  });
}

/**
 * Sort direction enum
 */
const SortDirectionEnum = new GraphQLEnumType({
  name: 'SortDirection',
  values: {
    ASC: { value: 'asc' },
    DESC: { value: 'desc' },
  },
});

/**
 * Sort input type
 */
const SortInput = new GraphQLInputObjectType({
  name: 'SortInput',
  fields: {
    field: { type: new GraphQLNonNull(GraphQLString), description: 'Field to sort by' },
    direction: { type: SortDirectionEnum, description: 'Sort direction (default: ASC)' },
  },
});

/**
 * Mutation result type
 */
const MutationResult = new GraphQLObjectType({
  name: 'MutationResult',
  description: 'Result of a mutation operation',
  fields: {
    success: { type: new GraphQLNonNull(GraphQLBoolean) },
    message: { type: GraphQLString },
  },
});

export interface ResolverCallbacks {
  onQuery: (objectName: string, operation: 'find' | 'findOne', args: any, ctx: GraphQLResolverContext) => Promise<any>;
  onMutation: (objectName: string, operation: 'create' | 'update' | 'delete', args: any, ctx: GraphQLResolverContext) => Promise<any>;
}

/**
 * Generate a complete GraphQL schema from ObjectStack object definitions
 */
export function generateSchema(
  objects: ObjectDef[],
  config: ResolvedGraphQLConfig,
  callbacks: ResolverCallbacks,
  options?: { pubsub?: PubSub },
): GraphQLSchema {
  if (objects.length === 0) {
    // Return minimal schema with a placeholder query
    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          _empty: {
            type: GraphQLString,
            resolve: () => 'No objects registered',
          },
        },
      }),
    });
  }

  const queryFields: GraphQLFieldConfigMap<any, GraphQLResolverContext> = {};
  const mutationFields: GraphQLFieldConfigMap<any, GraphQLResolverContext> = {};
  const objectTypes = new Map<string, GraphQLObjectType>();

  for (const objectDef of objects) {
    const typeName = toPascalCase(objectDef.name);
    const objectType = buildObjectType(objectDef);
    objectTypes.set(objectDef.name, objectType);
    const createInput = buildInputType(objectDef, 'CreateInput');
    const updateInput = buildInputType(objectDef, 'UpdateInput');
    const filterInput = buildFilterInputType(objectDef);
    const paginatedType = buildPaginatedType(objectDef, objectType);

    // Query: find[Object]s(filter, limit, offset, sort)
    queryFields[`find${typeName}s`] = {
      type: new GraphQLNonNull(paginatedType),
      description: `List ${objectDef.label || typeName} records`,
      args: {
        filter: { type: filterInput },
        limit: { type: GraphQLInt, description: `Max results (default: ${config.defaultPageSize})` },
        offset: { type: GraphQLInt, description: 'Offset for pagination (default: 0)' },
        sort: { type: SortInput, description: 'Sort order' },
      },
      resolve: async (_root, args, ctx) => {
        return callbacks.onQuery(objectDef.name, 'find', args, ctx);
      },
    };

    // Query: get[Object](id)
    queryFields[`get${typeName}`] = {
      type: objectType,
      description: `Get a single ${objectDef.label || typeName} by ID`,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString), description: 'Record ID' },
      },
      resolve: async (_root, args, ctx) => {
        return callbacks.onQuery(objectDef.name, 'findOne', args, ctx);
      },
    };

    // Mutation: create[Object](input)
    mutationFields[`create${typeName}`] = {
      type: objectType,
      description: `Create a new ${objectDef.label || typeName}`,
      args: {
        input: { type: new GraphQLNonNull(createInput) },
      },
      resolve: async (_root, args, ctx) => {
        return callbacks.onMutation(objectDef.name, 'create', args, ctx);
      },
    };

    // Mutation: update[Object](id, input)
    mutationFields[`update${typeName}`] = {
      type: objectType,
      description: `Update an existing ${objectDef.label || typeName}`,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString), description: 'Record ID' },
        input: { type: new GraphQLNonNull(updateInput) },
      },
      resolve: async (_root, args, ctx) => {
        return callbacks.onMutation(objectDef.name, 'update', args, ctx);
      },
    };

    // Mutation: delete[Object](id)
    mutationFields[`delete${typeName}`] = {
      type: new GraphQLNonNull(MutationResult),
      description: `Delete a ${objectDef.label || typeName}`,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString), description: 'Record ID' },
      },
      resolve: async (_root, args, ctx) => {
        return callbacks.onMutation(objectDef.name, 'delete', args, ctx);
      },
    };
  }

  // Build subscription type if PubSub is provided (O.1.4)
  let subscriptionType: GraphQLObjectType | undefined;
  if (options?.pubsub) {
    subscriptionType = buildSubscriptionType(objects, objectTypes, options.pubsub);
  }

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: queryFields,
    }),
    mutation: new GraphQLObjectType({
      name: 'Mutation',
      fields: mutationFields,
    }),
    subscription: subscriptionType,
  });
}

export { toPascalCase, buildObjectType, mapFieldToGraphQLType, mapFieldToGraphQLInputType };
