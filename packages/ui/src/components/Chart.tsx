import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '../lib/utils';

// Color palette similar to Airtable
const COLORS = [
  '#2D7FF9',
  '#18BFFF',
  '#20D9D2',
  '#20C933',
  '#FFC940',
  '#FF6F2C',
  '#FF08C2',
  '#8B46FF',
];

// Pie chart radius divisor for calculating outer radius
const PIE_RADIUS_DIVISOR = 3;

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface ChartDataPoint {
  [key: string]: string | number | null | undefined;
}

export interface ChartProps {
  /**
   * Type of chart to render
   */
  type?: ChartType;
  
  /**
   * Chart data array
   */
  data: ChartDataPoint[];
  
  /**
   * Key in data object to use for X-axis
   */
  xAxisKey?: string;
  
  /**
   * Keys in data object to use for Y-axis values (can be multiple for multi-series)
   */
  yAxisKeys?: string[];
  
  /**
   * Chart title
   */
  title?: string;
  
  /**
   * Chart description
   */
  description?: string;
  
  /**
   * Chart height in pixels
   */
  height?: number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Custom colors for chart series
   */
  colors?: string[];
  
  /**
   * Show grid lines
   */
  showGrid?: boolean;
  
  /**
   * Show legend
   */
  showLegend?: boolean;
  
  /**
   * Show tooltip on hover
   */
  showTooltip?: boolean;
}

export function Chart({
  type = 'bar',
  data,
  xAxisKey = 'name',
  yAxisKeys = ['value'],
  title,
  description,
  height = 300,
  className,
  colors = COLORS,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200 p-6', className)}>
        {(title || description) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        )}
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400">No data to display</p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        // For pie charts, use the first yAxisKey
        const dataKey = yAxisKeys[0];
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={height / PIE_RADIUS_DIVISOR}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200 p-6', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
