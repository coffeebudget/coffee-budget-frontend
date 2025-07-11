"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Save, HelpCircle } from "lucide-react";
import { Category } from "@/utils/types";
import { 
  removeKeywordFromCategory, 
  previewKeywordImpact,
  applyKeywordToCategory
} from "@/utils/api";
import KeywordSuggestions from "./KeywordSuggestions";
import KeywordImpactPreview from "./KeywordImpactPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";

interface KeywordImpact {
  totalImpactedCount: number;
  uncategorizedCount: number;
  categorizedCount: number;
  affectedCategories: Array<{
    id: number;
    name: string;
    count: number;
  }>;
  sampleTransactions: Array<{
    id: number;
    description: string;
    amount: number;
    executionDate: string;
    category?: { name: string };
  }>;
}

interface CategoryCount {
  id?: number;
  categoryId?: number;
  name?: string;
  count?: number;
}

interface CategoryFormProps {
  onCategoryChange: (category: Category, isNew: boolean) => Promise<void>;
  categoryToEdit?: Category | null;
  onCancel?: () => void;
}

export default function CategoryForm({
  onCategoryChange,
  categoryToEdit,
  onCancel,
}: CategoryFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [name, setName] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingKeyword, setRemovingKeyword] = useState<string | null>(null);

  const [excludeFromExpenseAnalytics, setExcludeFromExpenseAnalytics] = useState(false);
  const [analyticsExclusionReason, setAnalyticsExclusionReason] = useState("");
  
  // New state for keyword impact preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewKeyword, setPreviewKeyword] = useState("");
  const [keywordImpact, setKeywordImpact] = useState<KeywordImpact | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Initialize form with category data if editing
  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || "");
      setKeywords(categoryToEdit.keywords || []);
      setExcludeFromExpenseAnalytics(categoryToEdit.excludeFromExpenseAnalytics || false);
      setAnalyticsExclusionReason(categoryToEdit.analyticsExclusionReason || "");
    } else {
      // Reset form for new category
      setName("");
      setKeywords([]);
      setExcludeFromExpenseAnalytics(false);
      setAnalyticsExclusionReason("");
    }
  }, [categoryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate inputs
    if (!name.trim()) {
      setError("Category name is required");
      setLoading(false);
      showErrorToast("Category name is required");
      return;
    }

    try {
      const categoryData: Category = {
        id: categoryToEdit?.id || 0,
        name,
        keywords: keywords.map(k => k.trim()).filter(Boolean),
        excludeFromExpenseAnalytics,
        analyticsExclusionReason: excludeFromExpenseAnalytics ? analyticsExclusionReason : undefined
      };

      console.log("Calling onCategoryChange with", categoryData, !categoryToEdit);
      await onCategoryChange(categoryData, !categoryToEdit);
      console.log("onCategoryChange completed successfully");
      
      if (!categoryToEdit) {
        // Reset form after creating a new category
        setName("");
        setKeywords([]);
        setNewKeyword("");
        setExcludeFromExpenseAnalytics(false);
        setAnalyticsExclusionReason("");
        showSuccessToast(`Category "${name}" has been created successfully`);
      } else {
        showSuccessToast(`Category "${name}" has been updated successfully`);
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred while saving the category";
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    // Don't add duplicate keywords
    if (keywords.includes(newKeyword.trim())) {
      setError("This keyword already exists");
      return;
    }
    
    if (categoryToEdit?.id) {
      // For existing categories, show impact preview
      setPreviewKeyword(newKeyword.trim());
      loadKeywordImpact(newKeyword.trim());
    } else {
      // For new categories, just add to state
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
      setError(null);
    }
  };

  const loadKeywordImpact = async (keyword: string) => {
    if (!categoryToEdit?.id || !token) return;
    
    setLoadingPreview(true);
    setError(null);
    setKeywordImpact(null); // Reset the keywordImpact first
    
    try {
      const impact = await previewKeywordImpact(token, categoryToEdit.id, keyword, false);
      console.log("Keyword impact data received:", impact);
      
      // Map backend response to our expected structure
      const totalImpactedCount = impact?.totalAffected || 0;
      
      // Handle various possible structures for categoryCounts
      let uncategorizedCount = 0;
      let affectedCategories = [];
      
      if (impact?.categoryCounts) {
        // If categoryCounts is an object with category IDs as keys
        if (typeof impact.categoryCounts === 'object' && !Array.isArray(impact.categoryCounts)) {
          // Check for null key (uncategorized) or category with name "Uncategorized"
          Object.entries(impact.categoryCounts).forEach(([key, value]) => {
            const categoryCount = value as CategoryCount;
            if (key === 'null' || key === 'undefined' || categoryCount?.name === 'Uncategorized') {
              uncategorizedCount = categoryCount.count || 0;
            } else if (key !== 'null' && key !== 'undefined') {
              affectedCategories.push({
                id: parseInt(key),
                name: categoryCount.name || `Category ${key}`,
                count: categoryCount.count || 0
              });
            }
          });
        } 
        // If categoryCounts is an array
        else if (Array.isArray(impact.categoryCounts)) {
          const uncatItem = impact.categoryCounts.find(
            (c: CategoryCount) => c.name === 'Uncategorized' || c.id === null || c.categoryId === null
          );
          uncategorizedCount = uncatItem?.count || 0;
          
          affectedCategories = impact.categoryCounts
            .filter((c: CategoryCount) => c.id !== null && c.name !== 'Uncategorized')
            .map((c: CategoryCount) => ({
              id: c.id || c.categoryId,
              name: c.name || `Category ${c.id || c.categoryId}`,
              count: c.count || 0
            }));
        }
      }
      
      // Calculate categorized count
      const categorizedCount = totalImpactedCount - uncategorizedCount;
      
      // Ensure impact has the expected structure
      const safeImpact = {
        totalImpactedCount: totalImpactedCount,
        uncategorizedCount: uncategorizedCount,
        categorizedCount: categorizedCount,
        affectedCategories: affectedCategories,
        sampleTransactions: impact?.sampleTransactions || []
      };
      
      setKeywordImpact(safeImpact);
      setShowPreview(true);
    } catch (err) {
      console.error("Error loading keyword impact:", err);
      setError("Failed to load keyword impact");
      // Fall back to direct add if preview fails
      setKeywords([...keywords, keyword.trim()]);
      setNewKeyword("");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApplyKeyword = async (applyTo: "none" | "uncategorized" | "all" | number[]) => {
    if (!categoryToEdit?.id || !token || !previewKeyword) return;
    
    try {
      await applyKeywordToCategory(token, categoryToEdit.id, previewKeyword, applyTo);
      
      // Add keyword to local state
      if (!keywords.includes(previewKeyword)) {
        const updatedKeywords = [...keywords, previewKeyword];
        setKeywords(updatedKeywords);
        
        // Update the category in parent component
        const updatedCategory = {
          ...categoryToEdit,
          keywords: updatedKeywords
        };
        await onCategoryChange(updatedCategory, false);
      }
      
      setNewKeyword("");
      setShowPreview(false);
      setPreviewKeyword("");
      setKeywordImpact(null);
    } catch (err) {
      console.error(err);
      setError("Failed to apply keyword changes");
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewKeyword("");
    setKeywordImpact(null);
  };

  const handleRemoveKeyword = async (keyword: string) => {
    if (!categoryToEdit?.id) {
      // For new categories, just remove from state
      setKeywords(keywords.filter(k => k !== keyword));
      return;
    }
    
    // For existing categories, call API
    setRemovingKeyword(keyword);
    setError(null);
    
    try {
      await removeKeywordFromCategory(token, categoryToEdit.id, keyword);
      setKeywords(keywords.filter(k => k !== keyword));
      
      // Update the category in parent component
      if (categoryToEdit) {
        const updatedCategory = {
          ...categoryToEdit,
          keywords: keywords.filter(k => k !== keyword)
        };
        await onCategoryChange(updatedCategory, false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to remove keyword");
    } finally {
      setRemovingKeyword(null);
    }
  };



  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {categoryToEdit ? `Edit Category: ${categoryToEdit.name}` : "Add New Category"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Groceries, Utilities, Entertainment"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keywords to auto-categorize transactions"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    handleAddKeyword();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={handleAddKeyword}
                variant="outline"
                disabled={!newKeyword.trim() || loadingPreview}
              >
                {loadingPreview ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {keyword}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 ml-1"
                    onClick={() => handleRemoveKeyword(keyword)}
                    disabled={removingKeyword === keyword}
                  >
                    {removingKeyword === keyword ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="exclude-analytics" 
                  checked={excludeFromExpenseAnalytics}
                  onCheckedChange={(checked) => setExcludeFromExpenseAnalytics(checked === true)}
                />
                <div className="flex items-center gap-1">
                  <Label htmlFor="exclude-analytics">Exclude from expense analytics</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Info</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>When checked, transactions in this category will not be included in expense analytics and reports.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </TooltipProvider>
          </div>
          
          {excludeFromExpenseAnalytics && (
            <div className="space-y-2">
              <Label htmlFor="exclusion-reason">Reason for exclusion (optional)</Label>
              <Input
                id="exclusion-reason"
                value={analyticsExclusionReason}
                onChange={(e) => setAnalyticsExclusionReason(e.target.value)}
                placeholder="e.g., Personal transfers, not actual expenses"
              />
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
        
        {/* Show keyword suggestions only when editing an existing category */}
        {categoryToEdit && (
          <div className="mt-6">
            <KeywordSuggestions 
              category={categoryToEdit} 
              onKeywordSelected={(keyword) => {
                // Set the keyword for preview
                setPreviewKeyword(keyword);
                // Load the impact for preview
                loadKeywordImpact(keyword);
              }} 
            />
          </div>
        )}
        
        {/* Keyword impact preview dialog */}
        {categoryToEdit && (
          <KeywordImpactPreview
            isOpen={showPreview}
            onClose={handleClosePreview}
            keyword={previewKeyword}
            categoryName={categoryToEdit.name || ""}
            keywordImpact={keywordImpact}
            isLoading={loadingPreview}
            onApply={handleApplyKeyword}
          />
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit"
          form="category-form"
          disabled={loading || !name.trim()}
          className="ml-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {categoryToEdit ? "Update Category" : "Create Category"}
        </Button>
      </CardFooter>
    </Card>
  );
}