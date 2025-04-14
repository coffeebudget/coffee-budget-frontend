"use client";

import { useState, useEffect, useRef } from 'react';
import { Tag } from '@/utils/types';

interface TagSelectorProps {
  tags: Tag[];
  selectedTags: number[];
  onChange: (selectedIds: number[]) => void;
}

export default function TagSelector({ tags, selectedTags, onChange }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTagNames = tags
    .filter(tag => selectedTags.includes(tag.id))
    .map(tag => tag.name);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full p-2 border rounded cursor-pointer min-h-[42px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedTagNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedTagNames.map(name => (
              <span key={name} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-500">Select tags...</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
          <input
            type="text"
            className="w-full p-2 border-b"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="max-h-60 overflow-y-auto">
            {filteredTags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(
                    selectedTags.includes(tag.id)
                      ? selectedTags.filter(id => id !== tag.id)
                      : [...selectedTags, tag.id]
                  );
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => {}}
                  className="mr-2"
                />
                {tag.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 