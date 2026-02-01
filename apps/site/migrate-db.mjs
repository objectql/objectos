import { getBetterAuth } from "@objectos/plugin-better-auth";

console.log("Initializing database schema...");

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
