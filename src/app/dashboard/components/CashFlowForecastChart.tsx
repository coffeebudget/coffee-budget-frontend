import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function CashFlowForecastChart({ data }: { data: any }) {
  if (!data || data.length === 0) return <p>No forecast data available.</p>;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Line type="monotone" dataKey="income" stroke="#4CAF50" name="Income" />
          <Line type="monotone" dataKey="expenses" stroke="#F44336" name="Expenses" />
          <Line type="monotone" dataKey="projectedBalance" stroke="#2196F3" name="Projected Balance" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
