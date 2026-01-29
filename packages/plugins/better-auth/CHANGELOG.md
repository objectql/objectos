# Changelog

All notable changes to the `@objectos/plugin-better-auth` plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-28

### Added

- Initial release of Better-Auth plugin for ObjectOS
- Authentication support via Better-Auth library
- Email/password authentication
- Organization and team management via Better-Auth organization plugin
- Role-based access control (owner, admin, user)
- Multi-database support (PostgreSQL, MongoDB, SQLite)
- Plugin lifecycle hooks (onInstall, onEnable, onDisable, onUninstall)
- Automatic route registration at `/api/auth/*`
- Event system with auth-related events
- First user automatically becomes super_admin
- Factory function for custom plugin configuration
- Comprehensive documentation and examples
- Test suite (7 passing tests)

### Features

#### Core Authentication
- User registration and login via email/password
- Session management with secure cookies
- Organization and team support
- Dynamic access control

#### Database Support
- PostgreSQL via `pg` driver
- MongoDB via `mongodb` driver  
- SQLite via `better-sqlite3` driver
- Automatic database detection from connection string

#### Plugin Architecture
- Conforms to @objectstack/spec v0.6.0 protocol
- Implements PluginDefinition lifecycle interface
- Provides ObjectStackManifest for plugin metadata
- Scoped storage for plugin configuration

#### Events
- `auth.user.created` - New user registration
- `auth.user.login` - User login
- `auth.user.logout` - User logout
- `auth.session.created` - New session creation
- `auth.session.expired` - Session expiration

### Documentation

- README.md - Complete plugin documentation
- INTEGRATION.md - Integration guide for ObjectOS Server
- CHANGELOG.md - This changelog
- examples/usage.ts - Usage examples
- test/plugin.test.ts - Test suite

### Dependencies

- better-auth ^1.4.10
- better-sqlite3 ^12.6.0
- mongodb ^7.0.0
- pg ^8.11.3
- @objectstack/spec 0.6.0

[0.1.0]: https://github.com/objectstack-ai/objectos/releases/tag/%40objectos/plugin-better-auth%400.1.0
