import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Auth client configured to use ObjectStack Hono server.
 *
 * - In dev: Vite proxy forwards /api/v1 → http://localhost:3000
 * - In prod: Same origin via staticMount (single-process)
 */
export const authClient = createAuthClient({
  baseURL: "/api/v1/auth",
  plugins: [organizationClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  useListOrganizations,
  useActiveOrganization,
} = authClient;
