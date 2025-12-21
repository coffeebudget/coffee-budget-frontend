'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import type {
  PaymentActivityFilters as FiltersType,
  PaymentActivityType,
} from '@/types/payment-types';
import { PAYMENT_ACTIVITY_TYPES, formatActivityType } from '@/types/payment-types';

interface PaymentActivityFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onApply: () => void;
  onClear: () => void;
}

export function PaymentActivityFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
}: PaymentActivityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.searchTerm ||
    filters.startDate ||
    filters.endDate ||
    filters.activityType ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined;

  const activeFilterCount = [
    filters.searchTerm,
    filters.startDate || filters.endDate,
    filters.activityType,
    filters.minAmount !== undefined || filters.maxAmount !== undefined,
  ].filter(Boolean).length;

  const updateFilter = <K extends keyof FiltersType>(key: K, value: FiltersType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onApply();
    }
  };

  return (
    <Card className="p-4">
      {/* Search Bar - Always Visible */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by merchant, description..."
            value={filters.searchTerm || ''}
            onChange={(e) => updateFilter('searchTerm', e.target.value || undefined)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={onApply} size="sm">
          Search
        </Button>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="mt-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {isOpen && (
          <div className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
              />
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount (€)</Label>
              <Input
                id="minAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.minAmount ?? ''}
                onChange={(e) =>
                  updateFilter(
                    'minAmount',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount (€)</Label>
              <Input
                id="maxAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.maxAmount ?? ''}
                onChange={(e) =>
                  updateFilter(
                    'maxAmount',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>

          {/* Activity Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activityType">Activity Type</Label>
              <Select
                value={filters.activityType || 'all'}
                onValueChange={(value) =>
                  updateFilter('activityType', value === 'all' ? undefined : (value as PaymentActivityType))
                }
              >
                <SelectTrigger id="activityType">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(PAYMENT_ACTIVITY_TYPES).map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatActivityType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button size="sm" onClick={onApply}>
              Apply Filters
            </Button>
          </div>
        </div>
        )}
      </div>
    </Card>
  );
}
