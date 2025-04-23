import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type ImpactCategory = {
  id: number;
  name: string;
  count: number;
};

type KeywordImpact = {
  totalImpactedCount: number;
  uncategorizedCount: number;
  categorizedCount: number;
  affectedCategories: ImpactCategory[];
  sampleTransactions: any[];
};

type ApplyOption = "none" | "uncategorized" | "all" | number[];

interface KeywordImpactPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: string;
  categoryName: string;
  categoryId: number;
  keywordImpact: KeywordImpact | null;
  isLoading: boolean;
  onApply: (option: ApplyOption) => Promise<void>;
}

export default function KeywordImpactPreview({
  isOpen,
  onClose,
  keyword,
  categoryName,
  categoryId,
  keywordImpact,
  isLoading,
  onApply,
}: KeywordImpactPreviewProps) {
  const [selectedOption, setSelectedOption] = useState<ApplyOption>("none");
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(selectedOption);
      onClose();
    } catch (error) {
      console.error("Error applying keyword:", error);
    } finally {
      setIsApplying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('it-IT', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(dateString));
  };

  const hasSampleTransactions = keywordImpact?.sampleTransactions && 
    keywordImpact.sampleTransactions.length > 0;

  const effectiveImpactCount = 
    (keywordImpact?.totalImpactedCount || 0) > 0 
      ? keywordImpact?.totalImpactedCount 
      : (hasSampleTransactions ? keywordImpact?.sampleTransactions?.length : 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Impact of adding "{keyword}" to {categoryName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : keywordImpact ? (
          <>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  This keyword will affect <strong>
                    {effectiveImpactCount}
                  </strong> transactions
                  {(keywordImpact.uncategorizedCount || 0) > 0 && ` (${keywordImpact.uncategorizedCount} uncategorized)`}.
                </p>
              </div>

              {keywordImpact.affectedCategories && 
                keywordImpact.affectedCategories
                  .filter(cat => 
                    cat.name !== "Uncategorized" && 
                    !cat.name.includes("Category Uncategorized") && 
                    cat.count > 0
                  ).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Current categories of affected transactions:</p>
                  <div className="flex flex-wrap gap-2">
                    {keywordImpact.affectedCategories
                      .filter(cat => 
                        cat.name !== "Uncategorized" && 
                        !cat.name.includes("Category Uncategorized") && 
                        cat.count > 0
                      )
                      .map((category) => (
                        <Badge key={category.id} variant="outline">
                          {category.name} <span className="font-semibold ml-1">({category.count} transactions)</span>
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              )}

              {keywordImpact.sampleTransactions && keywordImpact.sampleTransactions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Sample transactions that will be affected:</p>
                  <ScrollArea className="h-[200px] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Current Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keywordImpact.sampleTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.executionDate)}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={transaction.description}>
                              {transaction.description}
                            </TableCell>
                            <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                            <TableCell>
                              {transaction.category ? transaction.category.name : "Uncategorized"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium">What transactions would you like to recategorize?</p>
                <RadioGroup
                  value={selectedOption as string}
                  onValueChange={(value: string) => {
                    if (value === "uncategorized" || value === "all" || value === "none") {
                      setSelectedOption(value);
                    } else {
                      setSelectedOption(JSON.parse(value));
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">Add keyword only, don't recategorize any transactions</Label>
                  </div>
                  
                  {(keywordImpact.uncategorizedCount || 0) > 0 && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="uncategorized" id="uncategorized" />
                      <Label htmlFor="uncategorized">
                        Recategorize only uncategorized transactions ({keywordImpact.uncategorizedCount})
                      </Label>
                    </div>
                  )}
                  
                  {(effectiveImpactCount || 0) > 0 && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">
                        Recategorize all matching transactions ({effectiveImpactCount})
                      </Label>
                    </div>
                  )}
                  
                  {keywordImpact.affectedCategories && 
                    keywordImpact.affectedCategories
                      .filter(cat => 
                        cat.name !== "Uncategorized" && 
                        !cat.name.includes("Category Uncategorized") && 
                        cat.count > 0
                      ).length > 0 && (
                    <div className="pl-6 space-y-2">
                      <p className="text-sm text-muted-foreground">Select which transactions to move by current category:</p>
                      {keywordImpact.affectedCategories
                        .filter(cat => 
                          cat.name !== "Uncategorized" && 
                          !cat.name.includes("Category Uncategorized") && 
                          cat.count > 0
                        )
                        .map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={JSON.stringify([category.id])} 
                              id={`category-${category.id}`} 
                            />
                            <Label htmlFor={`category-${category.id}`}>
                              Move {category.count} transactions from "{category.name}"
                            </Label>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </RadioGroup>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <p>No impact data available</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isApplying || selectedOption === "none" || isLoading || !keywordImpact}
          >
            {isApplying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {selectedOption === "none" ? "Skip Recategorization" : "Apply Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 