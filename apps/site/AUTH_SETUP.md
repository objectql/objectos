# Better-Auth Setup for ObjectOS Site

This document describes the authentication setup for the ObjectOS documentation site.

## Overview

The site uses [Better-Auth](https://www.better-auth.com/) for authentication, providing:
- Email/Password authentication
- User session management
- Secure cookie-based sessions
- SQLite database for user storage

## Architecture

### Components

1. **Auth Client** (`lib/auth-client.ts`)
   - Better-Auth React client configuration
   - Exports `signIn`, `signUp`, `signOut`, and `useSession` hooks

2. **API Route** (`app/api/auth/[...all]/route.ts`)
   - Handles all authentication requests at `/api/auth/*`
   - Uses the better-auth plugin from `@objectos/plugin-better-auth`

3. **UI Components**
   - `components/auth/sign-in-form.tsx` - Sign in form
   - `components/auth/sign-up-form.tsx` - Sign up form with validation
   - `components/auth/user-menu.tsx` - User dropdown menu in navigation

4. **Pages**
   - `/sign-in` - Sign in page
   - `/sign-up` - Sign up page

## Database Setup

The authentication system uses SQLite by default. To initialize the database:

```bash
cd apps/site
npx @better-auth/cli migrate
```

This creates the `objectos.db` file with all necessary tables.

## Environment Variables

You can configure the authentication system with these environment variables:

```env
# Optional: Database URL (defaults to sqlite:objectos.db)
OBJECTQL_DATABASE_URL=sqlite:objectos.db

# Optional: Auth base URL (defaults to http://localhost:3000/api/auth)
BETTER_AUTH_URL=http://localhost:3000/api/auth
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth

# Optional: Secret for JWT signing (auto-generated if not set)
BETTER_AUTH_SECRET=your-secret-key
```

## First User

The first user to sign up automatically receives the `super_admin` role. Subsequent users get the `user` role.

## Development

Run the development server:

```bash
pnpm dev
```

Then visit:
- http://localhost:3000/sign-up to create an account
- http://localhost:3000/sign-in to sign in

## Features

### Sign Up
- Name, email, and password fields
- Password confirmation
- Minimum 8 character password requirement
- Error handling for duplicate emails

### Sign In
- Email and password authentication
- Error handling for invalid credentials
- Automatic redirect to home page on success

### User Menu
- Displays user name and email
- Sign out functionality
- Avatar with user initials

## Security

- Passwords are hashed using bcrypt
- Sessions use secure HTTP-only cookies
- CSRF protection enabled
- Trusted origins configured for CORS

## Production Deployment

For production:

1. Set a strong `BETTER_AUTH_SECRET`
2. Configure `BETTER_AUTH_URL` to your production domain
3. Use PostgreSQL or MongoDB for better scalability
4. Enable HTTPS for secure cookie transmission

## Troubleshooting

### Database not found error

Run the migration command:
```bash
npx @better-auth/cli migrate
```

### Session not persisting

Check that cookies are enabled and `BETTER_AUTH_URL` matches your domain.

### Build errors

Ensure better-sqlite3 is properly built:
```bash
pnpm rebuild better-sqlite3
```
