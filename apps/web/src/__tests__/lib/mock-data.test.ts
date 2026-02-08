import { describe, it, expect } from 'vitest';
import {
  getMockAppDefinition,
  getMockObjectDefinition,
  getMockRecords,
  getMockRecord,
  mockAppDefinitions,
  mockObjectDefinitions,
} from '@/lib/mock-data';

describe('mock-data', () => {
  describe('getMockAppDefinition', () => {
    it('returns the CRM app definition', () => {
      const app = getMockAppDefinition('crm');
      expect(app).toBeDefined();
      expect(app?.label).toBe('CRM');
      expect(app?.objects).toContain('lead');
      expect(app?.active).toBe(true);
    });

    it('returns undefined for unknown app', () => {
      expect(getMockAppDefinition('nonexistent')).toBeUndefined();
    });
  });

  describe('getMockObjectDefinition', () => {
    it('returns the lead object definition', () => {
      const obj = getMockObjectDefinition('lead');
      expect(obj).toBeDefined();
      expect(obj?.label).toBe('Lead');
      expect(obj?.fields.name).toBeDefined();
      expect(obj?.fields.name.type).toBe('text');
      expect(obj?.fields.name.required).toBe(true);
    });

    it('returns undefined for unknown object', () => {
      expect(getMockObjectDefinition('nonexistent')).toBeUndefined();
    });

    it('has listFields defined for objects', () => {
      const obj = getMockObjectDefinition('lead');
      expect(obj?.listFields).toBeDefined();
      expect(obj!.listFields!.length).toBeGreaterThan(0);
    });
  });

  describe('getMockRecords', () => {
    it('returns records for leads', () => {
      const records = getMockRecords('lead');
      expect(records.length).toBeGreaterThan(0);
      expect(records[0]).toHaveProperty('id');
      expect(records[0]).toHaveProperty('name');
      expect(records[0]).toHaveProperty('email');
    });

    it('returns empty array for unknown object', () => {
      expect(getMockRecords('nonexistent')).toEqual([]);
    });
  });

  describe('getMockRecord', () => {
    it('finds a record by id', () => {
      const record = getMockRecord('lead', 'lead-001');
      expect(record).toBeDefined();
      expect(record?.name).toBe('Alice Johnson');
    });

    it('returns undefined for unknown record', () => {
      expect(getMockRecord('lead', 'nonexistent')).toBeUndefined();
    });
  });

  describe('data consistency', () => {
    it('all app objects reference existing object definitions', () => {
      for (const app of mockAppDefinitions) {
        for (const objName of (app.objects ?? [])) {
          expect(
            mockObjectDefinitions[objName],
            `App "${app.name}" references undefined object "${objName}"`,
          ).toBeDefined();
        }
      }
    });

    it('all object primaryFields exist in fields', () => {
      for (const [name, obj] of Object.entries(mockObjectDefinitions)) {
        if (obj.primaryField) {
          expect(
            obj.fields[obj.primaryField],
            `Object "${name}" has primaryField "${obj.primaryField}" not in fields`,
          ).toBeDefined();
        }
      }
    });

    it('all object listFields exist in fields', () => {
      for (const [name, obj] of Object.entries(mockObjectDefinitions)) {
        if (obj.listFields) {
          for (const fieldName of obj.listFields) {
            expect(
              obj.fields[fieldName],
              `Object "${name}" has listField "${fieldName}" not in fields`,
            ).toBeDefined();
          }
        }
      }
    });
  });
});
