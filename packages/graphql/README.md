# @objectos/graphql

Auto-generated GraphQL API plugin for ObjectOS. Builds a full GraphQL schema from ObjectStack metadata with query/mutation resolvers, subscriptions, DataLoader, and permission enforcement.

## Features

- **Schema Auto-Generation** — Generates GraphQL types, queries, and mutations from ObjectStack object metadata
- **Permission Enforcement** — All resolvers pass through the RBAC permission layer
- **Audit Logging** — Mutations automatically generate audit log entries
- **Subscriptions** — Real-time data updates via WebSocket (GraphQL subscriptions)
- **DataLoader Pattern** — Automatic N+1 query prevention for related object lookups
- **GraphQL Playground** — Built-in explorer for interactive schema browsing

## API Endpoints

| Method | Path              | Description                              |
| ------ | ----------------- | ---------------------------------------- |
| POST   | `/api/v1/graphql` | GraphQL query/mutation endpoint          |
| GET    | `/api/v1/graphql` | GraphQL Playground (in development mode) |

## Usage

```typescript
import { GraphQLPlugin } from '@objectos/graphql';

const graphql = new GraphQLPlugin({
  playground: true,
  introspection: true,
});
```

## Example Query

```graphql
query {
  contacts(filter: { status: "active" }, limit: 10) {
    id
    name
    email
    createdAt
  }
}
```

## Testing

```bash
pnpm test
```

## License

AGPL-3.0 — Part of the [ObjectOS](https://github.com/objectstack-ai/objectos) ecosystem.
