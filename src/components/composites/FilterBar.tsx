'use client';

import { Chip } from '../primitives/Chip';

interface FilterBarProps {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export function FilterBar({ tags, selectedTags, onTagToggle }: FilterBarProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap py-4">
      {tags.map((tag) => (
        <Chip
          key={tag}
          selected={selectedTags.includes(tag)}
          onClick={() => onTagToggle(tag)}
        >
          {tag}
        </Chip>
      ))}
      {selectedTags.length > 0 && (
        <button
          onClick={() => selectedTags.forEach(onTagToggle)}
          className="zissou-mono text-xs uppercase tracking-wider text-inkstain/60 hover:text-tracksuit-red ml-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
