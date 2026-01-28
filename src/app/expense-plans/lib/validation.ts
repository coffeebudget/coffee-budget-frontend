/**
 * Expense Plan Form Validation
 *
 * Shared validation logic for expense plan forms.
 * Used by both ExpensePlanFormDialog and detail page edit mode.
 */

import { ExpensePlanFormErrors } from "@/types/expense-plan-types";

export interface ExpensePlanValidationInput {
  name: string;
  targetAmount: string;
  monthlyContribution: string;
}

/**
 * Validate expense plan form data
 * @returns Object with validation errors, empty if valid
 */
export function validateExpensePlanForm(
  data: ExpensePlanValidationInput
): ExpensePlanFormErrors {
  const errors: ExpensePlanFormErrors = {};

  // Name is required
  if (!data.name.trim()) {
    errors.name = "Name is required";
  }

  // Target amount must be greater than 0
  const targetAmount = parseFloat(data.targetAmount);
  if (isNaN(targetAmount) || targetAmount <= 0) {
    errors.targetAmount = "Target amount must be greater than 0";
  }

  // Monthly contribution must be 0 or greater
  const monthlyContribution = parseFloat(data.monthlyContribution);
  if (isNaN(monthlyContribution) || monthlyContribution < 0) {
    errors.monthlyContribution = "Monthly contribution must be 0 or greater";
  }

  return errors;
}

/**
 * Check if form has validation errors
 */
export function hasValidationErrors(errors: ExpensePlanFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Validate a single field
 */
export function validateField(
  field: keyof ExpensePlanValidationInput,
  value: string
): string | undefined {
  switch (field) {
    case "name":
      if (!value.trim()) {
        return "Name is required";
      }
      return undefined;

    case "targetAmount": {
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        return "Target amount must be greater than 0";
      }
      return undefined;
    }

    case "monthlyContribution": {
      const amount = parseFloat(value);
      if (isNaN(amount) || amount < 0) {
        return "Monthly contribution must be 0 or greater";
      }
      return undefined;
    }

    default:
      return undefined;
  }
}

/**
 * Validate due month value
 */
export function validateDueMonth(value: string): string | undefined {
  if (!value) return undefined;

  const month = parseInt(value);
  if (isNaN(month) || month < 1 || month > 12) {
    return "Month must be between 1 and 12";
  }
  return undefined;
}

/**
 * Validate due day value
 */
export function validateDueDay(value: string): string | undefined {
  if (!value) return undefined;

  const day = parseInt(value);
  if (isNaN(day) || day < 1 || day > 31) {
    return "Day must be between 1 and 31";
  }
  return undefined;
}

/**
 * Validate frequency years value
 */
export function validateFrequencyYears(value: string): string | undefined {
  if (!value) return undefined;

  const years = parseFloat(value);
  if (isNaN(years) || years < 0.5 || years > 10) {
    return "Years must be between 0.5 and 10";
  }
  return undefined;
}
