/**
 * Tests for use-metadata hooks.
 *
 * Validates the exports and types of all metadata hooks,
 * including the newly added useAppObjects hook.
 */
import { describe, it, expect } from 'vitest';
import {
  useAppDefinition,
  useAppList,
  useObjectDefinition,
  useAppObjects,
} from '@/hooks/use-metadata';

describe('use-metadata exports', () => {
  it('exports useAppDefinition hook', () => {
    expect(useAppDefinition).toBeTypeOf('function');
  });

  it('exports useAppList hook', () => {
    expect(useAppList).toBeTypeOf('function');
  });

  it('exports useObjectDefinition hook', () => {
    expect(useObjectDefinition).toBeTypeOf('function');
  });

  it('exports useAppObjects hook', () => {
    expect(useAppObjects).toBeTypeOf('function');
  });
});
