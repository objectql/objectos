/**
 * useKeyboardShortcuts — global keyboard shortcut support.
 *
 * Registers keyboard shortcuts and invokes callbacks. Supports
 * modifier keys (Ctrl/Cmd, Shift, Alt) and prevents conflicts
 * when the user is typing in an input field.
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  /** Key identifier (e.g. 'k', 'Escape', '/') */
  key: string;
  /** Require Ctrl (or Cmd on Mac) */
  ctrl?: boolean;
  /** Require Shift */
  shift?: boolean;
  /** Require Alt */
  alt?: boolean;
  /** Callback on activation */
  handler: (event: KeyboardEvent) => void;
  /** Short description for help menu */
  description?: string;
  /** If true, also fire when focused on an input */
  allowInInput?: boolean;
}

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  if (INPUT_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcutsRef.current) {
      const ctrlMatch = shortcut.ctrl
        ? event.ctrlKey || event.metaKey
        : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      // Compare key with case sensitivity: use event.key directly for
      // special keys (length > 1) or shifted characters (e.g. '?').
      // For single alpha characters, compare case-insensitively.
      const keyMatches =
        shortcut.key.length === 1 && /[a-zA-Z]/.test(shortcut.key)
          ? event.key.toLowerCase() === shortcut.key.toLowerCase()
          : event.key === shortcut.key;

      if (keyMatches && ctrlMatch && shiftMatch && altMatch) {
        if (!shortcut.allowInInput && isInputFocused()) continue;

        event.preventDefault();
        shortcut.handler(event);
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Pre-defined shortcut sets for common operations.
 */
export const SHORTCUT_PRESETS = {
  search: { key: 'k', ctrl: true, description: 'Open search' },
  save: { key: 's', ctrl: true, description: 'Save' },
  escape: { key: 'Escape', description: 'Close / Cancel' },
  newRecord: { key: 'n', ctrl: true, shift: true, description: 'New record' },
  goHome: { key: 'h', ctrl: true, shift: true, description: 'Go home' },
  goSettings: { key: ',', ctrl: true, description: 'Open settings' },
  help: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
} as const;
