import { useState } from "react";
import { Category, Tag } from "@/utils/types";

type DashboardFiltersProps = {
  filters: {
    startDate: string;
    endDate: string;
    categoryIds: number[];
    tagIds: number[];
    minAmount?: number;
    maxAmount?: number;
    type?: 'expense' | 'income';
    searchTerm: string;
  };
  categories: Category[];
  tags: Tag[];
  onFilterChange: (filters: any) => void;
  onApplyFilters: () => void;
};

export default function DashboardFilters({
  filters,
  categories,
  tags,
  onFilterChange,
  onApplyFilters,
}: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'minAmount' || name === 'maxAmount') {
      onFilterChange({ [name]: value ? parseFloat(value) : undefined });
    } else {
      onFilterChange({ [name]: value });
    }
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, fieldName: string) => {
    const options = Array.from(e.target.selectedOptions).map(option => parseInt(option.value));
    onFilterChange({ [fieldName]: options });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filter Transactions & Categories</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 hover:text-blue-700"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type
          </label>
          <select
            name="type"
            value={filters.type || ''}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Amount
            </label>
            <input
              type="number"
              name="minAmount"
              value={filters.minAmount || ''}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Amount
            </label>
            <input
              type="number"
              name="maxAmount"
              value={filters.maxAmount || ''}
              onChange={handleInputChange}
              placeholder="1000.00"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Description
            </label>
            <input
              type="text"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleInputChange}
              placeholder="Search..."
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <select
              multiple
              name="categoryIds"
              value={filters.categoryIds.map(String)}
              onChange={(e) => handleMultiSelectChange(e, 'categoryIds')}
              className="w-full p-2 border rounded h-24"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <select
              multiple
              name="tagIds"
              value={filters.tagIds.map(String)}
              onChange={(e) => handleMultiSelectChange(e, 'tagIds')}
              className="w-full p-2 border rounded h-24"
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
        </div>
      )}

      <button
        onClick={onApplyFilters}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Apply Filters
      </button>
    </div>
  );
} 