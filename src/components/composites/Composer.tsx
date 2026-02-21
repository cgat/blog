'use client';

import { useState, useRef } from 'react';
import { Avatar } from '../primitives/Avatar';
import { Button } from '../primitives/Button';
import { Chip } from '../primitives/Chip';
import { MarkdownEditor } from './MarkdownEditor';
import { contentSources } from '@/lib/content-sources';
import type { ContentSource, SearchResult } from '@/lib/content-sources';

interface ComposerProps {
  userAvatar?: string;
  userName?: string;
  existingTags?: string[];
  onPublish: (data: { content: string; images: File[]; tags: string[]; isPrivate: boolean }) => void | Promise<void>;
  isSubmitting?: boolean;
}

const PhotoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FilmIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const sourceIcons: Record<string, () => React.ReactElement> = {
  'movie-review': FilmIcon,
  'book-review': BookIcon,
};

export function Composer({
  userAvatar,
  userName,
  existingTags = [],
  onPublish,
  isSubmitting = false,
}: ComposerProps) {
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Content search state
  const [activeSource, setActiveSource] = useState<ContentSource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addNewTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags((prev) => [...prev, newTag]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;
    await onPublish({ content, images, tags: selectedTags, isPrivate });
    setContent('');
    setIsPrivate(false);
    setImages([]);
    setImagePreviews([]);
    setSelectedTags([]);
    setActiveSource(null);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const toggleSource = (source: ContentSource) => {
    if (activeSource?.id === source.id) {
      setActiveSource(null);
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    } else {
      setActiveSource(source);
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleSearch = async () => {
    if (!activeSource || !searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(false);
    try {
      const res = await fetch('/api/content-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: activeSource.id,
          query: searchQuery.trim(),
        }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (!activeSource) return;

    // Prepend URL to content
    const newContent = content.trim()
      ? `${result.url}\n\n${content}`
      : result.url;
    setContent(newContent);

    // Add the source tag
    if (!selectedTags.includes(activeSource.tag)) {
      setSelectedTags((prev) => [...prev, activeSource.tag]);
    }

    // Reset search state
    setActiveSource(null);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const canPublish = (content.trim() || images.length > 0) && !isSubmitting;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex gap-4 mb-4">
        <Avatar src={userAvatar} fallback={userName} size="md" />
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2">What&apos;s on your mind?</p>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Share your thoughts... Markdown supported."
          />
        </div>
      </div>

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4 ml-14">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative w-20 h-20">
              <img
                src={preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-princeton-orange text-white rounded-full text-xs flex items-center justify-center hover:bg-opacity-90"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-green hover:text-blue-green transition-colors"
          >
            +
          </button>
        </div>
      )}

      {/* Content Search */}
      {activeSource && (
        <div className="mb-4 ml-14">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Search for a ${activeSource.label.toLowerCase()}...`}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-green"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="p-2 text-amber-flame hover:text-princeton-orange disabled:text-gray-300 transition-colors"
              title="Search"
            >
              {isSearching ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <SparkleIcon />
              )}
            </button>
            <button
              onClick={() => {
                setActiveSource(null);
                setSearchQuery('');
                setSearchResults([]);
                setHasSearched(false);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-3 py-2 hover:bg-sky-blue/10 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <p className="text-sm font-medium text-deep-space truncate">{result.title}</p>
                  <p className="text-xs text-gray-400 truncate">{result.url}</p>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {hasSearched && searchResults.length === 0 && (
            <p className="mt-2 text-sm text-gray-400">No results found. Try a different search.</p>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="flex gap-2 flex-wrap items-center mb-4 ml-14">
        {existingTags.map((tag) => (
          <Chip
            key={tag}
            selected={selectedTags.includes(tag)}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Chip>
        ))}
        {selectedTags
          .filter((tag) => !existingTags.includes(tag))
          .map((tag) => (
            <Chip
              key={tag}
              selected
              removable
              onRemove={() => toggleTag(tag)}
            >
              {tag}
            </Chip>
          ))}
        {showTagInput ? (
          <div className="flex gap-1 items-center">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
              placeholder="New tag"
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-green w-24"
              autoFocus
            />
            <button
              onClick={addNewTag}
              className="text-blue-green text-sm hover:underline"
            >
              Add
            </button>
            <button
              onClick={() => setShowTagInput(false)}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="text-blue-green text-sm hover:underline"
          >
            + Add tag
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between ml-14">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-green transition-colors"
          >
            <PhotoIcon />
            <span className="text-sm">Photo</span>
          </button>
          {contentSources.map((source) => {
            const Icon = sourceIcons[source.id] || FilmIcon;
            return (
              <button
                key={source.id}
                onClick={() => toggleSource(source)}
                className={`flex items-center gap-2 transition-colors ${
                  activeSource?.id === source.id
                    ? 'text-blue-green'
                    : 'text-gray-500 hover:text-blue-green'
                }`}
              >
                <Icon />
                <span className="text-sm">{source.label}</span>
              </button>
            );
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isPrivate
                ? 'text-amber-flame bg-amber-flame/10'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={isPrivate ? 'Private — only visible when logged in' : 'Public — visible to everyone'}
          >
            {isPrivate ? <LockIcon /> : <GlobeIcon />}
            <span>{isPrivate ? 'Private' : 'Public'}</span>
          </button>
          <Button
            onClick={handleSubmit}
            disabled={!canPublish}
          >
            {isSubmitting ? 'Publishing...' : isPrivate ? 'Post Privately' : 'Publish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
