/**
 * Better-Auth Client Configuration
 * 
 * This module provides the Better-Auth client for frontend authentication
 */

import { createAuthClient } from "better-auth/react";

export const { signIn, signOut, signUp, useSession } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000/api/auth",
});
