"use client";

import { useState } from "react";
import { Category } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface BulkCategorizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transactionCount: number;
  onSubmit: (categoryId: number) => Promise<void>;
}

export default function BulkCategorizeSheet({
  open,
  onOpenChange,
  categories,
  transactionCount,
  onSubmit,
}: BulkCategorizeSheetProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter categories based on search term
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.keywords && category.keywords.some(keyword => 
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      ))
  );

  const handleSubmit = async () => {
    if (!selectedCategoryId) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedCategoryId);
      onOpenChange(false);
      setSelectedCategoryId(null);
      setSearchTerm("");
    } catch (error) {
      console.error("Error categorizing transactions:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Categorize Transactions</SheetTitle>
          <SheetDescription>
            Select a category for {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex w-full items-center space-x-2 my-4">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="py-4 h-[60vh] overflow-y-auto pr-2">
          <RadioGroup 
            value={selectedCategoryId?.toString() || ""}
            onValueChange={(value: string) => setSelectedCategoryId(Number(value))}
          >
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2 mb-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <RadioGroupItem value={category.id.toString()} id={`category-${category.id}`} />
                  <Label htmlFor={`category-${category.id}`} className="flex-grow cursor-pointer">
                    <div className="font-medium">{category.name}</div>
                    {category.keywords && category.keywords.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Keywords: {category.keywords.join(", ")}
                      </div>
                    )}
                  </Label>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No categories found. Try a different search term.
              </div>
            )}
          </RadioGroup>
        </div>
        
        <SheetFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCategoryId || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Categorizing..." : "Categorize"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 