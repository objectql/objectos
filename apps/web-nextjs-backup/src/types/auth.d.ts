import type { User as DefaultUser, Session as DefaultSession } from "better-auth";

declare module "better-auth" {
  interface User extends DefaultUser {
    role?: string;
  }
  
  interface Session extends DefaultSession {
    user: User;
  }
}
