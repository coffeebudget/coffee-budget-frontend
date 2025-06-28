"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  id: number | string;
  label: string;
  keywords?: string[];
  description?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: number | string | null;
  onChange: (value: number | string | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  allowClear?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  renderOption?: (option: SearchableSelectOption) => React.ReactNode;
}

const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  className,
  allowClear = true,
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
  renderOption,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      (option.keywords && option.keywords.some(keyword => 
        keyword.toLowerCase().includes(searchLower)
      )) ||
      (option.description && option.description.toLowerCase().includes(searchLower))
    );
  });

  // Find selected option
  const selectedOption = options.find(option => option.id === value);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: SearchableSelectOption) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  const defaultRenderOption = (option: SearchableSelectOption) => (
    <div className="flex flex-col">
      <div className="font-medium">{option.label}</div>
      {option.keywords && option.keywords.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          Keywords: {option.keywords.join(", ")}
        </div>
      )}
      {option.description && (
        <div className="text-xs text-muted-foreground mt-1">
          {option.description}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-2", className)} ref={ref}>
      {label && <Label>{label}</Label>}
      
      <div className="relative" ref={dropdownRef}>
        {/* Trigger */}
        <div 
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "data-[placeholder]:text-muted-foreground",
            isOpen && "ring-1 ring-ring"
          )}
          onClick={handleToggleOpen}
        >
          <span className={cn("line-clamp-1", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          
          <div className="flex items-center gap-1">
            {allowClear && selectedOption && (
              <X 
                className="h-4 w-4 opacity-50 hover:opacity-100" 
                onClick={handleClear}
              />
            )}
            <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
            {/* Search Input */}
            <div className="relative p-2 border-b">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                className="pl-8 h-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center px-2 py-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      "select-none relative",
                      value === option.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    {value === option.id && (
                      <Check className="h-4 w-4 mr-2 opacity-100" />
                    )}
                    <div className={cn("flex-1", value !== option.id && "ml-6")}>
                      {renderOption ? renderOption(option) : defaultRenderOption(option)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                  {emptyMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SearchableSelect.displayName = "SearchableSelect";

export { SearchableSelect }; 