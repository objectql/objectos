/**
 * Template Engine
 * 
 * Handles template compilation and rendering using Handlebars
 */

import type { TemplateEngine as ITemplateEngine, TemplateData } from './types';

/**
 * Handlebars-based template engine with caching support
 */
export class TemplateEngine implements ITemplateEngine {
  private handlebars: any;
  private cache = new Map<string, (data: TemplateData) => string>();
  private cacheEnabled: boolean;

  constructor(options: { cache?: boolean } = {}) {
    this.cacheEnabled = options.cache ?? true;
    
    // Lazy load handlebars (optional dependency)
    try {
      this.handlebars = require('handlebars');
      this.registerHelpers();
    } catch (error) {
      // Handlebars not installed - use simple template engine
      this.handlebars = null;
    }
  }

  /**
   * Register custom helpers
   */
  private registerHelpers(): void {
    if (!this.handlebars) return;

    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleString();
      }
      return d.toISOString();
    });

    // Uppercase helper
    this.handlebars.registerHelper('upper', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    this.handlebars.registerHelper('lower', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Conditional equality helper
    this.handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });
  }

  /**
   * Compile a template string into a render function
   */
  compile(template: string): (data: TemplateData) => string {
    if (this.cacheEnabled && this.cache.has(template)) {
      return this.cache.get(template)!;
    }

    let compiledFn: (data: TemplateData) => string;

    if (this.handlebars) {
      // Use Handlebars
      const compiled = this.handlebars.compile(template);
      compiledFn = (data: TemplateData) => compiled(data);
    } else {
      // Fallback to simple variable substitution
      compiledFn = (data: TemplateData) => this.simpleRender(template, data);
    }

    if (this.cacheEnabled) {
      this.cache.set(template, compiledFn);
    }

    return compiledFn;
  }

  /**
   * Render a template with data
   */
  render(template: string, data: TemplateData): string {
    const compiledFn = this.compile(template);
    return compiledFn(data);
  }

  /**
   * Simple template rendering (fallback when Handlebars is not available)
   * Supports {{variable}} syntax only
   */
  private simpleRender(template: string, data: TemplateData): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Clear the template cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
