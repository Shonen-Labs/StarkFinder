"use client";

import React, { useState, useEffect } from "react";
import { TagSelectorProps } from "@/lib/review/types";
import { getAvailableTags } from "@/lib/review/api";
import { X, Plus } from "lucide-react";

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  availableTags: propAvailableTags,
  maxTags = 10,
}) => {
  const [availableTags, setAvailableTags] = useState<string[]>(propAvailableTags || []);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!propAvailableTags) {
      loadAvailableTags();
    }
  }, [propAvailableTags]);

  const loadAvailableTags = async () => {
    setIsLoading(true);
    try {
      const tags = await getAvailableTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (
      trimmedTag &&
      !selectedTags.includes(trimmedTag) &&
      selectedTags.length < maxTags
    ) {
      onTagsChange([...selectedTags, trimmedTag]);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const filteredAvailableTags = availableTags.filter(
    tag => !selectedTags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-grayscale-100">
        Tags ({selectedTags.length}/{maxTags})
      </label>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple/20 text-purple border border-purple"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple hover:bg-purple hover:text-white focus:outline-none focus:ring-2 focus:ring-purple"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Tag input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Add tags..."
          className="w-full px-4 py-3 bg-black-scale-400 border border-purple rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple text-white placeholder-grayscale-600"
          disabled={selectedTags.length >= maxTags || isLoading}
        />

        {inputValue && (
          <button
            type="button"
            onClick={() => handleAddTag(inputValue)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-grayscale-600 hover:text-purple"
            disabled={selectedTags.length >= maxTags}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Available tags suggestions */}
      {inputValue && filteredAvailableTags.length > 0 && (
        <div className="border border-purple rounded-lg shadow-sm bg-black-scale-400">
          <div className="p-3">
            <p className="text-xs text-grayscale-600 mb-2">Available tags:</p>
            <div className="flex flex-wrap gap-1">
              {filteredAvailableTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2 py-1 text-xs bg-purple/20 text-purple rounded hover:bg-purple hover:text-white transition-colors"
                  disabled={selectedTags.length >= maxTags}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-grayscale-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple"></div>
          <span>Loading tags...</span>
        </div>
      )}

      {/* Max tags warning */}
      {selectedTags.length >= maxTags && (
        <p className="text-sm text-orange-bright">
          Maximum number of tags reached ({maxTags})
        </p>
      )}
    </div>
  );
};
