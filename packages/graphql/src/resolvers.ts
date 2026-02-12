/**
 * GraphQL Resolvers for ObjectOS
 *
 * Provides query and mutation resolver implementations that:
 * - O.1.2: Enforce RBAC permission checks via the permissions service
 * - O.1.3: Integrate with audit logging for all mutations
 *
 * All data access goes through context.broker to ensure
 * the Security Kernel intercepts every operation.
 */

import type { GraphQLResolverContext, ResolvedGraphQLConfig, PaginatedResult } from './types.js';
import type { ResolverCallbacks } from './schema-generator.js';

/**
 * Check if a user has permission to perform an action on an object.
 * Uses the permissions service registered in the kernel.
 */
async function checkPermission(
  broker: any,
  user: { id: string; profile?: string } | undefined,
  objectName: string,
  action: string,
): Promise<void> {
  if (!user) {
    throw new Error('Authentication required');
  }

  // Use the permissions service if available
  const permissionsService = broker.getService?.('permissions');
  if (permissionsService) {
    const allowed = await permissionsService.checkPermission({
      userId: user.id,
      profileName: user.profile || 'standard',
      objectName,
      action,
    });
    if (!allowed) {
      throw new Error(`Permission denied: ${action} on ${objectName}`);
    }
  }
}

/**
 * Log an audit event for a mutation operation.
 * Uses the audit service registered in the kernel.
 */
async function logAuditEvent(
  broker: any,
  eventType: string,
  objectName: string,
  recordId: string | undefined,
  ctx: GraphQLResolverContext,
  changes?: any,
): Promise<void> {
  const auditService = broker.getService?.('audit');
  if (auditService) {
    await auditService.log({
      event_type: eventType,
      object_name: objectName,
      record_id: recordId,
      user_id: ctx.user?.id,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      session_id: ctx.sessionId,
      changes,
      metadata: { source: 'graphql' },
    });
  }
}

/**
 * Sanitize filter input — remove undefined/null values
 */
function sanitizeFilter(filter: Record<string, any> | undefined): Record<string, any> {
  if (!filter) return {};
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Create resolver callbacks wired to the ObjectStack broker
 */
export function createResolverCallbacks(config: ResolvedGraphQLConfig): ResolverCallbacks {
  return {
    /**
     * Handle query operations: find (list) and findOne (get by ID)
     * Enforces 'read' permission on the target object.
     */
    onQuery: async (objectName, operation, args, ctx) => {
      await checkPermission(ctx.broker, ctx.user, objectName, 'read');

      if (operation === 'findOne') {
        // Get single record by ID
        const result = await ctx.broker.call('data.findOne', {
          objectName,
          filters: { _id: args.id },
        });
        return result;
      }

      // List query with pagination, filtering, sorting
      const limit = Math.min(args.limit || config.defaultPageSize, config.maxPageSize);
      const offset = args.offset || 0;
      const filter = sanitizeFilter(args.filter);
      const sort = args.sort
        ? { [args.sort.field]: args.sort.direction || 'asc' }
        : undefined;

      const [data, totalCount] = await Promise.all([
        ctx.broker.call('data.find', {
          objectName,
          filters: filter,
          options: { limit, skip: offset, sort },
        }),
        ctx.broker.call('data.count', {
          objectName,
          filters: filter,
        }).catch(() => 0), // Graceful fallback if count is not supported
      ]);

      const records = Array.isArray(data) ? data : [];
      const total = typeof totalCount === 'number' ? totalCount : records.length;

      const result: PaginatedResult = {
        data: records,
        totalCount: total,
        pageSize: limit,
        offset,
        hasMore: offset + records.length < total,
      };

      return result;
    },

    /**
     * Handle mutation operations: create, update, delete
     * Enforces corresponding permission and generates audit log entries.
     */
    onMutation: async (objectName, operation, args, ctx) => {
      await checkPermission(ctx.broker, ctx.user, objectName, operation);

      switch (operation) {
        case 'create': {
          const record = await ctx.broker.call('data.create', {
            objectName,
            doc: args.input,
          });

          await logAuditEvent(ctx.broker, 'create', objectName, record?._id, ctx, {
            after: args.input,
          });

          return record;
        }

        case 'update': {
          const record = await ctx.broker.call('data.update', {
            objectName,
            id: args.id,
            doc: args.input,
          });

          await logAuditEvent(ctx.broker, 'update', objectName, args.id, ctx, {
            after: args.input,
          });

          return record;
        }

        case 'delete': {
          await ctx.broker.call('data.delete', {
            objectName,
            id: args.id,
          });

          await logAuditEvent(ctx.broker, 'delete', objectName, args.id, ctx);

          return { success: true, message: `${objectName} record deleted` };
        }

        default:
          throw new Error(`Unknown mutation operation: ${operation}`);
      }
    },
  };
}
