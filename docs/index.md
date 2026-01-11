---
layout: home

hero:
  name: "ObjectOS"
  text: "Metadata-Driven Enterprise Runtime"
  tagline: "Build complete enterprise applications from YAML. ObjectQL defines the protocol, ObjectOS executes it."
  actions:
    - theme: brand
      text: Quick Start
      link: /guide/
    - theme: alt
      text: Architecture
      link: /guide/architecture
    - theme: alt
      text: View Specs
      link: /spec/

features:
  - title: 🎯 Protocol-Driven
    details: Implements the ObjectQL metadata standard - a declarative YAML format for describing business objects, relationships, and logic.
  
  - title: 🏗️ Three-Layer Architecture
    details: Clean separation - Kernel handles logic, Drivers handle data, Server handles HTTP. Swap databases without changing business logic.
  
  - title: ⚡ Auto-Generated UI
    details: React components automatically render from metadata. Data grids, forms, charts - all generated from your YAML definitions.
  
  - title: 🔐 Enterprise Security
    details: Built-in authentication (Better-Auth), object-level permissions, field-level security, and record-level sharing rules.
  
  - title: 🔌 Database Agnostic
    details: Works with PostgreSQL, MongoDB, SQLite through pluggable drivers. Add support for any database by implementing the driver interface.
  
  - title: 🤖 AI-Ready
    details: Perfect execution layer for AI-generated applications. AI writes the YAML metadata, ObjectOS runs it instantly.
---

## What is ObjectOS?

ObjectOS is a **high-performance runtime engine** that transforms declarative metadata into fully functional enterprise applications.

### The Ecosystem

- **[ObjectQL](https://github.com/objectql/objectql)** - The metadata protocol and standard
- **ObjectOS** (this project) - The runtime engine that executes ObjectQL metadata
- **Your Applications** - Built purely from YAML definitions

### Example: Define a CRM Object

```yaml
# objects/contact.object.yml
name: contacts
label: Contact
icon: user

fields:
  first_name:
    type: text
    label: First Name
    required: true
  
  last_name:
    type: text
    label: Last Name
    required: true
  
  email:
    type: email
    label: Email
    unique: true
  
  account:
    type: lookup
    reference_to: accounts
    label: Account

permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

**That's it!** ObjectOS automatically provides:
- ✅ REST API endpoints for CRUD operations
- ✅ Database tables with proper indexes
- ✅ React UI components (grid + form)
- ✅ Validation and error handling
- ✅ Permission enforcement
- ✅ Relationship resolution

## Core Principle

> **"Kernel handles logic, Drivers handle data, Server handles HTTP."**

This separation ensures testability, flexibility, and maintainability as your application scales.

