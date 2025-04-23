"use client";

import { useState, useEffect } from "react";
import { Tags, Trash2, Download, ChevronDown, X } from "lucide-react";
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
} from "@/components/ui/sheet";

interface BulkToolbarProps {
  selectedIds: number[];
  onCategorize: (ids: number[]) => void;
  onTag: (ids: number[]) => void;
  onDelete: (ids: number[]) => Promise<void>;
  onExport?: (ids: number[]) => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
}

export default function BulkToolbar({
  selectedIds,
  onCategorize,
  onTag,
  onDelete,
  onExport,
  onClearSelection,
  isDeleting = false,
}: BulkToolbarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  // Mobile version (bottom sheet)
  if (isMobile) {
    return (
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
              onClick={() => onCategorize(selectedIds)}
              className="w-full"
            >
              <Tags className="mr-2 h-4 w-4" />
              Categorize
            </Button>
            <Button 
              onClick={() => onTag(selectedIds)}
              variant="outline"
              className="w-full"
            >
              <Tags className="mr-2 h-4 w-4" />
              Add Tags
            </Button>
            <Button 
              onClick={() => onExport?.(selectedIds)}
              variant="outline"
              className="w-full"
              disabled={!onExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              onClick={() => onDelete(selectedIds)}
              variant="destructive"
              className="w-full"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
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
    );
  }

  // Desktop version (toolbar)
  return (
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
          onClick={() => onCategorize(selectedIds)}
          size="sm"
        >
          <Tags className="mr-2 h-4 w-4" />
          Categorize
        </Button>
        <Button 
          onClick={() => onTag(selectedIds)}
          variant="outline"
          size="sm"
        >
          <Tags className="mr-2 h-4 w-4" />
          Add Tags
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="pl-3 pr-2"
            >
              More <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onExport?.(selectedIds)}
              disabled={!onExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(selectedIds)}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 