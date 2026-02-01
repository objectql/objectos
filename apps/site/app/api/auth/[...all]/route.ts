/**
 * Better-Auth API Route Handler
 * 
 * This handles all authentication requests at /api/auth/*
 */

import { getBetterAuth } from "@objectos/plugin-better-auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { BetterAuthOptions } from "better-auth";

// Configure route as dynamic
export const dynamic = 'force-dynamic';

// Lazy initialize auth instance
let authInstance: Awaited<ReturnType<typeof getBetterAuth>>;
let handlerInstance: ReturnType<typeof toNextJsHandler>;

async function getAuthHandler() {
  if (!handlerInstance) {
    // Initialize Better-Auth instance
    // Database path is resolved as: ENV var > default sqlite:objectos.db (created in apps/site/)
    authInstance = await getBetterAuth({
      databaseUrl: process.env.OBJECTQL_DATABASE_URL || "sqlite:objectos.db",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000/api/auth",
      trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://[::1]:3000",
        "http://[::1]:5173",
      ],
    });
    
    handlerInstance = toNextJsHandler(authInstance);
  }
  
  return handlerInstance;
}

export async function GET(request: Request) {
  const handler = await getAuthHandler();
  return handler.GET(request);
}

export async function POST(request: Request) {
  const handler = await getAuthHandler();
  return handler.POST(request);
}
