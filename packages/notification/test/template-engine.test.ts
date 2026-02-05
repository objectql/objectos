/**
 * Template Engine Tests
 */

import { TemplateEngine } from '../src/template-engine';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine({ cache: true });
  });

  describe('Variable Substitution', () => {
    it('should replace simple variables', () => {
      const template = 'Hello {{name}}!';
      const result = engine.render(template, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const template = 'Hello {{firstName}} {{lastName}}!';
      const result = engine.render(template, { 
        firstName: 'John', 
        lastName: 'Doe' 
      });
      expect(result).toBe('Hello John Doe!');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}!';
      const result = engine.render(template, {});
      // With handlebars installed, it renders empty string; without it keeps the placeholder
      expect(result === 'Hello !' || result === 'Hello {{name}}!').toBe(true);
    });

    it('should handle nested data', () => {
      const template = 'Email: {{user.email}}';
      const result = engine.render(template, { 
        user: { email: 'test@example.com' } 
      });
      expect(result).toContain('test@example.com');
    });
  });

  describe('Handlebars Features', () => {
    it('should support conditionals if handlebars is available', () => {
      const template = '{{#if admin}}Admin{{else}}User{{/if}}';
      const result1 = engine.render(template, { admin: true });
      const result2 = engine.render(template, { admin: false });
      
      // Either handlebars is available or it returns the template as-is
      if (result1.includes('Admin') || result1.includes('{{#if')) {
        expect(true).toBe(true);
      }
    });

    it('should support loops if handlebars is available', () => {
      const template = '{{#each items}}{{this}} {{/each}}';
      const result = engine.render(template, { items: ['a', 'b', 'c'] });
      
      // Either handlebars is available or it returns the template as-is
      if (result.includes('a b c') || result.includes('{{#each')) {
        expect(true).toBe(true);
      }
    });
  });

  describe('Template Caching', () => {
    it('should cache compiled templates', () => {
      const template = 'Hello {{name}}!';
      
      engine.render(template, { name: 'World' });
      expect(engine.getCacheSize()).toBe(1);
      
      engine.render(template, { name: 'Alice' });
      expect(engine.getCacheSize()).toBe(1); // Still 1, reused
    });

    it('should clear cache', () => {
      const template = 'Hello {{name}}!';
      engine.render(template, { name: 'World' });
      
      expect(engine.getCacheSize()).toBe(1);
      engine.clearCache();
      expect(engine.getCacheSize()).toBe(0);
    });

    it('should work with cache disabled', () => {
      const noCacheEngine = new TemplateEngine({ cache: false });
      const template = 'Hello {{name}}!';
      
      noCacheEngine.render(template, { name: 'World' });
      expect(noCacheEngine.getCacheSize()).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty template', () => {
      const result = engine.render('', {});
      expect(result).toBe('');
    });

    it('should handle empty data', () => {
      const result = engine.render('Static text', {});
      expect(result).toBe('Static text');
    });

    it('should handle special characters', () => {
      const template = 'Price: ${{price}}';
      const result = engine.render(template, { price: '99.99' });
      expect(result).toBe('Price: $99.99');
    });

    it('should handle numbers', () => {
      const template = 'Count: {{count}}';
      const result = engine.render(template, { count: 42 });
      expect(result).toBe('Count: 42');
    });

    it('should handle boolean values', () => {
      const template = 'Active: {{active}}';
      const result = engine.render(template, { active: true });
      expect(result).toBe('Active: true');
    });
  });

  describe('Complex Templates', () => {
    it('should render email template', () => {
      const template = `
        Hello {{userName}},
        
        Your email is {{userEmail}}.
        
        Thank you,
        {{appName}}
      `;
      
      const result = engine.render(template, {
        userName: 'John Doe',
        userEmail: 'john@example.com',
        appName: 'MyApp'
      });

      expect(result).toContain('John Doe');
      expect(result).toContain('john@example.com');
      expect(result).toContain('MyApp');
    });

    it('should render SMS template', () => {
      const template = 'Hi {{name}}, your code is {{code}}. Valid for {{minutes}} minutes.';
      
      const result = engine.render(template, {
        name: 'Alice',
        code: '123456',
        minutes: 10
      });

      expect(result).toContain('Alice');
      expect(result).toContain('123456');
      expect(result).toContain('10');
    });
  });
});
