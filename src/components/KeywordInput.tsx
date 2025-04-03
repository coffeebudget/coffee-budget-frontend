'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface KeywordInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

export default function KeywordInput({ keywords = [], onChange }: KeywordInputProps) {
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    // Check if keyword already exists (case insensitive)
    if (!keywords.some(k => k.toLowerCase() === newKeyword.trim().toLowerCase())) {
      const updatedKeywords = [...keywords, newKeyword.trim()];
      onChange(updatedKeywords);
    }
    
    setNewKeyword('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = [...keywords];
    updatedKeywords.splice(index, 1);
    onChange(updatedKeywords);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a keyword and press Enter"
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleAddKeyword}
          variant="outline"
        >
          Add
        </Button>
      </div>
      
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {keywords.map((keyword, index) => (
            <div 
              key={index} 
              className="flex items-center bg-gray-100 rounded-md px-3 py-1"
            >
              <span className="mr-1">{keyword}</span>
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 