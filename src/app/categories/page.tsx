"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchCategories, createCategory, deleteCategory, updateCategory, bulkCategorizeByKeyword, resetCategoriesToDefaults } from "@/utils/api";
import CategoryForm from "@/app/categories/components/CategoryForm";
import CategoryList from "@/app/categories/components/CategoryList";
import { Category } from "@/utils/types";
import { Loader2, FolderIcon, PlusCircle, ListIcon, TagIcon, X, InfoIcon, RefreshCw } from "lucide-react";
import CategorizationDashboard from "./components/CategorizationDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CategoryDetail from "./components/CategoryDetail";
import { toast } from "@/hooks/use-toast";
import UncategorizedTransactionsList from "./components/UncategorizedTransactionsList";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, RefreshCcw } from "lucide-react";
import SmartTrainingDashboard from "./components/SmartTrainingDashboard";

export default function CategoriesPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCategories(token);
        setCategories(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [token]);

  const handleCategoryChange = async (category: Category, isNew: boolean) => {
    console.log("handleCategoryChange called in parent", { category, isNew });
    try {
      // The id=0 check was incorrectly treating new categories as cancel operations
      // For new categories, we need to make the API call regardless of the ID
      
      if (!isNew) {
        console.log("Updating category:", category);
        const updatedCategory = await updateCategory(token, category.id, {
          name: category.name,
          keywords: category.keywords,
          excludeFromExpenseAnalytics: category.excludeFromExpenseAnalytics,
          analyticsExclusionReason: category.analyticsExclusionReason
        });
        console.log("Update successful, received:", updatedCategory);
        setCategories((prev) => prev.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)));
      } else {
        console.log("Creating new category:", category);
        const newCategory = await createCategory(token, {
          name: category.name,
          keywords: category.keywords,
          excludeFromExpenseAnalytics: category.excludeFromExpenseAnalytics,
          analyticsExclusionReason: category.analyticsExclusionReason
        });
        console.log("Creation successful, received:", newCategory);
        setCategories((prev) => [...prev, newCategory]);
      }
      setEditingCategory(null);
      setActiveTab("list"); // Switch back to list tab after adding/editing
    } catch (err: any) {
      console.error("API error:", err);
      setError(err.message || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setLoading(true);
    try {
      await deleteCategory(token, id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setActiveTab("add"); // Switch to add/edit tab
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setActiveTab("list");
  };

  const handleBulkCategorize = async (keyword: string, categoryId: number) => {
    try {
      console.log(`Page: Bulk categorizing keyword "${keyword}" with category ID ${categoryId}`);
      const data = await bulkCategorizeByKeyword(token, keyword, categoryId);
      console.log("Bulk categorize response:", data);
      return data.count;
    } catch (err) {
      console.error("Bulk categorize error in page component:", err);
      setError(err instanceof Error ? err.message : "Failed to bulk categorize transactions");
      throw err; // Re-throw to let the calling component handle it
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm("This will reset all categories to defaults. Any custom categories will be preserved. Continue?")) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const defaultCategories = await resetCategoriesToDefaults(token);
      setCategories(defaultCategories);
      toast({
        title: "Categories Reset",
        description: "Default categories have been restored.",
        variant: "default",
      });

      const data = await fetchCategories(token);
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError("Failed to reset categories to defaults");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryUpdated = async (updatedCategory: Category) => {
    setCategories(prevCategories => 
      prevCategories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
    );
    
    if (selectedCategory && selectedCategory.id === updatedCategory.id) {
      setSelectedCategory(updatedCategory);
    }
  };
  
  const refreshCategories = async () => {
    try {
      const fetchedCategories = await fetchCategories(token);
      setCategories(fetchedCategories);
      return fetchedCategories;
    } catch (err) {
      console.error(err);
      setError("Failed to refresh categories");
      return null;
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage categories.</p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setActiveTab("add")} className="flex items-center gap-2">
            <Plus size={16} />
            Add Category
          </Button>
          <Button onClick={handleResetToDefaults} variant="outline" className="flex items-center gap-2">
            <RefreshCcw size={16} />
            Reset to Defaults
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Categories</TabsTrigger>
          <TabsTrigger value="uncategorized">Uncategorized</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6 pt-4">
          {loading ? (
            <Card className="w-full">
              <CardContent className="pt-6">
                <div className="flex justify-center py-6">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {selectedCategory ? (
                <CategoryDetail 
                  category={selectedCategory} 
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onCategoryUpdated={handleCategoryUpdated}
                />
              ) : (
                <CategoryList 
                  categories={categories} 
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                />
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="uncategorized" className="space-y-6 pt-4">
          <UncategorizedTransactionsList 
            categories={categories}
            onUpdateCategories={refreshCategories}
          />
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6 pt-4">
          <SmartTrainingDashboard 
            categories={categories}
            onUpdateCategories={refreshCategories}
          />
        </TabsContent>
      </Tabs>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}