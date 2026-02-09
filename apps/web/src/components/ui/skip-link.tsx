/**
 * SkipLink — accessibility skip-to-content link.
 *
 * Hidden by default, becomes visible when focused via keyboard.
 * Allows screen reader and keyboard users to skip navigation.
 * WCAG 2.1 AA: 2.4.1 Bypass Blocks.
 */

interface SkipLinkProps {
  /** Target element id (without #). Defaults to "main-content". */
  targetId?: string;
  /** Link text. Defaults to "Skip to main content". */
  label?: string;
}

export function SkipLink({ targetId = 'main-content', label = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      data-testid="skip-link"
    >
      {label}
    </a>
  );
}
