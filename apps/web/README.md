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

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

- `/` - Home page with overview
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/dashboard` - Protected dashboard (requires authentication)

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

## Building for Production

```bash
pnpm build
pnpm start
```

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [Better-Auth](https://better-auth.com) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## License

AGPL-3.0
