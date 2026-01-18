# @objectos/server

## 0.2.0 (2026-01-17)

### Minor Changes

- **Metadata Loader Integration**: Enhanced server to support dynamic metadata loading
  - Auto-generated REST endpoints for all objects
  - Metadata API endpoints for UI consumption
  - Hot-reload support in development mode

- **Authentication Module**: Integrated Better-Auth for authentication
  - Local authentication (email/password)
  - OAuth 2.0 support (Google, GitHub, Microsoft)
  - JWT token management
  - Session management

- **API Enhancements**:
  - Batch operations endpoint
  - Query endpoint with advanced filtering
  - File upload support
  - WebSocket support for real-time updates

- **Security Improvements**:
  - CORS configuration
  - Rate limiting
  - Security headers (helmet)
  - Input validation and sanitization

- **Error Handling**: Standardized error responses
  - Consistent error format across all endpoints
  - Detailed error messages for debugging
  - HTTP status code mapping

### Patch Changes

- **Updated dependencies**:
  - @objectos/kernel@0.2.0
  - @objectql/core@1.8.1
  - @objectql/driver-sql@1.8.1
  - @objectql/driver-mongo@1.8.1

- Fixed issue with middleware execution order
- Improved request logging
- Performance optimizations for API endpoints
- Enhanced TypeScript type definitions

### Documentation

- Added complete HTTP protocol specification
- API endpoint documentation with examples
- Authentication and authorization guides
- Deployment documentation

### Breaking Changes

- Changed API endpoint structure from `/api/v4/` to `/api/data/`
- Renamed some configuration options for consistency
- Updated permission checking to use new RBAC system

## 0.1.0 (2025-12-15)

### Major Changes

- Initial release of @objectos/server
- NestJS-based HTTP server implementation
- Basic REST API endpoints
- Integration with @objectos/kernel
- Development server with hot-reload
