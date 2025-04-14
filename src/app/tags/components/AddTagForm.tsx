"use client";

import { useEffect, useState } from "react";
import { createTag } from "@/utils/api";
import { useSession } from "next-auth/react";
import { Tag } from "@/utils/types";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

type AddTagFormProps = {
  onTagAdded: (tag: Tag) => void;
  initialTag?: Tag | null;
  onUpdateTag?: (id: number, name: string) => void;
  onCancel?: () => void;
};

export default function AddTagForm({ onTagAdded, initialTag = null, onUpdateTag, onCancel }: AddTagFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [tagName, setTagName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTag) {
      setTagName(initialTag.name);
    } else {
      setTagName("");
    }
  }, [initialTag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName) {
      setError("Tag name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (initialTag && onUpdateTag) {
        // Edit mode
        await onUpdateTag(initialTag.id, tagName);
      } else {
        // Create mode
        const newTag = { name: tagName };
        const createdTag = await createTag(token, newTag);
        await onTagAdded(createdTag);
        setTagName("");
      }
    } catch (err) {
      setError(initialTag ? "Error updating tag" : "Error adding tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>
          {initialTag ? "Edit Tag" : "Add New Tag"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <form id="tag-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tagName">Tag Name</Label>
            <Input
              id="tagName"
              placeholder="Enter tag name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              required
            />
          </div>
          
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </form>
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
          form="tag-form"
          disabled={loading || !tagName.trim()}
          className={onCancel ? "ml-auto" : "w-full"}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {initialTag ? "Update Tag" : "Add Tag"}
        </Button>
      </CardFooter>
    </>
  );
}
