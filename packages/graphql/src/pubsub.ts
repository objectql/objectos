/**
 * In-memory PubSub for GraphQL Subscriptions (O.1.4)
 *
 * Provides a simple publish/subscribe mechanism that integrates
 * with @objectos/realtime WebSocket server for GraphQL subscriptions.
 */

export class PubSub {
  private subscribers: Map<string, Set<(payload: any) => void>> = new Map();

  subscribe(channel: string, callback: (payload: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);
    return () => {
      this.subscribers.get(channel)?.delete(callback);
    };
  }

  publish(channel: string, payload: any): void {
    const subs = this.subscribers.get(channel);
    if (subs) {
      for (const cb of subs) {
        cb(payload);
      }
    }
  }

  asyncIterator(channel: string): AsyncIterableIterator<any> {
    const queue: any[] = [];
    let resolve: ((value: IteratorResult<any>) => void) | null = null;

    const unsubscribe = this.subscribe(channel, (payload) => {
      if (resolve) {
        resolve({ value: payload, done: false });
        resolve = null;
      } else {
        queue.push(payload);
      }
    });

    return {
      next(): Promise<IteratorResult<any>> {
        if (queue.length > 0) {
          return Promise.resolve({ value: queue.shift(), done: false });
        }
        return new Promise((r) => {
          resolve = r;
        });
      },
      return(): Promise<IteratorResult<any>> {
        unsubscribe();
        return Promise.resolve({ value: undefined, done: true });
      },
      throw(error: any): Promise<IteratorResult<any>> {
        unsubscribe();
        return Promise.reject(error);
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }

  getSubscriberCount(channel: string): number {
    return this.subscribers.get(channel)?.size ?? 0;
  }

  clear(): void {
    this.subscribers.clear();
  }
}
