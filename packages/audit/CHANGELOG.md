# Changelog

All notable changes to @objectos/plugin-audit-log will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-29

### Added

- ✅ **Audit Event Recording (审计事件记录)**
  - Automatic capture of all CRUD operations
  - Create, Read, Update, Delete event tracking
  - Comprehensive metadata capture (user, timestamp, resource)
  - Event filtering and querying capabilities

- ✅ **Audit Tracking (审计跟踪)**
  - User action tracking (who did what, when, where)
  - IP address and user agent tracking
  - Session tracking
  - Date range queries
  - User-based filtering
  - Pagination support

- ✅ **Field History (字段历史)**
  - Field-level change tracking
  - Before/after value capture
  - Field-specific history queries
  - Complete audit trail for records

- **Plugin Infrastructure**
  - Full plugin lifecycle support (install, enable, disable, uninstall)
  - Event-driven architecture integration
  - Configurable audit scope
  - Sensitive field exclusion
  - In-memory storage implementation
  - Custom storage interface

- **API**
  - `queryEvents()` - Query audit events with filters
  - `getAuditTrail()` - Get complete audit trail for a record
  - `getFieldHistory()` - Get change history for a specific field
  - `getAuditLogAPI()` - Helper to access the plugin API

- **Configuration Options**
  - Enable/disable audit logging
  - Specify audited objects
  - Exclude sensitive fields
  - Configure retention policy
  - Custom storage implementation

- **Documentation**
  - Comprehensive README with examples
  - Integration guide
  - API documentation
  - Best practices

- **Testing**
  - 100% test coverage for core functionality
  - Plugin lifecycle tests
  - Audit event recording tests
  - Audit tracking tests
  - Field history tests
  - Storage implementation tests

### Notes

This is the initial release implementing all three required features:
1. 审计事件记录 (Audit Event Recording)
2. 审计跟踪 (Audit Tracking)
3. 字段历史 (Field History)
