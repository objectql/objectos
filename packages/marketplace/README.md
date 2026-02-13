# @objectos/marketplace

Plugin Marketplace for ObjectOS — discovery, installation, versioning, dependency resolution, and sandboxed execution of community plugins.

## Features

- **Plugin Registry** — Browse and search available plugins with version metadata
- **Plugin Installer** — Install, upgrade, and uninstall plugins with dependency resolution
- **Manifest Validation** — Verify plugin manifests against the ObjectStack spec before installation
- **Plugin Sandbox** — Run untrusted plugins in isolated execution contexts
- **Security Review** — Automated security checks during plugin installation
- **HTTP API** — RESTful endpoints for the full plugin lifecycle

## API Endpoints

| Method | Path                        | Description                       |
| ------ | --------------------------- | --------------------------------- |
| GET    | `/api/v1/plugins/registry`  | Browse available plugins          |
| POST   | `/api/v1/plugins/install`   | Install a plugin                  |
| POST   | `/api/v1/plugins/uninstall` | Remove a plugin                   |
| POST   | `/api/v1/plugins/upgrade`   | Upgrade a plugin to a new version |
| GET    | `/api/v1/plugins/installed` | List installed plugins            |

## Usage

```typescript
import { MarketplacePlugin } from '@objectos/marketplace';

const marketplace = new MarketplacePlugin({
  registryUrl: 'https://registry.objectstack.ai',
});
```

## Testing

```bash
pnpm test
```

## License

AGPL-3.0 — Part of the [ObjectOS](https://github.com/objectstack-ai/objectos) ecosystem.
