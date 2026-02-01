/**
 * Better-Auth API Route Handler
 * 
 * This handles all authentication requests at /api/auth/*
 */

import { getBetterAuth } from "@objectos/plugin-better-auth";
import { toNextJsHandler } from "better-auth/next-js";

// Configure route as dynamic
export const dynamic = 'force-dynamic';

// Initialize Better-Auth instance
const auth = await getBetterAuth({
  databaseUrl: process.env.OBJECTQL_DATABASE_URL,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000/api/auth",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://[::1]:3000",
    "http://[::1]:5173",
  ],
});

export const { GET, POST } = toNextJsHandler(auth);
