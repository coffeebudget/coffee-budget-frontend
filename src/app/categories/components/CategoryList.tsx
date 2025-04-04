"use client";

import { Category } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CategoryDetail from "./CategoryDetail";
import { useState } from "react";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export default function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  // Add state for the selected category and dialog
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Ensure categories is always an array
  const categoryArray = Array.isArray(categories) ? categories : [];
  
  return (
    <>
      <Card className="w-full max-w-2xl mt-8">
        <CardHeader>
          <CardTitle>Your Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryArray.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No categories found. Add your first category using the form.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {categoryArray.map((category) => (
                <li key={category.id} className="py-4">
                  <div className="flex items-center justify-between">
                    {/* Make the category name clickable */}
                    <div 
                      className="flex-1 cursor-pointer hover:text-blue-600"
                      onClick={() => {
                        setSelectedCategory(category);
                        setDetailsOpen(true);
                      }}
                    >
                      <h3 className="text-lg font-medium">{category.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {category.keywords?.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {(!category.keywords || category.keywords.length === 0) && (
                          <span className="text-xs text-gray-500 italic">No keywords</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Buttons remain the same */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(category);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this category?")) {
                            onDelete(category.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {/* Category Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedCategory && (
            <CategoryDetail 
              category={selectedCategory}
              onEditCategory={(category) => {
                setDetailsOpen(false);
                onEdit(category);
              }}
              onDeleteCategory={(id) => {
                setDetailsOpen(false);
                onDelete(id);
              }}
              onCategoryUpdated={(updatedCategory) => {
                // Update the category in the list
                const updatedCategories = categoryArray.map(c => 
                  c.id === updatedCategory.id ? updatedCategory : c
                );
                // This assumes you have a way to update the parent's state
                // You might need to add an onCategoriesUpdate prop
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}