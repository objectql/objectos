/**
 * ObjectOS Type Definitions
 * 
 * This file provides TypeScript type definitions for ObjectOS,
 * based on the @objectstack/spec protocol.
 */

// Re-export core protocol types from @objectstack/spec
export type { 
    // System Protocol (formerly kernel protocol)
    ObjectStackManifest,
    PluginDefinition,
    PluginLifecycleHooks,
    PluginContextData,
    KernelContext,
    LoggerConfig,
    LogEntry,
    LogLevel,
    LogFormat,
} from '@objectstack/spec/system';

export type {
    // Data Protocol
    ServiceObject,
    Field,
    FieldType,
    QueryAST,
    QueryFilter,
    Hook,
    HookEventType,
    Dataset,
} from '@objectstack/spec/data';

export type {
    // System Protocol
    AuditEvent,
    AuditEventType,
    Event,
    Job,
} from '@objectstack/spec/system';

// Legacy compatibility: Re-export ObjectQL types for existing code
export * from '@objectql/types';

/**
 * Menu item configuration for app interfaces.
 * Similar to Airtable's interface menu structure.
 */
export interface AppMenuItem {
    /** Unique identifier for the menu item */
    id?: string;
    /** **Required.** Display label for the menu item */
    label: string;
    /** Icon identifier (e.g., remixicon class name like 'ri-home-line') */
    icon?: string;
    /** Type of menu item. Default: 'page' */
    type?: 'object' | 'page' | 'url' | 'divider';
    /** Reference to an object name (for type: 'object') */
    object?: string;
    /** URL path (for type: 'url' or 'page') */
    url?: string;
    /** Badge text or count to display */
    badge?: string | number;
    /** Whether this item is visible. Default: true */
    visible?: boolean;
    /** Nested sub-menu items */
    items?: AppMenuItem[];
}

/**
 * Menu section/group configuration for organizing menu items.
 */
export interface AppMenuSection {
    /** Section title/label */
    label?: string;
    /** **Required.** Menu items in this section. */
    items: AppMenuItem[];
    /** Whether this section is collapsible. Default: false */
    collapsible?: boolean;
    /** Whether this section is collapsed by default. Default: false */
    collapsed?: boolean;
}

/**
 * Type guard to check if a menu entry is a section vs a direct menu item.
 * A section has an 'items' array and lacks menu item-specific properties like 'type', 'object', or 'url'.
 * It may also have section-specific properties like 'collapsible' or 'collapsed'.
 */
export function isAppMenuSection(entry: AppMenuSection | AppMenuItem): entry is AppMenuSection {
    return 'items' in entry && 
           Array.isArray(entry.items) && 
           !('type' in entry) && 
           !('object' in entry) && 
           !('url' in entry);
}

/**
 * App configuration metadata.
 * Represents an application or interface with its own menu structure.
 */
export interface AppConfig {
    /** Unique identifier or code for the app */
    id?: string;
    /** App name. Unique identifier for the app, default to id if not specified. */
    name: string;
    /** App code/slug (Legacy, use name or id) */
    code?: string;
    /** **Required.** Display name of the app. */
    label: string;
    /** Description of the app's purpose. */
    description?: string;
    /** Icon identifier (e.g., `ri-dashboard-line`). */
    icon?: string;
    /** Color theme for the app (e.g., `blue`, `gray`). */
    color?: string;
    /** Whether to use dark mode by default. */
    dark?: boolean;
    /** Base ID this app belongs to (optional, for Base layer support) */
    baseId?: string;
    /** 
     * Left-side navigation menu configuration.
     * Can be either:
     * - An array of menu sections (recommended for organized menus with groups)
     * - An array of menu items (for simple flat menus)
     * 
     * Use the `isAppMenuSection()` type guard to distinguish between them at runtime.
     */
    menu?: AppMenuSection[] | AppMenuItem[];
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface ChartConfig {
    name: string;
    label?: string;
    description?: string;
    type: ChartType;
    object: string;
    xAxisKey: string;
    yAxisKeys: string[];
    height?: number;
    colors?: string[];
    showGrid?: boolean;
    showLegend?: boolean;
    showTooltip?: boolean;
    filters?: any[];
    sort?: [string, 'asc' | 'desc'][];
}

export type PageLayoutType = 'grid' | 'flex' | 'stack' | 'tabs';

export interface PageComponent {
    type: string;
    props?: Record<string, any>;
    children?: PageComponent[];
}

export interface PageConfig {
    name: string;
    label?: string;
    description?: string;
    icon?: string;
    layout?: PageLayoutType;
    components?: PageComponent[];
    settings?: Record<string, any>;
}


