"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Save, X, Loader2 } from "lucide-react";
import {
  ExpensePlan,
  getExpensePlanStatusLabel,
  getExpensePlanPriorityLabel,
  getExpensePlanTypeLabel,
  getExpensePlanPurposeLabel,
  getPriorityColor,
  getStatusColor,
  getExpensePlanPurposeColor,
} from "@/types/expense-plan-types";

interface ExpensePlanHeaderProps {
  plan: ExpensePlan;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function ExpensePlanHeader({
  plan,
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  isSaving,
}: ExpensePlanHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Icon */}
            {plan.icon && (
              <div className="text-4xl">{plan.icon}</div>
            )}

            <div>
              {/* Name */}
              <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>

              {/* Description */}
              {plan.description && (
                <p className="text-gray-600 mt-1">{plan.description}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className={getStatusColor(plan.status)}>
                  {getExpensePlanStatusLabel(plan.status)}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(plan.priority)}>
                  {getExpensePlanPriorityLabel(plan.priority)}
                </Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  {getExpensePlanTypeLabel(plan.planType)}
                </Badge>
                <Badge variant="outline" className={getExpensePlanPurposeColor(plan.purpose)}>
                  {getExpensePlanPurposeLabel(plan.purpose)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
