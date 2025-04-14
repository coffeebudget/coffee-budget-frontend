import { Transaction, Category, Tag } from "@/utils/types";

type FilteredTransactionListProps = {
  transactions: Transaction[];
  categories: Category[];
  tags: Tag[];
};

export default function FilteredTransactionList({
  transactions,
  categories,
  tags,
}: FilteredTransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return <div className="text-center p-4 text-gray-500">No transactions match your filters</div>;
  }

  // Helper function to get category name
  const getCategoryName = (categoryId: number | undefined) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Helper function to get tag names
  const getTagNames = (tagIds: number[] | undefined) => {
    if (!tagIds || tagIds.length === 0) return "";
    return tagIds
      .map(id => {
        const tag = tags.find(t => t.id === id);
        return tag ? tag.name : "";
      })
      .filter(Boolean)
      .join(", ");
  };

  // Helper function to safely format currency
  const formatAmount = (amount: any) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(numAmount) ? numAmount.toFixed(2) : '0.00';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tags
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(transaction.executionDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getCategoryName(transaction.categoryId || undefined)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getTagNames(transaction.tagIds)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <span className={transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                  ${formatAmount(transaction.amount)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  transaction.type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 