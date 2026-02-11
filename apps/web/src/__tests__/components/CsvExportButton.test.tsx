/**
 * Tests for CsvExportButton component.
 *
 * Validates rendering and export behavior.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CsvExportButton } from '@/components/objectui/CsvExportButton';
import type { ObjectDefinition, RecordData } from '@/types/metadata';

const mockObjectDef: ObjectDefinition = {
  name: 'lead',
  label: 'Lead',
  fields: {
    id: { type: 'text', label: 'ID', readonly: true },
    name: { type: 'text', label: 'Name', required: true },
    email: { type: 'email', label: 'Email' },
  },
};

const mockRecords: RecordData[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

describe('CsvExportButton', () => {
  it('renders the export button', () => {
    render(<CsvExportButton objectDef={mockObjectDef} records={mockRecords} />);
    expect(screen.getByText('Export CSV')).toBeDefined();
  });

  it('is disabled when no records are provided', () => {
    render(<CsvExportButton objectDef={mockObjectDef} records={[]} />);
    const button = screen.getByTestId('csv-export-button');
    expect(button.getAttribute('disabled')).not.toBeNull();
  });

  it('triggers download on click', () => {
    // Mock URL methods and createElement to intercept the download link creation
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    const originalURL = window.URL;
    Object.defineProperty(window, 'URL', {
      value: { createObjectURL, revokeObjectURL },
      writable: true,
      configurable: true,
    });

    // Render first, then interact
    render(<CsvExportButton objectDef={mockObjectDef} records={mockRecords} />);

    // Mock the link element after rendering
    const originalCreateElement = document.createElement.bind(document);
    const clickFn = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickFn } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    const button = screen.getByTestId('csv-export-button');
    button.click();

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickFn).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    vi.restoreAllMocks();
    Object.defineProperty(window, 'URL', { value: originalURL, writable: true, configurable: true });
  });
});
