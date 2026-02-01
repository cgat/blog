# Personal Blog MVP Implementation Plan - Part 2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

Continuation of `2026-01-31-mvp-implementation.md`

---

## Phase 4 Continued: Composite Components

### Task 4.3: MarkdownEditor Component

**Files:**
- Create: `src/components/composites/MarkdownEditor.tsx`
- Create: `src/components/composites/MarkdownEditor.stories.tsx`

**Step 1: Create MarkdownEditor component**

```typescript
// src/components/composites/MarkdownEditor.tsx
'use client';

import { useState } from 'react';
import { TextArea } from '../primitives/TextArea';
import { Button } from '../primitives/Button';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {showPreview ? (
        <div className="min-h-[120px] p-3 border border-gray-300 rounded-lg bg-gray-50">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-gray-400 italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoExpand
          rows={3}
        />
      )}
    </div>
  );
}
```

**Step 2: Create stories**

```typescript
// src/components/composites/MarkdownEditor.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { MarkdownEditor } from "./MarkdownEditor";

const meta: Meta<typeof MarkdownEditor> = {
  title: "Composites/MarkdownEditor",
  component: MarkdownEditor,
};

export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

const MarkdownEditorWithState = () => {
  const [value, setValue] = useState('');
  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      placeholder="What's on your mind? Markdown supported..."
    />
  );
};

export const Default: Story = {
  render: () => <MarkdownEditorWithState />,
};

const PrefilledEditor = () => {
  const [value, setValue] = useState('# Hello World\n\nThis is **bold** and *italic* text.');
  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      placeholder="What's on your mind?"
    />
  );
};

export const WithContent: Story = {
  render: () => <PrefilledEditor />,
};
```

**Step 3: Commit**

```bash
git add src/components/composites/
git commit -m "feat: add MarkdownEditor composite component"
```

---

### Task 4.4: PostCard Component

**Files:**
- Create: `src/components/composites/PostCard.tsx`
- Create: `src/components/composites/PostCard.stories.tsx`
- Create: `src/types/post.ts`

**Step 1: Create post types**

```typescript
// src/types/post.ts
export interface PostImage {
  id: string;
  url: string;
  alt?: string;
  width: number;
  height: number;
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  content: string;
  type: 'text' | 'photo';
  images: PostImage[];
  tags: PostTag[];
  createdAt: Date;
  publishedAt: Date | null;
}
```

**Step 2: Create PostCard component**

```typescript
// src/components/composites/PostCard.tsx
'use client';

import { useState } from 'react';
import { Post } from '@/types/post';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ImageGrid } from './ImageGrid';
import { Chip } from '../primitives/Chip';
import { IconButton } from '../primitives/IconButton';

interface PostCardProps {
  post: Post;
  expanded?: boolean;
  isOwner?: boolean;
  onExpand?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export function PostCard({
  post,
  expanded = false,
  isOwner = false,
  onExpand,
  onEdit,
  onDelete,
  onShare,
}: PostCardProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(post.createdAt);

  return (
    <article
      className={`
        bg-white rounded-xl border border-gray-200 p-6
        transition-shadow duration-200
        ${!expanded ? 'hover:shadow-md cursor-pointer' : 'shadow-md'}
      `}
      onClick={() => !expanded && onExpand?.()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <time className="text-sm text-gray-500">{formattedDate}</time>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton icon={<ShareIcon />} label="Share" onClick={onShare} />
          {isOwner && (
            <>
              <IconButton icon={<EditIcon />} label="Edit" onClick={onEdit} />
              <IconButton icon={<TrashIcon />} label="Delete" variant="danger" onClick={onDelete} />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <MarkdownRenderer
          content={post.content}
          truncate={expanded ? undefined : 280}
        />
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="mb-4">
          <ImageGrid images={post.images} expanded={expanded} />
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <Chip key={tag.id}>{tag.name}</Chip>
          ))}
        </div>
      )}
    </article>
  );
}
```

**Step 3: Create stories**

```typescript
// src/components/composites/PostCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { PostCard } from "./PostCard";
import { Post } from "@/types/post";

const meta: Meta<typeof PostCard> = {
  title: "Composites/PostCard",
  component: PostCard,
};

export default meta;
type Story = StoryObj<typeof PostCard>;

const textPost: Post = {
  id: '1',
  content: 'Just finished reading **Thinking, Fast and Slow** by Daniel Kahneman. Incredible insights into how we make decisions. Highly recommend for anyone interested in psychology or behavioral economics.',
  type: 'text',
  images: [],
  tags: [
    { id: '1', name: 'books', slug: 'books' },
    { id: '2', name: 'thoughts', slug: 'thoughts' },
  ],
  createdAt: new Date('2026-01-30T10:30:00'),
  publishedAt: new Date('2026-01-30T10:30:00'),
};

const photoPost: Post = {
  id: '2',
  content: 'Beautiful sunset at the beach today. Sometimes you just need to stop and appreciate the moment.',
  type: 'photo',
  images: [
    { id: '1', url: 'https://picsum.photos/seed/sunset/800/600', width: 800, height: 600 },
    { id: '2', url: 'https://picsum.photos/seed/beach/800/600', width: 800, height: 600 },
  ],
  tags: [
    { id: '3', name: 'photography', slug: 'photography' },
    { id: '4', name: 'travel', slug: 'travel' },
  ],
  createdAt: new Date('2026-01-29T18:45:00'),
  publishedAt: new Date('2026-01-29T18:45:00'),
};

const longPost: Post = {
  id: '3',
  content: `# My Thoughts on Modern Web Development

The landscape of web development has changed dramatically over the past few years. We've seen the rise of meta-frameworks like Next.js, Remix, and SvelteKit that blur the line between client and server.

## Key Observations

1. **Server-first is back** - After years of SPAs, we're returning to server rendering
2. **Edge computing** - Deploy globally, run everywhere
3. **TypeScript everywhere** - Type safety is no longer optional

What do you think about these trends?`,
  type: 'text',
  images: [],
  tags: [
    { id: '5', name: 'tech', slug: 'tech' },
  ],
  createdAt: new Date('2026-01-28T14:00:00'),
  publishedAt: new Date('2026-01-28T14:00:00'),
};

export const TextPost: Story = {
  args: {
    post: textPost,
  },
};

export const TextPostExpanded: Story = {
  args: {
    post: textPost,
    expanded: true,
  },
};

export const PhotoPost: Story = {
  args: {
    post: photoPost,
  },
};

export const PhotoPostExpanded: Story = {
  args: {
    post: photoPost,
    expanded: true,
  },
};

export const LongPostCollapsed: Story = {
  args: {
    post: longPost,
  },
};

export const LongPostExpanded: Story = {
  args: {
    post: longPost,
    expanded: true,
  },
};

export const WithOwnerActions: Story = {
  args: {
    post: textPost,
    isOwner: true,
    onEdit: () => alert('Edit clicked'),
    onDelete: () => alert('Delete clicked'),
    onShare: () => alert('Share clicked'),
  },
};
```

**Step 4: Commit**

```bash
git add src/components/composites/ src/types/
git commit -m "feat: add PostCard composite component"
```

---

### Task 4.5: Composer Component

**Files:**
- Create: `src/components/composites/Composer.tsx`
- Create: `src/components/composites/Composer.stories.tsx`

**Step 1: Create Composer component**

```typescript
// src/components/composites/Composer.tsx
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
```

**Step 2: Create stories**

```typescript
// src/components/composites/Composer.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Composer } from "./Composer";

const meta: Meta<typeof Composer> = {
  title: "Composites/Composer",
  component: Composer,
};

export default meta;
type Story = StoryObj<typeof Composer>;

export const Default: Story = {
  args: {
    userName: 'John Doe',
    existingTags: ['travel', 'photography', 'tech', 'thoughts'],
    onPublish: (data) => {
      console.log('Publishing:', data);
      alert(`Publishing:\n${JSON.stringify(data, null, 2)}`);
    },
  },
};

export const WithAvatar: Story = {
  args: {
    userAvatar: 'https://i.pravatar.cc/150?u=demo',
    userName: 'John Doe',
    existingTags: ['travel', 'photography'],
    onPublish: (data) => console.log('Publishing:', data),
  },
};

export const Submitting: Story = {
  args: {
    userName: 'John Doe',
    existingTags: ['travel'],
    onPublish: () => {},
    isSubmitting: true,
  },
};

export const EmptyState: Story = {
  args: {
    userName: 'New User',
    existingTags: [],
    onPublish: (data) => console.log('Publishing:', data),
  },
  parameters: {
    docs: {
      description: {
        story: 'This is your space. What\'s on your mind?',
      },
    },
  },
};
```

**Step 3: Commit**

```bash
git add src/components/composites/
git commit -m "feat: add Composer composite component"
```

---

### Task 4.6: FilterBar Component

**Files:**
- Create: `src/components/composites/FilterBar.tsx`
- Create: `src/components/composites/FilterBar.stories.tsx`

**Step 1: Create FilterBar component**

```typescript
// src/components/composites/FilterBar.tsx
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
          className="text-sm text-gray-500 hover:text-deep-space ml-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
```

**Step 2: Create stories**

```typescript
// src/components/composites/FilterBar.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { FilterBar } from "./FilterBar";

const meta: Meta<typeof FilterBar> = {
  title: "Composites/FilterBar",
  component: FilterBar,
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

const FilterBarWithState = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const tags = ['travel', 'photography', 'tech', 'thoughts', 'books', 'music'];

  const toggle = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <FilterBar
      tags={tags}
      selectedTags={selected}
      onTagToggle={toggle}
    />
  );
};

export const Default: Story = {
  render: () => <FilterBarWithState />,
};

export const WithSelection: Story = {
  args: {
    tags: ['travel', 'photography', 'tech', 'thoughts'],
    selectedTags: ['travel', 'photography'],
    onTagToggle: () => {},
  },
};

export const Empty: Story = {
  args: {
    tags: [],
    selectedTags: [],
    onTagToggle: () => {},
  },
};
```

**Step 3: Commit**

```bash
git add src/components/composites/
git commit -m "feat: add FilterBar composite component"
```

---

### Task 4.7: ShareMenu Component

**Files:**
- Create: `src/components/composites/ShareMenu.tsx`
- Create: `src/components/composites/ShareMenu.stories.tsx`

**Step 1: Create ShareMenu component**

```typescript
// src/components/composites/ShareMenu.tsx
'use client';

import { useEffect, useRef } from 'react';

interface ShareMenuProps {
  postUrl: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export function ShareMenu({ postUrl, postTitle, isOpen, onClose }: ShareMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    onClose();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]"
    >
      <button
        onClick={shareToFacebook}
        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 text-deep-space"
      >
        <FacebookIcon />
        <span>Share to Facebook</span>
      </button>
      <button
        onClick={copyLink}
        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 text-deep-space"
      >
        <CopyIcon />
        <span>Copy link</span>
      </button>
    </div>
  );
}
```

**Step 2: Create stories**

```typescript
// src/components/composites/ShareMenu.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { ShareMenu } from "./ShareMenu";
import { Button } from "../primitives/Button";

const meta: Meta<typeof ShareMenu> = {
  title: "Composites/ShareMenu",
  component: ShareMenu,
};

export default meta;
type Story = StoryObj<typeof ShareMenu>;

const ShareMenuDemo = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="relative inline-block">
      <Button onClick={() => setIsOpen(!isOpen)}>Share</Button>
      <ShareMenu
        postUrl="https://myblog.com/posts/abc123"
        postTitle="My awesome post"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <ShareMenuDemo />,
};
```

**Step 3: Commit**

```bash
git add src/components/composites/
git commit -m "feat: add ShareMenu composite component"
```

---

### Task 4.8: ConfirmDialog Component

**Files:**
- Create: `src/components/composites/ConfirmDialog.tsx`
- Create: `src/components/composites/ConfirmDialog.stories.tsx`

**Step 1: Create ConfirmDialog component**

```typescript
// src/components/composites/ConfirmDialog.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Button } from '../primitives/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title" className="text-xl font-semibold text-deep-space mb-2">
          {title}
        </h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'primary' : 'primary'}
            onClick={onConfirm}
            className={variant === 'danger' ? 'bg-princeton-orange hover:bg-opacity-90' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create stories**

```typescript
// src/components/composites/ConfirmDialog.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "../primitives/Button";

const meta: Meta<typeof ConfirmDialog> = {
  title: "Composites/ConfirmDialog",
  component: ConfirmDialog,
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

const DeleteDemo = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete Post</Button>
      <ConfirmDialog
        isOpen={isOpen}
        title="Delete post?"
        message="This action cannot be undone. The post will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          alert('Deleted!');
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
};

export const DeleteConfirmation: Story = {
  render: () => <DeleteDemo />,
};

const DefaultDemo = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Show Dialog</Button>
      <ConfirmDialog
        isOpen={isOpen}
        title="Publish post?"
        message="Your post will be visible to everyone."
        confirmLabel="Publish"
        onConfirm={() => {
          alert('Published!');
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
};

export const Default: Story = {
  render: () => <DefaultDemo />,
};
```

**Step 3: Commit**

```bash
git add src/components/composites/
git commit -m "feat: add ConfirmDialog composite component"
```

---

### Task 4.9: FeedLayout Component

**Files:**
- Create: `src/components/composites/FeedLayout.tsx`
- Create: `src/components/composites/FeedLayout.stories.tsx`

**Step 1: Create FeedLayout component**

```typescript
// src/components/composites/FeedLayout.tsx
'use client';

import { Post } from '@/types/post';
import { PostCard } from './PostCard';
import { Button } from '../primitives/Button';

interface FeedLayoutProps {
  posts: Post[];
  focusedPostId?: string;
  isOwner?: boolean;
  hasNewer?: boolean;
  hasOlder?: boolean;
  onLoadNewer?: () => void;
  onLoadOlder?: () => void;
  onPostExpand?: (postId: string) => void;
  onPostEdit?: (postId: string) => void;
  onPostDelete?: (postId: string) => void;
  onPostShare?: (postId: string) => void;
}

export function FeedLayout({
  posts,
  focusedPostId,
  isOwner = false,
  hasNewer = false,
  hasOlder = false,
  onLoadNewer,
  onLoadOlder,
  onPostExpand,
  onPostEdit,
  onPostDelete,
  onPostShare,
}: FeedLayoutProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">This is your space. What&apos;s on your mind?</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasNewer && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onLoadNewer}>
            Load newer posts
          </Button>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          expanded={post.id === focusedPostId}
          isOwner={isOwner}
          onExpand={() => onPostExpand?.(post.id)}
          onEdit={() => onPostEdit?.(post.id)}
          onDelete={() => onPostDelete?.(post.id)}
          onShare={() => onPostShare?.(post.id)}
        />
      ))}

      {hasOlder && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onLoadOlder}>
            Load older posts
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create stories**

```typescript
// src/components/composites/FeedLayout.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { FeedLayout } from "./FeedLayout";
import { Post } from "@/types/post";

const meta: Meta<typeof FeedLayout> = {
  title: "Composites/FeedLayout",
  component: FeedLayout,
};

export default meta;
type Story = StoryObj<typeof FeedLayout>;

const mockPosts: Post[] = [
  {
    id: '1',
    content: 'Just finished reading **Thinking, Fast and Slow**. Incredible book about decision making.',
    type: 'text',
    images: [],
    tags: [{ id: '1', name: 'books', slug: 'books' }],
    createdAt: new Date('2026-01-30T10:30:00'),
    publishedAt: new Date('2026-01-30T10:30:00'),
  },
  {
    id: '2',
    content: 'Beautiful sunset at the beach today.',
    type: 'photo',
    images: [
      { id: '1', url: 'https://picsum.photos/seed/sunset/800/600', width: 800, height: 600 },
    ],
    tags: [{ id: '2', name: 'photography', slug: 'photography' }],
    createdAt: new Date('2026-01-29T18:45:00'),
    publishedAt: new Date('2026-01-29T18:45:00'),
  },
  {
    id: '3',
    content: 'Working on a new side project. More details soon!',
    type: 'text',
    images: [],
    tags: [{ id: '3', name: 'tech', slug: 'tech' }],
    createdAt: new Date('2026-01-28T14:00:00'),
    publishedAt: new Date('2026-01-28T14:00:00'),
  },
];

export const Default: Story = {
  args: {
    posts: mockPosts,
    hasOlder: true,
    onLoadOlder: () => alert('Loading older posts...'),
    onPostExpand: (id) => alert(`Expand post ${id}`),
  },
};

export const WithFocusedPost: Story = {
  args: {
    posts: mockPosts,
    focusedPostId: '2',
    hasNewer: true,
    hasOlder: true,
  },
};

export const AsOwner: Story = {
  args: {
    posts: mockPosts,
    isOwner: true,
    hasOlder: true,
    onPostEdit: (id) => alert(`Edit post ${id}`),
    onPostDelete: (id) => alert(`Delete post ${id}`),
    onPostShare: (id) => alert(`Share post ${id}`),
  },
};

export const Empty: Story = {
  args: {
    posts: [],
  },
};
```

**Step 3: Commit**

```bash
git add src/components/composites/
git commit -m "feat: add FeedLayout composite component"
```

---

## Phase 5: Database Schema

### Task 5.1: Setup Drizzle and Create Schema

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`

**Step 1: Create Drizzle config**

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/blog.db',
  },
} satisfies Config;
```

**Step 2: Create database schema**

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  type: text('type', { enum: ['text', 'photo'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
});

export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  mimeType: text('mime_type').notNull(),
  position: integer('position').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

// Relations
export const postsRelations = relations(posts, ({ many }) => ({
  images: many(images),
  postTags: many(postTags),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  post: one(posts, {
    fields: [images.postId],
    references: [posts.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));
```

**Step 3: Create database connection**

```typescript
// src/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const dbPath = './data/blog.db';

// Ensure data directory exists
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
```

**Step 4: Add migration script to package.json**

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Step 5: Generate and run migration**

```bash
mkdir -p data
npm run db:generate
npm run db:migrate
```

**Step 6: Commit**

```bash
git add src/db/ drizzle.config.ts drizzle/ package.json data/
git commit -m "feat: add database schema with Drizzle"
```

---

## Phase 6: API Routes

See `docs/plans/2026-01-31-mvp-implementation-part3.md` for:
- Task 6.1: Posts API (CRUD)
- Task 6.2: Tags API
- Task 6.3: Images API
- Phase 7: Authentication
- Phase 8: Page Assembly
- Phase 9: Sharing & OG Images
