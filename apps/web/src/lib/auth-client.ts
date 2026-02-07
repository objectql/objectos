import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Auth client configured to use ObjectStack Hono server.
 *
 * - In dev: Vite proxy forwards /api/v1 → http://localhost:5320
 * - In prod: Same origin via staticMount (single-process)
 *
 * better-auth requires an absolute URL with protocol.
 * We use window.location.origin so it works in both dev and prod.
 */
export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/api/v1/auth`,
  plugins: [
    organizationClient({
      teams: { enabled: true },
    }),
  ],
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
