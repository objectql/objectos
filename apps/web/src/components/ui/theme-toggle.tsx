/**
 * ThemeToggle — light / dark / system mode switcher.
 *
 * Renders a button that cycles through theme modes.
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/hooks/use-theme';

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const THEME_CYCLE: Theme[] = ['light', 'dark', 'system'];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const Icon = THEME_ICONS[theme];

  const nextTheme = () => {
    const idx = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  return (
    <button
      type="button"
      onClick={nextTheme}
      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`Theme: ${THEME_LABELS[theme]}. Click to switch.`}
      data-testid="theme-toggle"
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{THEME_LABELS[theme]}</span>
    </button>
  );
}
