# @objectos/plugin-server

The Runtime Gateway using NestJS.

## Overview

The primary entry point for the ObjectOS Kernel. It boots up the NestJS application, mounts all other plugins, and exposes the public API surfaces (REST, GraphQL, WebSocket).

## Features

- ✅ **NestJS Core**: Leveraging the robust module system of NestJS.
- ✅ **Auto-Documentation**: Swagger/OpenAPI generation from Object definitions.
- ✅ **Protocol Adapters**:
  - **GraphQL**: `/graphql` for flexible data fetching.
  - **REST**: `/api/v1/...` for standard integrations.
  - **WebSocket**: `/ws` for live subscriptions and sync.
- ✅ **Middleware Chain**: Global error handling, logging, and context injection.

## Development Plan

- [ ] **Rate Limiting**: Built-in DDOS protection.
- [ ] **Cluster Mode**: PM2 integration for multi-core scaling.
- [ ] **HTTP/2**: Enable faster multiplexing support.
- [ ] **Serverless Adaptor**: wrapper for AWS Lambda / Vercel deployment.
