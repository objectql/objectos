/**
 * Child Process Entry Point
 *
 * Spawned via child_process.fork(). Receives IPC messages from the parent
 * process, delegates to the loaded plugin module, and sends results back.
 */

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
    const pluginPath = process.argv[2];
    if (!pluginPath) {
        throw new Error('process-entry requires a plugin path as the first argument');
    }

    // Dynamic import of the plugin module
    const pluginModule = await import(pluginPath);
    const plugin = pluginModule.default ?? pluginModule;

    process.on('message', async (msg: InboundMessage) => {
        if (msg.type === 'heartbeat') {
            process.send!({ type: 'heartbeat-ack', callId: msg.callId });
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
                process.send!({ type: 'result', callId, result });
            } catch (err: unknown) {
                const error = err instanceof Error ? err.message : String(err);
                process.send!({ type: 'result', callId, error });
            }
        }
    });

    // Signal the parent that the process is ready
    process.send!({ type: 'ready' });
}

main().catch((err) => {
    process.send?.({ type: 'error', error: String(err) });
    process.exit(1);
});
