"use client";

import { useState, useEffect } from "react";
import { Tags, Trash2, Download, ChevronDown, X, ArrowLeft, Folder, Tag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import BulkCategorizeSheet from './BulkCategorizeSheet';
import BulkTagSheet from './BulkTagSheet';
import { Category, Tag as TagType } from "@/utils/types";

interface BulkToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onBulkCategorize: (categoryId: number | null, transactionIds: string[]) => Promise<void>;
  onBulkTag: (tagId: number, transactionIds: string[]) => Promise<void>;
  onBulkUncategorize: (transactionIds: string[]) => Promise<void>;
  categories: Category[];
  tags: TagType[];
  disabled?: boolean;
}

export default function BulkToolbar({
  selectedIds,
  onClearSelection,
  onDeleteSelected,
  onBulkCategorize,
  onBulkTag,
  onBulkUncategorize,
  categories,
  tags,
  disabled = false
}: BulkToolbarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showCategorizeSheet, setShowCategorizeSheet] = useState(false);
  const [showTagSheet, setShowTagSheet] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the viewport is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Open the sheet on mobile when items are selected
  useEffect(() => {
    if (isMobile && selectedIds.length > 0) {
      setIsSheetOpen(true);
    } else {
      setIsSheetOpen(false);
    }
  }, [isMobile, selectedIds.length]);

  // If no items are selected, don't show the toolbar
  if (selectedIds.length === 0) {
    return null;
  }

  const handleBulkCategorize = async (categoryId: number | null) => {
    setIsBulkProcessing(true);
    setError(null);
    
    try {
      if (categoryId === null) {
        // Make sure selectedIds is a non-empty array
        if (!selectedIds || selectedIds.length === 0) {
          throw new Error("No transactions selected");
        }
        
        console.log("Sending transaction IDs to uncategorize:", selectedIds);
        
        const response = await fetch("/api/transactions/bulk-uncategorize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionIds: selectedIds,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error from bulk-uncategorize API:", errorData);
          throw new Error(errorData.error || "Failed to bulk uncategorize transactions");
        }
        
        await onBulkUncategorize(selectedIds);
      } else {
        const response = await fetch("/api/transactions/bulk-categorize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionIds: selectedIds,
            categoryId,
          }),
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error from bulk-categorize API:", errorData);
          throw new Error(errorData.error || "Failed to bulk categorize transactions");
        }
    
        await onBulkCategorize(categoryId, selectedIds);
      }
      
      setShowCategorizeSheet(false);
    } catch (error: any) {
      console.error(`Error during bulk ${categoryId === null ? 'uncategorization' : 'categorization'}:`, error);
      setError(`Failed to bulk ${categoryId === null ? 'uncategorize' : 'categorize'} transactions: ${error.message || 'Unknown error'}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };
  
  const handleBulkTag = async (tagIds: number[]) => {
    if (tagIds.length === 0) return;
    
    setIsBulkProcessing(true);
    
    try {
      const response = await fetch("/api/transactions/bulk-tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionIds: selectedIds,
          tagIds,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to bulk tag transactions");
      }
  
      // Process each tag one by one
      for (const tagId of tagIds) {
        await onBulkTag(tagId, selectedIds);
      }
      
      setShowTagSheet(false);
    } catch (error) {
      console.error("Error during bulk tagging:", error);
      setError("Failed to bulk tag transactions");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Mobile version (bottom sheet)
  if (isMobile) {
    return (
      <>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="bottom" className="h-auto px-4 py-6">
            <SheetHeader className="flex flex-row items-center justify-between px-2">
              <SheetTitle className="text-left">
                {selectedIds.length} {selectedIds.length === 1 ? 'transaction' : 'transactions'} selected
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearSelection}
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 py-6">
              <Button 
                onClick={() => setShowCategorizeSheet(true)}
                className="w-full"
                disabled={disabled}
              >
                <Folder className="mr-2 h-4 w-4" />
                Categorize
              </Button>
              <Button 
                onClick={() => setShowTagSheet(true)}
                variant="outline"
                className="w-full"
                disabled={disabled}
              >
                <Tag className="mr-2 h-4 w-4" />
                Tag
              </Button>
              <Button 
                onClick={onDeleteSelected}
                variant="destructive"
                className="w-full"
                disabled={disabled}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
            <SheetFooter>
              <Button 
                onClick={onClearSelection}
                variant="ghost"
                className="w-full"
              >
                Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Use BulkCategorizeSheet directly without wrapping it in another Sheet */}
        <BulkCategorizeSheet
          open={showCategorizeSheet}
          onOpenChange={setShowCategorizeSheet}
          categories={categories}
          transactionCount={selectedIds.length}
          onSubmit={handleBulkCategorize}
        />

        {/* Use BulkTagSheet directly without wrapping it in another Sheet */}
        <BulkTagSheet
          open={showTagSheet}
          onOpenChange={setShowTagSheet}
          tags={tags}
          transactionCount={selectedIds.length}
          onSubmit={handleBulkTag}
        />
      </>
    );
  }

  // Desktop version (toolbar)
  return (
    <>
      <div className="bg-background border-b py-2 px-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {selectedIds.length} {selectedIds.length === 1 ? 'transaction' : 'transactions'} selected
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            title="Clear selection"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowCategorizeSheet(true)}
            size="sm"
            disabled={disabled}
          >
            <Folder className="mr-2 h-4 w-4" />
            Categorize
          </Button>
          <Button 
            onClick={() => setShowTagSheet(true)}
            size="sm"
            disabled={disabled}
          >
            <Tag className="mr-2 h-4 w-4" />
            Tag
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="pl-3 pr-2"
                disabled={disabled}
              >
                More <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={onDeleteSelected}
                disabled={disabled}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* These sheets are shared between mobile and desktop views */}
      <BulkCategorizeSheet
        open={showCategorizeSheet}
        onOpenChange={setShowCategorizeSheet}
        categories={categories}
        transactionCount={selectedIds.length}
        onSubmit={handleBulkCategorize}
      />

      <BulkTagSheet
        open={showTagSheet}
        onOpenChange={setShowTagSheet}
        tags={tags}
        transactionCount={selectedIds.length}
        onSubmit={handleBulkTag}
      />
    </>
  );
} 