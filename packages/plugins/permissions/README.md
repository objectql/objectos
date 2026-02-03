# @objectos/plugin-permissions

The Guardian of ObjectOS - RBAC & ABAC Security Engine.

## Overview

Enforces the "Zero Trust" security model. It intercepts every data access request and validates capabilities against the user's roles and permission sets.

## Features

- ✅ **RBAC (Role-Based)**: Roles (Admin, User) assigned to users.
- ✅ **Permission Sets**: Additive bundles of permissions (e.g., "Can Export Data").
- ✅ **Object Sharing**: Record-level access (Private, Public Read/Write, Shared with Group).
- ✅ **Field Level Security (FLS)**: Hide specific columns (e.g., `salary`) from unauthorized users.
- ✅ **Scope validation**: Validates OAuth scopes.

## Architecture

It acts as a middleware in the ObjectQL query pipeline:
`Query -> Auth (Who are you?) -> Permissions (Can you do this?) -> Resolver -> Database`

## Development Plan

- [ ] **Hierarchical Roles**: Role inheritance (Manager inherits Subordinate access).
- [ ] **Sharing Rules Engine**: Criteria-based sharing ("Share all 'US' leads with 'US Sales Team'").
- [ ] **Manual Sharing**: UI for users to manually share a record.
- [ ] **Permission Assistant**: "Why can't I see this?" debugger tool.
