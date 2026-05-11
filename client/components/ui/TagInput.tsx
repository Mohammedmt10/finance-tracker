/**
 * TagInput Component
 *
 * A dynamic tag input with autocomplete that lets users:
 * - Select from existing tags via a filtered dropdown
 * - Create new tags inline by typing and pressing Enter
 * - Remove selected tags via × buttons on each pill
 *
 * Styled for the dark design system.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Tag } from "lucide-react";

interface TagOption {
  _id: string;
  name: string;
}

interface TagInputProps {
  /** Currently selected tag names */
  value: string[];
  /** All available tags from the API */
  availableTags: TagOption[];
  /** Called when the selected tags change */
  onChange: (tags: string[]) => void;
  /** Called when a brand-new tag needs to be created */
  onCreateTag?: (name: string) => void;
  /** Max number of tags allowed */
  max?: number;
  /** Optional label */
  label?: string;
}

export default function TagInput({
  value,
  availableTags,
  onChange,
  onCreateTag,
  max = 10,
  label,
}: TagInputProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter available tags: not already selected, matches query
  const filteredTags = availableTags.filter(
    (tag) =>
      !value.includes(tag.name) &&
      tag.name.toLowerCase().includes(query.toLowerCase()),
  );

  const trimmedQuery = query.trim().toLowerCase();
  const showCreateOption =
    trimmedQuery.length > 0 &&
    !availableTags.some((t) => t.name === trimmedQuery) &&
    !value.includes(trimmedQuery);

  const showDropdown =
    isFocused && (filteredTags.length > 0 || showCreateOption);

  function addTag(name: string) {
    const normalized = name.trim().toLowerCase();
    if (!normalized || value.includes(normalized) || value.length >= max)
      return;
    onChange([...value, normalized]);
    setQuery("");
  }

  function removeTag(name: string) {
    onChange(value.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (trimmedQuery) {
        // If there's an exact match in the dropdown, add it
        // Otherwise create a new tag
        if (!value.includes(trimmedQuery)) {
          const existsInAvailable = availableTags.some(
            (t) => t.name === trimmedQuery,
          );
          if (!existsInAvailable && onCreateTag) {
            onCreateTag(trimmedQuery);
          }
          addTag(trimmedQuery);
        }
      }
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(value[value.length - 1]);
    }
  }

  function handleSelectTag(name: string) {
    addTag(name);
    inputRef.current?.focus();
  }

  function handleCreateAndAdd(name: string) {
    if (onCreateTag) onCreateTag(name);
    addTag(name);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}

      <div
        className={`
          flex flex-wrap items-center gap-1.5
          rounded-xl bg-surface-800 border px-3 py-2
          transition-all duration-200 min-h-[42px]
          ${isFocused ? "border-primary-500" : "border-surface-600"}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tag pills */}
        {value.map((tag) => (
          <span
            key={tag}
            className="
              inline-flex items-center gap-1 px-2 py-0.5
              rounded-lg text-xs font-medium
              bg-primary-600/20 text-primary-300
              animate-scale-in
            "
          >
            <Tag size={10} />
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="
                ml-0.5 rounded-full p-0.5
                hover:bg-primary-500/30 transition-colors
              "
              aria-label={`Remove tag ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {/* Text input */}
        {value.length < max && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? "Add tags…" : ""}
            className="
              flex-1 min-w-[80px] bg-transparent
              text-sm text-slate-100 placeholder:text-slate-500
              border-none outline-none 
              focus:ring-0 focus:outline-none focus:border-transparent
              focus-visible:ring-0 focus-visible:outline-none /* <-- Add these */
            "
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="
            relative z-50 mt-1 rounded-xl
            bg-surface-800 border border-surface-600
            shadow-xl shadow-black/30
            max-h-40 overflow-y-auto
            animate-scale-in
          "
        >
          {filteredTags.map((tag) => (
            <button
              key={tag._id}
              type="button"
              onClick={() => handleSelectTag(tag.name)}
              className="
                w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                text-slate-300 hover:bg-surface-700 hover:text-white
                transition-colors duration-150
              "
            >
              <Tag size={12} className="text-slate-500" />
              {tag.name}
            </button>
          ))}

          {showCreateOption && (
            <button
              type="button"
              onClick={() => handleCreateAndAdd(trimmedQuery)}
              className="
                w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                text-primary-400 hover:bg-primary-600/10
                transition-colors duration-150
                border-t border-surface-700
              "
            >
              <Plus size={12} />
              Create &ldquo;{trimmedQuery}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
