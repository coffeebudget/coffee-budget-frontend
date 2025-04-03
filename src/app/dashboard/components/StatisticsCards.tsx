type StatisticsData = {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  averageDailyExpense: number;
  topExpenseCategory: {
    name: string;
    amount: number;
  };
  totalTransactions: number;
};

type StatisticsCardsProps = {
  statistics: StatisticsData | null;
};

export default function StatisticsCards({ statistics }: StatisticsCardsProps) {
  if (!statistics) {
    return <div className="text-center p-4 text-gray-500">No statistics available for the selected month</div>;
  }

  // Helper function to safely format numbers
  const formatCurrency = (value: number | undefined) => {
    return value !== undefined ? `$${value.toFixed(2)}` : '$0.00';
  };

  const cards = [
    {
      title: "Total Expenses",
      value: formatCurrency(statistics.totalExpenses),
      color: "bg-red-100 text-red-800",
      icon: "💸"
    },
    {
      title: "Total Income",
      value: formatCurrency(statistics.totalIncome),
      color: "bg-green-100 text-green-800",
      icon: "💰"
    },
    {
      title: "Net Savings",
      value: formatCurrency(statistics.balance),
      color: "bg-blue-100 text-blue-800",
      icon: "💎"
    },
    {
      title: "Avg. Daily Expense",
      value: formatCurrency(statistics.averageDailyExpense),
      color: "bg-yellow-100 text-yellow-800",
      icon: "📊"
    },
    {
      title: "Largest Expense Category",
      value: statistics.topExpenseCategory ? 
        `${statistics.topExpenseCategory.name} (${formatCurrency(statistics.topExpenseCategory.amount)})` : 
        "None",
      color: "bg-purple-100 text-purple-800",
      icon: "📈"
    },
    {
      title: "Transaction Count",
      value: statistics.totalTransactions?.toString() || "0",
      color: "bg-indigo-100 text-indigo-800",
      icon: "🧾"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <div key={index} className={`p-4 rounded-lg shadow ${card.color}`}>
          <div className="flex items-center">
            <div className="text-2xl mr-3">{card.icon}</div>
            <div>
              <h3 className="text-sm font-medium">{card.title}</h3>
              <p className="text-xl font-bold">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
