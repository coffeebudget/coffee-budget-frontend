"use client";

import { useState } from "react";
import { Category } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, Tag, XCircle } from "lucide-react";
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
  onSubmit: (categoryId: number | null) => Promise<void>;
}

export default function BulkCategorizeSheet({
  open,
  onOpenChange,
  categories,
  transactionCount,
  onSubmit,
}: BulkCategorizeSheetProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isUncategorize, setIsUncategorize] = useState(false);
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
    setIsSubmitting(true);
    try {
      await onSubmit(isUncategorize ? null : selectedCategoryId);
      onOpenChange(false);
      setSelectedCategoryId(null);
      setIsUncategorize(false);
      setSearchTerm("");
    } catch (error) {
      console.error(`Error ${isUncategorize ? 'uncategorizing' : 'categorizing'} transactions:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionSelect = (value: string) => {
    if (value === 'uncategorize') {
      setIsUncategorize(true);
      setSelectedCategoryId(null);
    } else {
      setIsUncategorize(false);
      setSelectedCategoryId(Number(value));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Manage Transaction Categories</SheetTitle>
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
            value={isUncategorize ? 'uncategorize' : (selectedCategoryId?.toString() || "")}
            onValueChange={handleOptionSelect}
          >
            {/* Uncategorize option */}
            <div
              className="flex items-center space-x-2 mb-3 p-2 rounded-md hover:bg-muted cursor-pointer bg-muted-foreground/10"
              onClick={() => handleOptionSelect('uncategorize')}
            >
              <RadioGroupItem value="uncategorize" id="uncategorize" />
              <Label htmlFor="uncategorize" className="flex items-center space-x-2 cursor-pointer">
                <XCircle className="h-4 w-4 text-destructive" />
                <div className="font-medium">Remove Category</div>
              </Label>
            </div>
            
            <div className="h-px bg-border my-4"></div>
            
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2 mb-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handleOptionSelect(category.id.toString())}
                >
                  <RadioGroupItem value={category.id.toString()} id={`category-${category.id}`} />
                  <Label htmlFor={`category-${category.id}`} className="flex items-center space-x-2 cursor-pointer">
                    <Tag className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.keywords && category.keywords.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Keywords: {category.keywords.join(", ")}
                        </div>
                      )}
                    </div>
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
            disabled={(!selectedCategoryId && !isUncategorize) || isSubmitting}
            className={`w-full sm:w-auto ${isUncategorize ? 'bg-destructive hover:bg-destructive/90' : ''}`}
          >
            {isSubmitting 
              ? (isUncategorize ? "Removing..." : "Categorizing...") 
              : (isUncategorize ? "Remove Category" : "Categorize")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 