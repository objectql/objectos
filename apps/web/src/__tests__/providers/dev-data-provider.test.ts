import { describe, it, expect } from 'vitest';
import { DevDataProvider, useDevData } from '@/providers/dev-data-provider';

describe('DevDataProvider', () => {
  it('exports DevDataProvider component', () => {
    expect(DevDataProvider).toBeTypeOf('function');
  });

  it('exports useDevData hook', () => {
    expect(useDevData).toBeTypeOf('function');
  });
});
