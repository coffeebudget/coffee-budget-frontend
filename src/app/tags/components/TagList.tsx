"use client";

import { useState } from "react";
import { Tag } from "@/utils/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TagListProps {
  tags: Tag[];
  onDeleteTag: (id: number) => void;
  onUpdateTag: (id: number, name: string) => void;
  onEditTag: (tag: Tag) => void;
}

export default function TagList({ tags, onDeleteTag, onUpdateTag, onEditTag }: TagListProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = (id: number) => {
    if (confirmDelete === id) {
      handleDelete(id);
    } else {
      setConfirmDelete(id);
    }
  };

  const handleDelete = async (id: number) => {
    setLoadingId(id);
    setError(null);
    try {
      await onDeleteTag(id);
      setConfirmDelete(null);
    } catch (err) {
      setError("Error deleting tag");
    } finally {
      setLoadingId(null);
    }
  };

  if (tags.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Tags</h3>
            <p className="text-gray-500 mb-4">You haven't added any tags yet.</p>
            <p className="text-sm text-gray-500">
              Click "Add Tag" to create your first tag.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">
                    {tag.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEditTag(tag)} 
                        disabled={loadingId === tag.id}
                        title="Edit Tag"
                      >
                        {loadingId === tag.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant={confirmDelete === tag.id ? "destructive" : "ghost"} 
                        size="icon" 
                        onClick={() => handleDeleteClick(tag.id)}
                        disabled={loadingId === tag.id}
                        title={confirmDelete === tag.id ? "Confirm Delete" : "Delete Tag"}
                      >
                        {loadingId === tag.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
