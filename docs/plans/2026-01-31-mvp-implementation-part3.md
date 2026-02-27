# Personal Blog MVP Implementation Plan - Part 3

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

Continuation of `2026-01-31-mvp-implementation-part2.md`

---

## Phase 6: API Routes

### Task 6.1: Posts API

**Files:**

- Create: `src/app/api/posts/route.ts`
- Create: `src/app/api/posts/[id]/route.ts`
- Create: `src/lib/posts.ts`

**Step 1: Create posts data layer**

```typescript
// src/lib/posts.ts
import { db } from "@/db";
import { posts, images, tags, postTags } from "@/db/schema";
import { eq, desc, lt, gt, and, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface CreatePostInput {
  content: string;
  tagIds?: string[];
}

export interface PostWithRelations {
  id: string;
  content: string;
  type: "text" | "photo";
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  images: {
    id: string;
    url: string;
    width: number;
    height: number;
  }[];
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export async function createPost(
  input: CreatePostInput,
  imageIds: string[] = [],
): Promise<PostWithRelations> {
  const id = uuid();
  const now = new Date();
  const type = imageIds.length > 0 ? "photo" : "text";

  await db.insert(posts).values({
    id,
    content: input.content,
    type,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  });

  // Link tags
  if (input.tagIds && input.tagIds.length > 0) {
    await db
      .insert(postTags)
      .values(input.tagIds.map((tagId) => ({ postId: id, tagId })));
  }

  // Update images with post ID
  if (imageIds.length > 0) {
    for (let i = 0; i < imageIds.length; i++) {
      await db
        .update(images)
        .set({ postId: id, position: i })
        .where(eq(images.id, imageIds[i]));
    }
  }

  return getPost(id) as Promise<PostWithRelations>;
}

export async function getPost(id: string): Promise<PostWithRelations | null> {
  const result = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: {
      images: true,
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!result) return null;

  return {
    id: result.id,
    content: result.content,
    type: result.type,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    publishedAt: result.publishedAt,
    images: result.images.map((img) => ({
      id: img.id,
      url: `/api/images/${img.filename}`,
      width: img.width,
      height: img.height,
    })),
    tags: result.postTags.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
    })),
  };
}

export async function getPosts(options: {
  limit?: number;
  cursor?: Date;
  direction?: "older" | "newer";
  tagSlugs?: string[];
}): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const { limit = 20, cursor, direction = "older", tagSlugs } = options;

  let whereConditions = [];

  if (cursor) {
    whereConditions.push(
      direction === "older"
        ? lt(posts.createdAt, cursor)
        : gt(posts.createdAt, cursor),
    );
  }

  // Get posts
  const results = await db.query.posts.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    orderBy: direction === "older" ? desc(posts.createdAt) : posts.createdAt,
    limit: limit + 1,
    with: {
      images: true,
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  // Filter by tags if specified
  let filteredResults = results;
  if (tagSlugs && tagSlugs.length > 0) {
    filteredResults = results.filter((post) =>
      post.postTags.some((pt) => tagSlugs.includes(pt.tag.slug)),
    );
  }

  const hasMore = filteredResults.length > limit;
  const postsToReturn = filteredResults.slice(0, limit);

  if (direction === "newer") {
    postsToReturn.reverse();
  }

  return {
    posts: postsToReturn.map((result) => ({
      id: result.id,
      content: result.content,
      type: result.type,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      publishedAt: result.publishedAt,
      images: result.images.map((img) => ({
        id: img.id,
        url: `/api/images/${img.filename}`,
        width: img.width,
        height: img.height,
      })),
      tags: result.postTags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
    })),
    hasMore,
  };
}

export async function updatePost(
  id: string,
  input: Partial<CreatePostInput>,
): Promise<PostWithRelations | null> {
  const existing = await getPost(id);
  if (!existing) return null;

  await db
    .update(posts)
    .set({
      content: input.content,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));

  // Update tags if provided
  if (input.tagIds) {
    await db.delete(postTags).where(eq(postTags.postId, id));
    if (input.tagIds.length > 0) {
      await db
        .insert(postTags)
        .values(input.tagIds.map((tagId) => ({ postId: id, tagId })));
    }
  }

  return getPost(id);
}

export async function deletePost(id: string): Promise<boolean> {
  const result = await db.delete(posts).where(eq(posts.id, id));
  return true;
}
```

**Step 2: Create posts list API route**

```typescript
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPost, getPosts } from "@/lib/posts";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor");
  const direction = (searchParams.get("direction") || "older") as
    | "older"
    | "newer";
  const tags = searchParams.get("tags")?.split(",").filter(Boolean);

  const result = await getPosts({
    limit,
    cursor: cursor ? new Date(cursor) : undefined,
    direction,
    tagSlugs: tags,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, tagIds, imageIds } = body;

  if (!content?.trim() && (!imageIds || imageIds.length === 0)) {
    return NextResponse.json(
      { error: "Content or images required" },
      { status: 400 },
    );
  }

  const post = await createPost(
    { content: content || "", tagIds },
    imageIds || [],
  );
  return NextResponse.json(post, { status: 201 });
}
```

**Step 3: Create single post API route**

```typescript
// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPost, updatePost, deletePost } from "@/lib/posts";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const post = await getPost(params.id);

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const post = await updatePost(params.id, body);

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deletePost(params.id);
  return NextResponse.json({ success: true });
}
```

**Step 4: Commit**

```bash
git add src/lib/posts.ts src/app/api/posts/
git commit -m "feat: add Posts API routes"
```

---

### Task 6.2: Tags API

**Files:**

- Create: `src/app/api/tags/route.ts`
- Create: `src/lib/tags.ts`

**Step 1: Create tags data layer**

```typescript
// src/lib/tags.ts
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getAllTags(): Promise<Tag[]> {
  return db.select().from(tags);
}

export async function createTag(name: string): Promise<Tag> {
  const id = uuid();
  const slug = slugify(name);

  await db.insert(tags).values({ id, name, slug });

  return { id, name, slug };
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  const slug = slugify(name);
  const existing = await db.select().from(tags).where(eq(tags.slug, slug));

  if (existing.length > 0) {
    return existing[0];
  }

  return createTag(name);
}
```

**Step 2: Create tags API route**

```typescript
// src/app/api/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllTags, getOrCreateTag } from "@/lib/tags";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const tagsList = await getAllTags();
  return NextResponse.json(tagsList);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const tag = await getOrCreateTag(name.trim());
  return NextResponse.json(tag, { status: 201 });
}
```

**Step 3: Commit**

```bash
git add src/lib/tags.ts src/app/api/tags/
git commit -m "feat: add Tags API routes"
```

---

### Task 6.3: Images API

**Files:**

- Create: `src/app/api/images/route.ts`
- Create: `src/app/api/images/[filename]/route.ts`
- Create: `src/lib/images.ts`

**Step 1: Install sharp for image processing**

```bash
npm install sharp
npm install -D @types/sharp
```

**Step 2: Create images data layer**

```typescript
// src/lib/images.ts
import { db } from "@/db";
import { images } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import sharp from "sharp";
import { writeFile, mkdir, unlink, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = "./uploads";

export interface ImageMeta {
  id: string;
  filename: string;
  originalFilename: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadImage(file: File): Promise<ImageMeta> {
  await ensureUploadDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = uuid();
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${id}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Get image metadata
  const metadata = await sharp(buffer).metadata();

  // Save original file
  await writeFile(filepath, buffer);

  const imageMeta: ImageMeta = {
    id,
    filename,
    originalFilename: file.name,
    width: metadata.width || 0,
    height: metadata.height || 0,
    sizeBytes: buffer.length,
    mimeType: file.type,
  };

  // Save to database (without post_id initially)
  await db.insert(images).values({
    ...imageMeta,
    postId: "", // Will be updated when post is created
    position: 0,
    createdAt: new Date(),
  });

  return imageMeta;
}

export async function getImageFile(filename: string): Promise<Buffer | null> {
  const filepath = path.join(UPLOAD_DIR, filename);

  if (!existsSync(filepath)) {
    return null;
  }

  return readFile(filepath);
}

export async function deleteImage(id: string): Promise<void> {
  const image = await db.select().from(images).where(eq(images.id, id));

  if (image.length > 0) {
    const filepath = path.join(UPLOAD_DIR, image[0].filename);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }
    await db.delete(images).where(eq(images.id, id));
  }
}
```

**Step 3: Create images upload API route**

```typescript
// src/app/api/images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/images";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "File must be an image" },
      { status: 400 },
    );
  }

  const imageMeta = await uploadImage(file);
  return NextResponse.json(imageMeta, { status: 201 });
}
```

**Step 4: Create image serving route**

```typescript
// src/app/api/images/[filename]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getImageFile } from "@/lib/images";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } },
) {
  const file = await getImageFile(params.filename);

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Determine content type from filename
  const ext = params.filename.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };

  return new NextResponse(file, {
    headers: {
      "Content-Type": contentTypes[ext || "jpg"] || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
```

**Step 5: Add uploads to .gitignore**

```bash
echo "uploads/" >> .gitignore
```

**Step 6: Commit**

```bash
git add src/lib/images.ts src/app/api/images/ package.json package-lock.json .gitignore
git commit -m "feat: add Images API routes"
```

---

## Phase 7: Authentication

### Task 7.1: Setup NextAuth with Google

**Files:**

- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `.env.local.example`

**Step 1: Create auth configuration**

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow the configured email
      if (ALLOWED_EMAIL && user.email !== ALLOWED_EMAIL) {
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
```

**Step 2: Create NextAuth route**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**Step 3: Create session provider**

```typescript
// src/components/providers/SessionProvider.tsx
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

**Step 4: Update root layout**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'My Blog',
  description: 'My corner of the internet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

**Step 5: Create environment example**

```bash
# .env.local.example
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
ALLOWED_EMAIL=your@email.com
```

**Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/components/providers/ src/app/layout.tsx .env.local.example
git commit -m "feat: add NextAuth with Google OAuth"
```

---

## Phase 8: Page Assembly

### Task 8.1: Create Header Component

**Files:**

- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Header.stories.tsx`

**Step 1: Create Header component**

```typescript
// src/components/layout/Header.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Avatar } from '../primitives/Avatar';
import { Button } from '../primitives/Button';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  blogName?: string;
}

export function Header({ blogName = 'My Blog' }: HeaderProps) {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-semibold text-deep-space hover:text-blue-green transition-colors">
          {blogName}
        </a>

        {status === 'loading' ? (
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        ) : session ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <Avatar
                src={session.user?.image}
                fallback={session.user?.name || ''}
                size="sm"
              />
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px]">
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => signIn('google')}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
```

**Step 2: Create story**

```typescript
// src/components/layout/Header.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "./Header";
import { SessionProvider } from 'next-auth/react';

const meta: Meta<typeof Header> = {
  title: "Layout/Header",
  component: Header,
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Header>;

export const LoggedOut: Story = {
  args: {
    blogName: 'My Blog',
  },
};
```

**Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add Header layout component"
```

---

### Task 8.2: Create Feed Page

**Files:**

- Modify: `src/app/page.tsx`
- Create: `src/app/posts/[id]/page.tsx`

**Step 1: Create main feed page**

```typescript
// src/app/page.tsx
import { FeedPage } from '@/components/pages/FeedPage';

export default function Home() {
  return <FeedPage />;
}
```

**Step 2: Create FeedPage component**

```typescript
// src/components/pages/FeedPage.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { Header } from '../layout/Header';
import { Composer } from '../composites/Composer';
import { FilterBar } from '../composites/FilterBar';
import { FeedLayout } from '../composites/FeedLayout';
import { ConfirmDialog } from '../composites/ConfirmDialog';
import { ShareMenu } from '../composites/ShareMenu';
import { Post, PostTag } from '@/types/post';

interface FeedPageProps {
  focusedPostId?: string;
}

export function FeedPage({ focusedPostId }: FeedPageProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasNewer, setHasNewer] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  const fetchPosts = useCallback(async (cursor?: Date, direction: 'older' | 'newer' = 'older') => {
    const params = new URLSearchParams();
    params.set('limit', '20');
    if (cursor) params.set('cursor', cursor.toISOString());
    params.set('direction', direction);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

    const res = await fetch(`/api/posts?${params}`);
    const data = await res.json();

    return data;
  }, [selectedTags]);

  const fetchTags = async () => {
    const res = await fetch('/api/tags');
    const data = await res.json();
    setTags(data.map((t: PostTag) => t.name));
  };

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      const [postsData] = await Promise.all([
        fetchPosts(),
        fetchTags(),
      ]);
      setPosts(postsData.posts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      })));
      setHasOlder(postsData.hasMore);
      setIsLoading(false);
    };

    loadInitial();
  }, [fetchPosts]);

  const handlePublish = async (data: { content: string; images: File[]; tags: string[] }) => {
    setIsSubmitting(true);

    try {
      // Upload images first
      const imageIds: string[] = [];
      for (const file of data.images) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/images', { method: 'POST', body: formData });
        const imageData = await res.json();
        imageIds.push(imageData.id);
      }

      // Create tags and get IDs
      const tagIds: string[] = [];
      for (const tagName of data.tags) {
        const res = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName }),
        });
        const tagData = await res.json();
        tagIds.push(tagData.id);
      }

      // Create post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
          imageIds,
          tagIds,
        }),
      });

      const newPost = await res.json();
      setPosts((prev) => [{
        ...newPost,
        createdAt: new Date(newPost.createdAt),
        publishedAt: newPost.publishedAt ? new Date(newPost.publishedAt) : null,
      }, ...prev]);

      // Refresh tags
      await fetchTags();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePostId) return;

    await fetch(`/api/posts/${deletePostId}`, { method: 'DELETE' });
    setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
    setDeletePostId(null);
  };

  const handleLoadOlder = async () => {
    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;

    const data = await fetchPosts(lastPost.createdAt, 'older');
    setPosts((prev) => [...prev, ...data.posts.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    }))]);
    setHasOlder(data.hasMore);
  };

  const handleLoadNewer = async () => {
    const firstPost = posts[0];
    if (!firstPost) return;

    const data = await fetchPosts(firstPost.createdAt, 'newer');
    setPosts((prev) => [...data.posts.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    })), ...prev]);
    setHasNewer(data.hasMore);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const sharePost = posts.find((p) => p.id === sharePostId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {session && (
          <div className="mb-8">
            <Composer
              userAvatar={session.user?.image || undefined}
              userName={session.user?.name || undefined}
              existingTags={tags}
              onPublish={handlePublish}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        <FilterBar
          tags={tags}
          selectedTags={selectedTags}
          onTagToggle={toggleTag}
        />

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <FeedLayout
            posts={posts}
            focusedPostId={focusedPostId}
            isOwner={!!session}
            hasNewer={hasNewer}
            hasOlder={hasOlder}
            onLoadNewer={handleLoadNewer}
            onLoadOlder={handleLoadOlder}
            onPostExpand={(id) => window.location.href = `/posts/${id}`}
            onPostEdit={(id) => alert(`Edit ${id} - not implemented`)}
            onPostDelete={setDeletePostId}
            onPostShare={setSharePostId}
          />
        )}
      </main>

      <ConfirmDialog
        isOpen={!!deletePostId}
        title="Delete post?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletePostId(null)}
      />

      {sharePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSharePostId(null)} />
          <div className="relative">
            <ShareMenu
              postUrl={`${window.location.origin}/posts/${sharePost.id}`}
              postTitle={sharePost.content.slice(0, 60)}
              isOpen={true}
              onClose={() => setSharePostId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create post page**

```typescript
// src/app/posts/[id]/page.tsx
import { FeedPage } from '@/components/pages/FeedPage';
import { getPost } from '@/lib/posts';
import { Metadata } from 'next';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.id);

  if (!post) {
    return { title: 'Post not found' };
  }

  const title = post.content.slice(0, 60) || 'Post';
  const description = post.content.slice(0, 200);
  const image = post.images[0]?.url || '/og-default.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/posts/${params.id}`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function PostPage({ params }: Props) {
  return <FeedPage focusedPostId={params.id} />;
}
```

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/posts/ src/components/pages/
git commit -m "feat: add Feed and Post pages"
```

---

## Phase 9: OG Image Generation

### Task 9.1: Create OG Image Route

**Files:**

- Create: `src/app/api/og/[id]/route.tsx`

**Step 1: Create OG image generator**

```typescript
// src/app/api/og/[id]/route.tsx
import { ImageResponse } from 'next/og';
import { getPost } from '@/lib/posts';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await getPost(params.id);

  if (!post) {
    return new Response('Not found', { status: 404 });
  }

  // If post has images, redirect to first image
  if (post.images.length > 0) {
    return Response.redirect(post.images[0].url);
  }

  // Generate text-based OG image
  const content = post.content.slice(0, 280);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          backgroundColor: '#023047',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <p
          style={{
            fontSize: content.length > 140 ? '32px' : '48px',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {content}
        </p>
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ffb703',
            }}
          />
          <span style={{ fontSize: '24px', color: '#8ecae6' }}>My Blog</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

**Step 2: Update post page metadata to use OG route**

Update the image in `src/app/posts/[id]/page.tsx`:

```typescript
const image = post.images[0]?.url || `/api/og/${params.id}`;
```

**Step 3: Commit**

```bash
git add src/app/api/og/ src/app/posts/
git commit -m "feat: add OG image generation"
```

---

## Final Task: Component Index Exports

### Task 10.1: Create Export Indexes

**Files:**

- Create: `src/components/primitives/index.ts`
- Create: `src/components/composites/index.ts`
- Create: `src/components/layout/index.ts`

**Step 1: Create primitive exports**

```typescript
// src/components/primitives/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { TextArea } from "./TextArea";
export { Chip } from "./Chip";
export { Avatar } from "./Avatar";
export { IconButton } from "./IconButton";
```

**Step 2: Create composite exports**

```typescript
// src/components/composites/index.ts
export { MarkdownRenderer } from "./MarkdownRenderer";
export { MarkdownEditor } from "./MarkdownEditor";
export { ImageGrid } from "./ImageGrid";
export { PostCard } from "./PostCard";
export { Composer } from "./Composer";
export { FilterBar } from "./FilterBar";
export { ShareMenu } from "./ShareMenu";
export { ConfirmDialog } from "./ConfirmDialog";
export { FeedLayout } from "./FeedLayout";
```

**Step 3: Create layout exports**

```typescript
// src/components/layout/index.ts
export { Header } from "./Header";
```

**Step 4: Final commit**

```bash
git add src/components/
git commit -m "feat: add component index exports"
```

---

## Summary

**Total Tasks:** 31

**Phases:**

1. Project Setup (5 tasks)
2. Storybook Foundations (3 tasks)
3. Primitive Components (6 tasks)
4. Composite Components (9 tasks)
5. Database Schema (1 task)
6. API Routes (3 tasks)
7. Authentication (1 task)
8. Page Assembly (2 tasks)
9. OG Images (1 task)
10. Final cleanup (1 task)

**After completing all tasks:**

1. Run `npm run storybook` to review component library
2. Run `npm run dev` to test the app
3. Create `.env.local` with Google OAuth credentials
4. Test posting, filtering, sharing flow
