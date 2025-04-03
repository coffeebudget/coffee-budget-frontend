"use client";

import { useState, useEffect } from 'react';
import { Category } from '@/utils/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import KeywordInput from '@/components/KeywordInput';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

type Props = {
  categoryToEdit?: Category | null;
  onCategoryChange: (category: Category) => Promise<void>;
};

export default function CategoryForm({ categoryToEdit, onCategoryChange }: Props) {
  const isEditing = !!categoryToEdit;

  const [formData, setFormData] = useState({
    name: categoryToEdit?.name || '',
    keywords: categoryToEdit?.keywords || [],
  });

  // Update form data when categoryToEdit changes
  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        name: categoryToEdit.name || '',
        keywords: categoryToEdit.keywords || [],
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: '',
        keywords: [],
      });
    }
  }, [categoryToEdit]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the callback function instead of direct API calls
      await onCategoryChange(formData as Category);
      
      // Reset form after successful submission
      if (!isEditing) {
        setFormData({
          name: '',
          keywords: [],
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Category' : 'Create Category'}</CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update your category details below.' 
              : 'Fill in the details to create a new category.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="keywords">Keywords</Label>
            <KeywordInput
              keywords={formData.keywords}
              onChange={(keywords) => handleChange('keywords', keywords)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Keywords help automatically categorize transactions based on their description.
            </p>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {isEditing && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                // Reset form and exit editing mode
                setFormData({
                  name: '',
                  keywords: [],
                });
                // Notify parent component to clear editing state
                onCategoryChange({ name: '', keywords: [], id: 0 } as unknown as Category);
              }}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading || isSubmitting}
            className={isEditing ? "" : "ml-auto"}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}