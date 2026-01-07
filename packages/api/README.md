# @objectql/api

This package provides REST API generation and Router creation for ObjectQL applications. It bridges Express.js with ObjectQL.

## Features

- **Auto-generated REST API**: `/api/:objectName` endpoints.
- **Swagger/OpenAPI**: Automatic documentation generation.
- **Standard CRUD**: `GET`, `POST`, `PUT`, `DELETE` handlers.
- **Aggregation**: Support for pipeline aggregation via HTTP.

## Installation

```bash
npm install @objectql/api
```

## Usage

```typescript
import express from 'express';
import { ObjectQL } from '@objectql/core';
import { createObjectQLRouter } from '@objectql/api';

const app = express();
const objectql = new ObjectQL({ ... });

app.use('/api', createObjectQLRouter({
    objectql,
    swagger: {
        enabled: true,
        path: '/docs'
    },
    getContext: async (req, res) => {
        // Authenticate request and return context
        return objectql.createContext({ userId: '...' });
    }
}));

app.listen(3000);
```
