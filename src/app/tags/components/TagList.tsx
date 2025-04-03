"use client";

import { useState } from "react";
import { Tag } from "@/utils/types";

interface TagListProps {
  tags: Tag[];
  onDeleteTag: (id: number) => void;
  onUpdateTag: (id: number, name: string) => void;
}

export default function TagList({ tags, onDeleteTag, onUpdateTag }: TagListProps) {
  const [editTagId, setEditTagId] = useState<number | null>(null);
  const [editTagName, setEditTagName] = useState("");

  const handleEditTag = (tag: Tag) => {
    setEditTagId(tag.id);
    setEditTagName(tag.name);
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTagId === null) return;

    onUpdateTag(editTagId, editTagName);
    setEditTagId(null);
    setEditTagName("");
  };

  return (
    <div className="w-full max-w-2xl mt-8 mx-auto bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-bold mb-2">Your Tags</h2>
      <ul className="divide-y divide-gray-200">
        {tags.map((tag) => (
          <li key={tag.id} className="flex justify-between items-center py-2">
            {editTagId === tag.id ? (
              <form onSubmit={handleUpdateTag} className="flex w-full">
                <input
                  type="text"
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  className="border p-1 flex-grow rounded-l"
                  required
                />
                <button type="submit" className="bg-green-500 text-white px-2 rounded-r hover:bg-green-600">
                  Update
                </button>
              </form>
            ) : (
              <>
                <span className="flex-grow">{tag.name}</span>
                <div>
                  <button onClick={() => handleEditTag(tag)} className="text-blue-500 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => onDeleteTag(tag.id)} className="text-red-500 hover:underline ml-2">
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
