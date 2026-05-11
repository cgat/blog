"use client";

import { useEffect, useRef, useState } from "react";

export interface TagOption {
  name: string;
  count: number;
}

interface TagComboboxProps {
  allTags: TagOption[];
  selectedTags: string[];
  onAdd: (tag: string) => void;
  placeholder?: string;
  maxResults?: number;
}

export function TagCombobox({
  allTags,
  selectedTags,
  onAdd,
  placeholder = "Search or add tag",
  maxResults = 8,
}: TagComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const lowerQuery = trimmed.toLowerCase();
  const selectedLower = new Set(selectedTags.map((t) => t.toLowerCase()));

  const matches = trimmed
    ? allTags
        .filter(
          (t) =>
            !selectedLower.has(t.name.toLowerCase()) &&
            t.name.toLowerCase().includes(lowerQuery),
        )
        .slice(0, maxResults)
    : [];

  const hasExactMatch = allTags.some(
    (t) => t.name.toLowerCase() === lowerQuery,
  );
  const showCreateRow =
    trimmed.length > 0 && !hasExactMatch && !selectedLower.has(lowerQuery);

  const totalRows = matches.length + (showCreateRow ? 1 : 0);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const commit = (name: string) => {
    const value = name.trim();
    if (!value) return;
    if (selectedLower.has(value.toLowerCase())) return;
    onAdd(value);
    setQuery("");
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalRows === 0) return;
      setHighlightedIndex((i) => (i + 1) % totalRows);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalRows === 0) return;
      setHighlightedIndex((i) => (i - 1 + totalRows) % totalRows);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (totalRows === 0) return;
      if (highlightedIndex < matches.length) {
        commit(matches[highlightedIndex].name);
      } else if (showCreateRow) {
        commit(trimmed);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlightedIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="px-2 py-1 zissou-mono text-xs uppercase border-0 border-b-2 border-dashed border-inkstain bg-transparent focus:outline-none focus:border-solid focus:bg-mendls-pink/20 w-40"
      />
      {isOpen && totalRows > 0 && (
        <div className="absolute left-0 top-full mt-1 z-10 min-w-full w-56 zissou-border bg-page overflow-hidden">
          {matches.map((tag, index) => (
            <button
              key={tag.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(tag.name)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 transition-none border-b-2 border-inkstain last:border-b-0 ${
                index === highlightedIndex ? "bg-submarine-yellow/30" : ""
              }`}
            >
              <span className="zissou-mono text-xs uppercase text-inkstain truncate">
                {tag.name}
              </span>
              <span className="zissou-mono text-xs text-inkstain/40">
                {tag.count}
              </span>
            </button>
          ))}
          {showCreateRow && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(trimmed)}
              onMouseEnter={() => setHighlightedIndex(matches.length)}
              className={`w-full text-left px-3 py-2 transition-none border-b-2 border-inkstain last:border-b-0 ${
                highlightedIndex === matches.length
                  ? "bg-submarine-yellow/30"
                  : ""
              }`}
            >
              <span className="zissou-mono text-xs uppercase text-deep-ocean-teal">
                + Create &ldquo;{trimmed}&rdquo;
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
