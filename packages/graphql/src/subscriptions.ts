/**
 * GraphQL Subscription Support (O.1.4)
 *
 * Generates subscription types for each object:
 * - on{Object}Created — fires when a record is created
 * - on{Object}Updated — fires when a record is updated
 * - on{Object}Deleted — fires when a record is deleted
 */

import { GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLResolverContext, ObjectDef } from './types.js';
import { PubSub } from './pubsub.js';
import { toPascalCase } from './utils.js';

export function buildSubscriptionType(
  objects: ObjectDef[],
  objectTypes: Map<string, GraphQLObjectType>,
  pubsub: PubSub,
): GraphQLObjectType | undefined {
  if (objects.length === 0) return undefined;

  const fields: GraphQLFieldConfigMap<any, GraphQLResolverContext> = {};

  for (const objectDef of objects) {
    const typeName = toPascalCase(objectDef.name);
    const objectType = objectTypes.get(objectDef.name);
    if (!objectType) continue;

    // on{Object}Created
    fields[`on${typeName}Created`] = {
      type: objectType,
      description: `Fires when a ${typeName} record is created`,
      subscribe: () => pubsub.asyncIterator(`${objectDef.name}.created`),
      resolve: (payload: any) => payload,
    };

    // on{Object}Updated
    fields[`on${typeName}Updated`] = {
      type: objectType,
      description: `Fires when a ${typeName} record is updated`,
      subscribe: () => pubsub.asyncIterator(`${objectDef.name}.updated`),
      resolve: (payload: any) => payload,
    };

    // on{Object}Deleted
    fields[`on${typeName}Deleted`] = {
      type: new GraphQLObjectType({
        name: `${typeName}DeleteEvent`,
        fields: {
          id: { type: new GraphQLNonNull(GraphQLString) },
          objectName: { type: new GraphQLNonNull(GraphQLString) },
          deletedAt: { type: new GraphQLNonNull(GraphQLString) },
          deletedBy: { type: GraphQLString },
        },
      }),
      description: `Fires when a ${typeName} record is deleted`,
      subscribe: () => pubsub.asyncIterator(`${objectDef.name}.deleted`),
      resolve: (payload: any) => payload,
    };
  }

  return new GraphQLObjectType({
    name: 'Subscription',
    fields,
  });
}

/**
 * Wire pubsub to mutation resolver callbacks to auto-publish events
 */
export function createSubscriptionHooks(pubsub: PubSub) {
  return {
    afterCreate(objectName: string, record: any, _ctx: GraphQLResolverContext): void {
      pubsub.publish(`${objectName}.created`, record);
    },
    afterUpdate(objectName: string, record: any, _ctx: GraphQLResolverContext): void {
      pubsub.publish(`${objectName}.updated`, record);
    },
    afterDelete(objectName: string, id: string, ctx: GraphQLResolverContext): void {
      pubsub.publish(`${objectName}.deleted`, {
        id,
        objectName,
        deletedAt: new Date().toISOString(),
        deletedBy: ctx.user?.id,
      });
    },
  };
}
