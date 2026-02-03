# @objectos/plugin-server

The Enterprise Runtime Gateway using NestJS.

## Overview

The primary entry point for the ObjectOS Kernel. While `@objectstack/plugin-hono-server` provides a lightweight, edge-compatible server, **@objectos/plugin-server** brings the full power of the **NestJS** ecosystem to ObjectOS.

It is designed for complex, "Modular Monolith" business applications that require:
- **Dependency Injection**: Robust management of service dependencies.
- **Structured Architecture**: Controllers, Providers, Modules.
- **Rich Ecosystem**: Easy integration with vast NestJS libraries.

It boots up the NestJS application, mounts all other plugins, and exposes the public API surfaces (REST, GraphQL, WebSocket).

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
