/**
 * Better-Auth Database Migration Script
 * 
 * This script initializes the Better-Auth database with the required schema.
 * The database file will be created in the apps/site directory as objectos.db
 */

import { getBetterAuth } from "@objectos/plugin-better-auth";

console.log("Initializing database schema...");
console.log("Database location: apps/site/objectos.db");

try {
  const auth = await getBetterAuth({
    databaseUrl: process.env.OBJECTQL_DATABASE_URL || "sqlite:objectos.db",
  });
  
  console.log("Database initialized successfully!");
  console.log("You can now use the authentication system.");
  process.exit(0);
} catch (error) {
  console.error("Failed to initialize database:", error);
  process.exit(1);
}
