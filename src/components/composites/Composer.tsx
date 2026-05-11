"use client";

import { useState, useRef } from "react";
import { Avatar } from "../primitives/Avatar";
import { Button } from "../primitives/Button";
import { Chip } from "../primitives/Chip";
import { TagCombobox, type TagOption } from "../primitives/TagCombobox";
import { Toggle } from "../primitives/Toggle";
import { MarkdownEditor } from "./MarkdownEditor";
import { contentSources } from "@/lib/content-sources";
import type { ContentSource, SearchResult } from "@/lib/content-sources";

const FREQUENT_TAGS_LIMIT = 8;

interface ComposerProps {
  userAvatar?: string;
  userName?: string;
  existingTags?: TagOption[];
  onPublish: (data: {
    content: string;
    images: File[];
    tags: string[];
    isPrivate: boolean;
    isDraft?: boolean;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
  // Edit mode props
  editPost?: {
    id: string;
    content: string;
    tags: string[];
    isPrivate: boolean;
    images: { id: string; url: string; mimeType?: string }[];
    isDraft: boolean;
    publishedAt?: Date | null;
  };
  onSave?: (data: {
    content: string;
    images: File[];
    existingImageIds: string[];
    tags: string[];
    isPrivate: boolean;
    publish?: boolean;
    publishedAt?: string;
  }) => void | Promise<void>;
  onCancel?: () => void;
}

const PhotoIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const FilmIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
    />
  </svg>
);

const BookIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const SparkleIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const sourceIcons: Record<string, () => React.ReactElement> = {
  "movie-review": FilmIcon,
  "book-review": BookIcon,
};

export function Composer({
  userAvatar,
  userName,
  existingTags = [],
  onPublish,
  isSubmitting = false,
  editPost,
  onSave,
  onCancel,
}: ComposerProps) {
  const [content, setContent] = useState(editPost?.content ?? "");
  const [isPrivate, setIsPrivate] = useState(editPost?.isPrivate ?? false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(editPost?.tags ?? []);
  const [existingImages, setExistingImages] = useState(editPost?.images ?? []);
  const [publishedAt, setPublishedAt] = useState(() => {
    if (!editPost?.publishedAt) return "";
    const d = new Date(editPost.publishedAt);
    // Format as datetime-local value: YYYY-MM-DDTHH:MM
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + 'T' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Content search state
  const [activeSource, setActiveSource] = useState<ContentSource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const addTag = (tag: string) => {
    const value = tag.trim();
    if (!value) return;
    setSelectedTags((prev) =>
      prev.some((t) => t.toLowerCase() === value.toLowerCase())
        ? prev
        : [...prev, value],
    );
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (isDraft?: boolean) => {
    if (!content.trim() && images.length === 0) return;
    await onPublish({ content, images, tags: selectedTags, isPrivate, isDraft });
    setContent("");
    setIsPrivate(false);
    setImages([]);
    setImagePreviews([]);
    setSelectedTags([]);
    setExistingImages([]);
    setActiveSource(null);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleSave = async (publish?: boolean) => {
    if (!content.trim() && images.length === 0 && existingImages.length === 0) return;
    await onSave?.({
      content,
      images,
      existingImageIds: existingImages.map((img) => img.id),
      tags: selectedTags,
      isPrivate,
      publish,
      publishedAt: publishedAt || undefined,
    });
  };

  const toggleSource = (source: ContentSource) => {
    if (activeSource?.id === source.id) {
      setActiveSource(null);
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
    } else {
      setActiveSource(source);
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleSearch = async () => {
    if (!activeSource || !searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(false);
    try {
      const res = await fetch("/api/content-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const canPublish = (content.trim() || images.length > 0) && !isSubmitting;

  return (
    <div className="bg-[white] zissou-border zissou-shadow p-6">
      {/* Header */}
      <div className="flex gap-4 mb-4">
        <Avatar src={userAvatar} fallback={userName} size="md" />
        <div className="flex-1">
          <p className="zissou-mono text-xs text-inkstain/60 mb-2 uppercase">
            What&apos;s on your mind?
          </p>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Share your thoughts... Markdown supported."
          />
        </div>
      </div>

      {/* Image Previews */}
      {(existingImages.length > 0 || imagePreviews.length > 0) && (
        <div className="flex gap-2 flex-wrap mb-4 ml-14">
          {existingImages.map((img) => (
            <div key={img.id} className="relative w-20 h-20">
              {img.mimeType?.startsWith('video/') ? (
                <video src={img.url} className="w-full h-full object-cover zissou-border" muted />
              ) : (
                <img src={img.url} alt="" className="w-full h-full object-cover zissou-border" />
              )}
              <button
                onClick={() => removeExistingImage(img.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-tracksuit-red text-white text-xs flex items-center justify-center zissou-border"
              >
                ×
              </button>
            </div>
          ))}
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative w-20 h-20">
              {images[index]?.type.startsWith('video/') ? (
                <video src={preview} className="w-full h-full object-cover zissou-border" muted />
              ) : (
                <img
                  src={preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover zissou-border"
                />
              )}
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-tracksuit-red text-white text-xs flex items-center justify-center zissou-border"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-inkstain flex items-center justify-center text-inkstain/40 hover:border-deep-ocean-teal hover:text-deep-ocean-teal transition-none"
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={`Search for a ${activeSource.label.toLowerCase()}...`}
              className="flex-1 px-3 py-2 zissou-mono text-sm border-0 border-b-2 border-dashed border-inkstain bg-transparent focus:outline-none focus:border-solid focus:bg-mendls-pink/20"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="p-2 text-submarine-yellow hover:text-tracksuit-red disabled:text-inkstain/20 transition-none"
              title="Search"
            >
              {isSearching ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <SparkleIcon />
              )}
            </button>
            <button
              onClick={() => {
                setActiveSource(null);
                setSearchQuery("");
                setSearchResults([]);
                setHasSearched(false);
              }}
              className="p-2 text-inkstain/40 hover:text-tracksuit-red transition-none"
              title="Cancel"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 zissou-border overflow-hidden">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-3 py-2 hover:bg-submarine-yellow/30 transition-none border-b-2 border-inkstain last:border-b-0"
                >
                  <p className="text-sm font-medium text-inkstain truncate">
                    {result.title}
                  </p>
                  <p className="zissou-mono text-xs text-inkstain/40 truncate">
                    {result.url}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {hasSearched && searchResults.length === 0 && (
            <p className="mt-2 zissou-mono text-sm text-inkstain/40">
              No results found. Try a different search.
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="flex gap-2 flex-wrap items-center mb-4 ml-14">
        {(() => {
          const frequentTags = existingTags.slice(0, FREQUENT_TAGS_LIMIT);
          const frequentNamesLower = new Set(
            frequentTags.map((t) => t.name.toLowerCase()),
          );
          const extraSelected = selectedTags.filter(
            (t) => !frequentNamesLower.has(t.toLowerCase()),
          );
          return (
            <>
              {frequentTags.map((tag) => (
                <Chip
                  key={tag.name}
                  selected={selectedTags.includes(tag.name)}
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                </Chip>
              ))}
              {extraSelected.map((tag) => (
                <Chip
                  key={tag}
                  selected
                  removable
                  onRemove={() => toggleTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
              <TagCombobox
                allTags={existingTags}
                selectedTags={selectedTags}
                onAdd={addTag}
              />
            </>
          );
        })()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between ml-14">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-inkstain/60 hover:text-deep-ocean-teal transition-none"
          >
            <PhotoIcon />
            <span className="zissou-mono text-xs uppercase">Media</span>
          </button>
          {contentSources.map((source) => {
            const Icon = sourceIcons[source.id] || FilmIcon;
            return (
              <button
                key={source.id}
                onClick={() => toggleSource(source)}
                className={`flex items-center gap-2 transition-none ${
                  activeSource?.id === source.id
                    ? "text-deep-ocean-teal"
                    : "text-inkstain/60 hover:text-deep-ocean-teal"
                }`}
              >
                <Icon />
                <span className="zissou-mono text-xs uppercase">
                  {source.label}
                </span>
              </button>
            );
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <Toggle
            checked={isPrivate}
            onChange={() => setIsPrivate(!isPrivate)}
            label={isPrivate ? "PRIVATE" : "PUBLIC"}
          />
          {editPost ? (
            <div className="flex items-center gap-2">
              {!editPost.isDraft && (
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="px-2 py-1 zissou-mono text-xs border-0 border-b-2 border-dashed border-inkstain bg-transparent focus:outline-none focus:border-solid"
                  title="Published date"
                />
              )}
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
              {editPost.isDraft && (
                <Button onClick={() => handleSave(true)}>Publish</Button>
              )}
              <Button onClick={() => handleSave()}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => handleSubmit(true)} disabled={!canPublish}>
                {isSubmitting ? "Saving..." : "Save Draft"}
              </Button>
              <Button onClick={() => handleSubmit(false)} disabled={!canPublish}>
                {isSubmitting ? "Publishing..." : isPrivate ? "Post Privately" : "Publish"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
