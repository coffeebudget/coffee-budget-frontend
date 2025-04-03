"use client";

import { useEffect, useState } from "react";
import { createTag } from "@/utils/api";
import { useSession } from "next-auth/react";
import { Tag } from "@/utils/types";

type AddTagFormProps = {
  onTagAdded: (tag: Tag) => void;
};

export default function AddTagForm({ onTagAdded }: AddTagFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [tagName, setTagName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName) {
      setError("Tag name is required");
      return;
    }

    const newTag = { name: tagName };

    try {
      const createdTag = await createTag(token, newTag);
      onTagAdded(createdTag);
      setTagName("");
      setError(null);
    } catch (err) {
      setError("Error adding tag");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        placeholder="Tag Name"
        value={tagName}
        onChange={(e) => setTagName(e.target.value)}
        className="border p-2 mb-2"
        required
      />
      <button type="submit" className="bg-blue-500 text-white p-2">Add Tag</button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
