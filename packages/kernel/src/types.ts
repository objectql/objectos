// Re-export all types from ObjectQL protocol
// Rule #1: The Dependency Wall - NEVER redefine types. Always import from @objectql/types.
export * from '@objectql/types';

/**
 * Menu item configuration for app interfaces.
 * 
 * Represents a single navigation item in an application's menu structure.
 * Similar to Airtable's interface menu structure.
 * 
 * @example
 * ```yaml
 * # Simple menu item
 * - label: Dashboard
 *   icon: ri-dashboard-line
 *   type: page
 *   url: /dashboard
 * 
 * # Object reference
 * - label: Contacts
 *   icon: ri-contacts-line
 *   type: object
 *   object: contacts
 * 
 * # External link
 * - label: Documentation
 *   icon: ri-book-line
 *   type: url
 *   url: https://objectos.org
 * ```
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
 * 
 * Sections allow grouping related menu items with optional labels and collapsible behavior.
 * Use sections to organize complex navigation hierarchies.
 * 
 * @example
 * ```yaml
 * # Collapsible section with label
 * - label: Sales
 *   collapsible: true
 *   items:
 *     - label: Leads
 *       type: object
 *       object: leads
 *     - label: Opportunities
 *       type: object
 *       object: opportunities
 * ```
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
 * 
 * A section has an 'items' array and lacks menu item-specific properties like 'type', 'object', or 'url'.
 * It may also have section-specific properties like 'collapsible' or 'collapsed'.
 * 
 * Use this guard when processing menu configurations that can contain both sections and items.
 * 
 * @param entry - The menu entry to check
 * @returns true if the entry is a section, false if it's a menu item
 * 
 * @example
 * ```typescript
 * const menu = app.menu || [];
 * menu.forEach(entry => {
 *   if (isAppMenuSection(entry)) {
 *     console.log('Section:', entry.label);
 *     entry.items.forEach(item => console.log('  -', item.label));
 *   } else {
 *     console.log('Item:', entry.label);
 *   }
 * });
 * ```
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
 * 
 * Represents an application or interface with its own menu structure and settings.
 * Apps are the top-level organizational unit in ObjectOS, similar to Airtable's "Bases"
 * or Salesforce's "Apps".
 * 
 * Each app can have:
 * - A unique navigation menu
 * - Custom branding (icon, color)
 * - Specific objects and pages
 * 
 * @example
 * ```yaml
 * # sales.app.yml
 * name: sales
 * label: Sales CRM
 * description: Manage leads, opportunities, and accounts
 * icon: ri-briefcase-line
 * color: blue
 * menu:
 *   - label: Dashboard
 *     type: page
 *     url: /dashboard
 *   - label: Leads
 *     type: object
 *     object: leads
 *   - label: Opportunities
 *     type: object
 *     object: opportunities
 * ```
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

/** Supported chart types for data visualization */
export type ChartType = 'bar' | 'line' | 'pie' | 'area';

/**
 * Chart configuration for data visualization.
 * 
 * Defines how to render data from an object as a chart.
 * Charts can be embedded in pages or dashboards.
 * 
 * @example
 * ```yaml
 * # revenue-chart.chart.yml
 * name: monthly_revenue
 * label: Monthly Revenue
 * type: bar
 * object: opportunities
 * xAxisKey: close_date
 * yAxisKeys:
 *   - amount
 * filters:
 *   - field: stage
 *     operator: equals
 *     value: Won
 * showGrid: true
 * showLegend: true
 * ```
 */
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

/** Supported page layout types for component arrangement */
export type PageLayoutType = 'grid' | 'flex' | 'stack' | 'tabs';

/**
 * Page component configuration.
 * 
 * Defines a UI component to render on a page.
 * Components can be nested to create complex layouts.
 * 
 * @example
 * ```yaml
 * type: Card
 * props:
 *   title: Welcome
 *   description: Get started with ObjectOS
 * children:
 *   - type: Button
 *     props:
 *       label: Learn More
 *       variant: primary
 * ```
 */
export interface PageComponent {
    /** Component type identifier (e.g., 'Card', 'Button', 'ObjectGrid') */
    type: string;
    /** Component properties/attributes */
    props?: Record<string, any>;
    /** Nested child components */
    children?: PageComponent[];
}

/**
 * Page configuration metadata.
 * 
 * Defines a custom page with layout and components.
 * Pages can be referenced in app menus to create custom views
 * beyond the auto-generated object grids and forms.
 * 
 * @example
 * ```yaml
 * # dashboard.page.yml
 * name: dashboard
 * label: Sales Dashboard
 * description: Overview of sales metrics
 * icon: ri-dashboard-line
 * layout: grid
 * components:
 *   - type: Chart
 *     props:
 *       chartName: monthly_revenue
 *   - type: ObjectGrid
 *     props:
 *       objectName: leads
 *       limit: 10
 *       filters:
 *         - field: status
 *           value: New
 * ```
 */
export interface PageConfig {
    name: string;
    label?: string;
    description?: string;
    icon?: string;
    layout?: PageLayoutType;
    components?: PageComponent[];
    settings?: Record<string, any>;
}


