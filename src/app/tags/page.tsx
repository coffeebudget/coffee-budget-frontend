"use client";

import { useEffect, useState } from "react";
import { fetchTags, createTag, deleteTag, updateTag } from "@/utils/api";
import { useSession } from "next-auth/react";
import AddTagForm from "./components/AddTagForm";
import TagList from "./components/TagList";
import { Tag } from "@/utils/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, TagIcon, PlusCircle, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

export default function TagsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTab, setActiveTab] = useState("list");
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);

  useEffect(() => {
    const loadTags = async () => {
      setLoading(true);
      try {
        const tagsData = await fetchTags(token);
        setTags(tagsData);
      } catch (err) {
        setError("Failed to load tags");
      }
      setLoading(false);
    };
    loadTags();
  }, [token]);

  const handleAddTag = async (newTag: Tag) => {
    try {
      const createdTag = await createTag(token, newTag);
      setTags([...tags, createdTag]);
      setActiveTab("list"); // Switch back to list tab after adding
    } catch (err) {
      setError("Error adding tag");
    }
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await deleteTag(token, id);
      setTags(tags.filter(tag => tag.id !== id));
    } catch (err) {
      setError("Error deleting tag");
    }
  };

  const handleUpdateTag = async (id: number, name: string) => {
    try {
      const updatedTag = await updateTag(token, id, { name });
      setTags(tags.map(tag => (tag.id === id ? updatedTag : tag)));
      setCurrentTag(null);
      setActiveTab("list"); // Switch back to list tab after updating
    } catch (err) {
      setError("Error updating tag");
    }
  };

  const handleEditTag = (tag: Tag) => {
    setCurrentTag(tag);
    setActiveTab("add"); // Switch to add/edit tab
  };

  const handleCancelEdit = () => {
    setCurrentTag(null);
    setActiveTab("list");
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage tags.</p>
      </div>
    );
  }

  return (
    <PageLayout
      title="Tags"
      description="Manage your tags to organize and categorize your transactions."
      icon={TagIcon}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <TagIcon className="h-4 w-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              {currentTag ? "Edit Tag" : "Add Tag"}
            </TabsTrigger>
          </TabsList>

          {currentTag && (
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
              <span className="ml-2 text-gray-600">Loading tags...</span>
            </div>
          ) : (
            <TagList
              tags={tags}
              onDeleteTag={handleDeleteTag}
              onUpdateTag={handleUpdateTag}
              onEditTag={handleEditTag}
            />
          )}
        </TabsContent>

        <TabsContent value="add" className="mt-0">
          <Card className="w-full max-w-3xl mx-auto">
            <AddTagForm
              onTagAdded={handleAddTag}
              initialTag={currentTag}
              onUpdateTag={handleUpdateTag}
              onCancel={handleCancelEdit}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </PageLayout>
  );
}
