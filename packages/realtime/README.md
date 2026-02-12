# @objectos/realtime

WebSocket server plugin for ObjectOS providing real-time data subscriptions, presence awareness, and collaborative editing support.

## Features

- **WebSocket Server** — Built on `ws` with automatic upgrade handling
- **Authentication** — Token extraction from cookie, `Sec-WebSocket-Protocol` header, or query parameter
- **Event Subscriptions** — Subscribe to object-level data change events (create, update, delete)
- **Presence & Awareness** — Track online users and their current activity/cursor position
- **Collaboration Sessions** — Multi-user editing with operational transform support
- **Message Filtering** — Server-side filtering of events by object, record, or field

## Usage

```typescript
import { createRealtimePlugin } from '@objectos/realtime';

const realtime = createRealtimePlugin({
  auth: { required: true },
  heartbeat: { interval: 30000, timeout: 60000 },
});
```

### Client-Side

```typescript
const ws = new WebSocket('ws://localhost:5320/api/v1/realtime');

ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'data:contacts',
}));

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Realtime update:', msg);
};
```

## Testing

```bash
pnpm test
```

## License

AGPL-3.0 — Part of the [ObjectOS](https://github.com/objectstack-ai/objectos) ecosystem.
