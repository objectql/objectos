/**
 * API client for ObjectStack REST endpoints.
 *
 * Wraps `fetch` with typed JSON handling, error normalization,
 * and base URL resolution.  During development the `useMock` flag
 * in each query hook causes calls to resolve from `mock-data.ts`
 * instead of hitting the network.
 */

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as Record<string, string>).error ?? res.statusText,
      res.status,
      (body as Record<string, string>).code,
    );
  }

  return res.json() as Promise<T>;
}
