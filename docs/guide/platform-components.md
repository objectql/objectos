# Platform Component Design & Implementation

This document provides a comprehensive architectural breakdown of the ObjectOS components, focusing on how they interact to realize the full platform functionality. It is intended for Solution Architects and Core Contributors.

## 📐 Design Philosophy

1.  **Strict Layering**: Interactions flow one way: `UI -> Server -> Kernel -> Driver`. Bypassing layers (e.g., Server directly querying DB) is forbidden.
2.  **Metadata Sovereignty**: The state of the system is defined by `*.object.yml` files. Code is just the interpreter.
3.  **Adapter Pattern**: All external systems (DB, Auth, Storage) are accessed via pluggable adapters (Drivers).

---

## 🏗️ 1. Logic & State Support (Kernel Layer)

The `@objectos/kernel` package is the runtime engine. It encapsulates the "Business Intelligence" of the platform.

### Component Breakdown

| Component | Responsibility | Implementation Notes |
| :--- | :--- | :--- |
| **ObjectRegistry** | In-memory cache of all object definitions. | Parses YAML on startup. Handles merging of "Standard" and "Custom" objects. |
| **FieldTypeFactory** | Converts metadata types to JS behaviors. | `resolve('currency')` -> Returns formatter, validation regex, and DB column type. |
| **QueryDispatcher** | Translates high-level requests to Driver calls. | `kernel.find('contact')` -> `driver.find('contact_table')`. Handles alias mapping. |
| **HookExecutor** | Runs logic before/after CRUD events. | Supports synchronous and asynchronous patterns. |
| **PermissionGrant** | Resolves "Can User X do Action Y?". | Evaluates Profile rules and Record-level sharing (RLS). |

### Functional Realization: "Metadata Hot-Reloading"
*   **Design**: The Registry watches the filesystem.
*   **Flow**: `FileChanged` event -> `Registry.reload()` -> `Driver.syncSchema()` -> `Server.clearCache()`.

---

## 🌐 2. Interface Support (Server Layer)

The `@objectos/server` package is the Gateway. It translates HTTP/WebSockets into Kernel calls.

### Component Breakdown

| Component | Responsibility | Implementation Notes |
| :--- | :--- | :--- |
| **ObjectQLController** | Generic REST endpoint for all objects. | `GET /:objectName/*`. No need to write manual controllers for new objects. |
| **AuthProvider** | Authentication strategy manager. | Wraps `better-auth`. Supports pluggable strategies (GitHub, Google, SSO). |
| **StaticServeModule** | Hosting the compiled frontend. | Resolves `@objectos/web` dist path dynamically for production deployments. |
| **ExceptionFilter** | Standardized error formatting. | Converts `ObjectOSError` into JSON: `{ error: { code: 404, message: "..." } }`. |

### Functional Realization: "Context-Aware Request"
*   **Design**: Every Kernel request requires a `SessionContext`.
*   **Flow**: HTTP Header `Authorization` -> Middleware decodes JWT -> Creates `SessionContext(userId)` -> Passes to `kernel.find(ctx, ...)`.

---

## 🖥️ 3. Interaction Support (UI Layer)

The `@objectos/ui` (Components) and `@objectos/web` (App) packages provide the human interface.

### Component Breakdown

| Component | Responsibility | Implementation Notes |
| :--- | :--- | :--- |
| **ObjectGrid** | Data Table with "Excel-like" features. | Uses **TanStack Table**. Implements Virtual Scroll for 100k+ rows. |
| **ObjectForm** | Dynamic Record Editor. | Uses **React-Hook-Form**. Generates Zod schema from Metadata at runtime. |
| **LayoutShell** | Application chrome (Sidebar, Header). | Responsive. Adapts menu based on user permissions. |
| **DataQueryHook** | React Query wrapper for API. | Cache management. `useQuery(['data', 'contacts'], ...)` |

### Functional Realization: "Dynamic Types"
*   **Design**: The UI downloads metadata initially.
*   **Flow**: `schema.json` received -> `FieldFactory` maps `type: 'date'` to `<DatePicker />` -> Renders Cell.

---

## 🔌 4. Infrastructure Support (Driver Layer)

Reliable persistence on any database.

| Component | Responsibility | Implementation Notes |
| :--- | :--- | :--- |
| **AbstractDriver** | Base class for all drivers. | Defines the `IObjectQLDriver` interface. |
| **KnexDriver** | SQL implementation (Postgres/SQLite). | Handles SQL generation, schema migration (`CREATE TABLE`), and transactions. |
| **MongoDriver** | NoSQL implementation. | Maps objects to Collections. Handles `_id` mapping. |

---

## ✅ System Capability Checklist

To prove functional completeness for a release (e.g., v1.0), the system must pass these integration scenarios:

### A. The "Zero-Code" Flow
1.  **Define**: Create `cars.object.yml` with `brand`, `model`, `price`.
2.  **Verify**: API `/api/v4/cars` is immediately available (200 OK).
3.  **Interact**: UI shows "Cars" menu item. Grid works. Form works.

### B. The "Secure-By-Default" Flow
1.  **Restrict**: Set `cars.permission.yml` to `read: false` for Guest.
2.  **Verify**: Unauthenticated API call returns 401/403.
3.  **Interact**: UI hides "Cars" from navigation for Guests.

### C. The "Enterprise-Scale" Flow
1.  **Load**: Insert 10,000 records via Script.
2.  **Verify**: Grid loads first page in < 200ms (Persistence + Network).
3.  **Interact**: Search/Filter works instantly (Backend Indexing).
