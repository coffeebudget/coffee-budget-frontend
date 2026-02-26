import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type MonthlySummaryItem = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

type MonthlySummaryChartProps = {
  data: MonthlySummaryItem[];
};

export default function MonthlySummaryChart({ data }: MonthlySummaryChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">No monthly data available</div>;
  }

  // Format the month names for better display
  const formattedData = data.map(item => ({
    ...item,
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }));

  // Safe formatter for tooltip values
  const safeFormatter = (value: any) => {
    if (value === undefined || value === null) return ['€0,00', ''];
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(numValue) ? [`€${numValue.toFixed(2)}`, ''] : ['€0,00', ''];
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={safeFormatter} />
          <Legend />
          <Bar dataKey="income" fill="#4CAF50" name="Income" />
          <Bar dataKey="expenses" fill="#F44336" name="Expenses" />
          <Bar dataKey="savings" fill="#2196F3" name="Savings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 