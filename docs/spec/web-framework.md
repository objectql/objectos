# Web Framework Specification

## 1. Overview

The ObjectOS Web Framework is a **plugin-based, extensible architecture** for building enterprise web applications. It provides a minimal core with well-defined extension points, allowing developers to replace or extend any component through a standardized plugin system.

### Design Principles

1. **Minimalist Core**: The framework provides only essential functionality
2. **Plugin Everything**: All major features (tables, forms, charts) are plugins
3. **Clear Contracts**: Well-defined interfaces for plugin development
4. **Progressive Enhancement**: Start simple, add complexity as needed
5. **Ecosystem Ready**: Designed for third-party plugin development

---

## 2. Core Framework Architecture

### 2.1 Framework Layers

```
┌─────────────────────────────────────────────────────┐
│              Application Layer                      │
│  (User's App, Routes, Pages, Business Logic)        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Plugin Layer                           │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Frontend   │  │   Backend    │                │
│  │   Plugins    │  │   Plugins    │                │
│  │  (UI, Forms) │  │(Hooks, APIs) │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Framework Core                         │
│  (Plugin Registry, Event Bus, Context, Metadata)    │
└─────────────────────────────────────────────────────┘
            ↓                           ↓
┌─────────────────────┐    ┌───────────────────────┐
│  Foundation Layer   │    │   ObjectOS Kernel     │
│  (React, UI, Theme) │    │  (Hooks, Actions, DB) │
└─────────────────────┘    └───────────────────────┘
```

### 2.2 Core Modules

The framework core provides:

| Module | Responsibility | Status |
|--------|---------------|--------|
| **PluginRegistry** | Plugin registration and lifecycle management | Core |
| **EventBus** | Event-driven communication between plugins | Core |
| **ThemeProvider** | Theming and styling system | Core |
| **ContextManager** | Application state and configuration | Core |
| **ComponentRegistry** | Component override and extension system | Core |
| **MetadataRegistry** | Plugin-provided object definitions and metadata | Core |
| **HookRegistry** | Server-side hook registration and execution | Core |
| **ActionRegistry** | Custom action registration and invocation | Core |
| **RouteRegistry** | Plugin-provided API endpoint registration | Core |

---

## 3. Plugin System

### 3.1 Plugin Interface

Every plugin must implement the `IObjectOSPlugin` interface:

```typescript
interface IObjectOSPlugin {
  // Unique plugin identifier (npm package name)
  name: string;
  
  // Semantic version
  version: string;
  
  // Plugin metadata (for marketplace and UI)
  metadata: PluginMetadata;
  
  // Plugin capabilities declaration
  capabilities: PluginCapabilities;
  
  // Plugin dependencies (other plugins required)
  dependencies?: string[];
  
  // Initialize plugin (called once on registration)
  initialize(context: PluginContext): void | Promise<void>;
  
  // Cleanup on plugin unload
  destroy?(): void | Promise<void>;
}

interface PluginMetadata {
  // Display name shown in UI
  displayName: string;
  
  // Description for marketplace
  description: string;
  
  // Long description (supports markdown)
  longDescription?: string;
  
  // Plugin author/vendor
  author: string;
  
  // Author/vendor website
  homepage?: string;
  
  // Plugin category for marketplace browsing
  category: 'table' | 'form' | 'chart' | 'calendar' | 'editor' | 'utility' | 'integration';
  
  // Plugin icon (URL or base64)
  icon?: string;
  
  // Screenshots for marketplace
  screenshots?: string[];
  
  // License type (MIT, Commercial, etc.)
  license: string;
  
  // Pricing information
  pricing?: {
    type: 'free' | 'paid' | 'freemium' | 'subscription';
    price?: number;
    currency?: string;
    trialDays?: number;
  };
  
  // Support and documentation links
  links?: {
    documentation?: string;
    support?: string;
    changelog?: string;
    repository?: string;
  };
  
  // Minimum framework version required
  minFrameworkVersion?: string;
  
  // Tags for search and categorization
  tags?: string[];
}

interface PluginCapabilities {
  // Frontend: What UI components does this plugin provide?
  provides?: {
    components?: string[];  // e.g., ['table', 'table.advanced', 'workflow-designer']
    hooks?: string[];       // e.g., ['data:transform']
    services?: string[];    // e.g., ['export', 'analytics']
  };
  
  // Backend: What metadata does this plugin add?
  metadata?: {
    objects?: string[];     // e.g., ['workflow', 'workflow_step', 'workflow_instance']
    fields?: string[];      // e.g., ['workflow_status'] - adds fields to existing objects
    views?: string[];       // e.g., ['workflow_board', 'workflow_timeline']
    actions?: string[];     // e.g., ['start_workflow', 'approve_step']
  };
  
  // Backend: What server-side capabilities does this plugin add?
  backend?: {
    hooks?: string[];       // e.g., ['beforeInsert', 'afterUpdate'] - server-side lifecycle hooks
    actions?: string[];     // e.g., ['workflow.start', 'workflow.approve'] - custom business logic
    apis?: string[];        // e.g., ['/api/workflow/execute', '/api/workflow/status'] - new endpoints
    services?: string[];    // e.g., ['WorkflowEngine', 'ApprovalService'] - background services
  };
  
  // What components/services does this plugin extend?
  extends?: string[];
  
  // Feature flags this plugin supports
  features?: {
    [key: string]: boolean;
  };
}
```

### 3.2 Plugin Context

The framework provides plugins with a context object:

```typescript
interface PluginContext {
  // Access to plugin registry
  registry: PluginRegistry;
  
  // Event bus for pub/sub
  events: EventBus;
  
  // Frontend registries
  components: ComponentRegistry;  // Register UI components
  theme: ThemeProvider;          // Access theme system
  
  // Backend registries
  metadata: MetadataRegistry;    // Register objects, fields, views
  hooks: HookRegistry;           // Register server-side hooks
  actions: ActionRegistry;       // Register custom actions
  routes: RouteRegistry;         // Register API endpoints

  
  // Application configuration
  config: AppConfig;
  
  // HTTP client for API calls
  http: HttpClient;
}
```

### 3.3 Plugin Registration

Plugins are registered at application startup:

```typescript
import { createFramework } from '@objectos/web-framework';
import { AGGridPlugin } from '@objectos/plugin-aggrid';
import { ReactHookFormPlugin } from '@objectos/plugin-react-hook-form';

const framework = createFramework({
  plugins: [
    new AGGridPlugin(),
    new ReactHookFormPlugin(),
    // ... other plugins
  ]
});
```

### 3.4 Plugin Package Structure

Plugins are distributed as npm packages with a standardized structure:

```
@vendor/objectos-plugin-name/
├── package.json           # Package metadata
├── plugin.manifest.json   # Plugin manifest (required)
├── dist/
│   ├── index.js          # Main entry point
│   ├── index.d.ts        # TypeScript definitions
│   └── assets/           # Icons, images, etc.
├── README.md
├── LICENSE
└── CHANGELOG.md
```

**plugin.manifest.json** (Required):

```json
{
  "name": "@vendor/objectos-plugin-advanced-table",
  "version": "1.2.0",
  "frameworkVersion": ">=0.1.0",
  "metadata": {
    "displayName": "Advanced Data Table",
    "description": "High-performance data table with advanced features",
    "longDescription": "# Advanced Table\n\nA feature-rich table component...",
    "author": "Acme Corp",
    "homepage": "https://acme.com/plugins/advanced-table",
    "category": "table",
    "icon": "https://cdn.acme.com/icons/table.svg",
    "screenshots": [
      "https://cdn.acme.com/screenshots/table-1.png",
      "https://cdn.acme.com/screenshots/table-2.png"
    ],
    "license": "Commercial",
    "pricing": {
      "type": "subscription",
      "price": 29.99,
      "currency": "USD",
      "trialDays": 14
    },
    "links": {
      "documentation": "https://docs.acme.com/table",
      "support": "https://support.acme.com",
      "changelog": "https://acme.com/changelog",
      "repository": "https://github.com/acme/table-plugin"
    },
    "tags": ["table", "grid", "data", "advanced", "enterprise"]
  },
  "capabilities": {
    "provides": {
      "components": ["table", "table.advanced", "table.mobile"],
      "services": ["export", "column-manager"]
    },
    "features": {
      "sorting": true,
      "filtering": true,
      "grouping": true,
      "virtualization": true,
      "export": true,
      "cellEditing": true,
      "pivoting": true
    }
  },
  "dependencies": [
    "@objectos/plugin-export"
  ],
  "permissions": [
    "storage.read",
    "storage.write",
    "network.external"
  ]
}
```

### 3.5 Plugin Installation and Activation

#### Programmatic Installation (Developer)

```typescript
import { PluginManager } from '@objectos/web-framework';

const manager = new PluginManager();

// Install from npm
await manager.install('@vendor/objectos-plugin-advanced-table');

// Or install from URL (for private registries)
await manager.install('https://private-registry.com/plugin.tar.gz');

// Enable the plugin
await manager.enable('@vendor/objectos-plugin-advanced-table');
```

#### UI-Based Installation (End User)

The framework provides a built-in plugin management interface accessible at `/admin/plugins`:

**Plugin Marketplace UI Features:**

1. **Browse Plugins**
   - Search by name, category, tags
   - Filter by pricing (free, paid, trial available)
   - Sort by popularity, rating, recent updates
   - View plugin details, screenshots, reviews

2. **Install Plugin**
   - Click "Install" button
   - For paid plugins: Redirects to payment/licensing
   - Shows installation progress
   - Handles dependency installation automatically

3. **Manage Installed Plugins**
   - Enable/Disable plugins without uninstalling
   - Configure plugin settings
   - View plugin status and health
   - Update to newer versions
   - Uninstall plugins

4. **Plugin Configuration**
   - Each plugin can provide a settings UI
   - Admin can configure plugin-specific options
   - Changes take effect immediately or after restart

**Example Plugin Management UI:**

```tsx
import { PluginMarketplace, PluginManager } from '@objectos/web-framework/admin';

function PluginManagementPage() {
  return (
    <div>
      <h1>Plugin Management</h1>
      
      {/* Marketplace for browsing and installing */}
      <PluginMarketplace 
        registry="https://marketplace.objectos.org"
        onInstall={handleInstall}
      />
      
      {/* Manage installed plugins */}
      <PluginManager 
        plugins={installedPlugins}
        onEnable={handleEnable}
        onDisable={handleDisable}
        onConfigure={handleConfigure}
        onUninstall={handleUninstall}
      />
    </div>
  );
}
```

### 3.6 Plugin Marketplace System

#### Marketplace Architecture

```
┌─────────────────────────────────────────────┐
│         ObjectOS Application                │
│  ┌─────────────────────────────────────┐   │
│  │    Plugin Management UI             │   │
│  └─────────────────┬───────────────────┘   │
│                    │                        │
│  ┌─────────────────▼───────────────────┐   │
│  │    Plugin Manager Service           │   │
│  │  - Install/Uninstall                │   │
│  │  - Enable/Disable                   │   │
│  │  - License Verification             │   │
│  └─────────────────┬───────────────────┘   │
└────────────────────┼────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│     Plugin Marketplace (marketplace.objectos.org)  │
│  ┌─────────────────────────────────────┐   │
│  │    Plugin Registry API              │   │
│  │  - Search plugins                   │   │
│  │  - Download packages                │   │
│  │  - Verify signatures                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │    License Management               │   │
│  │  - Purchase handling                │   │
│  │  - License key generation           │   │
│  │  - Subscription management          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │    Analytics & Reviews              │   │
│  │  - Download counts                  │   │
│  │  - User ratings                     │   │
│  │  - Review management                │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

#### Marketplace API

```typescript
// Search plugins
GET /api/plugins/search?q=table&category=table&pricing=free

// Get plugin details
GET /api/plugins/@vendor/objectos-plugin-name

// Download plugin package
GET /api/plugins/@vendor/objectos-plugin-name/download

// Purchase plugin (for commercial plugins)
POST /api/plugins/@vendor/objectos-plugin-name/purchase

// Verify license
POST /api/plugins/@vendor/objectos-plugin-name/verify-license
{
  "licenseKey": "xxxx-xxxx-xxxx-xxxx",
  "instanceId": "unique-installation-id"
}
```

#### Plugin Distribution Models

1. **Free & Open Source**
   - Published to npm registry
   - Listed in marketplace for free
   - No license verification required

2. **Commercial - One-time Purchase**
   - Purchase generates a license key
   - License key validated on installation
   - Can be installed on limited number of instances

3. **Commercial - Subscription**
   - Monthly/yearly subscription
   - License key expires if subscription lapses
   - Automatic renewal handling

4. **Freemium**
   - Basic features free
   - Advanced features require license
   - Plugin checks license at runtime for premium features

#### License Verification

```typescript
class CommercialPlugin implements IObjectOSPlugin {
  async initialize(context: PluginContext) {
    // Verify license before initialization
    const licenseValid = await this.verifyLicense(context);
    
    if (!licenseValid) {
      throw new Error('Invalid or expired license');
    }
    
    // Initialize plugin features
    this.initializeFeatures(context);
  }
  
  private async verifyLicense(context: PluginContext): Promise<boolean> {
    const license = context.config.get('plugins.licenses.' + this.name);
    
    const response = await fetch('https://marketplace.objectos.org/api/verify', {
      method: 'POST',
      body: JSON.stringify({
        plugin: this.name,
        licenseKey: license,
        instanceId: context.config.get('instanceId')
      })
    });
    
    const result = await response.json();
    return result.valid;
  }
}
```

---

## 4. Full-Stack Plugin Architecture

Plugins in ObjectOS are not limited to frontend UI components. A complete plugin can provide:
- **Metadata**: New object definitions, fields, views
- **Backend Logic**: Hooks, actions, services
- **APIs**: Custom endpoints
- **Frontend**: UI components, pages, widgets

### 4.1 Plugin Types

| Plugin Type | Provides | Example |
|-------------|----------|---------|
| **UI Plugin** | Frontend components only | Table, Form, Chart components |
| **Backend Plugin** | Server-side hooks and actions | Audit Trail, Validation Rules |
| **Integration Plugin** | External service integration + UI | Email, SMS, Payment Gateway |
| **Feature Plugin** | Complete feature with metadata + backend + UI | Workflow, Approvals, Document Management |

### 4.2 Full-Stack Plugin Example: Workflow

A workflow plugin demonstrates all plugin capabilities:

```typescript
import type { IObjectOSPlugin, PluginContext } from '@objectos/web-framework';
import type { ObjectConfig, HookConfig, ActionConfig } from '@objectql/types';

export class WorkflowPlugin implements IObjectOSPlugin {
  name = '@objectos/plugin-workflow';
  version = '2.0.0';
  category = 'feature';
  
  metadata: PluginMetadata = {
    displayName: 'Workflow Engine',
    description: 'Complete workflow and approval system',
    author: 'ObjectOS Team',
    category: 'integration',
    license: 'Commercial',
    pricing: {
      type: 'subscription',
      price: 49.99,
      currency: 'USD'
    }
  };
  
  capabilities: PluginCapabilities = {
    // Frontend components
    provides: {
      components: ['workflow-designer', 'workflow-board', 'approval-widget'],
      services: ['workflow-engine']
    },
    
    // Metadata: New objects this plugin adds
    metadata: {
      objects: ['workflow', 'workflow_step', 'workflow_instance', 'approval_request'],
      fields: ['workflow_status', 'approval_stage'],  // Adds to existing objects
      views: ['workflow_board', 'workflow_timeline'],
      actions: ['start_workflow', 'approve', 'reject', 'delegate']
    },
    
    // Backend capabilities
    backend: {
      hooks: ['workflow:beforeStart', 'workflow:afterComplete', 'approval:beforeDecision'],
      actions: ['workflow.start', 'workflow.cancel', 'approval.approve', 'approval.reject'],
      apis: ['/api/workflow/execute', '/api/workflow/status', '/api/approval/pending'],
      services: ['WorkflowEngine', 'ApprovalService', 'NotificationService']
    },
    
    features: {
      parallelApprovals: true,
      conditionalRouting: true,
      emailNotifications: true,
      escalation: true
    }
  };
  
  async initialize(context: PluginContext) {
    // 1. Register metadata (objects, fields, views)
    await this.registerMetadata(context);
    
    // 2. Register server-side hooks
    await this.registerHooks(context);
    
    // 3. Register custom actions
    await this.registerActions(context);
    
    // 4. Register API endpoints
    await this.registerAPIs(context);
    
    // 5. Register UI components
    await this.registerComponents(context);
    
    // 6. Start background services
    await this.startServices(context);
  }
  
  // Register new object definitions
  private async registerMetadata(context: PluginContext) {
    // Register Workflow object
    context.metadata.registerObject({
      name: 'workflow',
      label: 'Workflow',
      icon: 'workflow',
      fields: {
        name: { type: 'text', label: 'Workflow Name', required: true },
        description: { type: 'textarea', label: 'Description' },
        status: {
          type: 'select',
          label: 'Status',
          options: ['Draft', 'Active', 'Archived'],
          default: 'Draft'
        },
        trigger_type: {
          type: 'select',
          label: 'Trigger',
          options: ['Manual', 'On Create', 'On Update', 'Scheduled']
        },
        steps: {
          type: 'json',
          label: 'Workflow Steps'
        }
      },
      permissions: {
        allowRead: true,
        allowCreate: ['admin', 'workflow_manager'],
        allowEdit: ['admin', 'workflow_manager'],
        allowDelete: ['admin']
      }
    });
    
    // Register WorkflowInstance object
    context.metadata.registerObject({
      name: 'workflow_instance',
      label: 'Workflow Instance',
      fields: {
        workflow: {
          type: 'lookup',
          label: 'Workflow',
          reference_to: 'workflow',
          required: true
        },
        record_id: { type: 'text', label: 'Related Record ID' },
        record_type: { type: 'text', label: 'Related Object' },
        status: {
          type: 'select',
          label: 'Status',
          options: ['Pending', 'InProgress', 'Completed', 'Cancelled']
        },
        current_step: { type: 'text', label: 'Current Step' },
        started_at: { type: 'datetime', label: 'Started At' },
        completed_at: { type: 'datetime', label: 'Completed At' }
      }
    });
    
    // Add workflow_status field to other objects
    context.metadata.addField('*', {
      name: 'workflow_status',
      type: 'select',
      label: 'Workflow Status',
      options: ['Not Started', 'In Progress', 'Approved', 'Rejected'],
      hidden: true  // Only shown when workflow is enabled for the object
    });
    
    // Register custom view
    context.metadata.registerView({
      object: 'workflow_instance',
      name: 'workflow_board',
      label: 'Workflow Board',
      type: 'kanban',
      group_by: 'status',
      card: {
        title: 'workflow.name',
        subtitle: 'current_step',
        fields: ['started_at', 'record_type']
      }
    });
  }
  
  // Register server-side hooks
  private async registerHooks(context: PluginContext) {
    // Hook: Auto-start workflow when record is created
    context.hooks.register('afterInsert', async (hookContext) => {
      const { objectName, record } = hookContext;
      
      // Check if object has workflows configured
      const workflows = await this.getActiveWorkflows(objectName, 'On Create');
      
      for (const workflow of workflows) {
        await this.startWorkflow(workflow.id, record.id, objectName);
      }
    });
    
    // Hook: Update workflow when record is updated
    context.hooks.register('afterUpdate', async (hookContext) => {
      const { objectName, record, previousRecord } = hookContext;
      
      // Check for field changes that should trigger workflow
      if (record.status !== previousRecord.status) {
        await this.handleStatusChange(record, objectName);
      }
    });
    
    // Custom workflow hook
    context.hooks.register('workflow:beforeStart', async (hookContext) => {
      // Validate workflow can start
      const { workflow, record } = hookContext;
      
      // Check permissions
      if (!this.canStartWorkflow(hookContext.user, workflow)) {
        throw new Error('Permission denied');
      }
    });
  }
  
  // Register custom actions
  private async registerActions(context: PluginContext) {
    // Action: Start a workflow
    context.actions.register({
      name: 'workflow.start',
      label: 'Start Workflow',
      description: 'Initiates a workflow for the selected record',
      parameters: {
        workflow_id: { type: 'lookup', reference_to: 'workflow', required: true },
        record_id: { type: 'text', required: true },
        object_name: { type: 'text', required: true }
      },
      execute: async (params, actionContext) => {
        const instance = await this.startWorkflow(
          params.workflow_id,
          params.record_id,
          params.object_name
        );
        
        return {
          success: true,
          instance_id: instance.id,
          message: 'Workflow started successfully'
        };
      }
    });
    
    // Action: Approve workflow step
    context.actions.register({
      name: 'approval.approve',
      label: 'Approve',
      description: 'Approve current workflow step',
      parameters: {
        instance_id: { type: 'text', required: true },
        comments: { type: 'textarea' }
      },
      execute: async (params, actionContext) => {
        await this.approveStep(
          params.instance_id,
          actionContext.user.id,
          params.comments
        );
        
        return { success: true, message: 'Approved successfully' };
      }
    });
  }
  
  // Register API endpoints
  private async registerAPIs(context: PluginContext) {
    // API: Execute workflow
    context.routes.register('POST', '/api/workflow/execute', async (req, res) => {
      const { workflow_id, record_id, object_name } = req.body;
      
      const instance = await this.startWorkflow(workflow_id, record_id, object_name);
      
      res.json({
        success: true,
        instance: instance
      });
    });
    
    // API: Get workflow status
    context.routes.register('GET', '/api/workflow/status/:instanceId', async (req, res) => {
      const instance = await this.getWorkflowInstance(req.params.instanceId);
      
      res.json({
        status: instance.status,
        current_step: instance.current_step,
        history: await this.getWorkflowHistory(instance.id)
      });
    });
    
    // API: Get pending approvals
    context.routes.register('GET', '/api/approval/pending', async (req, res) => {
      const userId = req.user.id;
      const pending = await this.getPendingApprovals(userId);
      
      res.json({ approvals: pending });
    });
  }
  
  // Register UI components
  private async registerComponents(context: PluginContext) {
    // Register workflow designer component
    context.components.register('workflow-designer', WorkflowDesignerComponent);
    
    // Register workflow board view
    context.components.register('workflow-board', WorkflowBoardComponent);
    
    // Register approval widget
    context.components.register('approval-widget', ApprovalWidgetComponent);
  }
  
  // Start background services
  private async startServices(context: PluginContext) {
    // Start workflow engine
    this.workflowEngine = new WorkflowEngine(context);
    await this.workflowEngine.start();
    
    // Start notification service
    this.notificationService = new NotificationService(context);
    await this.notificationService.start();
    
    // Register cleanup on destroy
    context.events.on('plugin:destroy', async () => {
      await this.workflowEngine.stop();
      await this.notificationService.stop();
    });
  }
  
  // Implementation methods
  private async startWorkflow(workflowId: string, recordId: string, objectName: string) {
    // Workflow execution logic
  }
  
  private async getActiveWorkflows(objectName: string, trigger: string) {
    // Query workflows
  }
  
  // ... other helper methods
}
```

### 4.3 Plugin Metadata Registration

Plugins can register new objects, fields, and views:

```typescript
interface MetadataRegistry {
  // Register a complete object definition
  registerObject(config: ObjectConfig): void;
  
  // Add a field to existing object(s)
  addField(objectName: string | '*', fieldConfig: FieldConfig): void;
  
  // Register a custom view
  registerView(viewConfig: ViewConfig): void;
  
  // Register a custom action
  registerAction(actionConfig: ActionConfig): void;
}
```

### 4.4 Hook Registration

Plugins can register server-side lifecycle hooks:

```typescript
interface HookRegistry {
  // Register a hook for lifecycle events
  register(event: HookEvent, handler: HookHandler): void;
}

type HookEvent =
  | 'beforeInsert' | 'afterInsert'
  | 'beforeUpdate' | 'afterUpdate'
  | 'beforeDelete' | 'afterDelete'
  | 'beforeFind' | 'afterFind'
  | string;  // Custom hooks like 'workflow:beforeStart'

interface HookHandler {
  (context: HookContext): void | Promise<void>;
}

interface HookContext {
  objectName: string;
  record?: any;
  previousRecord?: any;
  user: User;
  query?: FindOptions;
  // Plugin can add custom properties
  [key: string]: any;
}
```

### 4.5 Action Registration

Plugins can register custom business logic actions:

```typescript
interface ActionRegistry {
  register(config: ActionConfig): void;
}

interface ActionConfig {
  name: string;  // e.g., 'workflow.start'
  label: string;
  description: string;
  parameters: Record<string, ParameterConfig>;
  execute: (params: any, context: ActionContext) => Promise<any>;
  
  // Where can this action be used?
  availableOn?: {
    objects?: string[];  // Which objects
    views?: string[];    // Which view types
    triggers?: ('button' | 'menu' | 'api')[];
  };
}

interface ActionContext {
  user: User;
  objectName?: string;
  recordId?: string;
  selectedRecords?: any[];
}
```

### 4.6 Route Registration

Plugins can register custom API endpoints:

```typescript
interface RouteRegistry {
  register(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    handler: RouteHandler,
    options?: RouteOptions
  ): void;
}

interface RouteHandler {
  (req: Request, res: Response): void | Promise<void>;
}

interface RouteOptions {
  auth?: boolean;  // Require authentication (default: true)
  permissions?: string[];  // Required permissions
  rateLimit?: {
    max: number;
    windowMs: number;
  };
}

// Example: Register a webhook endpoint
context.routes.register('POST', '/api/webhooks/stripe', async (req, res) => {
  const event = req.body;
  
  // Handle Stripe webhook
  await handleStripeEvent(event);
  
  res.json({ received: true });
}, {
  auth: false,  // Stripe sends unauthenticated requests
  rateLimit: { max: 100, windowMs: 60000 }
});
```

---

## 5. Component Plugin System

### 4.1 Component Plugin Categories

The framework defines standard plugin categories:

| Category | Purpose | Default Implementation |
|----------|---------|----------------------|
| **TablePlugin** | Data grid/table component | `@objectos/plugin-table-default` |
| **FormPlugin** | Form builder and validation | `@objectos/plugin-form-default` |
| **ChartPlugin** | Data visualization | `@objectos/plugin-chart-default` |
| **CalendarPlugin** | Calendar/scheduler views | `@objectos/plugin-calendar-default` |
| **KanbanPlugin** | Kanban board views | `@objectos/plugin-kanban-default` |
| **EditorPlugin** | Rich text editor | `@objectos/plugin-editor-default` |
| **FileUploaderPlugin** | File upload handling | `@objectos/plugin-uploader-default` |

### 4.2 Table Plugin Interface

Example: Replacing the table component

```typescript
interface ITablePlugin extends IObjectOSPlugin {
  // Plugin category identifier
  category: 'table';
  
  // Render the table component
  renderTable(props: TableProps): React.ReactElement;
  
  // Table capabilities (optional features)
  capabilities: {
    sorting?: boolean;
    filtering?: boolean;
    grouping?: boolean;
    virtualization?: boolean;
    export?: boolean;
    cellEditing?: boolean;
  };
}

// Usage in component
const TableComponent = framework.components.get('table');
<TableComponent data={data} columns={columns} />
```

### 4.3 Form Plugin Interface

Example: Replacing the form component

```typescript
interface IFormPlugin extends IObjectOSPlugin {
  // Plugin category identifier
  category: 'form';
  
  // Render form component
  renderForm(props: FormProps): React.ReactElement;
  
  // Form capabilities
  capabilities: {
    validation?: boolean;
    conditionalFields?: boolean;
    fileUpload?: boolean;
    autoSave?: boolean;
    multiStep?: boolean;
  };
  
  // Validation integration
  createValidator?(schema: ValidationSchema): Validator;
}

// Usage
const FormComponent = framework.components.get('form');
<FormComponent schema={schema} onSubmit={handleSubmit} />
```

### 4.4 Chart Plugin Interface

Example: Replacing chart/visualization components

```typescript
interface IChartPlugin extends IObjectOSPlugin {
  category: 'chart';
  
  // Supported chart types
  chartTypes: string[]; // e.g., ['bar', 'line', 'pie', 'area']
  
  // Render chart
  renderChart(props: ChartProps): React.ReactElement;
  
  // Chart capabilities
  capabilities: {
    interactive?: boolean;
    realtime?: boolean;
    export?: boolean;
    animations?: boolean;
  };
}
```

### 4.5 Metadata-Driven UI Generation

All plugins must support **metadata-driven UI generation**, where components automatically render based on ObjectQL object definitions.

#### Standard Props Interface

Every plugin category has a standardized props interface that receives object metadata:

```typescript
// Base interface for all metadata-driven components
interface MetadataDrivenProps {
  // Object metadata from ObjectQL
  objectConfig: ObjectConfig;
  
  // View metadata (optional, for view-specific rendering)
  viewConfig?: ViewConfig;
  
  // Runtime data
  data?: any[];
  
  // Event handlers
  onDataChange?: (data: any[]) => void;
  onError?: (error: Error) => void;
}
```

#### Table Plugin Props (Standardized)

```typescript
interface TableProps extends MetadataDrivenProps {
  // Object definition (automatically provides columns)
  objectConfig: ObjectConfig;
  
  // Optional view configuration
  viewConfig?: {
    type: 'list' | 'grid';
    columns?: ColumnConfig[];  // Override default columns
    sort?: SortConfig;
    filters?: FilterConfig;
    pagination?: PaginationConfig;
  };
  
  // Runtime data
  data: any[];
  
  // Selection state
  selection?: {
    mode: 'single' | 'multiple' | 'none';
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
  };
  
  // Event handlers
  onRowClick?: (row: any) => void;
  onSort?: (sort: SortConfig) => void;
  onFilter?: (filters: FilterConfig) => void;
  onPageChange?: (page: number) => void;
  
  // Actions
  actions?: {
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    export?: boolean;
    customActions?: ActionConfig[];
  };
}

// Column configuration derived from field metadata
interface ColumnConfig {
  id: string;
  field: string;  // Maps to ObjectConfig.fields[field]
  label?: string;  // Defaults to field.label
  type?: string;   // Auto-derived from field.type
  width?: string;
  sortable?: boolean;  // Auto-derived from field type
  filterable?: boolean;
  visible?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}
```

**Example: Auto-generating columns from object definition**

```typescript
class TablePlugin implements ITablePlugin {
  renderTable(props: TableProps) {
    // Auto-generate columns from object metadata if not provided
    const columns = props.viewConfig?.columns || 
      this.generateColumnsFromObject(props.objectConfig);
    
    return <TableComponent {...props} columns={columns} />;
  }
  
  private generateColumnsFromObject(objectConfig: ObjectConfig): ColumnConfig[] {
    return Object.entries(objectConfig.fields).map(([fieldName, fieldConfig]) => ({
      id: fieldName,
      field: fieldName,
      label: fieldConfig.label || fieldName,
      type: fieldConfig.type,
      sortable: this.isFieldSortable(fieldConfig.type),
      filterable: this.isFieldFilterable(fieldConfig.type),
      visible: !fieldConfig.hidden,
      width: this.getDefaultWidth(fieldConfig.type)
    }));
  }
  
  private isFieldSortable(type: string): boolean {
    return !['textarea', 'image', 'file'].includes(type);
  }
  
  private isFieldFilterable(type: string): boolean {
    return ['text', 'number', 'select', 'boolean', 'date'].includes(type);
  }
  
  private getDefaultWidth(type: string): string {
    const widthMap: Record<string, string> = {
      'boolean': '80px',
      'date': '120px',
      'datetime': '180px',
      'number': '100px',
      'currency': '120px',
      'select': '150px'
    };
    return widthMap[type] || '200px';
  }
}
```

#### Form Plugin Props (Standardized)

```typescript
interface FormProps extends MetadataDrivenProps {
  // Object definition (automatically provides fields)
  objectConfig: ObjectConfig;
  
  // Form mode
  mode: 'create' | 'edit' | 'view';
  
  // Record data (for edit/view)
  record?: any;
  
  // Form configuration
  formConfig?: {
    layout?: 'vertical' | 'horizontal' | 'grid';
    sections?: SectionConfig[];  // Group fields into sections
    fieldOrder?: string[];       // Custom field order
    hiddenFields?: string[];     // Fields to hide
    readonlyFields?: string[];   // Fields to make readonly
  };
  
  // Validation
  validationRules?: ValidationRules;
  
  // Event handlers
  onSubmit?: (data: any) => void | Promise<void>;
  onChange?: (field: string, value: any) => void;
  onValidate?: (errors: ValidationErrors) => void;
  onCancel?: () => void;
  
  // Form state
  loading?: boolean;
  errors?: ValidationErrors;
}

// Auto-generated field renderer
interface FieldRendererProps {
  fieldName: string;
  fieldConfig: FieldConfig;  // From ObjectConfig.fields
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
}
```

**Example: Auto-generating form from object definition**

```typescript
class FormPlugin implements IFormPlugin {
  renderForm(props: FormProps) {
    // Auto-generate fields from object metadata
    const fields = this.generateFieldsFromObject(props.objectConfig, props.formConfig);
    
    return (
      <Form onSubmit={props.onSubmit}>
        {fields.map(field => (
          <FieldRenderer
            key={field.name}
            fieldName={field.name}
            fieldConfig={field.config}
            value={props.record?.[field.name]}
            onChange={(value) => props.onChange?.(field.name, value)}
            error={props.errors?.[field.name]}
            disabled={props.loading}
            readonly={props.mode === 'view' || field.readonly}
          />
        ))}
        
        {props.mode !== 'view' && (
          <FormActions>
            <Button type="submit" loading={props.loading}>
              {props.mode === 'create' ? 'Create' : 'Save'}
            </Button>
            <Button type="button" onClick={props.onCancel}>
              Cancel
            </Button>
          </FormActions>
        )}
      </Form>
    );
  }
  
  private generateFieldsFromObject(
    objectConfig: ObjectConfig,
    formConfig?: FormProps['formConfig']
  ) {
    const allFields = Object.entries(objectConfig.fields);
    const hiddenFields = formConfig?.hiddenFields || [];
    const readonlyFields = formConfig?.readonlyFields || [];
    const fieldOrder = formConfig?.fieldOrder || Object.keys(objectConfig.fields);
    
    return fieldOrder
      .filter(name => !hiddenFields.includes(name))
      .map(name => ({
        name,
        config: objectConfig.fields[name],
        readonly: readonlyFields.includes(name)
      }));
  }
}
```

#### Chart Plugin Props (Standardized)

```typescript
interface ChartProps extends MetadataDrivenProps {
  // Chart type
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  
  // Data configuration
  dataConfig: {
    // Field mappings
    xField?: string;  // Maps to ObjectConfig.fields[xField]
    yField?: string;  // Maps to ObjectConfig.fields[yField]
    seriesField?: string;
    groupBy?: string;
    
    // Data aggregation
    aggregation?: {
      type: 'sum' | 'avg' | 'count' | 'min' | 'max';
      field: string;
    };
  };
  
  // Chart configuration
  chartConfig?: {
    title?: string;
    width?: number | string;
    height?: number | string;
    legend?: boolean;
    tooltip?: boolean;
    colors?: string[];
  };
  
  // Data
  data: any[];
  
  // Event handlers
  onDataPointClick?: (point: any) => void;
  onLegendClick?: (series: string) => void;
}
```

#### Calendar Plugin Props (Standardized)

```typescript
interface CalendarProps extends MetadataDrivenProps {
  // Object definition
  objectConfig: ObjectConfig;
  
  // Field mappings (must be date/datetime fields)
  fieldMapping: {
    titleField: string;      // Maps to ObjectConfig.fields
    startDateField: string;  // Must be date/datetime type
    endDateField?: string;   // Optional, for events with duration
    colorField?: string;     // Optional, for color coding
    descriptionField?: string;
  };
  
  // Calendar configuration
  calendarConfig?: {
    view: 'month' | 'week' | 'day' | 'agenda';
    firstDay?: 0 | 1;  // 0 = Sunday, 1 = Monday
    timeSlotDuration?: number;  // Minutes
    businessHours?: {
      start: string;
      end: string;
    };
  };
  
  // Data
  data: any[];
  
  // Event handlers
  onEventClick?: (event: any) => void;
  onDateClick?: (date: Date) => void;
  onEventDrop?: (event: any, newStart: Date, newEnd?: Date) => void;
}
```

#### Kanban Plugin Props (Standardized)

```typescript
interface KanbanProps extends MetadataDrivenProps {
  // Object definition
  objectConfig: ObjectConfig;
  
  // Field mappings
  fieldMapping: {
    titleField: string;       // Card title
    statusField: string;      // Field that determines column (must be select type)
    assigneeField?: string;   // Optional
    descriptionField?: string;
    imageField?: string;
  };
  
  // Column configuration (auto-generated from select field options)
  columns?: {
    id: string;
    title: string;
    limit?: number;  // WIP limit
    color?: string;
  }[];
  
  // Data
  data: any[];
  
  // Event handlers
  onCardClick?: (card: any) => void;
  onCardMove?: (card: any, fromColumn: string, toColumn: string) => void;
  onColumnClick?: (column: string) => void;
}
```

### 4.6 Field Type Rendering

Plugins must provide consistent rendering for all ObjectQL field types:

```typescript
interface FieldTypeRenderer {
  // Required: Render field in table cell
  renderCell(value: any, fieldConfig: FieldConfig): React.ReactNode;
  
  // Required: Render field in form input
  renderInput(props: FieldRendererProps): React.ReactNode;
  
  // Optional: Render field in detail view
  renderDetail?(value: any, fieldConfig: FieldConfig): React.ReactNode;
  
  // Optional: Custom filter component
  renderFilter?(fieldConfig: FieldConfig, onChange: (value: any) => void): React.ReactNode;
}

// Standard field type renderers
const fieldTypeRenderers: Record<string, FieldTypeRenderer> = {
  text: {
    renderCell: (value) => <span>{value}</span>,
    renderInput: (props) => <Input {...props} type="text" />,
    renderFilter: (config, onChange) => <Input onChange={e => onChange(e.target.value)} />
  },
  
  number: {
    renderCell: (value) => <span>{value?.toLocaleString()}</span>,
    renderInput: (props) => <Input {...props} type="number" />,
    renderFilter: (config, onChange) => <NumberRangeFilter onChange={onChange} />
  },
  
  boolean: {
    renderCell: (value) => <Checkbox checked={value} disabled />,
    renderInput: (props) => <Checkbox {...props} />,
    renderFilter: (config, onChange) => <BooleanFilter onChange={onChange} />
  },
  
  date: {
    renderCell: (value) => <span>{formatDate(value)}</span>,
    renderInput: (props) => <DatePicker {...props} />,
    renderFilter: (config, onChange) => <DateRangeFilter onChange={onChange} />
  },
  
  select: {
    renderCell: (value, config) => <Badge>{value}</Badge>,
    renderInput: (props) => <Select {...props} options={props.fieldConfig.options} />,
    renderFilter: (config, onChange) => <MultiSelect options={config.options} onChange={onChange} />
  },
  
  lookup: {
    renderCell: (value) => <Link to={`/records/${value.id}`}>{value.name}</Link>,
    renderInput: (props) => <LookupField {...props} />,
    renderFilter: (config, onChange) => <LookupFilter referenceTo={config.reference_to} onChange={onChange} />
  },
  
  currency: {
    renderCell: (value, config) => <span>{formatCurrency(value, config.currency)}</span>,
    renderInput: (props) => <CurrencyInput {...props} />,
    renderFilter: (config, onChange) => <NumberRangeFilter onChange={onChange} />
  },
  
  image: {
    renderCell: (value) => <Avatar src={value} />,
    renderInput: (props) => <ImageUpload {...props} />,
    renderDetail: (value) => <Image src={value} />
  },
  
  file: {
    renderCell: (value) => <FileLink href={value.url}>{value.name}</FileLink>,
    renderInput: (props) => <FileUpload {...props} />
  }
};
```

### 4.7 Validation Rules Generation

Plugins should auto-generate validation rules from object metadata:

```typescript
interface ValidationRulesGenerator {
  generateRules(objectConfig: ObjectConfig): ValidationRules;
}

class FormPlugin implements IFormPlugin {
  generateValidationRules(objectConfig: ObjectConfig): ValidationRules {
    const rules: ValidationRules = {};
    
    Object.entries(objectConfig.fields).forEach(([fieldName, fieldConfig]) => {
      const fieldRules: FieldValidationRule[] = [];
      
      // Required validation
      if (fieldConfig.required) {
        fieldRules.push({
          type: 'required',
          message: `${fieldConfig.label} is required`
        });
      }
      
      // Type-specific validation
      switch (fieldConfig.type) {
        case 'email':
          fieldRules.push({
            type: 'email',
            message: `${fieldConfig.label} must be a valid email`
          });
          break;
          
        case 'url':
          fieldRules.push({
            type: 'url',
            message: `${fieldConfig.label} must be a valid URL`
          });
          break;
          
        case 'number':
        case 'currency':
          if (fieldConfig.min !== undefined) {
            fieldRules.push({
              type: 'min',
              value: fieldConfig.min,
              message: `${fieldConfig.label} must be at least ${fieldConfig.min}`
            });
          }
          if (fieldConfig.max !== undefined) {
            fieldRules.push({
              type: 'max',
              value: fieldConfig.max,
              message: `${fieldConfig.label} must be at most ${fieldConfig.max}`
            });
          }
          break;
          
        case 'text':
          if (fieldConfig.minLength) {
            fieldRules.push({
              type: 'minLength',
              value: fieldConfig.minLength,
              message: `${fieldConfig.label} must be at least ${fieldConfig.minLength} characters`
            });
          }
          if (fieldConfig.maxLength) {
            fieldRules.push({
              type: 'maxLength',
              value: fieldConfig.maxLength,
              message: `${fieldConfig.label} must be at most ${fieldConfig.maxLength} characters`
            });
          }
          if (fieldConfig.pattern) {
            fieldRules.push({
              type: 'pattern',
              value: new RegExp(fieldConfig.pattern),
              message: `${fieldConfig.label} format is invalid`
            });
          }
          break;
      }
      
      // Unique validation
      if (fieldConfig.unique) {
        fieldRules.push({
          type: 'unique',
          message: `${fieldConfig.label} must be unique`,
          async: true
        });
      }
      
      rules[fieldName] = fieldRules;
    });
    
    return rules;
  }
}
```

---

## 5. Component Override System

### 5.1 Component Registration

Plugins can register or override components:

```typescript
class AGGridPlugin implements ITablePlugin {
  name = '@objectos/plugin-aggrid';
  category = 'table';
  
  initialize(context: PluginContext) {
    // Register as the table component provider
    context.components.register('table', AGGridTable);
    
    // Can also register variants
    context.components.register('table.advanced', AGGridAdvanced);
    context.components.register('table.mobile', AGGridMobile);
  }
  
  renderTable(props: TableProps) {
    return <AGGridTable {...props} />;
  }
}
```

### 5.2 Component Resolution

The framework resolves components using a priority system:

```typescript
// Priority order:
// 1. User-specified override
// 2. Active plugin for category
// 3. Default fallback

const TableComponent = framework.components.get('table', {
  fallback: DefaultTable,
  variant: 'advanced' // optional variant
});
```

### 5.3 Partial Overrides

Plugins can extend rather than replace:

```typescript
class CustomTablePlugin implements ITablePlugin {
  initialize(context: PluginContext) {
    // Get the current table component
    const BaseTable = context.components.get('table');
    
    // Wrap and enhance it
    const EnhancedTable = (props) => (
      <BaseTable
        {...props}
        onRowClick={(row) => {
          // Custom behavior
          console.log('Row clicked:', row);
          props.onRowClick?.(row);
        }}
      />
    );
    
    // Register the enhanced version
    context.components.register('table', EnhancedTable);
  }
}
```

---

## 6. Event System

### 6.1 Standard Events

The framework defines standard lifecycle events:

```typescript
// Framework lifecycle
'framework:initialized'
'framework:ready'
'framework:error'

// Plugin lifecycle
'plugin:registered'
'plugin:initialized'
'plugin:destroyed'

// Data events
'data:fetched'
'data:created'
'data:updated'
'data:deleted'

// UI events
'view:changed'
'record:selected'
'form:submitted'
'table:sorted'
'filter:applied'
```

### 6.2 Event Subscription

Plugins can subscribe to events:

```typescript
class AnalyticsPlugin implements IObjectOSPlugin {
  initialize(context: PluginContext) {
    // Listen to data events
    context.events.on('data:created', (payload) => {
      this.trackEvent('record_created', payload);
    });
    
    // Listen to UI events
    context.events.on('form:submitted', (payload) => {
      this.trackEvent('form_submit', payload);
    });
  }
  
  trackEvent(name: string, data: any) {
    // Send to analytics service
  }
}
```

### 6.3 Custom Events

Plugins can emit custom events:

```typescript
class NotificationPlugin implements IObjectOSPlugin {
  initialize(context: PluginContext) {
    this.events = context.events;
  }
  
  showNotification(message: string) {
    // Emit custom event
    this.events.emit('notification:show', {
      message,
      timestamp: Date.now()
    });
  }
}
```

---

## 7. Theme System

### 7.1 Theme Structure

The framework uses a centralized theme system:

```typescript
interface Theme {
  // Color system
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    border: string;
    // ... more colors
  };
  
  // Typography
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, string>;
  };
  
  // Spacing
  spacing: Record<string, string>;
  
  // Border radius
  radius: Record<string, string>;
  
  // Shadows
  shadows: Record<string, string>;
  
  // Breakpoints
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
```

### 7.2 Theme Customization

Plugins can access and extend the theme:

```typescript
class CustomThemePlugin implements IObjectOSPlugin {
  initialize(context: PluginContext) {
    // Extend existing theme
    context.theme.extend({
      colors: {
        brand: '#FF6B6B',
        accent: '#4ECDC4'
      }
    });
    
    // Or replace entirely
    context.theme.set(customTheme);
  }
}
```

### 7.3 Component Theming

Components use theme tokens:

```typescript
import { useTheme } from '@objectos/web-framework';

function CustomComponent() {
  const theme = useTheme();
  
  return (
    <div style={{
      color: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md
    }}>
      Content
    </div>
  );
}
```

---

## 8. Plugin Development Guide

### 8.1 Creating a Plugin

Step-by-step guide to create a plugin:

**Step 1: Define the plugin structure**

```typescript
// my-table-plugin/src/index.ts
import { ITablePlugin, PluginContext } from '@objectos/web-framework';
import { MyTableComponent } from './MyTable';

export class MyTablePlugin implements ITablePlugin {
  name = '@myorg/table-plugin';
  version = '1.0.0';
  category = 'table';
  
  metadata = {
    displayName: 'My Custom Table',
    description: 'A custom table implementation',
    author: 'Your Name'
  };
  
  capabilities = {
    sorting: true,
    filtering: true,
    virtualization: true
  };
  
  initialize(context: PluginContext) {
    // Register the component
    context.components.register('table', MyTableComponent);
    
    // Set up event listeners
    context.events.on('data:fetched', this.handleDataFetched);
  }
  
  renderTable(props) {
    return <MyTableComponent {...props} />;
  }
  
  handleDataFetched = (data) => {
    console.log('Data fetched:', data);
  };
  
  destroy() {
    // Cleanup
  }
}
```

**Step 2: Implement the component**

```typescript
// my-table-plugin/src/MyTable.tsx
import React from 'react';
import { TableProps } from '@objectos/web-framework';

export function MyTableComponent(props: TableProps) {
  const { data, columns, onRowClick } = props;
  
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.id}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id} onClick={() => onRowClick?.(row)}>
            {columns.map(col => (
              <td key={col.id}>{row[col.field]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Step 3: Package and publish**

```json
// package.json
{
  "name": "@myorg/table-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "peerDependencies": {
    "@objectos/web-framework": "^0.1.0",
    "react": "^18.0.0"
  }
}
```

### 8.2 Plugin Best Practices

1. **Minimal Dependencies**: Keep plugin dependencies minimal
2. **Clear Documentation**: Document all props, events, and capabilities
3. **Backward Compatibility**: Maintain compatibility across versions
4. **Error Handling**: Handle errors gracefully, don't crash the app
5. **Performance**: Optimize for performance (lazy loading, memoization)
6. **Testing**: Provide comprehensive tests
7. **TypeScript**: Use TypeScript for better DX

### 8.3 Plugin Testing

```typescript
// __tests__/plugin.test.ts
import { createTestFramework } from '@objectos/web-framework/testing';
import { MyTablePlugin } from '../src';

describe('MyTablePlugin', () => {
  it('should register successfully', () => {
    const framework = createTestFramework();
    const plugin = new MyTablePlugin();
    
    framework.registerPlugin(plugin);
    
    expect(framework.hasPlugin('@myorg/table-plugin')).toBe(true);
  });
  
  it('should render table component', () => {
    const framework = createTestFramework();
    framework.registerPlugin(new MyTablePlugin());
    
    const TableComponent = framework.components.get('table');
    const { container } = render(
      <TableComponent 
        data={mockData} 
        columns={mockColumns} 
      />
    );
    
    expect(container.querySelector('table')).toBeInTheDocument();
  });
});
```

---

## 9. Official Plugin Ecosystem

### 9.1 Core Plugins (Maintained by ObjectOS Team)

| Plugin | Package | Description |
|--------|---------|-------------|
| **Default Table** | `@objectos/plugin-table-default` | Basic table implementation using TanStack Table |
| **AG Grid Table** | `@objectos/plugin-table-aggrid` | Advanced table using AG Grid |
| **Default Form** | `@objectos/plugin-form-default` | Form using React Hook Form |
| **Formik Form** | `@objectos/plugin-form-formik` | Alternative form using Formik |
| **Recharts** | `@objectos/plugin-chart-recharts` | Charts using Recharts |
| **Chart.js** | `@objectos/plugin-chart-chartjs` | Charts using Chart.js |
| **FullCalendar** | `@objectos/plugin-calendar-full` | Full-featured calendar |
| **Tiptap Editor** | `@objectos/plugin-editor-tiptap` | Rich text editor |
| **React DnD Kanban** | `@objectos/plugin-kanban-dnd` | Kanban board with drag-n-drop |

### 9.2 Community Plugins

The ecosystem welcomes community contributions:

- **Plugin Registry**: https://plugins.objectos.org
- **Development Guide**: https://docs.objectos.org/plugin-development
- **Plugin Template**: https://github.com/objectql/plugin-template

### 9.3 Plugin Discovery

Users can discover and install plugins:

```bash
# Search for plugins
npm search objectos-plugin

# Install a plugin
npm install @vendor/objectos-plugin-name

# Use in application
import { VendorPlugin } from '@vendor/objectos-plugin-name';
framework.registerPlugin(new VendorPlugin());
```

---

## 10. Framework Configuration

### 10.1 Framework Initialization

```typescript
import { createFramework } from '@objectos/web-framework';

const framework = createFramework({
  // Plugin configuration
  plugins: [
    new TablePlugin(),
    new FormPlugin()
  ],
  
  // Theme configuration
  theme: {
    mode: 'light',
    preset: 'default',
    customization: {
      colors: {
        primary: '#0066CC'
      }
    }
  },
  
  // Feature flags
  features: {
    devTools: process.env.NODE_ENV === 'development',
    analytics: true,
    errorBoundary: true
  },
  
  // API configuration
  api: {
    baseURL: '/api/v4',
    timeout: 30000
  },
  
  // Performance settings
  performance: {
    lazyLoadPlugins: true,
    virtualizeGrids: true,
    cacheComponents: true
  }
});
```

### 10.2 Runtime Configuration

Configuration can be updated at runtime:

```typescript
// Update API settings
framework.config.set('api.baseURL', '/api/v5');

// Enable/disable features
framework.config.set('features.analytics', false);

// Update theme
framework.config.set('theme.mode', 'dark');
```

---

## 11. Advanced Patterns

### 11.1 Plugin Communication

Plugins can communicate via events:

```typescript
// Plugin A: Export functionality
class ExportPlugin implements IObjectOSPlugin {
  initialize(context: PluginContext) {
    context.events.on('table:export', (data) => {
      this.exportToCSV(data);
    });
  }
}

// Plugin B: Trigger export
class TablePlugin implements ITablePlugin {
  exportData() {
    this.context.events.emit('table:export', this.data);
  }
}
```

### 11.2 Plugin Dependencies

Declare dependencies between plugins:

```typescript
class AdvancedTablePlugin implements ITablePlugin {
  dependencies = ['@objectos/plugin-export'];
  
  initialize(context: PluginContext) {
    // Can safely use export plugin
    const exportPlugin = context.registry.get('@objectos/plugin-export');
  }
}
```

### 11.3 Middleware Pattern

Plugins can implement middleware:

```typescript
class LoggingPlugin implements IObjectOSPlugin {
  initialize(context: PluginContext) {
    // Intercept API calls
    context.http.use(async (request, next) => {
      console.log('Request:', request);
      const response = await next(request);
      console.log('Response:', response);
      return response;
    });
  }
}
```

### 11.4 Lazy Loading Plugins

Load plugins on demand:

```typescript
const framework = createFramework({
  plugins: [
    // Eager load
    new CorePlugin(),
    
    // Lazy load
    {
      name: '@objectos/plugin-advanced-charts',
      loader: () => import('@objectos/plugin-advanced-charts')
    }
  ]
});

// Load when needed
await framework.loadPlugin('@objectos/plugin-advanced-charts');
```

---

## 12. Migration Guide

### 12.1 Migrating from Monolithic Components

Before (Monolithic):
```typescript
import { ObjectGrid } from '@objectos/ui';

<ObjectGrid 
  data={data} 
  columns={columns}
  // Tightly coupled to specific implementation
/>
```

After (Plugin-based):
```typescript
import { useComponent } from '@objectos/web-framework';

function MyView() {
  const TableComponent = useComponent('table');
  
  return (
    <TableComponent 
      data={data} 
      columns={columns}
      // Implementation can be swapped via plugins
    />
  );
}
```

### 12.2 Creating Wrapper Plugins

Wrap existing components as plugins:

```typescript
import { ObjectGrid } from '@objectos/ui/legacy';

class LegacyTablePlugin implements ITablePlugin {
  renderTable(props: TableProps) {
    // Adapt props to legacy interface
    return <ObjectGrid {...adaptProps(props)} />;
  }
}
```

---

## 13. Performance Considerations

### 13.1 Bundle Size

- **Tree Shaking**: Only include used plugins
- **Code Splitting**: Lazy load plugins
- **Peer Dependencies**: Share common dependencies

### 13.2 Runtime Performance

- **Memoization**: Cache component resolutions
- **Event Debouncing**: Batch event emissions
- **Virtual Scrolling**: Use for large datasets

### 13.3 Plugin Initialization

```typescript
// Lazy initialization
class HeavyPlugin implements IObjectOSPlugin {
  private initialized = false;
  
  async initialize(context: PluginContext) {
    // Defer heavy operations
    context.events.on('plugin:activate', async () => {
      if (!this.initialized) {
        await this.loadHeavyDependencies();
        this.initialized = true;
      }
    });
  }
}
```

---

## 14. Security

### 14.1 Plugin Sandboxing

Plugins run in the same context but should follow security guidelines:

- **No eval()**: Never use eval or Function constructor
- **Sanitize Input**: Always sanitize user input
- **CSP Compliance**: Follow Content Security Policy
- **XSS Prevention**: Escape HTML output

### 14.2 Plugin Verification

```typescript
// Verify plugin signature (future feature)
framework.config.set('security.verifyPlugins', true);

// Whitelist approved plugins
framework.config.set('security.allowedPlugins', [
  '@objectos/*',
  '@trusted-vendor/*'
]);
```

---

## 15. TypeScript Support

### 15.1 Plugin Type Definitions

```typescript
// Strongly typed plugin interface
import type { 
  ITablePlugin, 
  TableProps, 
  PluginContext 
} from '@objectos/web-framework';

export class MyPlugin implements ITablePlugin {
  // Full type safety
}
```

### 15.2 Type Augmentation

Extend framework types:

```typescript
// my-plugin/types.d.ts
import '@objectos/web-framework';

declare module '@objectos/web-framework' {
  interface ComponentRegistry {
    'my-custom-component': typeof MyComponent;
  }
  
  interface EventMap {
    'custom:event': { data: string };
  }
}
```

---

## 16. Testing Framework

### 16.1 Test Utilities

```typescript
import { 
  createTestFramework,
  mockPlugin,
  mockComponent 
} from '@objectos/web-framework/testing';

describe('Framework Tests', () => {
  it('should work with test framework', () => {
    const framework = createTestFramework();
    const plugin = mockPlugin('table');
    
    framework.registerPlugin(plugin);
    expect(framework.hasPlugin('table')).toBe(true);
  });
});
```

### 16.2 Component Testing

```typescript
import { renderWithFramework } from '@objectos/web-framework/testing';

test('component uses plugin', () => {
  const { getByRole } = renderWithFramework(
    <MyComponent />,
    {
      plugins: [new MockTablePlugin()]
    }
  );
  
  expect(getByRole('table')).toBeInTheDocument();
});
```

---

## 17. Future Roadmap

### 17.1 Planned Features

- **Plugin Marketplace**: Web-based plugin discovery
- **Visual Plugin Builder**: No-code plugin creation
- **Plugin Analytics**: Usage tracking and metrics
- **Hot Reload**: Update plugins without reload
- **Remote Plugins**: Load plugins from CDN
- **Plugin Versioning**: Multiple versions simultaneously

### 17.2 API Stability

- **Core API**: Stable (Semantic Versioning)
- **Plugin API**: Stable (Backward compatible)
- **Internal API**: May change between minor versions

---

## 18. Examples

### 18.1 Complete Example Application

```typescript
// app.tsx
import { createFramework } from '@objectos/web-framework';
import { AGGridPlugin } from '@objectos/plugin-table-aggrid';
import { ReactHookFormPlugin } from '@objectos/plugin-form-rhf';
import { RechartsPlugin } from '@objectos/plugin-chart-recharts';

// Initialize framework
const framework = createFramework({
  plugins: [
    new AGGridPlugin({
      license: process.env.AGGRID_LICENSE
    }),
    new ReactHookFormPlugin(),
    new RechartsPlugin()
  ],
  theme: {
    preset: 'enterprise',
    mode: 'light'
  }
});

// Provide framework to app
function App() {
  return (
    <FrameworkProvider framework={framework}>
      <Router>
        <Routes>
          <Route path="/contacts" element={<ContactsView />} />
          <Route path="/deals" element={<DealsView />} />
        </Routes>
      </Router>
    </FrameworkProvider>
  );
}

// Use framework components
function ContactsView() {
  const Table = useComponent('table');
  const Form = useComponent('form');
  
  return (
    <div>
      <Table 
        data={contacts}
        columns={columns}
        onRowClick={handleRowClick}
      />
      <Form
        schema={contactSchema}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

### 18.2 Custom Plugin Example

See section 8.1 for complete plugin development example.

---

## 19. Glossary

- **Plugin**: Self-contained module that extends framework functionality
- **Component Registry**: Central storage for component overrides
- **Event Bus**: Pub/sub system for inter-plugin communication
- **Plugin Context**: Runtime environment provided to plugins
- **Theme Provider**: Centralized styling and theming system
- **Framework Core**: Minimal core providing plugin infrastructure

---

## 20. References

- **Plugin Development Guide**: `/docs/guide/plugin-development.md`
- **Component API Reference**: `/docs/api/components.md`
- **Event System Reference**: `/docs/api/events.md`
- **TypeScript Definitions**: `@objectos/web-framework/types`
- **Example Plugins**: `https://github.com/objectql/example-plugins`

---

## Appendix A: Default Plugin Implementations

The framework ships with minimal default implementations for all plugin categories. These can be replaced with more advanced alternatives:

### Table Plugin (Default)
- **Package**: `@objectos/plugin-table-default`
- **Features**: Basic sorting, filtering
- **Library**: TanStack Table

### Form Plugin (Default)
- **Package**: `@objectos/plugin-form-default`
- **Features**: Validation, field types
- **Library**: React Hook Form

### Chart Plugin (Default)
- **Package**: `@objectos/plugin-chart-default`
- **Features**: Line, bar, pie charts
- **Library**: Recharts

---

## Appendix B: Plugin Checklist

When creating a plugin, ensure:

- [ ] Implements `IObjectOSPlugin` interface
- [ ] Has unique name and version
- [ ] Provides clear metadata (description, author)
- [ ] Handles initialization and cleanup
- [ ] Documents all capabilities
- [ ] Includes TypeScript definitions
- [ ] Has comprehensive tests
- [ ] Follows security best practices
- [ ] Optimized for performance
- [ ] Has clear documentation
- [ ] Publishes to npm registry
- [ ] Lists in plugin marketplace

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-13  
**Status**: Draft Specification
