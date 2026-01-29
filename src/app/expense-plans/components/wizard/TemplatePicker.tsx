"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Settings } from "lucide-react";
import {
  PlanTemplate,
  TemplateCategory,
  PLAN_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateCategoryLabel,
  getTemplatesByCategory,
} from "@/types/expense-plan-types";

interface TemplatePickerProps {
  onSelectTemplate: (template: PlanTemplate) => void;
  onCustomPlan?: () => void;
}

export function TemplatePicker({
  onSelectTemplate,
  onCustomPlan,
}: TemplatePickerProps) {
  const renderTemplateCard = (template: PlanTemplate) => (
    <Card
      key={template.id}
      className="cursor-pointer transition-all hover:shadow-md hover:border-green-300 hover:bg-green-50/50"
      onClick={() => onSelectTemplate(template)}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{template.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{template.name}</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {template.examples.slice(0, 3).join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderCategory = (category: TemplateCategory) => {
    const templates = getTemplatesByCategory(category);
    const label = getTemplateCategoryLabel(category);

    return (
      <div key={category} className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {label}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map(renderTemplateCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          What would you like to track?
        </h2>
        <p className="text-sm text-gray-600">
          Choose a template to get started quickly with sensible defaults, or
          create a custom plan with full control.
        </p>
      </div>

      {/* Template Categories */}
      {TEMPLATE_CATEGORIES.map(renderCategory)}

      {/* Custom Plan Option */}
      {onCustomPlan && (
        <div className="border-t pt-6">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onCustomPlan}
          >
            <Settings className="h-4 w-4" />
            Create Custom Plan
            <span className="text-gray-400 text-sm ml-auto">
              Full control over all settings
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
