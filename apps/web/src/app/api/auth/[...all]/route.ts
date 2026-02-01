import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { role } from "better-auth/plugins/access";
import Database from "better-sqlite3";
import { toNextJsHandler } from "better-auth/next-js";

// Initialize database
const db = new Database(process.env.DATABASE_URL?.replace('sqlite:', '') || 'objectos-web.db');

// Create Better-Auth instance
const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000/api/auth",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://[::1]:3000",
    "http://[::1]:5173"
  ],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: 'user',
        input: false
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          try {
            // Check if this is the first user
            let count = 0;
            try {
              const stmt = db.prepare('SELECT count(*) as count FROM user');
              const result = stmt.get() as any;
              count = result.count;
            } catch {
              count = 0;
            }

            // First user gets super_admin role
            const role = count === 0 ? 'super_admin' : 'user';
            console.log(`Creating user with role: ${role} (current count: ${count})`);
            
            return {
              data: {
                ...user,
                role
              }
            };
          } catch (e) {
            console.error("Error in user create hook:", e);
            return { 
              data: {
                ...user,
                role: 'user'
              }
            };
          }
        }
      }
    }
  },
  plugins: [
    organization({
      dynamicAccessControl: {
        enabled: true
      },
      teams: {
        enabled: true
      },
      creatorRole: 'owner',
      roles: {
        owner: role({
          organization: ['update', 'delete', 'read'],
          member: ['create', 'update', 'delete', 'read'],
          invitation: ['create', 'cancel', 'read'],
          team: ['create', 'update', 'delete', 'read']
        }),
        admin: role({
          organization: ['update', 'read'],
          member: ['create', 'update', 'delete', 'read'],
          invitation: ['create', 'cancel', 'read'],
          team: ['create', 'update', 'delete', 'read']
        }),
        user: role({
          organization: ['read'],
          member: ['read'],
          team: ['read']
        })
      }
    })
  ]
});

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;
export const POST = handlers.POST;
