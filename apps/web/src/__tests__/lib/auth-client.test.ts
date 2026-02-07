/**
 * Unit tests for @/lib/auth-client
 *
 * Validates that createAuthClient is called with correct ObjectStack config:
 * - baseURL uses window.location.origin + /api/v1/auth
 * - organizationClient plugin is included
 * - Re-exports signIn, signUp, signOut, useSession
 */
import { describe, it, expect, vi } from 'vitest';

// Mock better-auth/react and better-auth/client/plugins BEFORE importing auth-client
const mockClient = {
  signIn: { email: vi.fn(), social: vi.fn() },
  signUp: { email: vi.fn() },
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null, isPending: false })),
  organization: {},
  useListOrganizations: vi.fn(),
  useActiveOrganization: vi.fn(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreateAuthClient = vi.fn((() => mockClient) as any);
const mockOrganizationClient = vi.fn(() => ({ id: 'organization' }));

vi.mock('better-auth/react', () => ({
  createAuthClient: mockCreateAuthClient,
}));

vi.mock('better-auth/client/plugins', () => ({
  organizationClient: mockOrganizationClient,
}));

describe('auth-client', () => {
  it('should call createAuthClient with correct baseURL', async () => {
    await import('@/lib/auth-client');

    expect(mockCreateAuthClient).toHaveBeenCalledTimes(1);
    const config = mockCreateAuthClient.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(config.baseURL).toBe('http://localhost:3001/api/v1/auth');
  });

  it('should include organizationClient plugin', async () => {
    // Module is cached — createAuthClient was called once during first import
    const config = mockCreateAuthClient.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(config?.plugins).toBeDefined();
    expect(config?.plugins).toContainEqual({ id: 'organization' });
  });

  it('should export signIn, signUp, signOut, useSession', async () => {
    const mod = await import('@/lib/auth-client');

    expect(mod.signIn).toBeDefined();
    expect(mod.signUp).toBeDefined();
    expect(mod.signOut).toBeDefined();
    expect(mod.useSession).toBeDefined();
  });

  it('should export organization-related hooks', async () => {
    const mod = await import('@/lib/auth-client');

    expect(mod.organization).toBeDefined();
    expect(mod.useListOrganizations).toBeDefined();
    expect(mod.useActiveOrganization).toBeDefined();
  });

  it('should export the authClient instance', async () => {
    const mod = await import('@/lib/auth-client');

    expect(mod.authClient).toBeDefined();
    expect(mod.authClient).toBe(mockClient);
  });
});
