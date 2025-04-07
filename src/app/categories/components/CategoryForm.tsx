"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Save } from "lucide-react";
import { Category } from "@/utils/types";
import { addKeywordToCategory, removeKeywordFromCategory } from "@/utils/api";
import KeywordSuggestions from "./KeywordSuggestions";

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
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);

  // Initialize form with category data if editing
  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || "");
      setKeywords(categoryToEdit.keywords || []);
    } else {
      // Reset form for new category
      setName("");
      setKeywords([]);
    }
  }, [categoryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const categoryData: Category = {
        id: categoryToEdit?.id || 0,
        name,
        keywords,
      };

      await onCategoryChange(categoryData, !categoryToEdit);
      
      if (!categoryToEdit) {
        // Reset form after creating a new category
        setName("");
        setKeywords([]);
        setNewKeyword("");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save category");
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
    
    setKeywords([...keywords, newKeyword.trim()]);
    setNewKeyword("");
    setError(null);
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

  const handleAddExternalKeyword = async (keyword: string) => {
    if (!categoryToEdit?.id) {
      // For new categories, just add to state
      if (!keywords.includes(keyword.trim())) {
        setKeywords([...keywords, keyword.trim()]);
        setNewKeyword("");
      }
      return;
    }
    
    // For existing categories, call API
    setAddingKeyword(keyword);
    setError(null);
    
    try {
      await addKeywordToCategory(token, categoryToEdit.id, keyword);
      
      // Only add if not already in the list
      if (!keywords.includes(keyword)) {
        const updatedKeywords = [...keywords, keyword];
        setKeywords(updatedKeywords);
        
        // Update the category in parent component
        const updatedCategory = {
          ...categoryToEdit,
          keywords: updatedKeywords
        };
        await onCategoryChange(updatedCategory, false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to add keyword");
    } finally {
      setAddingKeyword(null);
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    e.preventDefault();
                    if (categoryToEdit) {
                      handleAddExternalKeyword(newKeyword);
                    } else {
                      handleAddKeyword();
                    }
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={() => {
                  if (categoryToEdit) {
                    handleAddExternalKeyword(newKeyword);
                  } else {
                    handleAddKeyword();
                  }
                }}
                variant="outline"
                disabled={!newKeyword.trim() || Boolean(categoryToEdit && addingKeyword === newKeyword)}
              >
                {categoryToEdit && addingKeyword === newKeyword ? (
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
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
        
        {/* Show keyword suggestions only when editing an existing category */}
        {categoryToEdit && (
          <div className="mt-6">
            <KeywordSuggestions 
              category={categoryToEdit} 
              onKeywordAdded={(updatedCategory) => {
                setKeywords(updatedCategory.keywords || []);
                onCategoryChange(updatedCategory, false);
              }} 
            />
          </div>
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
          onClick={handleSubmit}
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