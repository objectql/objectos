/**
 * Tests for use-keyboard-shortcuts hook.
 */
import { describe, it, expect } from 'vitest';
import { useKeyboardShortcuts, SHORTCUT_PRESETS } from '@/hooks/use-keyboard-shortcuts';

describe('useKeyboardShortcuts', () => {
  it('exports useKeyboardShortcuts as a function', () => {
    expect(useKeyboardShortcuts).toBeTypeOf('function');
  });

  it('exports SHORTCUT_PRESETS with expected keys', () => {
    expect(SHORTCUT_PRESETS).toBeDefined();
    expect(SHORTCUT_PRESETS.search).toEqual({ key: 'k', ctrl: true, description: 'Open search' });
    expect(SHORTCUT_PRESETS.save).toEqual({ key: 's', ctrl: true, description: 'Save' });
    expect(SHORTCUT_PRESETS.escape).toEqual({ key: 'Escape', description: 'Close / Cancel' });
    expect(SHORTCUT_PRESETS.newRecord).toEqual({
      key: 'n',
      ctrl: true,
      shift: true,
      description: 'New record',
    });
    expect(SHORTCUT_PRESETS.goHome).toEqual({
      key: 'h',
      ctrl: true,
      shift: true,
      description: 'Go home',
    });
    expect(SHORTCUT_PRESETS.goSettings).toEqual({
      key: ',',
      ctrl: true,
      description: 'Open settings',
    });
    expect(SHORTCUT_PRESETS.help).toEqual({
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
    });
  });
});
