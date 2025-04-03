"use client";

import { useEffect, useState } from "react";
import { fetchTags, createTag, deleteTag, updateTag } from "@/utils/api";
import { useSession } from "next-auth/react";
import AddTagForm from "./components/AddTagForm";
import TagList from "./components/TagList";
import { Tag } from "@/utils/types";

export default function TagsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);

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

  const handleAddTag = (newTag: Tag) => {
    setTags([...tags, newTag]);
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
    } catch (err) {
      setError("Error updating tag");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-blue-500 mb-4">Manage Tags</h1>
      <AddTagForm onTagAdded={handleAddTag} />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <TagList tags={tags} onDeleteTag={handleDeleteTag} onUpdateTag={handleUpdateTag} />
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
