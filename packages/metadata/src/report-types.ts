/**
 * Type definitions for ObjectQL Visual Reporting System
 * Supports multi-table joins, grouping, and aggregations
 */

/**
 * Report types supported by ObjectQL
 */
export type ReportType = 
  | 'tabular'   // Simple list view
  | 'summary'   // Grouped with aggregations
  | 'matrix';   // Cross-tab/pivot table

/**
 * Aggregation functions for summary reports
 */
export type AggregationFunction = 
  | 'count' 
  | 'sum' 
  | 'avg' 
  | 'min' 
  | 'max';

/**
 * Chart types for report visualization
 */
export type ChartType = 
  | 'bar' 
  | 'line' 
  | 'pie' 
  | 'donut' 
  | 'area'
  | 'scatter';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Column alignment options
 */
export type ColumnAlign = 'left' | 'center' | 'right';

/**
 * A column in a report
 * Can reference fields in the primary object or related objects using dot notation
 */
export interface ReportColumn {
  /** 
   * Field path (e.g., "name" or "project.name" for related fields)
   */
  field: string;
  
  /** 
   * Display label for the column
   */
  label: string;
  
  /** 
   * Column width in pixels (optional)
   */
  width?: number;
  
  /** 
   * Text alignment
   */
  align?: ColumnAlign;
  
  /** 
   * Format string for numbers/dates (optional)
   */
  format?: string;
  
  /** 
   * Whether this column is visible
   */
  visible?: boolean;
}

/**
 * Grouping configuration for summary reports
 */
export interface GroupingConfig {
  /** 
   * Field to group by (can use dot notation for related fields)
   */
  field: string;
  
  /** 
   * Display label for the grouping
   */
  label?: string;
  
  /** 
   * Sort direction for this grouping level
   */
  sort?: SortDirection;
  
  /** 
   * Show subtotals for this grouping
   */
  showSubtotals?: boolean;
}

/**
 * Aggregation configuration for summary reports
 */
export interface AggregationConfig {
  /** 
   * Field to aggregate
   */
  field: string;
  
  /** 
   * Aggregation function to apply
   */
  function: AggregationFunction;
  
  /** 
   * Display label for the aggregated value
   */
  label: string;
  
  /** 
   * Format string for the result
   */
  format?: string;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  /** 
   * Field to sort by
   */
  field: string;
  
  /** 
   * Sort direction
   */
  direction: SortDirection;
}

/**
 * Chart configuration for report visualization
 */
export interface ChartConfig {
  /** 
   * Type of chart to display
   */
  type: ChartType;
  
  /** 
   * Field to group data by (X-axis for bar/line charts)
   */
  groupBy?: string;
  
  /** 
   * Field to measure (Y-axis for bar/line charts)
   */
  measure: string;
  
  /** 
   * Aggregation function for the measure
   */
  aggregation: AggregationFunction;
  
  /** 
   * Chart title
   */
  title?: string;
  
  /** 
   * Show legend
   */
  showLegend?: boolean;
  
  /** 
   * Chart height in pixels
   */
  height?: number;
}

/**
 * Matrix report configuration
 * Creates a pivot table with row and column groupings
 */
export interface MatrixConfig {
  /** 
   * Field to group rows by
   */
  rowGrouping: {
    field: string;
    label?: string;
    sort?: SortDirection;
  };
  
  /** 
   * Field to group columns by
   */
  columnGrouping: {
    field: string;
    label?: string;
    sort?: SortDirection;
  };
  
  /** 
   * Measure to display in cells
   */
  measure: {
    field: string;
    function: AggregationFunction;
    label?: string;
    format?: string;
  };
}

/**
 * Permission configuration for reports
 */
export interface ReportPermissions {
  /** 
   * Roles that can view this report
   */
  view?: string[];
  
  /** 
   * Roles that can edit this report
   */
  edit?: string[];
  
  /** 
   * Roles that can delete this report
   */
  delete?: string[];
  
  /** 
   * Roles that can run this report
   */
  run?: string[];
}

/**
 * Filter expression type (from query language)
 * Simplified type - should match UnifiedQuery filters
 */
export type FilterExpression = Array<
  [string, string, any] | 'and' | 'or' | FilterExpression
>;

/**
 * Complete report definition
 */
export interface ReportDefinition {
  /** 
   * Unique name/identifier for the report
   */
  name: string;
  
  /** 
   * Human-readable label
   */
  label: string;
  
  /** 
   * Report description
   */
  description?: string;
  
  /** 
   * Type of report
   */
  type: ReportType;
  
  /** 
   * Primary object to query
   */
  object: string;
  
  /** 
   * Columns to display in the report
   */
  columns: ReportColumn[];
  
  /** 
   * Filters to apply (uses UnifiedQuery filter syntax)
   */
  filters?: FilterExpression;
  
  /** 
   * Grouping configuration (for summary reports)
   */
  groupings?: GroupingConfig[];
  
  /** 
   * Aggregations (for summary reports)
   */
  aggregations?: AggregationConfig[];
  
  /** 
   * Matrix configuration (for matrix reports)
   */
  matrix?: MatrixConfig;
  
  /** 
   * Sort configuration
   */
  sort?: Array<[string, SortDirection]>;
  
  /** 
   * Chart configuration
   */
  chart?: ChartConfig;
  
  /** 
   * Maximum number of rows to return
   */
  limit?: number;
  
  /** 
   * Permission configuration
   */
  permissions?: ReportPermissions;
  
  /** 
   * Report category/folder
   */
  category?: string;
  
  /** 
   * Tags for organization
   */
  tags?: string[];
  
  /** 
   * Report creator
   */
  createdBy?: string;
  
  /** 
   * Creation timestamp
   */
  createdAt?: string;
  
  /** 
   * Last modified timestamp
   */
  modifiedAt?: string;
}

/**
 * Runtime report execution result
 */
export interface ReportResult {
  /** 
   * Report definition used
   */
  definition: ReportDefinition;
  
  /** 
   * Result data
   */
  data: any[];
  
  /** 
   * Total count (may differ from data.length if limited)
   */
  totalCount: number;
  
  /** 
   * Execution time in milliseconds
   */
  executionTime: number;
  
  /** 
   * Timestamp when report was run
   */
  timestamp: string;
  
  /** 
   * Any warnings or messages
   */
  warnings?: string[];
}

/**
 * Report metadata for listing
 */
export interface ReportMetadata {
  name: string;
  label: string;
  description?: string;
  type: ReportType;
  object: string;
  category?: string;
  tags?: string[];
  createdBy?: string;
  createdAt?: string;
  modifiedAt?: string;
}
