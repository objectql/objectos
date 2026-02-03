# ObjectOS Web Application

The reference implementation of a web interface for ObjectOS. It serves as the Admin Console and user interface.

## Features

- **Next.js App Router**: Modern React framework.
- **Better-Auth Integration**: Complete authentication flows (Sign In, Sign Up, Forgot Password).
- **Admin Console**: Interface for managing Objects, Records, and configurations.
- **Tailwind CSS**: Styling infrastructure.

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Integration

This app connects directly to the ObjectQuick/ObjectOS runtime and uses the `@objectos/plugin-better-auth` for identity management.
