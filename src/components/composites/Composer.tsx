'use client';

import { useState, useRef } from 'react';
import { Avatar } from '../primitives/Avatar';
import { Button } from '../primitives/Button';
import { Chip } from '../primitives/Chip';
import { MarkdownEditor } from './MarkdownEditor';

interface ComposerProps {
  userAvatar?: string;
  userName?: string;
  existingTags?: string[];
  onPublish: (data: { content: string; images: File[]; tags: string[] }) => void;
  isSubmitting?: boolean;
}

const PhotoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export function Composer({
  userAvatar,
  userName,
  existingTags = [],
  onPublish,
  isSubmitting = false,
}: ComposerProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) return;
    onPublish({ content, images, tags: selectedTags });
    setContent('');
    setImages([]);
    setImagePreviews([]);
    setSelectedTags([]);
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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-green transition-colors"
        >
          <PhotoIcon />
          <span className="text-sm">Photo</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          onClick={handleSubmit}
          disabled={!canPublish}
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </Button>
      </div>
    </div>
  );
}
