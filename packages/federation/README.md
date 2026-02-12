# @objectos/federation

Dynamic plugin loading via Module Federation for ObjectOS with runtime remote loading, shared dependency management, and hot-reload support.

## Features

- **Remote Plugin Loader** — Load plugins from remote URLs at runtime without rebuilding the host
- **Shared Dependency Manager** — Deduplicate shared packages (React, ObjectStack SDK) across remotes
- **Hot-Reload Manager** — Live-reload remote plugins during development without server restart
- **Host Configuration** — Declarative federation config for exposing and consuming modules
- **HTTP API** — Endpoints for remote management, shared dependency listing, and configuration

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/federation/remotes` | List loaded remote plugins |
| GET | `/api/v1/federation/shared` | List shared dependencies |
| GET | `/api/v1/federation/config` | Current federation configuration |
| GET | `/api/v1/federation/stats` | Federation runtime statistics |

## Usage

```typescript
import { FederationPlugin } from '@objectos/federation';

const federation = new FederationPlugin({
  remotes: {
    crm: 'https://cdn.example.com/crm/remoteEntry.js',
  },
  shared: ['react', 'react-dom', '@objectstack/spec'],
});
```

## Testing

```bash
pnpm test
```

## License

AGPL-3.0 — Part of the [ObjectOS](https://github.com/objectstack-ai/objectos) ecosystem.
