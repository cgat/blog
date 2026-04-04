# Drafts & Post Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow saving posts as drafts (`publishedAt = null`) and editing existing posts inline in the feed.

**Architecture:** No schema migration — reuse existing nullable `publishedAt` column. Backend changes to `createPost`/`updatePost`/`getPosts` to support draft lifecycle. Composer component gains edit mode (pre-filled props + save/cancel). FeedPage gets a Published/Drafts toggle visible only to authenticated users. PostCard renders inline Composer when in edit mode.

**Tech Stack:** Next.js App Router, Drizzle ORM (SQLite), React, Tailwind CSS 4

---

### Task 1: Backend — Draft-aware post creation

**Files:**
- Modify: `src/lib/posts.ts:7-11` (CreatePostInput interface)
- Modify: `src/lib/posts.ts:37-72` (createPost function)
- Modify: `src/app/api/posts/route.ts:28-47` (POST handler)

**Step 1: Update `CreatePostInput` to accept `isDraft`**

In `src/lib/posts.ts`, add `isDraft` to the interface:

```typescript
export interface CreatePostInput {
  content: string;
  tagIds?: string[];
  isPrivate?: boolean;
  isDraft?: boolean;
}
```

**Step 2: Update `createPost` to conditionally set `publishedAt`**

In `src/lib/posts.ts`, change the `db.insert` call so `publishedAt` is `null` when `isDraft` is true:

```typescript
await db.insert(posts).values({
  id,
  content: input.content,
  type,
  createdAt: now,
  updatedAt: now,
  publishedAt: input.isDraft ? null : now,
  isPrivate: input.isPrivate ?? false,
});
```

**Step 3: Update POST API route to pass `isDraft`**

In `src/app/api/posts/route.ts`, extract `isDraft` from body and pass it through:

```typescript
const { content, tagIds, imageIds, isPrivate, isDraft } = body;
// ...
const post = await createPost({ content: content || '', tagIds, isPrivate: !!isPrivate, isDraft: !!isDraft }, imageIds || []);
```

**Step 4: Verify dev server starts without errors**

Run: `npm run dev` — check no build errors on the posts route.

**Step 5: Commit**

```bash
git add src/lib/posts.ts src/app/api/posts/route.ts
git commit -m "feat: support draft creation with isDraft flag"
```

---

### Task 2: Backend — Draft-aware post listing

**Files:**
- Modify: `src/lib/posts.ts:123-215` (getPosts function)
- Modify: `src/app/api/posts/route.ts:5-26` (GET handler)

**Step 1: Add `draftsOnly` filter to `getPosts`**

In `src/lib/posts.ts`, add `draftsOnly` to the options parameter and filter accordingly. Add these conditions to the `whereConditions` array inside `getPosts`:

```typescript
export async function getPosts(options: {
  limit?: number;
  cursor?: Date;
  direction?: 'older' | 'newer';
  tagSlugs?: string[];
  includePrivate?: boolean;
  draftsOnly?: boolean;
}): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const { limit = 20, cursor, direction = 'older', tagSlugs, includePrivate = false, draftsOnly = false } = options;

  const whereConditions = [];

  if (!includePrivate) {
    whereConditions.push(eq(posts.isPrivate, false));
  }

  // Draft filtering
  if (draftsOnly) {
    whereConditions.push(isNull(posts.publishedAt));
  } else {
    whereConditions.push(isNotNull(posts.publishedAt));
  }

  // ... rest unchanged
```

Import `isNull` and `isNotNull` from `drizzle-orm` at the top of the file:

```typescript
import { eq, desc, lt, gt, and, isNull, isNotNull } from 'drizzle-orm';
```

**Step 2: Update GET API route to accept `draftsOnly` param**

In `src/app/api/posts/route.ts`, parse the new query param. Drafts require auth (same as private posts):

```typescript
const draftsOnly = searchParams.get('draftsOnly') === 'true';

// Only honor draftsOnly when authenticated
const session = (includePrivateParam || draftsOnly) ? await auth() : null;
const includePrivate = includePrivateParam && !!session;
const showDrafts = draftsOnly && !!session;

const result = await getPosts({
  limit,
  cursor: cursor ? new Date(cursor) : undefined,
  direction,
  tagSlugs: tags,
  includePrivate,
  draftsOnly: showDrafts,
});
```

**Step 3: Verify with dev server**

Run: `npm run dev` — hit `/api/posts?draftsOnly=true` in browser, confirm empty array (no drafts yet).

**Step 4: Commit**

```bash
git add src/lib/posts.ts src/app/api/posts/route.ts
git commit -m "feat: filter posts by draft status in getPosts"
```

---

### Task 3: Backend — Update post with publish support

**Files:**
- Modify: `src/lib/posts.ts:217-244` (updatePost function)
- Modify: `src/app/api/posts/[id]/route.ts:19-38` (PATCH handler)

**Step 1: Extend `updatePost` to handle publishing and image updates**

In `src/lib/posts.ts`, update the function to accept `publish` and `imageIds`:

```typescript
export async function updatePost(id: string, input: Partial<CreatePostInput> & { publish?: boolean; imageIds?: string[] }): Promise<PostWithRelations | null> {
  const existing = await getPost(id, { includePrivate: true, includeDrafts: true });
  if (!existing) return null;

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (input.content !== undefined) updateFields.content = input.content;
  if (input.isPrivate !== undefined) updateFields.isPrivate = input.isPrivate;
  if (input.publish) updateFields.publishedAt = new Date();

  // Update post type based on images
  if (input.imageIds !== undefined) {
    updateFields.type = input.imageIds.length > 0 ? 'photo' : 'text';
  }

  await db.update(posts)
    .set(updateFields)
    .where(eq(posts.id, id));

  // Update tags if provided
  if (input.tagIds) {
    await db.delete(postTags).where(eq(postTags.postId, id));
    if (input.tagIds.length > 0) {
      await db.insert(postTags).values(
        input.tagIds.map((tagId) => ({ postId: id, tagId }))
      );
    }
  }

  // Update image associations if provided
  if (input.imageIds !== undefined) {
    // Unlink existing images
    await db.update(images)
      .set({ postId: null })
      .where(eq(images.postId, id));
    // Link new images
    for (let i = 0; i < input.imageIds.length; i++) {
      await db.update(images)
        .set({ postId: id, position: i })
        .where(eq(images.id, input.imageIds[i]));
    }
  }

  if (input.content) {
    await processPostLinkPreviews(input.content);
  }

  return getPost(id, { includePrivate: true, includeDrafts: true });
}
```

**Step 2: Update `getPost` to support `includeDrafts`**

In `src/lib/posts.ts`, add `includeDrafts` option to `getPost`:

```typescript
export async function getPost(id: string, options?: { includePrivate?: boolean; includeDrafts?: boolean }): Promise<PostWithRelations | null> {
  const includePrivate = options?.includePrivate ?? false;
  const includeDrafts = options?.includeDrafts ?? false;
  const whereConditions = [eq(posts.id, id)];
  if (!includePrivate) {
    whereConditions.push(eq(posts.isPrivate, false));
  }
  if (!includeDrafts) {
    whereConditions.push(isNotNull(posts.publishedAt));
  }
  // ... rest unchanged
```

**Step 3: Commit**

```bash
git add src/lib/posts.ts src/app/api/posts/[id]/route.ts
git commit -m "feat: support publishing drafts and image updates in updatePost"
```

---

### Task 4: Composer — Edit mode

**Files:**
- Modify: `src/components/composites/Composer.tsx`

**Step 1: Add edit mode props to Composer**

Extend `ComposerProps` to support editing an existing post and saving drafts:

```typescript
interface ComposerProps {
  userAvatar?: string;
  userName?: string;
  existingTags?: string[];
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
    images: { id: string; url: string }[];
    isDraft: boolean;
  };
  onSave?: (data: {
    content: string;
    images: File[];
    existingImageIds: string[];
    tags: string[];
    isPrivate: boolean;
    publish?: boolean;
  }) => void | Promise<void>;
  onCancel?: () => void;
}
```

**Step 2: Initialize state from `editPost` when provided**

Update the state initializations to use edit data when present:

```typescript
const [content, setContent] = useState(editPost?.content ?? "");
const [isPrivate, setIsPrivate] = useState(editPost?.isPrivate ?? false);
const [selectedTags, setSelectedTags] = useState<string[]>(editPost?.tags ?? []);
const [existingImages, setExistingImages] = useState(editPost?.images ?? []);
```

**Step 3: Add existing image previews in the image section**

Before the new image previews, render existing images (from the post being edited) with remove buttons. Track removed existing images by filtering `existingImages` state.

```typescript
const removeExistingImage = (imageId: string) => {
  setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
};
```

Render them before new image previews:

```tsx
{existingImages.map((img) => (
  <div key={img.id} className="relative w-20 h-20">
    <img src={img.url} alt="" className="w-full h-full object-cover zissou-border" />
    <button
      onClick={() => removeExistingImage(img.id)}
      className="absolute -top-2 -right-2 w-5 h-5 bg-tracksuit-red text-white text-xs flex items-center justify-center zissou-border"
    >
      ×
    </button>
  </div>
))}
```

**Step 4: Update submit handler and buttons for edit mode**

When `editPost` is set, the submit calls `onSave` instead of `onPublish`. Show different buttons:

- Edit mode (published post): "Save" + "Cancel"
- Edit mode (draft): "Save Draft" + "Publish" + "Cancel"
- Create mode: "Save Draft" + "Publish"

```typescript
const handleSave = async (publish?: boolean) => {
  if (!content.trim() && images.length === 0 && existingImages.length === 0) return;
  await onSave?.({
    content,
    images,
    existingImageIds: existingImages.map((img) => img.id),
    tags: selectedTags,
    isPrivate,
    publish,
  });
};
```

Update the action bar buttons:

```tsx
{editPost ? (
  <div className="flex items-center gap-2">
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
```

Update `handleSubmit` to accept `isDraft`:

```typescript
const handleSubmit = async (isDraft?: boolean) => {
  if (!content.trim() && images.length === 0) return;
  await onPublish({ content, images, tags: selectedTags, isPrivate, isDraft });
  setContent("");
  setIsPrivate(false);
  setImages([]);
  setImagePreviews([]);
  setSelectedTags([]);
  setExistingImages([]);
  // ... reset search state
};
```

**Step 5: Commit**

```bash
git add src/components/composites/Composer.tsx
git commit -m "feat: add edit mode and draft support to Composer"
```

---

### Task 5: PostCard — Inline edit mode

**Files:**
- Modify: `src/components/composites/PostCard.tsx`
- Modify: `src/components/composites/FeedLayout.tsx`

**Step 1: Add draft badge and publish button to PostCard**

In `PostCard.tsx`, add a "DRAFT" badge next to the date (same style as "PRIVATE" badge) when `post.publishedAt` is null. Add a publish quick-action button for drafts:

```tsx
{!post.publishedAt && (
  <span className="flex items-center gap-1 text-submarine-yellow zissou-mono text-xs uppercase">
    Draft
  </span>
)}
```

Add `onPublish` to `PostCardProps` and render a publish button for drafts:

```typescript
interface PostCardProps {
  post: Post;
  isOwner?: boolean;
  isEditing?: boolean;
  editComposer?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onPublish?: () => void;
  onImageClick?: (image: PostImage) => void;
}
```

**Step 2: Support inline edit rendering**

When `isEditing` is true, render `editComposer` instead of the post content:

```tsx
export function PostCard({ post, isOwner, isEditing, editComposer, onEdit, onDelete, onShare, onPublish, onImageClick }: PostCardProps) {
  if (isEditing && editComposer) {
    return (
      <article className="bg-[white] zissou-border zissou-shadow p-6">
        {editComposer}
      </article>
    );
  }
  // ... existing render
}
```

**Step 3: Update FeedLayout to pass edit state through**

Add `editingPostId` and `editComposerFn` props to `FeedLayoutProps`:

```typescript
interface FeedLayoutProps {
  posts: Post[];
  isOwner?: boolean;
  hasNewer?: boolean;
  hasOlder?: boolean;
  editingPostId?: string | null;
  renderEditComposer?: (post: Post) => ReactNode;
  onLoadNewer?: () => void;
  onLoadOlder?: () => void;
  onPostEdit?: (postId: string) => void;
  onPostDelete?: (postId: string) => void;
  onPostShare?: (postId: string) => void;
  onPostPublish?: (postId: string) => void;
  onImageClick?: (image: PostImage, post: Post) => void;
}
```

Pass to PostCard:

```tsx
<PostCard
  key={post.id}
  post={post}
  isOwner={isOwner}
  isEditing={editingPostId === post.id}
  editComposer={editingPostId === post.id ? renderEditComposer?.(post) : undefined}
  onEdit={() => onPostEdit?.(post.id)}
  onDelete={() => onPostDelete?.(post.id)}
  onShare={() => onPostShare?.(post.id)}
  onPublish={() => onPostPublish?.(post.id)}
  onImageClick={(image) => onImageClick?.(image, post)}
/>
```

**Step 4: Commit**

```bash
git add src/components/composites/PostCard.tsx src/components/composites/FeedLayout.tsx
git commit -m "feat: inline edit mode for PostCard and draft badge"
```

---

### Task 6: FeedPage — Wire up editing, drafts toggle, and draft creation

**Files:**
- Modify: `src/components/pages/FeedPage.tsx`
- Modify: `src/types/post.ts`

**Step 1: Add `updatedAt` to Post type**

In `src/types/post.ts`, the backend already returns `updatedAt` but the type doesn't include it. Add it:

```typescript
export interface Post {
  id: string;
  content: string;
  type: 'text' | 'photo';
  images: PostImage[];
  tags: PostTag[];
  linkPreviews: Record<string, LinkPreviewData>;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}
```

**Step 2: Add drafts toggle state to FeedPage**

Add state for `showDrafts` and `editingPostId`:

```typescript
const [showDrafts, setShowDrafts] = useState(false);
const [editingPostId, setEditingPostId] = useState<string | null>(null);
```

**Step 3: Update `fetchPosts` to pass `draftsOnly`**

```typescript
if (showDrafts) params.set('draftsOnly', 'true');
```

Add `showDrafts` to the `useCallback` dependency array and the `useEffect` dependencies.

**Step 4: Add drafts/published toggle UI**

Render a toggle above the feed (only when `session` exists):

```tsx
{session && (
  <div className="flex gap-2 mb-6">
    <button
      onClick={() => setShowDrafts(false)}
      className={`zissou-mono text-xs uppercase px-3 py-1 ${!showDrafts ? 'bg-inkstain text-cream' : 'text-inkstain/60 hover:text-inkstain'}`}
    >
      Published
    </button>
    <button
      onClick={() => setShowDrafts(true)}
      className={`zissou-mono text-xs uppercase px-3 py-1 ${showDrafts ? 'bg-inkstain text-cream' : 'text-inkstain/60 hover:text-inkstain'}`}
    >
      Drafts
    </button>
  </div>
)}
```

**Step 5: Update `handlePublish` to support drafts**

Modify the publish handler to accept `isDraft`:

```typescript
const handlePublish = async (data: {
  content: string;
  images: File[];
  tags: string[];
  isPrivate: boolean;
  isDraft?: boolean;
}) => {
  // ... existing image upload and tag creation code ...

  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: data.content,
      imageIds,
      tagIds,
      isPrivate: data.isPrivate,
      isDraft: data.isDraft,
    }),
  });

  // ... rest unchanged
};
```

**Step 6: Add `handleEdit` (save) and `handlePublishDraft` functions**

```typescript
const handleSaveEdit = async (postId: string, data: {
  content: string;
  images: File[];
  existingImageIds: string[];
  tags: string[];
  isPrivate: boolean;
  publish?: boolean;
}) => {
  setIsSubmitting(true);
  try {
    // Upload new images
    const newImageIds: string[] = [];
    for (const file of data.images) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/images", { method: "POST", body: formData });
      const imageData = await res.json();
      newImageIds.push(imageData.id);
    }

    // Resolve tag IDs
    const tagIds: string[] = [];
    for (const tagName of data.tags) {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName }),
      });
      const tagData = await res.json();
      tagIds.push(tagData.id);
    }

    const allImageIds = [...data.existingImageIds, ...newImageIds];

    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: data.content,
        tagIds,
        imageIds: allImageIds,
        isPrivate: data.isPrivate,
        publish: data.publish,
      }),
    });

    const updatedPost = await res.json();
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...updatedPost,
              createdAt: new Date(updatedPost.createdAt),
              updatedAt: new Date(updatedPost.updatedAt),
              publishedAt: updatedPost.publishedAt ? new Date(updatedPost.publishedAt) : null,
            }
          : p
      ).filter((p) => {
        // If we just published a draft and we're viewing drafts, remove it
        if (data.publish && showDrafts && p.id === postId) return false;
        return true;
      })
    );

    setEditingPostId(null);
    await fetchTags();
  } finally {
    setIsSubmitting(false);
  }
};

const handlePublishDraft = async (postId: string) => {
  const res = await fetch(`/api/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publish: true }),
  });

  if (res.ok) {
    // Remove from drafts view
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }
};
```

**Step 7: Wire up FeedLayout with edit props**

```tsx
<FeedLayout
  posts={posts}
  isOwner={!!session}
  hasNewer={hasNewer}
  hasOlder={hasOlder}
  editingPostId={editingPostId}
  renderEditComposer={(post) => (
    <Composer
      userAvatar={session?.user?.image || undefined}
      userName={session?.user?.name || undefined}
      existingTags={tags}
      onPublish={handlePublish}
      isSubmitting={isSubmitting}
      editPost={{
        id: post.id,
        content: post.content,
        tags: post.tags.map((t) => t.name),
        isPrivate: post.isPrivate,
        images: post.images.map((img) => ({ id: img.id, url: img.url })),
        isDraft: !post.publishedAt,
      }}
      onSave={(data) => handleSaveEdit(post.id, data)}
      onCancel={() => setEditingPostId(null)}
    />
  )}
  onLoadNewer={handleLoadNewer}
  onLoadOlder={handleLoadOlder}
  onPostEdit={setEditingPostId}
  onPostDelete={setDeletePostId}
  onPostShare={setSharePostId}
  onPostPublish={(id) => handlePublishDraft(id)}
  onImageClick={handleImageClick}
/>
```

**Step 8: Commit**

```bash
git add src/components/pages/FeedPage.tsx src/types/post.ts
git commit -m "feat: wire up draft toggle, inline editing, and publish from drafts"
```

---

### Task 7: Manual testing & cleanup

**Step 1: Test the full flow in dev**

Run: `npm run dev`

Test these scenarios:
1. Create a new post → confirm it appears in Published feed
2. Save a draft → confirm it appears in Drafts view, not Published
3. Edit a draft → confirm inline Composer appears with pre-filled content
4. Publish a draft from edit mode → confirm it moves to Published
5. Publish a draft via quick-action button → confirm it moves to Published
6. Edit a published post → confirm save works, content updates
7. Add/remove images during edit → confirm images update correctly
8. Cancel an edit → confirm PostCard returns to normal view

**Step 2: Fix any issues found during testing**

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
