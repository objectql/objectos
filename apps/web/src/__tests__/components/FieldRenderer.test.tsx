import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FieldRenderer } from '@/components/records/FieldRenderer';
import type { FieldDefinition } from '@/types/metadata';

function textField(overrides?: Partial<FieldDefinition>): FieldDefinition {
  return { name: 'test', type: 'text', label: 'Test', ...overrides };
}

describe('FieldRenderer', () => {
  it('renders dash for null/undefined values', () => {
    const { container } = render(<FieldRenderer field={textField()} value={null} />);
    expect(container.textContent).toBe('—');
  });

  it('renders dash for empty string', () => {
    const { container } = render(<FieldRenderer field={textField()} value="" />);
    expect(container.textContent).toBe('—');
  });

  it('renders text value as string', () => {
    render(<FieldRenderer field={textField()} value="Hello World" />);
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('renders boolean true as Yes', () => {
    const field = textField({ type: 'boolean' });
    render(<FieldRenderer field={field} value={true} />);
    expect(screen.getByText('Yes')).toBeDefined();
  });

  it('renders boolean false as No', () => {
    const field = textField({ type: 'boolean' });
    render(<FieldRenderer field={field} value={false} />);
    expect(screen.getByText('No')).toBeDefined();
  });

  it('renders datetime as formatted date', () => {
    const field = textField({ type: 'datetime' });
    render(<FieldRenderer field={field} value="2025-01-15T10:30:00Z" />);
    // The date should contain "Jan" and "2025"
    const text = screen.getByTitle('2025-01-15T10:30:00.000Z').textContent;
    expect(text).toContain('2025');
    expect(text).toContain('Jan');
  });

  it('renders currency with $ symbol', () => {
    const field = textField({ type: 'currency' });
    const { container } = render(<FieldRenderer field={field} value={15000} />);
    expect(container.textContent).toContain('15,000');
    expect(container.textContent).toContain('$');
  });

  it('renders select as badge with option label', () => {
    const field = textField({
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
      ],
    });
    render(<FieldRenderer field={field} value="active" />);
    expect(screen.getByText('Active')).toBeDefined();
  });

  it('renders select with raw value if no matching option', () => {
    const field = textField({
      type: 'select',
      options: [{ label: 'Active', value: 'active' }],
    });
    render(<FieldRenderer field={field} value="unknown" />);
    expect(screen.getByText('unknown')).toBeDefined();
  });

  it('renders email as mailto link', () => {
    const field = textField({ type: 'email' });
    render(<FieldRenderer field={field} value="test@example.com" />);
    const link = screen.getByText('test@example.com');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('mailto:test@example.com');
  });

  it('renders url as external link', () => {
    const field = textField({ type: 'url' });
    render(<FieldRenderer field={field} value="https://example.com" />);
    const link = screen.getByText('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('renders number with locale formatting', () => {
    const field = textField({ type: 'number' });
    const { container } = render(<FieldRenderer field={field} value={1234567} />);
    expect(container.textContent).toContain('1,234,567');
  });

  it('renders percent with one decimal', () => {
    const field = textField({ type: 'percent' });
    const { container } = render(<FieldRenderer field={field} value={75.5} />);
    expect(container.textContent).toBe('75.5%');
  });
});
