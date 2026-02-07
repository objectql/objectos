/**
 * Sandbox Tests
 */

import { executeSandboxed, validateScript } from '../src/sandbox.js';

describe('Sandbox', () => {
    describe('executeSandboxed()', () => {
        it('should execute simple expressions', async () => {
            const result = await executeSandboxed('1 + 2');
            expect(result.success).toBe(true);
            expect(result.result).toBe(3);
        });

        it('should access injected variables', async () => {
            const result = await executeSandboxed('name + " World"', { name: 'Hello' });
            expect(result.success).toBe(true);
            expect(result.result).toBe('Hello World');
        });

        it('should capture console.log output', async () => {
            const result = await executeSandboxed('console.log("test message"); 42', {}, { captureConsole: true });
            expect(result.success).toBe(true);
            expect(result.result).toBe(42);
            expect(result.logs).toContain('test message');
        });

        it('should timeout long-running scripts', async () => {
            const result = await executeSandboxed('while(true) {}', {}, { timeout: 100 });
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should not allow access to require', async () => {
            const result = await executeSandboxed('require("fs")');
            expect(result.success).toBe(false);
        });

        it('should not allow access to process', async () => {
            const result = await executeSandboxed('process.exit(1)');
            expect(result.success).toBe(false);
        });

        it('should allow JSON operations', async () => {
            const result = await executeSandboxed('JSON.stringify({ a: 1 })');
            expect(result.success).toBe(true);
            expect(result.result).toBe('{"a":1}');
        });

        it('should allow Math operations', async () => {
            const result = await executeSandboxed('Math.max(1, 2, 3)');
            expect(result.success).toBe(true);
            expect(result.result).toBe(3);
        });

        it('should allow Date usage', async () => {
            const result = await executeSandboxed('typeof new Date().toISOString()');
            expect(result.success).toBe(true);
            expect(result.result).toBe('string');
        });

        it('should return execution duration', async () => {
            const result = await executeSandboxed('1 + 1');
            expect(result.duration).toBeGreaterThanOrEqual(0);
        });

        it('should handle syntax errors gracefully', async () => {
            const result = await executeSandboxed('function {{{');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle complex object manipulation', async () => {
            const result = await executeSandboxed(
                'const items = data.map(x => x * 2); items.reduce((a, b) => a + b, 0)',
                { data: [1, 2, 3, 4, 5] }
            );
            expect(result.success).toBe(true);
            expect(result.result).toBe(30);
        });
    });

    describe('validateScript()', () => {
        it('should warn about require usage', () => {
            const warnings = validateScript('const fs = require("fs")');
            expect(warnings).toContain('Script uses require() — modules are not available in sandbox');
        });

        it('should warn about import usage', () => {
            const warnings = validateScript('import fs from "fs"');
            expect(warnings).toContain('Script uses import — modules are not available in sandbox');
        });

        it('should warn about process usage', () => {
            const warnings = validateScript('process.exit(0)');
            expect(warnings).toContain('Script references process — not available in sandbox');
        });

        it('should warn about eval usage', () => {
            const warnings = validateScript('eval("alert(1)")');
            expect(warnings).toContain('Script uses eval() — potential security risk');
        });

        it('should return empty for safe scripts', () => {
            const warnings = validateScript('const x = 1 + 2; console.log(x);');
            expect(warnings).toHaveLength(0);
        });

        it('should detect multiple issues', () => {
            const warnings = validateScript('require("fs"); process.exit(0); eval("x")');
            expect(warnings.length).toBeGreaterThanOrEqual(3);
        });
    });
});
