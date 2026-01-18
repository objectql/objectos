# HTTP Protocol Specification

The ObjectOS Server exposes a RESTful HTTP API that provides complete CRUD operations for all objects defined in metadata. This document specifies the complete HTTP protocol.

## Base URL

```
http://localhost:3000/api
```

For production deployments, replace with your actual domain.

## Authentication

### Header Format

All authenticated requests must include the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Getting a Token

Obtain an authentication token through the auth endpoint:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Request Headers

### Required Headers

```
Content-Type: application/json
```

### Optional Headers

```
Authorization: Bearer <token>      # For authenticated requests
X-Request-ID: <unique_id>          # For request tracking
Accept-Language: en-US             # For internationalization
```

## Response Format

### Success Response

All successful responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "count": 100,              // Total records (for queries)
    "page": 1,                 // Current page
    "limit": 20                // Records per page
  }
}
```

### Error Response

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation failed",
    "details": {
      "field": "email",
      "reason": "Email is required"
    }
  }
}
```

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request syntax or validation error |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Unique constraint violation |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Server error |

## Standard Endpoints

### 1. Query Records

Retrieve multiple records with filtering, sorting, and pagination.

**Endpoint:**
```
POST /api/data/{object}/query
```

**Request Body:**
```json
{
  "filters": {
    "status": "active"
  },
  "fields": ["id", "name", "email"],
  "sort": [
    { "field": "created_at", "order": "desc" }
  ],
  "limit": 20,
  "skip": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contact_123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "meta": {
    "count": 150,
    "limit": 20,
    "skip": 0
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/data/contacts/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "filters": { "status": "active" },
    "limit": 20
  }'
```

### 2. Get Single Record

Retrieve a single record by ID.

**Endpoint:**
```
GET /api/data/{object}/{id}
```

**Query Parameters:**
- `fields`: Comma-separated list of fields to return
- `include`: Comma-separated list of related objects to include

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/data/contacts/contact_123 \
  -H "Authorization: Bearer <token>"
```

### 3. Create Record

Create a new record.

**Endpoint:**
```
POST /api/data/{object}
```

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "contact_456",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/data/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com"
  }'
```

### 4. Update Record

Update an existing record.

**Endpoint:**
```
PATCH /api/data/{object}/{id}
```

**Request Body:**
```json
{
  "phone": "+1987654321",
  "status": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1987654321",
    "status": "inactive",
    "updated_at": "2024-01-15T11:30:00Z"
  }
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/data/contacts/contact_123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "phone": "+1987654321"
  }'
```

### 5. Delete Record

Delete a record.

**Endpoint:**
```
DELETE /api/data/{object}/{id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "deleted": true
  }
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/data/contacts/contact_123 \
  -H "Authorization: Bearer <token>"
```

### 6. Batch Operations

Create, update, or delete multiple records in a single request.

**Endpoint:**
```
POST /api/data/{object}/batch
```

**Request Body:**
```json
{
  "operations": [
    {
      "type": "create",
      "data": { "name": "Record 1" }
    },
    {
      "type": "update",
      "id": "contact_123",
      "data": { "status": "active" }
    },
    {
      "type": "delete",
      "id": "contact_456"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "created": 1,
    "updated": 1,
    "deleted": 1,
    "results": [
      { "type": "create", "id": "contact_789", "success": true },
      { "type": "update", "id": "contact_123", "success": true },
      { "type": "delete", "id": "contact_456", "success": true }
    ]
  }
}
```

## Metadata Endpoints

### Get Object Metadata

Retrieve metadata definition for an object.

**Endpoint:**
```
GET /api/metadata/{object}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "contacts",
    "label": "Contact",
    "icon": "user",
    "fields": {
      "first_name": {
        "type": "text",
        "label": "First Name",
        "required": true
      },
      "email": {
        "type": "email",
        "label": "Email",
        "unique": true
      }
    },
    "permission_set": {
      "allowRead": true,
      "allowCreate": ["sales", "admin"],
      "allowEdit": ["sales", "admin"],
      "allowDelete": ["admin"]
    }
  }
}
```

### List All Objects

Get list of all available objects.

**Endpoint:**
```
GET /api/metadata
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "contacts",
      "label": "Contact",
      "icon": "user"
    },
    {
      "name": "accounts",
      "label": "Account",
      "icon": "building"
    }
  ]
}
```

## Advanced Features

### Filtering

See [Query Language Specification](./query-language.md) for complete filter syntax.

```bash
curl -X POST http://localhost:3000/api/data/contacts/query \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "$and": [
        { "status": "active" },
        { "age": { "$gte": 18 } }
      ]
    }
  }'
```

### Including Related Records

Include related object data in a single request:

```bash
curl -X POST http://localhost:3000/api/data/opportunities/query \
  -H "Content-Type: application/json" \
  -d '{
    "include": ["account", "owner"],
    "limit": 10
  }'
```

**Response includes nested objects:**
```json
{
  "data": [
    {
      "id": "opp_123",
      "name": "Big Deal",
      "account": {
        "id": "acc_456",
        "name": "Acme Corp"
      },
      "owner": {
        "id": "user_789",
        "name": "John Doe"
      }
    }
  ]
}
```

### Pagination

Use `limit` and `skip` for pagination:

```bash
# Page 1
curl -X POST http://localhost:3000/api/data/contacts/query \
  -d '{ "limit": 20, "skip": 0 }'

# Page 2
curl -X POST http://localhost:3000/api/data/contacts/query \
  -d '{ "limit": 20, "skip": 20 }'

# Page 3
curl -X POST http://localhost:3000/api/data/contacts/query \
  -d '{ "limit": 20, "skip": 40 }'
```

## Error Examples

### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation failed",
    "details": {
      "email": "Email is required"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": 401,
    "message": "Authentication required"
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": 403,
    "message": "Insufficient permissions",
    "details": {
      "action": "delete",
      "object": "contacts"
    }
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Record not found",
    "details": {
      "object": "contacts",
      "id": "contact_999"
    }
  }
}
```

### 409 Conflict - Unique Constraint

```json
{
  "success": false,
  "error": {
    "code": 409,
    "message": "Unique constraint violation",
    "details": {
      "field": "email",
      "value": "john@example.com"
    }
  }
}
```

## Rate Limiting

API requests are rate-limited per user:

- **Free tier**: 100 requests per minute
- **Pro tier**: 1000 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642341600
```

## CORS

Cross-Origin Resource Sharing (CORS) is enabled for the following origins:

- `http://localhost:5173` (development)
- Configured production domains

## WebSocket Protocol

For real-time updates, ObjectOS supports WebSocket connections:

**Endpoint:**
```
ws://localhost:3000/ws
```

**Message Format:**
```json
{
  "type": "subscribe",
  "object": "contacts",
  "filters": { "status": "active" }
}
```

See [Real-Time Guide](../guide/realtime.md) for details (coming soon).

## API Versioning

Current API version: `v1`

Version is included in the URL path:
```
/api/v1/data/{object}
```

Breaking changes will introduce new versions (`v2`, `v3`, etc.).
