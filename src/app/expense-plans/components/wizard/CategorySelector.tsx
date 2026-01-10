"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  WizardExpenseCategory,
  WIZARD_CATEGORY_DEFINITIONS,
  WizardCategoryGroup,
} from "@/types/expense-plan-types";

interface CategorySelectorProps {
  selectedCategories: WizardExpenseCategory[];
  onSelectionChange: (categories: WizardExpenseCategory[]) => void;
}

export function CategorySelector({
  selectedCategories,
  onSelectionChange,
}: CategorySelectorProps) {
  const handleToggleCategory = (categoryId: WizardExpenseCategory) => {
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter((c) => c !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(WIZARD_CATEGORY_DEFINITIONS.map((c) => c.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const essentialCategories = WIZARD_CATEGORY_DEFINITIONS.filter(
    (c) => c.group === "essential"
  );
  const lifestyleCategories = WIZARD_CATEGORY_DEFINITIONS.filter(
    (c) => c.group === "lifestyle"
  );

  const renderCategoryGroup = (
    title: string,
    categories: typeof WIZARD_CATEGORY_DEFINITIONS,
    group: WizardCategoryGroup
  ) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-green-500 bg-green-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleToggleCategory(category.id)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleCategory(category.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-medium text-gray-900">
                      {category.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {category.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          What types of recurring expenses do you have?
        </h2>
        <p className="text-sm text-gray-600">
          Select the categories that apply to you. We&apos;ll help you set up expense
          plans for each one.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleSelectAll}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          Clear All
        </Button>
      </div>

      {/* Essential Categories */}
      {renderCategoryGroup("Essential Expenses", essentialCategories, "essential")}

      {/* Lifestyle Categories */}
      {renderCategoryGroup("Lifestyle Expenses", lifestyleCategories, "lifestyle")}

      {/* Selection Summary */}
      {selectedCategories.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <span className="font-medium">{selectedCategories.length}</span>{" "}
            {selectedCategories.length === 1 ? "category" : "categories"} selected.
            Click &quot;Next&quot; to configure your expense plans.
          </p>
        </div>
      )}
    </div>
  );
}
