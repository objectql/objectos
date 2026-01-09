/**
 * Report Compiler
 * Converts ReportDefinition into ObjectQL UnifiedQuery
 * Handles multi-table joins, grouping, and aggregations
 */

import type { 
  ReportDefinition, 
  ReportColumn, 
  GroupingConfig,
  AggregationConfig 
} from '@objectql/metadata';
import type { UnifiedQuery } from './query';

/**
 * Path segment representing a relationship traversal
 */
interface PathSegment {
  field: string;
  remainingPath: string[];
}

/**
 * Compiled expansion structure
 */
interface ExpansionTree {
  fields: string[];
  expand?: Record<string, ExpansionTree>;
}

/**
 * Compiles report definitions into executable queries
 */
export class ReportCompiler {
  /**
   * Main compilation method
   * Converts a ReportDefinition into a UnifiedQuery that can be executed
   */
  compile(report: ReportDefinition): UnifiedQuery {
    const query: UnifiedQuery = {};

    // Extract fields and build expansions for relationship paths
    const { directFields, expansions } = this.processColumns(report.columns);
    
    if (directFields.length > 0) {
      query.fields = directFields;
    }

    if (Object.keys(expansions).length > 0) {
      query.expand = expansions;
    }

    // Add filters
    if (report.filters) {
      query.filters = report.filters;
    }

    // Handle grouping and aggregations for summary reports
    if (report.type === 'summary' && report.groupings) {
      const groupByFields = report.groupings.map(g => g.field);
      // Note: groupBy and aggregate need to be added to UnifiedQuery type
      // For now, we'll extend the query object
      (query as any).groupBy = groupByFields;
      
      if (report.aggregations) {
        (query as any).aggregate = this.buildAggregations(report.aggregations);
      }
    }

    // Handle matrix reports
    if (report.type === 'matrix' && report.matrix) {
      // Matrix reports are a special case of grouping
      (query as any).groupBy = [
        report.matrix.rowGrouping.field,
        report.matrix.columnGrouping.field
      ];
      (query as any).aggregate = {
        [report.matrix.measure.field]: report.matrix.measure.function
      };
    }

    // Add sorting
    if (report.sort) {
      query.sort = report.sort;
    } else if (report.type === 'summary' && report.groupings) {
      // Default sort by grouping fields
      query.sort = report.groupings
        .filter(g => g.sort)
        .map(g => [g.field, g.sort!] as [string, 'asc' | 'desc']);
    }

    // Add limit
    if (report.limit) {
      query.limit = report.limit;
    }

    return query;
  }

  /**
   * Process columns and extract direct fields vs relationship paths
   */
  private processColumns(columns: ReportColumn[]): {
    directFields: string[];
    expansions: Record<string, ExpansionTree>;
  } {
    const directFields: string[] = [];
    const expansions: Record<string, ExpansionTree> = {};

    for (const column of columns) {
      if (column.visible === false) {
        continue; // Skip hidden columns
      }

      const path = column.field.split('.');
      
      if (path.length === 1) {
        // Direct field on the primary object
        directFields.push(path[0]);
      } else {
        // Relationship path - need to build expansion
        this.addToExpansionTree(expansions, path);
      }
    }

    return { directFields, expansions };
  }

  /**
   * Recursively build expansion tree from field paths
   */
  private addToExpansionTree(
    tree: Record<string, ExpansionTree>,
    path: string[]
  ): void {
    if (path.length === 0) return;

    const [first, ...rest] = path;

    if (!tree[first]) {
      tree[first] = { fields: [] };
    }

    if (rest.length === 1) {
      // Terminal field
      if (!tree[first].fields.includes(rest[0])) {
        tree[first].fields.push(rest[0]);
      }
    } else if (rest.length > 1) {
      // Nested relationship
      if (!tree[first].expand) {
        tree[first].expand = {};
      }
      this.addToExpansionTree(tree[first].expand!, rest);
    }
  }

  /**
   * Build aggregation map from aggregation configs
   */
  private buildAggregations(
    aggregations: AggregationConfig[]
  ): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const agg of aggregations) {
      result[agg.field] = agg.function;
    }
    
    return result;
  }

  /**
   * Parse a relationship path into segments
   */
  parseFieldPath(fieldPath: string): PathSegment[] {
    const parts = fieldPath.split('.');
    const segments: PathSegment[] = [];

    for (let i = 0; i < parts.length; i++) {
      segments.push({
        field: parts[i],
        remainingPath: parts.slice(i + 1)
      });
    }

    return segments;
  }

  /**
   * Validate report definition
   * Checks for common errors and inconsistencies
   */
  validate(report: ReportDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validations
    if (!report.name) {
      errors.push('Report name is required');
    }

    if (!report.object) {
      errors.push('Primary object is required');
    }

    if (!report.columns || report.columns.length === 0) {
      errors.push('At least one column is required');
    }

    // Type-specific validations
    if (report.type === 'summary') {
      if (!report.groupings || report.groupings.length === 0) {
        errors.push('Summary reports require at least one grouping');
      }
      if (!report.aggregations || report.aggregations.length === 0) {
        errors.push('Summary reports require at least one aggregation');
      }
    }

    if (report.type === 'matrix') {
      if (!report.matrix) {
        errors.push('Matrix reports require matrix configuration');
      } else {
        if (!report.matrix.rowGrouping?.field) {
          errors.push('Matrix reports require row grouping field');
        }
        if (!report.matrix.columnGrouping?.field) {
          errors.push('Matrix reports require column grouping field');
        }
        if (!report.matrix.measure?.field) {
          errors.push('Matrix reports require measure field');
        }
      }
    }

    // Check for duplicate column fields
    const fieldPaths = report.columns.map(c => c.field);
    const duplicates = fieldPaths.filter(
      (item, index) => fieldPaths.indexOf(item) !== index
    );
    if (duplicates.length > 0) {
      errors.push(`Duplicate column fields: ${duplicates.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Optimize query for performance
   * Adds hints and optimizations to the query
   */
  optimize(query: UnifiedQuery, report: ReportDefinition): UnifiedQuery {
    const optimized = { ...query };

    // If no explicit limit and not a grouped report, add a reasonable default
    if (!optimized.limit && report.type === 'tabular') {
      optimized.limit = 1000; // Default max for tabular reports
    }

    // Add field-level optimization hints
    // (These would be used by the driver for index selection)
    if (optimized.filters) {
      // Extract filter fields for potential index hints
      const filterFields = this.extractFilterFields(optimized.filters);
      (optimized as any)._hints = {
        filterFields,
        suggestIndexes: true
      };
    }

    return optimized;
  }

  /**
   * Extract field names from filter expression
   */
  private extractFilterFields(filters: any[]): string[] {
    const fields: string[] = [];

    for (const item of filters) {
      if (Array.isArray(item)) {
        if (item.length === 3 && typeof item[0] === 'string') {
          // This is a criterion [field, operator, value]
          fields.push(item[0]);
        } else {
          // This is a nested filter array
          fields.push(...this.extractFilterFields(item));
        }
      }
    }

    return [...new Set(fields)]; // Deduplicate
  }

  /**
   * Generate a preview query (limited result set)
   */
  compilePreview(report: ReportDefinition, maxRows: number = 10): UnifiedQuery {
    const query = this.compile(report);
    query.limit = maxRows;
    return query;
  }
}

/**
 * Helper function to create a report compiler instance
 */
export function createReportCompiler(): ReportCompiler {
  return new ReportCompiler();
}
