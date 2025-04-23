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
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";

export default function CategoriesPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
    if (!token) return;
    
    setIsDeleting(true);
    try {
      await deleteCategory(token, id);
      
      // Find the category that was deleted to show its name in the toast
      const deletedCategory = categories.find(c => c.id === id);
      const categoryName = deletedCategory ? deletedCategory.name : 'Category';
      
      // Remove the category from state
      setCategories(prevCategories => prevCategories.filter(category => category.id !== id));
      showSuccessToast(`${categoryName} has been deleted successfully`);
    } catch (error) {
      console.error("Error deleting category:", error);
      showErrorToast("Failed to delete category");
    } finally {
      setIsDeleting(false);
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
    if (!token) return;
    setIsResetting(true);
    try {
      const resetCategories = await resetCategoriesToDefaults(token);
      setCategories(resetCategories);
      showSuccessToast("Categories have been reset to defaults");
    } catch (error) {
      console.error("Error resetting categories:", error);
      showErrorToast("Failed to reset categories to defaults");
    } finally {
      setIsResetting(false);
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
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FolderIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Create and manage categories to organize your transactions and track your spending patterns.
        </p>
      </div>
      
      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <ListIcon className="h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                {editingCategory ? "Edit Category" : "Add Category"}
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-1">
                <TagIcon className="h-4 w-4" />
                Categorization Dashboard
              </TabsTrigger>
            </TabsList>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetToDefaults}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            
            {editingCategory && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Cancel Edit
              </Button>
            )}
          </div>
          
          <TabsContent value="list" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading categories...</span>
              </div>
            ) : (
              <CategoryList
                categories={categories}
                onDelete={handleDeleteCategory}
                onEdit={handleEditCategory}
              />
            )}
          </TabsContent>
          
          <TabsContent value="add" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <CategoryForm 
                onCategoryChange={handleCategoryChange} 
                categoryToEdit={editingCategory}
                onCancel={handleCancelEdit} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="dashboard" className="mt-0">
            <CategorizationDashboard 
              categories={categories}
              onCategorize={handleBulkCategorize}
            />
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}