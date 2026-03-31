# Anonymous Likes & Sticky Mobile Nav Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add anonymous fingerprint-based post likes and a scroll-responsive sticky mobile header.

**Architecture:** Likes use a new `likes` table with a server-computed fingerprint (SHA-256 of IP + user-agent) for deduplication. A toggle endpoint creates/deletes likes. Like counts are included in post queries. The sticky nav uses a `useScrollDirection` hook that applies a CSS transform to hide/show the mobile header on scroll.

**Tech Stack:** Drizzle ORM (SQLite), Next.js API routes, React hooks, Tailwind CSS transitions.

---

### Task 1: Likes schema and migration

**Files:**
- Modify: `src/db/schema.ts`

**Step 1: Add likes table and relations to schema**

In `src/db/schema.ts`, add after the `linkPreviews` table:

```typescript
export const likes = sqliteTable('likes', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  fingerprint: text('fingerprint').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
}));
```

Also add `likes: many(likes)` to the existing `postsRelations`.

**Step 2: Generate and apply migration**

Run:
```bash
npm run db:generate
npm run db:migrate
```

**Step 3: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add likes table to schema"
```

---

### Task 2: Likes library functions

**Files:**
- Create: `src/lib/likes.ts`

**Step 1: Create likes library**

```typescript
import { db } from '@/db';
import { likes } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';

export function computeFingerprint(ip: string, userAgent: string): string {
  return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

export async function toggleLike(postId: string, fingerprint: string): Promise<{ likeCount: number; likedByMe: boolean }> {
  const existing = await db.query.likes.findFirst({
    where: and(eq(likes.postId, postId), eq(likes.fingerprint, fingerprint)),
  });

  if (existing) {
    await db.delete(likes).where(eq(likes.id, existing.id));
  } else {
    await db.insert(likes).values({
      id: uuid(),
      postId,
      fingerprint,
      createdAt: new Date(),
    });
  }

  const [result] = await db.select({ count: count() }).from(likes).where(eq(likes.postId, postId));
  const likedByMe = !existing;

  return { likeCount: result.count, likedByMe };
}

export async function getLikeCount(postId: string): Promise<number> {
  const [result] = await db.select({ count: count() }).from(likes).where(eq(likes.postId, postId));
  return result.count;
}

export async function getLikeCounts(postIds: string[]): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const results = await db.select({ postId: likes.postId, count: count() })
    .from(likes)
    .where(
      postIds.length === 1
        ? eq(likes.postId, postIds[0])
        : undefined as any // will handle below
    )
    .groupBy(likes.postId);

  // Better approach: fetch all likes grouped by postId
  const allResults = await db.select({ postId: likes.postId, count: count() })
    .from(likes)
    .groupBy(likes.postId);

  const map: Record<string, number> = {};
  for (const id of postIds) map[id] = 0;
  for (const row of allResults) {
    if (postIds.includes(row.postId)) {
      map[row.postId] = row.count;
    }
  }
  return map;
}

export async function getLikedPostIds(postIds: string[], fingerprint: string): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const results = await db.select({ postId: likes.postId })
    .from(likes)
    .where(eq(likes.fingerprint, fingerprint));

  const likedIds = new Set<string>();
  for (const row of results) {
    if (postIds.includes(row.postId)) {
      likedIds.add(row.postId);
    }
  }
  return likedIds;
}
```

**Step 2: Commit**

```bash
git add src/lib/likes.ts
git commit -m "feat: add likes library functions"
```

---

### Task 3: Like API endpoint

**Files:**
- Create: `src/app/api/posts/[id]/like/route.ts`

**Step 1: Create the toggle endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { toggleLike, computeFingerprint, getLikeCount } from '@/lib/likes';
import { getPost } from '@/lib/posts';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify post exists
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  const result = await toggleLike(id, fingerprint);
  return NextResponse.json(result);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const likeCount = await getLikeCount(id);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  const { default: { db } } = await import('@/db');
  const { likes } = await import('@/db/schema');
  const { eq, and } = await import('drizzle-orm');

  const existing = await db.query.likes.findFirst({
    where: and(eq(likes.postId, id), eq(likes.fingerprint, fingerprint)),
  });

  return NextResponse.json({ likeCount, likedByMe: !!existing });
}
```

**Step 2: Commit**

```bash
git add src/app/api/posts/[id]/like/route.ts
git commit -m "feat: add like toggle API endpoint"
```

---

### Task 4: Add like data to post responses

**Files:**
- Modify: `src/types/post.ts`
- Modify: `src/lib/posts.ts`
- Modify: `src/app/api/posts/route.ts`
- Modify: `src/app/api/posts/[id]/route.ts`

**Step 1: Add likeCount and likedByMe to Post type**

In `src/types/post.ts`, add to the `Post` interface:

```typescript
likeCount: number;
likedByMe: boolean;
```

**Step 2: Update `PostWithRelations` in `src/lib/posts.ts`**

Add to the interface:
```typescript
likeCount: number;
likedByMe: boolean;
```

Update `getPost` to accept an optional `fingerprint` parameter and return like data. Update `getPosts` similarly — use `getLikeCounts` and `getLikedPostIds` for batch efficiency.

In `getPost`, after building the result:
```typescript
const likeCount = await getLikeCount(id);
const likedByMe = fingerprint
  ? !!(await db.query.likes.findFirst({ where: and(eq(likes.postId, id), eq(likes.fingerprint, fingerprint)) }))
  : false;
```

Include `likeCount` and `likedByMe` in the return.

In `getPosts`, after mapping posts:
```typescript
const postIds = postsToReturn.map(p => p.id);
const likeCounts = await getLikeCounts(postIds);
const likedIds = fingerprint ? await getLikedPostIds(postIds, fingerprint) : new Set<string>();
```

Include `likeCount: likeCounts[result.id] || 0` and `likedByMe: likedIds.has(result.id)` in each mapped post.

**Step 3: Update API routes to pass fingerprint**

In both `src/app/api/posts/route.ts` and `src/app/api/posts/[id]/route.ts`, compute fingerprint from request headers and pass to `getPost`/`getPosts`:

```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  || request.headers.get('x-real-ip')
  || 'unknown';
const userAgent = request.headers.get('user-agent') || 'unknown';
const fingerprint = computeFingerprint(ip, userAgent);
```

**Step 4: Commit**

```bash
git add src/types/post.ts src/lib/posts.ts src/app/api/posts/route.ts src/app/api/posts/[id]/route.ts
git commit -m "feat: include like counts in post responses"
```

---

### Task 5: Like button UI in PostCard

**Files:**
- Modify: `src/components/composites/PostCard.tsx`

**Step 1: Add LikeButton component and wire into PostCard**

Add a `ThumbsUpIcon` SVG component (outline when not liked, filled when liked).

Add props to `PostCardProps`:
```typescript
onLike?: () => void;
```

Add the like button at the bottom of the post, in a new row between tags and the end of the article. Left-aligned, showing thumbs-up icon + count (count only when > 0). Apply a subtle scale animation via CSS (`transition-transform duration-150`, `scale-110` on active).

```tsx
{/* Likes */}
<div className="flex items-center gap-2 mt-3">
  <button
    onClick={onLike}
    className={`flex items-center gap-1.5 group transition-transform duration-150 active:scale-110 ${
      post.likedByMe
        ? 'text-deep-ocean-teal'
        : 'text-inkstain/30 hover:text-inkstain/60'
    }`}
  >
    <ThumbsUpIcon filled={post.likedByMe} />
    {post.likeCount > 0 && (
      <span className="zissou-mono text-xs">{post.likeCount}</span>
    )}
  </button>
</div>
```

**Step 2: Commit**

```bash
git add src/components/composites/PostCard.tsx
git commit -m "feat: add like button to PostCard"
```

---

### Task 6: Wire likes into FeedPage

**Files:**
- Modify: `src/components/composites/FeedLayout.tsx`
- Modify: `src/components/pages/FeedPage.tsx`

**Step 1: Add onLike to FeedLayout**

Pass `onLike` through FeedLayout to PostCard, similar to how `onEdit`/`onDelete` are passed.

**Step 2: Add handleLike in FeedPage**

```typescript
const handleLike = async (postId: string) => {
  // Optimistic update
  setPosts((prev) =>
    prev.map((p) =>
      p.id === postId
        ? {
            ...p,
            likedByMe: !p.likedByMe,
            likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
          }
        : p
    )
  );

  try {
    const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    const data = await res.json();
    // Sync with server truth
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likeCount: data.likeCount, likedByMe: data.likedByMe }
          : p
      )
    );
  } catch {
    // Revert on error
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    );
  }
};
```

Pass `onLike={handleLike}` to FeedLayout.

**Step 3: Commit**

```bash
git add src/components/composites/FeedLayout.tsx src/components/pages/FeedPage.tsx
git commit -m "feat: wire like interactions into feed"
```

---

### Task 7: Sticky mobile nav

**Files:**
- Create: `src/hooks/useScrollDirection.ts`
- Modify: `src/components/layout/AppLayout.tsx`

**Step 1: Create useScrollDirection hook**

```typescript
"use client";

import { useState, useEffect } from 'react';

export function useScrollDirection(threshold = 10) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      if (Math.abs(diff) < threshold) return;

      setHidden(currentScrollY > threshold && diff > 0);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return hidden;
}
```

**Step 2: Update AppLayout mobile header block**

In `src/components/layout/AppLayout.tsx`, replace:

```tsx
<div className="md:hidden">
  <Header />
</div>
```

With:

```tsx
<StickyMobileHeader />
```

Add a new client component inside AppLayout (or inline):

```tsx
function StickyMobileHeader() {
  const hidden = useScrollDirection();

  return (
    <div
      className={`md:hidden sticky top-0 z-40 transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <Header />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/hooks/useScrollDirection.ts src/components/layout/AppLayout.tsx
git commit -m "feat: add scroll-responsive sticky mobile header"
```

---

### Task 8: Build and verify

**Step 1: Run build**

```bash
npm run build
```

Expected: clean build with no errors.

**Step 2: Manual testing checklist**

- [ ] Like button appears on posts, thumbs-up icon
- [ ] Clicking like increments count, icon fills with color
- [ ] Clicking again unlikes, count decrements
- [ ] Refreshing page preserves like state (same browser)
- [ ] Like count visible to all users
- [ ] On mobile viewport: header hides on scroll down, shows on scroll up
- [ ] On desktop: header behavior unchanged (sidebar nav)
- [ ] At top of page: header always visible

**Step 3: Final commit if any fixes needed**
