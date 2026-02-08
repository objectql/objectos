import { describe, it, expect } from 'vitest';
import { resolveFields } from '@/types/metadata';
import type { FieldDefinition } from '@/types/metadata';

describe('resolveFields', () => {
  const fields: Record<string, FieldDefinition> = {
    name: { type: 'text', label: 'Full Name', required: true },
    email: { type: 'email' },
    status: { name: 'status', type: 'select', label: 'Status' },
  };

  it('returns all fields with guaranteed name and label', () => {
    const resolved = resolveFields(fields);
    expect(resolved).toHaveLength(3);
    for (const f of resolved) {
      expect(f.name).toBeDefined();
      expect(f.label).toBeDefined();
    }
  });

  it('uses the record key as the field name when name is missing', () => {
    const resolved = resolveFields(fields);
    const emailField = resolved.find((f) => f.name === 'email');
    expect(emailField).toBeDefined();
    expect(emailField!.label).toBe('email');
  });

  it('preserves explicit name and label', () => {
    const resolved = resolveFields(fields);
    const nameField = resolved.find((f) => f.name === 'name');
    expect(nameField!.label).toBe('Full Name');
  });

  it('excludes specified fields', () => {
    const resolved = resolveFields(fields, ['email']);
    expect(resolved).toHaveLength(2);
    expect(resolved.find((f) => f.name === 'email')).toBeUndefined();
  });

  it('returns empty array for empty fields', () => {
    expect(resolveFields({})).toEqual([]);
  });
});
