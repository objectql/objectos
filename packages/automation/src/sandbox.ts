/**
 * Action Execution Sandbox for ObjectOS Automation
 * 
 * Provides a sandboxed environment for executing user-provided scripts
 * with resource limits (timeout, memory) and restricted module access.
 * 
 * Aligns with PluginSecurityManifest.sandboxConfig from @objectstack/spec.
 */

import { createContext, runInContext, type Context } from 'vm';

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
    /** Maximum execution time in milliseconds */
    timeout?: number;
    /** Maximum memory in bytes (advisory, not enforced by vm) */
    maxMemory?: number;
    /** List of allowed module names (e.g., ['lodash', 'dayjs']) */
    allowedModules?: string[];
    /** Whether console output is captured or suppressed */
    captureConsole?: boolean;
}

/**
 * Sandbox execution result
 */
export interface SandboxResult {
    /** Whether execution completed successfully */
    success: boolean;
    /** Return value from the script */
    result?: unknown;
    /** Error message if failed */
    error?: string;
    /** Execution duration in ms */
    duration: number;
    /** Captured console output */
    logs?: string[];
}

/**
 * Default sandbox configuration
 */
const DEFAULT_CONFIG: Required<SandboxConfig> = {
    timeout: 5000,
    maxMemory: 64 * 1024 * 1024, // 64MB
    allowedModules: [],
    captureConsole: true,
};

/**
 * Execute a script in a sandboxed VM context
 * 
 * @param script - JavaScript code to execute
 * @param variables - Variables to inject into the sandbox context
 * @param config - Sandbox configuration
 */
export async function executeSandboxed(
    script: string,
    variables: Record<string, unknown> = {},
    config: SandboxConfig = {},
): Promise<SandboxResult> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    const logs: string[] = [];

    // Build a safe context with limited globals
    const sandboxGlobals: Record<string, unknown> = {
        // Safe built-ins
        JSON,
        Math,
        Date,
        String,
        Number,
        Boolean,
        Array,
        Object,
        Map,
        Set,
        RegExp,
        Promise,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        encodeURIComponent,
        decodeURIComponent,
        encodeURI,
        decodeURI,

        // Captured console
        console: mergedConfig.captureConsole
            ? {
                  log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
                  info: (...args: unknown[]) => logs.push(`[INFO] ${args.map(String).join(' ')}`),
                  warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(String).join(' ')}`),
                  error: (...args: unknown[]) => logs.push(`[ERROR] ${args.map(String).join(' ')}`),
              }
            : undefined,

        // Inject user variables
        ...variables,
    };

    // Create isolated context
    const context: Context = createContext(sandboxGlobals);

    try {
        // Run the script in the sandbox
        const result = runInContext(script, context, {
            timeout: mergedConfig.timeout,
            displayErrors: true,
        });

        return {
            success: true,
            result,
            duration: Date.now() - startTime,
            logs: mergedConfig.captureConsole ? logs : undefined,
        };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            error: errorMessage,
            duration: Date.now() - startTime,
            logs: mergedConfig.captureConsole ? logs : undefined,
        };
    }
}

/**
 * Validate a script for obvious security issues before execution
 * 
 * Returns an array of warnings/errors found in the script.
 */
export function validateScript(script: string): string[] {
    const warnings: string[] = [];
    const dangerous = [
        { pattern: /\brequire\s*\(/, message: 'Script uses require() — modules are not available in sandbox' },
        { pattern: /\bimport\s+/, message: 'Script uses import — modules are not available in sandbox' },
        { pattern: /\bprocess\b/, message: 'Script references process — not available in sandbox' },
        { pattern: /\b__dirname\b/, message: 'Script references __dirname — not available in sandbox' },
        { pattern: /\b__filename\b/, message: 'Script references __filename — not available in sandbox' },
        { pattern: /\bglobal\b/, message: 'Script references global — restricted in sandbox' },
        { pattern: /\beval\s*\(/, message: 'Script uses eval() — potential security risk' },
        { pattern: /\bFunction\s*\(/, message: 'Script uses Function constructor — potential security risk' },
    ];

    for (const { pattern, message } of dangerous) {
        if (pattern.test(script)) {
            warnings.push(message);
        }
    }

    return warnings;
}
