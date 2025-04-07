"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { Category } from "@/utils/types";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export default function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  // Ensure categories is always an array
  const categoryArray = Array.isArray(categories) ? categories : [];
  
  return (
    <Card className="w-full">
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
                  <div className="flex-1">
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
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(category)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => {
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
  );
}