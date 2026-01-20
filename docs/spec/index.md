# Protocol Specifications

This section provides comprehensive technical specifications for ObjectOS protocols, file formats, and APIs. These specifications are the authoritative reference for developers building with or extending ObjectOS.

## Overview

ObjectOS implements three core protocols:

1. **Metadata Format** - YAML schema for defining business objects
2. **Query Language** - Powerful filtering and querying syntax
3. **HTTP Protocol** - RESTful API endpoints and conventions

## Specifications

### [Metadata Format](./metadata-format.md)

Complete specification of the YAML schema used to define objects, fields, relationships, and permissions. Includes:

- Object schema structure
- All field types (text, number, date, lookup, etc.)
- Field attributes and validation rules
- Permission configuration
- Relationship definitions

**Use this when:** Defining new objects or understanding how metadata is structured.

### [Query Language](./query-language.md)

Comprehensive guide to the ObjectOS Query Language, including filtering, sorting, and pagination. Includes:

- Filter operators (comparison, string, array, null, range)
- Logical operators (AND, OR, NOT)
- Complex query composition
- Field selection and sorting
- Pagination and performance optimization

**Use this when:** Querying data programmatically or building custom queries.

### [HTTP Protocol](./http-protocol.md)

Complete HTTP API reference including all REST endpoints, authentication, and response formats. Includes:

- Authentication and authorization
- Standard CRUD endpoints
- Batch operations
- Metadata endpoints
- Error handling and status codes
- Rate limiting and CORS

**Use this when:** Integrating with ObjectOS via HTTP API or building client applications.

## Quick Links

- **[Getting Started Guide](../guide/index.md)** - New to ObjectOS? Start here
- **[Architecture Guide](../guide/architecture.md)** - Understand the system design
- **[SDK Reference](../guide/sdk-reference.md)** - Programmatic API reference

## Contributing to Specifications

These specifications are living documents. If you find errors or omissions:

1. Open an issue on [GitHub](https://github.com/objectql/objectos/issues)
2. Submit a pull request with corrections
3. Discuss in our community forum (coming soon)

## Version

Current specification version: **v0.2.0**

Last updated: January 2026
