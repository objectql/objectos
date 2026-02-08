import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartWidget } from '@/components/objectui/ChartWidget';
import type { ChartConfig } from '@/types/workflow';

describe('ChartWidget', () => {
  it('renders number chart', () => {
    const config: ChartConfig = {
      type: 'number',
      title: 'Total Revenue',
      data: [{ label: 'Revenue', value: 150000 }],
    };
    render(<ChartWidget config={config} />);
    expect(screen.getByText('Total Revenue')).toBeDefined();
    expect(screen.getByText('150,000')).toBeDefined();
  });

  it('renders bar chart with labels', () => {
    const config: ChartConfig = {
      type: 'bar',
      title: 'Leads by Status',
      data: [
        { label: 'New', value: 10 },
        { label: 'Qualified', value: 5 },
      ],
    };
    render(<ChartWidget config={config} />);
    expect(screen.getByText('Leads by Status')).toBeDefined();
    expect(screen.getByText('New')).toBeDefined();
    expect(screen.getByText('Qualified')).toBeDefined();
  });

  it('renders pie chart with legend', () => {
    const config: ChartConfig = {
      type: 'pie',
      title: 'Distribution',
      data: [
        { label: 'A', value: 30 },
        { label: 'B', value: 70 },
      ],
    };
    render(<ChartWidget config={config} />);
    expect(screen.getByText('Distribution')).toBeDefined();
    expect(screen.getByText('A')).toBeDefined();
    expect(screen.getByText('B')).toBeDefined();
  });

  it('renders description when provided', () => {
    const config: ChartConfig = {
      type: 'number',
      title: 'Title',
      description: 'Some description',
      data: [{ label: 'X', value: 1 }],
    };
    render(<ChartWidget config={config} />);
    expect(screen.getByText('Some description')).toBeDefined();
  });

  it('has data-testid attribute', () => {
    const config: ChartConfig = {
      type: 'number',
      title: 'Test',
      data: [{ label: 'X', value: 1 }],
    };
    render(<ChartWidget config={config} />);
    expect(screen.getByTestId('chart-widget')).toBeDefined();
  });
});
