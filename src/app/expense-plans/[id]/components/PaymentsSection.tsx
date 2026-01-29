"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  Plus,
  MoreVertical,
  Trash2,
  Loader2,
  ExternalLink,
  Zap,
  Link2,
  Unlink,
} from "lucide-react";
import {
  useExpensePlanPayments,
  useDeletePayment,
} from "@/hooks/useExpensePlans";
import {
  ExpensePlan,
  ExpensePlanPayment,
  formatCurrency,
} from "@/types/expense-plan-types";

interface PaymentsSectionProps {
  plan: ExpensePlan;
  onLinkTransaction: () => void;
}

export function PaymentsSection({ plan, onLinkTransaction }: PaymentsSectionProps) {
  const { data: payments = [], isLoading } = useExpensePlanPayments(plan.id);
  const deletePaymentMutation = useDeletePayment();
  const [paymentToDelete, setPaymentToDelete] = useState<ExpensePlanPayment | null>(null);

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    await deletePaymentMutation.mutateAsync({
      planId: plan.id,
      paymentId: paymentToDelete.id,
    });
    setPaymentToDelete(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPaymentTypeBadge = (type: ExpensePlanPayment["paymentType"]) => {
    switch (type) {
      case "auto_linked":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            Auto
          </Badge>
        );
      case "manual":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Link2 className="h-3 w-3 mr-1" />
            Manual
          </Badge>
        );
      case "unlinked":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Unlink className="h-3 w-3 mr-1" />
            Unlinked
          </Badge>
        );
    }
  };

  // Calculate total for current month
  const now = new Date();
  const currentMonthPayments = payments.filter(
    (p) => p.year === now.getFullYear() && p.month === now.getMonth() + 1
  );
  const currentMonthTotal = currentMonthPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Linked Payments</CardTitle>
            {payments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {payments.length}
              </Badge>
            )}
          </div>
          <Button size="sm" onClick={onLinkTransaction}>
            <Plus className="h-4 w-4 mr-1" />
            Link Transaction
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        {payments.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This month</span>
              <span className="font-semibold">
                {formatCurrency(currentMonthTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && payments.length === 0 && (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payments linked yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {plan.autoTrackCategory
                ? "Transactions with matching category will be linked automatically"
                : "Click 'Link Transaction' to connect a payment"}
            </p>
          </div>
        )}

        {/* Payments table */}
        {!isLoading && payments.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {formatDate(payment.paymentDate)}
                    </TableCell>
                    <TableCell>
                      {payment.transaction ? (
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]">
                            {payment.transaction.description}
                          </span>
                          <a
                            href={`/transactions?id=${payment.transactionId}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="View transaction"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          {payment.notes || "No transaction linked"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setPaymentToDelete(payment)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Unlink
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <Dialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink this payment? The transaction will remain
              but won&apos;t be counted towards this expense plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentToDelete(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeletePayment}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePaymentMutation.isPending}
            >
              {deletePaymentMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Unlink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
