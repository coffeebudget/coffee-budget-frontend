import { useState } from "react";
import { Category, Tag } from "@/utils/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

type TransactionFiltersProps = {
  filters: {
    startDate: string;
    endDate: string;
    categoryIds: number[];
    tagIds: number[];
    minAmount?: number;
    maxAmount?: number;
    type?: 'expense' | 'income';
    searchTerm: string;
    orderBy?: 'executionDate' | 'amount' | 'description';
    orderDirection?: 'asc' | 'desc';
  };
  categories: Category[];
  tags: Tag[];
  onFilterChange: (filters: any) => void;
  onApplyFilters: () => void;
  title?: string;
  showOrderOptions?: boolean;
  className?: string;
  variant?: 'default' | 'dashboard';
};

export default function TransactionFilters({
  filters,
  categories,
  tags,
  onFilterChange,
  onApplyFilters,
  title = "Filter Transactions",
  showOrderOptions = false,
  className = "",
  variant = 'default'
}: TransactionFiltersProps) {
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

  // Different styling based on variant
  const cardClassName = variant === 'dashboard' 
    ? "bg-white shadow mb-6 " + className
    : "mb-6 " + className;

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground"
          >
            {isExpanded ? (
              <><ChevronUp className="h-4 w-4 mr-1" /> Show Less</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-1" /> Show More</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="type">Transaction Type</Label>
            <select
              id="type"
              name="type"
              value={filters.type || ''}
              onChange={handleInputChange}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        {isExpanded && (
          <>
            {showOrderOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="orderBy">Order By</Label>
                  <select
                    id="orderBy"
                    name="orderBy"
                    value={filters.orderBy || 'executionDate'}
                    onChange={handleInputChange}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="executionDate">Date</option>
                    <option value="amount">Amount</option>
                    <option value="description">Description</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="orderDirection">Order Direction</Label>
                  <select
                    id="orderDirection"
                    name="orderDirection"
                    value={filters.orderDirection || 'desc'}
                    onChange={handleInputChange}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="searchTerm">Search Description</Label>
                  <Input
                    id="searchTerm"
                    type="text"
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleInputChange}
                    placeholder="Search..."
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {!showOrderOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="searchTerm">Search Description</Label>
                  <Input
                    id="searchTerm"
                    type="text"
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleInputChange}
                    placeholder="Search..."
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="minAmount">Min Amount</Label>
                <Input
                  id="minAmount"
                  type="number"
                  name="minAmount"
                  value={filters.minAmount || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="maxAmount">Max Amount</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  name="maxAmount"
                  value={filters.maxAmount || ''}
                  onChange={handleInputChange}
                  placeholder="1000.00"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="categoryIds">Categories</Label>
                <select
                  id="categoryIds"
                  multiple
                  name="categoryIds"
                  value={filters.categoryIds.map(String)}
                  onChange={(e) => handleMultiSelectChange(e, 'categoryIds')}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              <div>
                <Label htmlFor="tagIds">Tags</Label>
                <select
                  id="tagIds"
                  multiple
                  name="tagIds"
                  value={filters.tagIds.map(String)}
                  onChange={(e) => handleMultiSelectChange(e, 'tagIds')}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            </div>
          </>
        )}

        <Button
          className="w-full"
          onClick={onApplyFilters}
        >
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
} 