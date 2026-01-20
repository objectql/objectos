# The Sync Engine Design: Local-First Architecture

> **Author**: ObjectOS Core Team  
> **Date**: January 2026  
> **Version**: 1.0  
> **Target Audience**: Distributed Systems Engineers, Mobile/Desktop Developers

---

## Executive Summary

ObjectOS implements a **Local-First Synchronization Engine** that allows clients (web, mobile, desktop) to work with data offline and sync changes when connectivity is restored. This article explores the conflict resolution strategies, replication protocols, and optimization techniques that enable this architecture.

**Core Challenge**: How do we keep data consistent across hundreds of offline clients without sacrificing performance or user experience?

---

## 1. The Local-First Philosophy

### 1.1 What is Local-First?

**Traditional Cloud-First Architecture**:

```
Client ──────────▶ Server ──────────▶ Database
        (Always Online Required)
```

**Problems**:
- No offline support
- High latency (round trip to server)
- Single point of failure

**Local-First Architecture**:

```
Client
  │
  ├─ Local Database (SQLite/IndexedDB)
  │    └─ Primary copy of user's data
  │
  └─ Sync Engine
       └─ Bidirectional sync with server
```

**Benefits**:
- ✅ Instant UI updates (no network delay)
- ✅ Offline-first (works without internet)
- ✅ Resilient (server downtime doesn't block user)
- ✅ Privacy (data stays on device)

### 1.2 ObjectOS Sync Architecture

```
┌──────────────────────────────────────────────────────┐
│                     ObjectOS Server                  │
│  ┌────────────────────────────────────────────────┐  │
│  │           Master Database (PostgreSQL)         │  │
│  └────────────────────────────────────────────────┘  │
│                         ▲                            │
│                         │                            │
│            ┌────────────┴────────────┐               │
│            │    Sync Coordinator     │               │
│            └────────────┬────────────┘               │
└─────────────────────────┼───────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Client 1│     │ Client 2│     │ Client 3│
    │ (Web)   │     │ (Mobile)│     │ (Desktop)│
    │         │     │         │     │         │
    │ RxDB    │     │ SQLite  │     │ RxDB    │
    └─────────┘     └─────────┘     └─────────┘
```

---

## 2. Sync Protocol Design

### 2.1 The Mutation Log Pattern

**Core Concept**: Instead of syncing **final state**, we sync **operations** (mutations).

**Why?**
- Captures **intent** (user wanted to change X to Y)
- Enables conflict detection (two users changed the same field)
- Supports **undo/redo** (replay operations)

**Example**:

```typescript
// ❌ State-based sync (loses information)
{
  id: 'contact-123',
  name: 'John Doe Updated',  // Final state - who changed it? when?
  email: 'john@new.com'
}

// ✅ Operation-based sync (preserves intent)
{
  id: 'mutation-456',
  object: 'contacts',
  record_id: 'contact-123',
  operation: 'update',
  changes: {
    name: { from: 'John Doe', to: 'John Doe Updated' },
    email: { from: 'john@old.com', to: 'john@new.com' }
  },
  timestamp: '2026-01-20T10:30:00Z',
  user: 'user-789',
  device: 'mobile-app-v1.2'
}
```

### 2.2 The Sync Cycle

```
┌─────────────────────────────────────────────────────┐
│                    Sync Cycle                       │
└─────────────────────────────────────────────────────┘

Client                                Server
  │                                      │
  │  1. PUSH: Send local mutations       │
  ├──────────────────────────────────────▶│
  │  [mutation1, mutation2, ...]          │
  │                                      │
  │                                      │  2. Detect conflicts
  │                                      │     Apply mutations
  │                                      │     Generate delta
  │                                      │
  │  3. PULL: Receive server changes     │
  │◀──────────────────────────────────────┤
  │  [mutation3, mutation4, ...]          │
  │                                      │
  │  4. Merge local changes              │
  │     Resolve conflicts                │
  │     Update local database            │
  │                                      │
  │  5. ACK: Confirm sync                │
  ├──────────────────────────────────────▶│
  │  { last_sync: timestamp }             │
  │                                      │
```

### 2.3 Protocol Messages

**PUSH (Client → Server)**:

```typescript
interface PushRequest {
  client_id: string;
  last_sync: Timestamp;
  mutations: Mutation[];
  checkpoint: string;  // Cursor for pagination
}

interface Mutation {
  id: string;              // Client-generated UUID
  object: string;          // 'contacts', 'accounts', etc.
  record_id: string;       // Record being modified
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: Timestamp;    // Client timestamp
  version: number;         // Optimistic lock
}
```

**PULL (Server → Client)**:

```typescript
interface PullResponse {
  mutations: Mutation[];
  conflicts: Conflict[];
  checkpoint: string;      // Next cursor
  has_more: boolean;       // More data available?
}

interface Conflict {
  mutation_id: string;
  reason: 'version_mismatch' | 'concurrent_update' | 'deleted';
  server_version: any;
  client_version: any;
  resolution?: 'server_wins' | 'client_wins' | 'manual';
}
```

---

## 3. Conflict Detection

### 3.1 The Version Vector Approach

**Problem**: How do we know if two mutations conflict?

**Solution**: Attach a **version number** to every record.

```typescript
interface Record {
  id: string;
  name: string;
  version: number;        // Incremented on every update
  last_modified: Timestamp;
  last_modified_by: string;
}
```

**Conflict Detection Logic**:

```typescript
// @objectos/sync/src/ConflictDetector.ts
export class ConflictDetector {
  detectConflict(
    clientMutation: Mutation,
    serverRecord: Record
  ): Conflict | null {
    // Case 1: Record was deleted on server
    if (!serverRecord) {
      return {
        reason: 'deleted',
        resolution: 'client_loses'  // Server deletion wins
      };
    }
    
    // Case 2: Version mismatch (concurrent update)
    if (clientMutation.version !== serverRecord.version) {
      return {
        reason: 'version_mismatch',
        server_version: serverRecord,
        client_version: clientMutation.data,
        resolution: this.resolveConflict(clientMutation, serverRecord)
      };
    }
    
    // No conflict
    return null;
  }
}
```

### 3.2 Conflict Resolution Strategies

#### Strategy 1: Last-Write-Wins (LWW)

**Rule**: Newest timestamp wins.

```typescript
resolveConflict(client: Mutation, server: Record): Resolution {
  if (client.timestamp > server.last_modified) {
    return 'client_wins';
  } else {
    return 'server_wins';
  }
}
```

**Pros**: Simple, deterministic  
**Cons**: Loses data (older changes discarded)

#### Strategy 2: Field-Level Merge

**Rule**: Merge non-conflicting fields, flag conflicting ones.

```typescript
resolveConflict(client: Mutation, server: Record): Resolution {
  const merged = { ...server };
  const conflicts = [];
  
  for (const [field, value] of Object.entries(client.data)) {
    if (server[field] === client.original[field]) {
      // Server version unchanged, apply client change
      merged[field] = value;
    } else if (server[field] === value) {
      // Both changed to same value, no conflict
      continue;
    } else {
      // Both changed to different values - CONFLICT
      conflicts.push({
        field,
        client_value: value,
        server_value: server[field]
      });
    }
  }
  
  return conflicts.length > 0 
    ? { type: 'manual', merged, conflicts }
    : { type: 'auto', merged };
}
```

**Example**:

```typescript
// Original record
{ name: 'John Doe', email: 'john@old.com', phone: '123' }

// Client changed name + email (offline)
{ name: 'John Updated', email: 'john@new.com', phone: '123' }

// Server changed email + phone (online)
{ name: 'John Doe', email: 'john@server.com', phone: '456' }

// Field-level merge result
{
  name: 'John Updated',           // ✅ Client wins (server unchanged)
  email: ???,                      // ❌ CONFLICT (both changed)
  phone: '456'                     // ✅ Server wins (client unchanged)
}
```

#### Strategy 3: Operational Transform (OT)

**Rule**: Transform operations so they can be applied in any order.

**Use Case**: Collaborative text editing.

```typescript
// User A types "Hello" at position 0
opA = { type: 'insert', pos: 0, text: 'Hello' }

// User B types "World" at position 0 (concurrent)
opB = { type: 'insert', pos: 0, text: 'World' }

// Transform B relative to A
opB' = transform(opB, opA) 
     = { type: 'insert', pos: 5, text: 'World' }  // Adjusted position

// Result: "HelloWorld" (deterministic)
```

**ObjectOS Implementation**:

```typescript
// @objectos/sync/src/OperationalTransform.ts
export class OperationalTransform {
  transform(
    op1: Operation,
    op2: Operation
  ): Operation {
    // Transform op2 assuming op1 was applied first
    
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op2.pos <= op1.pos) {
        return op2;  // No change needed
      } else {
        return { ...op2, pos: op2.pos + op1.text.length };
      }
    }
    
    // Handle all operation pairs (insert/delete, delete/insert, etc.)
    // ...
  }
}
```

---

## 4. Incremental Sync (Delta Protocol)

### 4.1 The Problem with Full Sync

**Naive Approach**: Download entire database on every sync.

```typescript
// ❌ Inefficient
const allData = await server.getAllRecords();
await localDB.replaceAll(allData);  // 100MB download every time
```

**Problems**:
- Wastes bandwidth
- Slow on mobile networks
- Doesn't scale (10,000 records = 10MB+)

### 4.2 Checkpoint-Based Incremental Sync

**Idea**: Only fetch changes **since last sync**.

```typescript
// Client stores last sync checkpoint
const lastCheckpoint = await localDB.getCheckpoint();

// Request only new changes
const { mutations, checkpoint } = await server.pull({
  since: lastCheckpoint
});

// Apply changes
await localDB.applyMutations(mutations);

// Save new checkpoint
await localDB.saveCheckpoint(checkpoint);
```

**Server Implementation**:

```typescript
// @objectos/sync/src/SyncController.ts
export class SyncController {
  async pull(req: PullRequest): Promise<PullResponse> {
    const since = req.checkpoint || '0';
    
    // Fetch mutations after checkpoint
    const mutations = await this.db.query(`
      SELECT * FROM mutations
      WHERE sequence > $1
        AND client_id != $2  -- Exclude client's own mutations
      ORDER BY sequence ASC
      LIMIT 100
    `, [since, req.client_id]);
    
    return {
      mutations,
      checkpoint: mutations[mutations.length - 1]?.sequence || since,
      has_more: mutations.length === 100
    };
  }
}
```

### 4.3 Optimizations

**1. Compression**:

```typescript
// Compress mutation payload
const compressed = gzip(JSON.stringify(mutations));

// 10MB → 2MB (typical compression ratio: 5:1)
```

**2. Batching**:

```typescript
// Instead of syncing every change immediately
client.onMutation((mutation) => {
  batchQueue.add(mutation);
});

// Sync in batches every 30 seconds
setInterval(() => {
  const batch = batchQueue.flush();
  server.push(batch);
}, 30000);
```

**3. Selective Sync** (Partial Replication):

```typescript
// Only sync relevant data
const subscription = {
  objects: ['contacts', 'accounts'],
  filters: {
    contacts: { owner: currentUser.id },      // My contacts only
    accounts: { region: currentUser.region }  // My region only
  }
};

await server.subscribe(subscription);
```

---

## 5. Implementation: Client-Side

### 5.1 Client Architecture

```typescript
// @objectos/client/src/SyncEngine.ts
export class SyncEngine {
  private db: LocalDatabase;        // RxDB or SQLite
  private ws: WebSocket;            // Real-time connection
  private queue: MutationQueue;     // Pending mutations
  
  constructor(config: SyncConfig) {
    this.db = new LocalDatabase(config.dbName);
    this.ws = new WebSocket(config.serverUrl);
    this.queue = new MutationQueue();
  }
  
  // Start sync loop
  async start(): Promise<void> {
    // 1. Initial full sync
    await this.initialSync();
    
    // 2. Enable real-time updates
    this.ws.on('mutation', (m) => this.handleRemoteMutation(m));
    
    // 3. Start background sync
    setInterval(() => this.sync(), 30000);  // Every 30s
  }
  
  // Perform sync cycle
  private async sync(): Promise<void> {
    try {
      // PUSH local changes
      const localMutations = await this.queue.getAll();
      const pushResult = await this.server.push(localMutations);
      
      // Handle conflicts
      for (const conflict of pushResult.conflicts) {
        await this.resolveConflict(conflict);
      }
      
      // PULL server changes
      const pullResult = await this.server.pull({
        checkpoint: this.db.getCheckpoint()
      });
      
      // Apply server mutations
      await this.applyMutations(pullResult.mutations);
      
      // Update checkpoint
      await this.db.setCheckpoint(pullResult.checkpoint);
      
      // Clear synced mutations
      await this.queue.clear(localMutations);
      
    } catch (error) {
      console.error('Sync failed:', error);
      // Retry with exponential backoff
      setTimeout(() => this.sync(), this.getRetryDelay());
    }
  }
}
```

### 5.2 Local Database Schema

```typescript
// Client-side database schema
const localSchema = {
  // Main data tables (same as server)
  contacts: {
    id: 'string',
    name: 'string',
    email: 'string',
    // ...
    _version: 'number',
    _synced: 'boolean'
  },
  
  // Sync metadata
  _mutations: {
    id: 'string',
    object: 'string',
    record_id: 'string',
    operation: 'string',
    data: 'json',
    timestamp: 'datetime',
    synced: 'boolean'
  },
  
  _sync_state: {
    checkpoint: 'string',
    last_sync: 'datetime'
  }
};
```

### 5.3 Handling Offline Mutations

```typescript
// User edits contact while offline
const contact = await db.contacts.findOne(id);
contact.name = 'Updated Name';
await contact.save();

// Automatically queue mutation
await db._mutations.insert({
  id: uuid(),
  object: 'contacts',
  record_id: id,
  operation: 'update',
  data: { name: 'Updated Name' },
  timestamp: new Date(),
  synced: false
});

// When online, sync engine pushes to server
await syncEngine.sync();
```

---

## 6. Implementation: Server-Side

### 6.1 Mutation Log Table

```sql
-- Server-side mutation log
CREATE TABLE mutations (
  id UUID PRIMARY KEY,
  sequence BIGSERIAL,           -- Auto-incrementing for ordering
  client_id TEXT NOT NULL,
  object TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  user_id TEXT NOT NULL,
  
  INDEX idx_mutations_sequence (sequence),
  INDEX idx_mutations_client (client_id, sequence)
);
```

### 6.2 Applying Client Mutations

```typescript
// @objectos/sync/src/MutationApplier.ts
export class MutationApplier {
  async apply(mutation: Mutation): Promise<ApplyResult> {
    const { object, record_id, operation, data, version } = mutation;
    
    // 1. Load current record
    const current = await this.db.findOne(object, record_id);
    
    // 2. Detect conflicts
    const conflict = this.detectConflict(mutation, current);
    if (conflict) {
      return { success: false, conflict };
    }
    
    // 3. Apply mutation
    let result;
    switch (operation) {
      case 'insert':
        result = await this.db.insert(object, data);
        break;
      case 'update':
        result = await this.db.update(object, record_id, data);
        break;
      case 'delete':
        result = await this.db.delete(object, record_id);
        break;
    }
    
    // 4. Log mutation for other clients
    await this.logMutation({
      ...mutation,
      sequence: await this.getNextSequence()
    });
    
    // 5. Broadcast to connected clients
    this.broadcast(mutation);
    
    return { success: true, result };
  }
}
```

---

## 7. Real-Time Updates (WebSocket)

### 7.1 Push vs. Pull

**Pull Model** (Polling):

```typescript
// Client polls every 30 seconds
setInterval(async () => {
  const updates = await server.pull();
  await applyUpdates(updates);
}, 30000);
```

**Cons**: 
- Delayed updates (up to 30s)
- Wastes bandwidth (polling empty results)

**Push Model** (WebSocket):

```typescript
// Server pushes immediately
ws.on('connect', (client) => {
  db.on('mutation', (mutation) => {
    client.send({ type: 'mutation', data: mutation });
  });
});

// Client receives instantly
ws.on('message', async (msg) => {
  if (msg.type === 'mutation') {
    await applyMutation(msg.data);
  }
});
```

**Pros**:
- Instant updates (sub-second)
- Efficient (no unnecessary requests)

### 7.2 Presence Detection

**Track who's online**:

```typescript
// Server
const onlineUsers = new Map<string, WebSocket>();

ws.on('connect', (client, userId) => {
  onlineUsers.set(userId, client);
  
  // Broadcast presence
  broadcast({ type: 'user_online', userId });
});

ws.on('disconnect', (client, userId) => {
  onlineUsers.delete(userId);
  
  // Broadcast presence
  broadcast({ type: 'user_offline', userId });
});
```

---

## 8. Performance & Scalability

### 8.1 Sync Performance Metrics

**Target SLAs**:
- Initial sync: < 5s for 10,000 records
- Incremental sync: < 500ms for 100 mutations
- Real-time push: < 100ms latency

**Benchmarks**:

```typescript
// Measure sync performance
const start = Date.now();
await syncEngine.sync();
const duration = Date.now() - start;

console.log(`Sync completed in ${duration}ms`);
```

### 8.2 Optimization Techniques

**1. Index Optimization**:

```sql
-- Critical for checkpoint queries
CREATE INDEX idx_mutations_checkpoint ON mutations(sequence);

-- Speed up client-specific queries
CREATE INDEX idx_mutations_client_sequence ON mutations(client_id, sequence);
```

**2. Pagination**:

```typescript
// Limit mutations per sync to avoid timeouts
const BATCH_SIZE = 100;

let checkpoint = lastCheckpoint;
let hasMore = true;

while (hasMore) {
  const { mutations, checkpoint: next, has_more } = await server.pull({
    checkpoint,
    limit: BATCH_SIZE
  });
  
  await applyMutations(mutations);
  checkpoint = next;
  hasMore = has_more;
}
```

**3. Parallel Sync**:

```typescript
// Sync multiple objects in parallel
await Promise.all([
  syncObject('contacts'),
  syncObject('accounts'),
  syncObject('opportunities')
]);
```

---

## 9. Testing Strategies

### 9.1 Conflict Resolution Tests

```typescript
describe('Conflict Resolution', () => {
  it('should resolve concurrent updates with LWW', async () => {
    // Client 1 updates offline
    const mutation1 = {
      record_id: 'contact-123',
      data: { name: 'Client 1 Update' },
      timestamp: new Date('2026-01-20T10:00:00Z')
    };
    
    // Client 2 updates offline (later)
    const mutation2 = {
      record_id: 'contact-123',
      data: { name: 'Client 2 Update' },
      timestamp: new Date('2026-01-20T10:00:01Z')
    };
    
    // Both sync
    await server.apply(mutation1);
    await server.apply(mutation2);
    
    // Verify LWW: Client 2 wins (later timestamp)
    const result = await server.get('contacts', 'contact-123');
    expect(result.name).toBe('Client 2 Update');
  });
});
```

### 9.2 Network Partition Tests

```typescript
describe('Network Partition', () => {
  it('should queue mutations when offline', async () => {
    // Disconnect client
    await client.disconnect();
    
    // Make changes while offline
    await client.update('contacts', id, { name: 'Offline Update' });
    
    // Verify queued
    const queue = await client.getQueue();
    expect(queue).toHaveLength(1);
    
    // Reconnect
    await client.connect();
    
    // Verify sync
    await waitForSync();
    const synced = await server.get('contacts', id);
    expect(synced.name).toBe('Offline Update');
  });
});
```

---

## 10. Security Considerations

### 10.1 Mutation Authentication

**Every mutation must be authenticated**:

```typescript
interface Mutation {
  id: string;
  signature: string;  // HMAC of mutation data
  user_id: string;
  timestamp: Timestamp;
  // ...
}

// Verify signature
const isValid = verifyHMAC(
  mutation.signature,
  mutation.data,
  user.secret
);

if (!isValid) {
  throw new Error('Invalid mutation signature');
}
```

### 10.2 Replay Attack Prevention

**Use nonces to prevent duplicate mutations**:

```typescript
// Server tracks processed mutations
const processedMutations = new Set<string>();

async function apply(mutation: Mutation): Promise<void> {
  if (processedMutations.has(mutation.id)) {
    throw new Error('Mutation already processed');
  }
  
  await applyMutation(mutation);
  processedMutations.add(mutation.id);
  
  // Expire after 24 hours
  setTimeout(() => processedMutations.delete(mutation.id), 86400000);
}
```

---

## 11. Conclusion

The ObjectOS Sync Engine achieves **local-first capabilities** through:

1. **Mutation Log Protocol**: Operation-based sync preserves intent
2. **Conflict Detection**: Version vectors + multiple resolution strategies
3. **Incremental Sync**: Checkpoint-based delta protocol
4. **Real-Time Updates**: WebSocket push for instant collaboration
5. **Offline Support**: Queue mutations, sync when reconnected

**Key Insight**: By treating the client database as a **first-class replica**, we enable rich offline experiences without sacrificing data consistency.

---

**Next Article**: [Plugin System and Extensibility Patterns](./04-plugin-system.md)
