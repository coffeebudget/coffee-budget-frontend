"use client";

import { Category } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CategoryListProps = {
  categories: Category[];
  onDeleteCategory: (id: number) => void;
  onEditCategory: (category: Category) => void;
};

export default function CategoryList({ categories, onDeleteCategory, onEditCategory }: CategoryListProps) {
  return (
    <Card className="w-full max-w-2xl mt-8">
      <CardHeader>
        <CardTitle>Your Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No categories found. Create your first category above.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li key={category.id} className="py-4">
                <div className="flex items-center justify-between">
                  {/* Category Name */}
                  <div className="w-1/4">
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                  </div>
                  
                  {/* Keywords */}
                  <div className="w-1/2 flex items-center">
                    {category.keywords && category.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {category.keywords.map((keyword, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No keywords</span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditCategory(category)}
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
                          onDeleteCategory(category.id);
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