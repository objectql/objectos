# ObjectOS Web Application

This is a Next.js web application with Better-Auth integration for authentication.

## Features

- 🔐 Email & Password Authentication
- 👥 Organization Management
- 🎭 Role-Based Access Control (RBAC)
- 👨‍👩‍👧‍👦 Team Collaboration
- 🔒 Secure Session Management

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Initialize the database:

```bash
npx tsx scripts/init-db.ts
```

4. Start the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

- `/` - Home page with overview
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/dashboard` - Protected dashboard (requires authentication)

## Screenshots

### Home Page
![Home Page](https://github.com/user-attachments/assets/d7f77a2f-3c9e-4e9b-b8ed-4339d09bf8b3)

### Sign Up Page
![Sign Up Page](https://github.com/user-attachments/assets/79e04c5c-ee82-4752-ba99-7a4197353c9a)

### Sign In Page
![Sign In Page](https://github.com/user-attachments/assets/d5d2ee57-06df-46dc-ae4d-67ee0b4c3445)

## Authentication

This application uses [Better-Auth](https://better-auth.com) for authentication with the following features:

- Email/Password authentication
- Organization management with teams
- Role-based access control (RBAC)
- First user automatically gets `super_admin` role
- Subsequent users get `user` role by default

## Database

By default, the application uses SQLite for local development. You can configure it to use PostgreSQL or MongoDB by updating the `DATABASE_URL` environment variable.

### SQLite (default)
```
DATABASE_URL=sqlite:objectos-web.db
```

### PostgreSQL
```
DATABASE_URL=postgres://user:password@localhost:5432/objectos
```

### MongoDB
```
DATABASE_URL=mongodb://localhost:27017/objectos
```

### Database Initialization

The database schema needs to be initialized before first use. Run the initialization script:

```bash
npx tsx scripts/init-db.ts
```

This will create all necessary tables for authentication, users, sessions, organizations, and teams.

## Building for Production

```bash
pnpm build
pnpm start
```

## Development Commands

Available scripts in the root package.json:

```bash
# Start web development server
pnpm web:dev

# Build the web application
pnpm web:build

# Start production server
pnpm web:start
```

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [Better-Auth](https://better-auth.com) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [SQLite](https://www.sqlite.org/) / [PostgreSQL](https://www.postgresql.org/) / [MongoDB](https://www.mongodb.com/) - Database options

## License

AGPL-3.0
