import React from 'react';
import { Chart } from '../src/components/Chart';

/**
 * Chart Component Examples
 * 
 * This file demonstrates various chart types and configurations
 * similar to Airtable's chart component.
 */

// Sample data for demonstrations
const salesData = [
  { month: 'Jan', sales: 4000, expenses: 2400, profit: 1600 },
  { month: 'Feb', sales: 3000, expenses: 1398, profit: 1602 },
  { month: 'Mar', sales: 2000, expenses: 9800, profit: -7800 },
  { month: 'Apr', sales: 2780, expenses: 3908, profit: -1128 },
  { month: 'May', sales: 1890, expenses: 4800, profit: -2910 },
  { month: 'Jun', sales: 2390, expenses: 3800, profit: -1410 },
  { month: 'Jul', sales: 3490, expenses: 4300, profit: -810 },
];

const categoryData = [
  { category: 'Electronics', value: 400 },
  { category: 'Clothing', value: 300 },
  { category: 'Food', value: 200 },
  { category: 'Books', value: 100 },
];

const trafficData = [
  { date: '2024-01', visitors: 1200, pageViews: 3400 },
  { date: '2024-02', visitors: 1800, pageViews: 4200 },
  { date: '2024-03', visitors: 2400, pageViews: 5100 },
  { date: '2024-04', visitors: 3200, pageViews: 6800 },
  { date: '2024-05', visitors: 2800, pageViews: 5900 },
];

export function ChartExamples() {
  return (
    <div className="space-y-8 p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900">Chart Component Examples</h1>
      
      {/* Bar Chart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bar Chart</h2>
        <Chart
          type="bar"
          data={salesData}
          xAxisKey="month"
          yAxisKeys={['sales', 'expenses']}
          title="Monthly Sales and Expenses"
          description="Comparison of sales vs expenses over time"
          height={350}
        />
      </section>

      {/* Line Chart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Line Chart</h2>
        <Chart
          type="line"
          data={trafficData}
          xAxisKey="date"
          yAxisKeys={['visitors', 'pageViews']}
          title="Website Traffic"
          description="Monthly visitors and page views"
          height={350}
        />
      </section>

      {/* Area Chart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Area Chart</h2>
        <Chart
          type="area"
          data={salesData}
          xAxisKey="month"
          yAxisKeys={['profit']}
          title="Monthly Profit"
          description="Profit trend over time"
          height={350}
        />
      </section>

      {/* Pie Chart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pie Chart</h2>
        <Chart
          type="pie"
          data={categoryData}
          xAxisKey="category"
          yAxisKeys={['value']}
          title="Sales by Category"
          description="Distribution of sales across product categories"
          height={350}
        />
      </section>

      {/* Multiple Series Bar Chart */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Multi-Series Bar Chart</h2>
        <Chart
          type="bar"
          data={salesData}
          xAxisKey="month"
          yAxisKeys={['sales', 'expenses', 'profit']}
          title="Complete Financial Overview"
          description="Sales, expenses, and profit in one view"
          height={400}
        />
      </section>

      {/* Chart with Custom Options */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Custom Styling</h2>
        <Chart
          type="line"
          data={trafficData}
          xAxisKey="date"
          yAxisKeys={['visitors']}
          title="Simplified View"
          description="Line chart without grid and legend"
          height={300}
          showGrid={false}
          showLegend={false}
          colors={['#FF6B6B']}
        />
      </section>

      {/* Empty State */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Empty State</h2>
        <Chart
          type="bar"
          data={[]}
          xAxisKey="month"
          yAxisKeys={['sales']}
          title="No Data Available"
          description="Example of chart with no data"
          height={300}
        />
      </section>
    </div>
  );
}

export default ChartExamples;
