/**
 * Worker Thread Entry Point
 *
 * Loaded inside a worker_threads Worker. Receives RPC messages from the
 * parent thread, delegates to the loaded plugin module, and posts results back.
 */

import { parentPort, workerData } from 'node:worker_threads';

interface CallMessage {
    type: 'call';
    callId: string;
    method: string;
    args?: unknown[];
}

interface HeartbeatMessage {
    type: 'heartbeat';
    callId: string;
}

type InboundMessage = CallMessage | HeartbeatMessage;

async function main(): Promise<void> {
    const { pluginPath } = workerData as { pluginPath: string };

    // Dynamic import of the plugin module
    const pluginModule = await import(pluginPath);
    const plugin = pluginModule.default ?? pluginModule;

    if (!parentPort) {
        throw new Error('worker-entry must be run inside a Worker thread');
    }

    parentPort.on('message', async (msg: InboundMessage) => {
        if (msg.type === 'heartbeat') {
            parentPort!.postMessage({ type: 'heartbeat-ack', callId: msg.callId });
            return;
        }

        if (msg.type === 'call') {
            const { callId, method, args } = msg;
            try {
                const fn = plugin[method];
                if (typeof fn !== 'function') {
                    throw new Error(`Plugin method "${method}" is not a function`);
                }
                const result = await fn.apply(plugin, args ?? []);
                parentPort!.postMessage({ type: 'result', callId, result });
            } catch (err: unknown) {
                const error = err instanceof Error ? err.message : String(err);
                parentPort!.postMessage({ type: 'result', callId, error });
            }
        }
    });

    // Signal the parent that the worker is ready
    parentPort.postMessage({ type: 'ready' });
}

main().catch((err) => {
    parentPort?.postMessage({ type: 'error', error: String(err) });
    process.exit(1);
});
