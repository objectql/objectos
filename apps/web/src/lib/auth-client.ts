import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000/api/auth",
  plugins: [
    organizationClient()
  ]
});

export const { signIn, signUp, signOut, useSession, organization, useListOrganizations, useActiveOrganization } = authClient;

