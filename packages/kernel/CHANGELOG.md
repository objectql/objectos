# @objectos/kernel

## 0.2.0 (2026-01-17)

### Minor Changes

- **Metadata Loader**: Added comprehensive metadata loading system
  - Support for `*.object.yml`, `*.app.yml`, and `*.data.yml` files
  - Automatic discovery and registration of metadata
  - Hot-reload support in development mode

- **Hook System**: Implemented lifecycle hooks for all CRUD operations
  - beforeFind, afterFind
  - beforeInsert, afterInsert
  - beforeUpdate, afterUpdate
  - beforeDelete, afterDelete
  - Object-specific hooks with `:objectName` syntax

- **Action Registry**: Custom action endpoint support
  - Register custom business logic endpoints
  - Full TypeScript support with type inference
  - Built-in permission checking

- **Permission Enforcement**: Enhanced security model
  - Object-level permissions (CRUD)
  - Field-level security
  - Record-level security (RLS)
  - Role-based access control (RBAC)

- **Transaction Support**: Database transaction management
  - Automatic rollback on errors
  - Nested transaction support

### Patch Changes

- Fixed issue with metadata registry initialization
- Improved error messages for validation failures
- Performance optimizations for large metadata sets
- Enhanced TypeScript type definitions

### Documentation

- Added comprehensive SDK reference
- Expanded API documentation with examples
- Added integration guides for common use cases

## 0.1.0 (2025-12-15)

### Major Changes

- Initial release of @objectos/kernel
- Core runtime engine implementation
- Integration with ObjectQL protocol
- Basic CRUD operations support
- Plugin system foundation
