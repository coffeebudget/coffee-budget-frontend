import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import React from 'react';

type ExpenseDistributionItem = {
  categoryName: string;
  amount: number;
  percentage: number;
};

type ExpenseDistributionChartProps = {
  data: ExpenseDistributionItem[];
};

// Custom colors for the bar chart
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
];

export default function ExpenseDistributionChart({ data }: ExpenseDistributionChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">No expense data available</div>;
  }

  // Sort data by amount in descending order
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);
  const topCategories = sortedData.slice(0, 15); // Get the top 15 categories

  // Safe formatter for tooltip values
  const safeFormatter = (value: any, name: string) => {
    if (value === undefined || value === null) return ['€0,00', ''];
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (name === 'amount') {
      return !isNaN(numValue) ? [`€${numValue.toFixed(2)}`, 'Amount'] : ['€0,00', 'Amount'];
    } else if (name === 'percentage') {
      return !isNaN(numValue) ? [`${numValue.toFixed(1)}%`, 'Percentage'] : ['0.0%', 'Percentage'];
    }

    return [value, name];
  };

  return (
    <div className="flex">
      <div className="h-96 w-2/3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topCategories}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 100, // More space for category names
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="categoryName" 
              tick={{ fontSize: 12 }}
              width={90}
            />
            <Tooltip formatter={safeFormatter} />
            <Legend />
            <Bar 
              dataKey="amount" 
              name="Amount" 
              radius={[0, 4, 4, 0]}
            >
              {topCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-1/3 pl-4">
        <h3 className="text-lg font-semibold mb-2">Category Details</h3>
        <ul className="list-disc pl-5">
          {sortedData.map((item, index) => (
            <li key={index} className="text-xs">
              {item.categoryName}: €{item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 