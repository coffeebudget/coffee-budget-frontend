"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link2, Wallet, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBankAccounts, fetchCreditCards } from "@/utils/api-client";
import {
  WizardCategoryDefinition,
  WizardExpensePlan,
  WizardFrequency,
  WIZARD_FREQUENCIES,
  getWizardFrequencyLabel,
  PaymentAccountType,
} from "@/types/expense-plan-types";
import { TransactionSelectorModal } from "./TransactionSelectorModal";

interface BankAccount {
  id: number;
  name: string;
  balance: number;
}

interface CreditCardAccount {
  id: number;
  name: string;
  creditLimit: number;
  availableCredit: number;
}

interface CategoryExpenseFormProps {
  category: WizardCategoryDefinition;
  existingPlans: WizardExpensePlan[];
  onAddPlan: (plan: Omit<WizardExpensePlan, "tempId">) => void;
  onUpdatePlan: (tempId: string, updates: Partial<WizardExpensePlan>) => void;
  onRemovePlan: (tempId: string) => void;
  onSkip: () => void;
}

interface ExpenseFormData {
  expenseType: string;
  name: string;
  amount: string;
  frequency: WizardFrequency;
  nextDueDate: string;
  priority: "essential" | "discretionary";
  notes: string;
  linkedTransactionIds: number[];
  paymentAccountType: PaymentAccountType | null;
  paymentAccountId: number | null;
}

const getDefaultFormData = (
  category: WizardCategoryDefinition
): ExpenseFormData => ({
  expenseType: category.expenseTypes[0]?.id || "",
  name: "",
  amount: "",
  frequency: "monthly",
  nextDueDate: new Date().toISOString().split("T")[0],
  priority: category.group === "essential" ? "essential" : "discretionary",
  notes: "",
  linkedTransactionIds: [],
  paymentAccountType: null,
  paymentAccountId: null,
});

export function CategoryExpenseForm({
  category,
  existingPlans,
  onAddPlan,
  onRemovePlan,
  onSkip,
}: CategoryExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>(
    getDefaultFormData(category)
  );
  const [showForm, setShowForm] = useState(existingPlans.length === 0);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);

  // Fetch bank accounts for payment source selection
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["bankAccounts"],
    queryFn: fetchBankAccounts,
  });

  // Fetch credit cards for payment source selection
  const { data: creditCards = [] } = useQuery<CreditCardAccount[]>({
    queryKey: ["creditCards"],
    queryFn: fetchCreditCards,
  });

  const handleInputChange = (
    field: keyof ExpenseFormData,
    value: string | number | number[] | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTransactionSelection = (ids: number[]) => {
    setFormData((prev) => ({ ...prev, linkedTransactionIds: ids }));
  };

  const handleAddExpense = () => {
    if (!formData.name || !formData.amount || parseFloat(formData.amount) <= 0) {
      return;
    }

    onAddPlan({
      categoryType: category.id,
      expenseType: formData.expenseType,
      name: formData.name,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      nextDueDate: formData.nextDueDate,
      priority: formData.priority,
      linkedTransactionIds: formData.linkedTransactionIds,
      notes: formData.notes,
      categoryId: null,
      paymentAccountType: formData.paymentAccountType,
      paymentAccountId: formData.paymentAccountId,
    });

    // Reset form for another entry
    setFormData(getDefaultFormData(category));
    setShowForm(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(Math.abs(amount));

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{category.icon}</span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{category.label}</h2>
          <p className="text-sm text-gray-600">{category.description}</p>
        </div>
      </div>

      {/* Existing Plans for this Category */}
      {existingPlans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Added Expense Plans ({existingPlans.length})
          </h3>
          {existingPlans.map((plan) => (
            <Card key={plan.tempId} className="bg-green-50 border-green-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-gray-600">
                      {formatCurrency(plan.amount)} / {getWizardFrequencyLabel(plan.frequency)}
                    </p>
                    {plan.linkedTransactionIds.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {plan.linkedTransactionIds.length} linked
                      </Badge>
                    )}
                    {plan.paymentAccountId && plan.paymentAccountType === "bank_account" && (
                      <Badge variant="outline" className="text-xs">
                        <Wallet className="h-3 w-3 mr-1 text-blue-600" />
                        {bankAccounts.find((a) => a.id === plan.paymentAccountId)?.name || "Bank Account"}
                      </Badge>
                    )}
                    {plan.paymentAccountId && plan.paymentAccountType === "credit_card" && (
                      <Badge variant="outline" className="text-xs">
                        <CreditCard className="h-3 w-3 mr-1 text-purple-600" />
                        {creditCards.find((c) => c.id === plan.paymentAccountId)?.name || "Credit Card"}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemovePlan(plan.tempId)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Expense Form */}
      {showForm ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add {category.label} Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expense Type Selection */}
            {category.expenseTypes.length > 1 && (
              <div className="space-y-2">
                <Label>Expense Type</Label>
                <Select
                  value={formData.expenseType}
                  onValueChange={(v) => handleInputChange("expenseType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {category.expenseTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Link Transactions Button */}
            <div className="space-y-2">
              <Label>Link Transactions (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransactionModalOpen(true)}
                className="w-full justify-start text-left"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {formData.linkedTransactionIds.length > 0 ? (
                  <span className="text-green-600 font-medium">
                    {formData.linkedTransactionIds.length} transaction(s) linked
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Click to search and link transactions...
                  </span>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Linking transactions helps track your payment history
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Expense Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Rent Payment"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            {/* Amount & Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) => handleInputChange("frequency", v as WizardFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIZARD_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {getWizardFrequencyLabel(freq)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Next Due Date */}
            <div className="space-y-2">
              <Label htmlFor="nextDueDate">Next Due Date</Label>
              <Input
                id="nextDueDate"
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => handleInputChange("nextDueDate", e.target.value)}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="essential"
                    checked={formData.priority === "essential"}
                    onChange={() => handleInputChange("priority", "essential")}
                    className="text-green-600"
                  />
                  <span className="text-sm">Essential</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="discretionary"
                    checked={formData.priority === "discretionary"}
                    onChange={() => handleInputChange("priority", "discretionary")}
                  />
                  <span className="text-sm">Discretionary</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={2}
              />
            </div>

            {/* Payment Account */}
            <div className="space-y-2">
              <Label>Payment Account (Optional)</Label>
              <Select
                value={
                  formData.paymentAccountId && formData.paymentAccountType
                    ? `${formData.paymentAccountType}:${formData.paymentAccountId}`
                    : "none"
                }
                onValueChange={(v) => {
                  if (v === "none") {
                    setFormData((prev) => ({
                      ...prev,
                      paymentAccountType: null,
                      paymentAccountId: null,
                    }));
                  } else {
                    const [type, id] = v.split(":");
                    setFormData((prev) => ({
                      ...prev,
                      paymentAccountType: type as PaymentAccountType,
                      paymentAccountId: parseInt(id),
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment account..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500">No account selected</span>
                  </SelectItem>
                  {/* Bank Accounts */}
                  {bankAccounts.length > 0 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                      Bank Accounts
                    </div>
                  )}
                  {bankAccounts.map((account) => (
                    <SelectItem key={`bank_account:${account.id}`} value={`bank_account:${account.id}`}>
                      <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <span>{account.name}</span>
                        <span className="text-gray-500 ml-2">
                          ({formatCurrency(account.balance)})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                  {/* Credit Cards */}
                  {creditCards.length > 0 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                      Credit Cards
                    </div>
                  )}
                  {creditCards.map((card) => (
                    <SelectItem key={`credit_card:${card.id}`} value={`credit_card:${card.id}`}>
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span>{card.name}</span>
                        <span className="text-gray-500 ml-2">
                          ({formatCurrency(card.availableCredit)} available)
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Link to a payment account for coverage monitoring
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddExpense}
                disabled={!formData.name || !formData.amount}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Expense Plan
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowForm(true)} className="flex-1">
            <Plus className="h-4 w-4 mr-1" />
            Add Another {category.label} Expense
          </Button>
        </div>
      )}

      {/* Skip Category Option */}
      {existingPlans.length === 0 && !showForm && (
        <div className="text-center pt-4">
          <Button variant="ghost" onClick={onSkip} className="text-gray-500">
            Skip this category - I don&apos;t have {category.label.toLowerCase()} expenses
          </Button>
        </div>
      )}

      {/* Transaction Selector Modal */}
      <TransactionSelectorModal
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        selectedTransactionIds={formData.linkedTransactionIds}
        onSelectionChange={handleTransactionSelection}
      />
    </div>
  );
}
