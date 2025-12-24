"use client";

import { useState } from "react";
import {
  useIncomeDistributionRules,
  useDeleteIncomeDistributionRule,
  useDistributeManually,
} from "@/hooks/useIncomeDistribution";
import { useActiveExpensePlans } from "@/hooks/useExpensePlans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Banknote,
  ArrowRightLeft,
  Settings,
  Zap,
  CircleDollarSign,
} from "lucide-react";
import {
  IncomeDistributionRule,
  DistributionStrategy,
  DISTRIBUTION_STRATEGIES,
  getDistributionStrategyLabel,
  getDistributionStrategyDescription,
  formatCurrency,
} from "@/types/expense-plan-types";
import IncomeDistributionRuleDialog from "./IncomeDistributionRuleDialog";

export default function IncomeDistributionSetup() {
  const { data: rules, isLoading, error } = useIncomeDistributionRules();
  const { data: plans } = useActiveExpensePlans();
  const deleteMutation = useDeleteIncomeDistributionRule();
  const distributeManually = useDistributeManually();

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<IncomeDistributionRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<IncomeDistributionRule | null>(null);
  const [manualDistributeOpen, setManualDistributeOpen] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualStrategy, setManualStrategy] = useState<DistributionStrategy>("priority");

  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: IncomeDistributionRule) => {
    setEditingRule(rule);
    setRuleDialogOpen(true);
  };

  const handleDeleteClick = (rule: IncomeDistributionRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ruleToDelete) {
      await deleteMutation.mutateAsync(ruleToDelete.id);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const handleManualDistribute = async () => {
    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) return;

    await distributeManually.mutateAsync({
      amount,
      strategy: manualStrategy,
    });
    setManualDistributeOpen(false);
    setManualAmount("");
  };

  const activeRules = rules?.filter((r) => r.isActive) || [];
  const inactiveRules = rules?.filter((r) => !r.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-green-600" />
            Income Distribution
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Automatically distribute income to your expense plans
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setManualDistributeOpen(true)}
            disabled={!plans?.length}
            className="gap-2"
          >
            <Banknote className="h-4 w-4" />
            Distribute Now
          </Button>
          <Button onClick={handleCreateRule} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 text-center text-red-500">
          Failed to load distribution rules. Please try again.
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!rules || rules.length === 0) && (
        <Card className="p-8 text-center">
          <CircleDollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Distribution Rules Yet
          </h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Create rules to automatically distribute incoming income (like salary)
            to your expense plans based on priority or proportion.
          </p>
          <Button onClick={handleCreateRule}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Rule
          </Button>
        </Card>
      )}

      {/* Active Rules */}
      {activeRules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Active Rules</h3>
          <div className="grid gap-3">
            {activeRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={handleEditRule}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Rules */}
      {inactiveRules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Inactive Rules</h3>
          <div className="grid gap-3">
            {inactiveRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={handleEditRule}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rule Dialog */}
      <IncomeDistributionRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        rule={editingRule}
        onComplete={() => {
          setRuleDialogOpen(false);
          setEditingRule(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Distribution Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{ruleToDelete?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Distribution Dialog */}
      <Dialog open={manualDistributeOpen} onOpenChange={setManualDistributeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute Income</DialogTitle>
            <DialogDescription>
              Manually distribute an amount to your expense plans.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Enter amount to distribute"
              />
            </div>

            <div>
              <Label htmlFor="strategy">Distribution Strategy</Label>
              <Select
                value={manualStrategy}
                onValueChange={(v) => setManualStrategy(v as DistributionStrategy)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTRIBUTION_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy} value={strategy}>
                      <div>
                        <div>{getDistributionStrategyLabel(strategy)}</div>
                        <div className="text-xs text-gray-500">
                          {getDistributionStrategyDescription(strategy)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setManualDistributeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleManualDistribute}
              disabled={
                distributeManually.isPending ||
                !manualAmount ||
                parseFloat(manualAmount) <= 0
              }
            >
              {distributeManually.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Distribute
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Rule Card Component
interface RuleCardProps {
  rule: IncomeDistributionRule;
  onEdit: (rule: IncomeDistributionRule) => void;
  onDelete: (rule: IncomeDistributionRule) => void;
}

function RuleCard({ rule, onEdit, onDelete }: RuleCardProps) {
  return (
    <Card className={`${!rule.isActive ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900">{rule.name}</h4>
              <Badge
                variant="secondary"
                className={
                  rule.autoDistribute
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }
              >
                {rule.autoDistribute ? "Auto" : "Manual"}
              </Badge>
              <Badge variant="outline">
                {getDistributionStrategyLabel(rule.distributionStrategy)}
              </Badge>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              {/* Detection Criteria */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {rule.expectedAmount && (
                  <span>
                    Amount: {formatCurrency(rule.expectedAmount)}
                    {rule.amountTolerance > 0 && ` (±${rule.amountTolerance}%)`}
                  </span>
                )}
                {rule.descriptionPattern && (
                  <span>Pattern: "{rule.descriptionPattern}"</span>
                )}
                {rule.category && (
                  <span>Category: {rule.category.name}</span>
                )}
                {rule.bankAccount && (
                  <span>Account: {rule.bankAccount.name}</span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(rule)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(rule)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
