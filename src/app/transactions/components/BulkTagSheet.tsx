"use client";

import { useState } from "react";
import { Tag } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface BulkTagSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  transactionCount: number;
  onSubmit: (tagIds: number[]) => Promise<void>;
}

export default function BulkTagSheet({
  open,
  onOpenChange,
  tags,
  transactionCount,
  onSubmit,
}: BulkTagSheetProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tags based on search term
  const filteredTags = tags.filter(
    (tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds((prev) => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (selectedTagIds.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedTagIds);
      onOpenChange(false);
      setSelectedTagIds([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Error tagging transactions:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Tags</SheetTitle>
          <SheetDescription>
            Select tags for {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex w-full items-center space-x-2 my-4">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="py-4 h-[60vh] overflow-y-auto pr-2">
          {filteredTags.length > 0 ? (
            <div className="space-y-3">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handleTagToggle(tag.id)}
                >
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTagIds.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <Label
                    htmlFor={`tag-${tag.id}`}
                    className="flex-grow cursor-pointer"
                  >
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No tags found. Try a different search term.
            </div>
          )}
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
            disabled={selectedTagIds.length === 0 || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Adding Tags..." : "Add Tags"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 