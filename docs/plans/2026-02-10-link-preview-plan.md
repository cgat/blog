# Link Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When a bare URL appears on its own line in a post, render a rich preview card with OG/Twitter metadata scraped at publish time.

**Architecture:** New `linkPreviews` DB table stores scraped metadata keyed by URL. At post creation, bare URLs are extracted from content and scraped via cheerio. At render time, `MarkdownRenderer` detects bare-URL paragraphs and replaces them with `LinkPreview` cards using data passed down from `PostCard`.

**Tech Stack:** Drizzle ORM (SQLite), cheerio (HTML parsing), react-markdown (rendering), Tailwind CSS 4

---

### Task 1: Install cheerio dependency

**Files:**
- Modify: `package.json`

**Step 1: Install cheerio**

Run: `npm install cheerio`

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add cheerio for link preview HTML parsing"
```

---

### Task 2: Add linkPreviews table to database schema

**Files:**
- Modify: `src/db/schema.ts`

**Step 1: Add the linkPreviews table and relations**

Add to the end of `src/db/schema.ts`:

```typescript
export const linkPreviews = sqliteTable('link_previews', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title'),
  description: text('description'),
  imageUrl: text('image_url'),
  domain: text('domain').notNull(),
  scrapedAt: integer('scraped_at', { mode: 'timestamp' }).notNull(),
});
```

No relations needed — link previews are looked up by URL, not joined via foreign keys.

**Step 2: Generate migration**

Run: `npm run db:generate`

**Step 3: Apply migration**

Run: `npm run db:migrate`

**Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add linkPreviews table to database schema"
```

---

### Task 3: Add LinkPreviewData type and update Post interface

**Files:**
- Modify: `src/types/post.ts`

**Step 1: Add LinkPreviewData interface and update Post**

Add the `LinkPreviewData` interface and add `linkPreviews` to `Post`:

```typescript
export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  domain: string;
}

export interface Post {
  id: string;
  content: string;
  type: 'text' | 'photo';
  images: PostImage[];
  tags: PostTag[];
  linkPreviews: Record<string, LinkPreviewData>; // keyed by URL
  createdAt: Date;
  publishedAt: Date | null;
}
```

**Step 2: Commit**

```bash
git add src/types/post.ts
git commit -m "feat: add LinkPreviewData type and linkPreviews to Post"
```

---

### Task 4: Create the scraping logic

**Files:**
- Create: `src/lib/link-previews.ts`

**Step 1: Create src/lib/link-previews.ts**

```typescript
import { db } from '@/db';
import { linkPreviews } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import * as cheerio from 'cheerio';

export interface ScrapedMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  domain: string;
}

export async function scrapeMetadata(url: string): Promise<ScrapedMetadata | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      null;

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null;

    const imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null;

    const domain = new URL(url).hostname;

    return { title, description, imageUrl, domain };
  } catch {
    return null;
  }
}

/**
 * Extract bare URLs from markdown content.
 * A "bare URL" is a line that contains only a URL (possibly with whitespace).
 * This matches the rendering behavior where paragraphs with a single autolink
 * are replaced with preview cards.
 */
export function extractBareUrls(content: string): string[] {
  const lines = content.split('\n');
  const urlPattern = /^\s*(https?:\/\/[^\s]+)\s*$/;
  const urls: string[] = [];

  for (const line of lines) {
    const match = line.match(urlPattern);
    if (match) {
      urls.push(match[1]);
    }
  }

  return urls;
}

/**
 * Process link previews for a post's content.
 * Extracts bare URLs, checks for existing previews, scrapes new ones.
 */
export async function processPostLinkPreviews(content: string): Promise<void> {
  const urls = extractBareUrls(content);
  if (urls.length === 0) return;

  // Check which URLs already have previews
  const existing = await db
    .select({ url: linkPreviews.url })
    .from(linkPreviews)
    .where(inArray(linkPreviews.url, urls));

  const existingUrls = new Set(existing.map((e) => e.url));
  const newUrls = urls.filter((url) => !existingUrls.has(url));

  // Scrape new URLs
  for (const url of newUrls) {
    const metadata = await scrapeMetadata(url);
    if (metadata) {
      await db.insert(linkPreviews).values({
        id: uuid(),
        url,
        title: metadata.title,
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        domain: metadata.domain,
        scrapedAt: new Date(),
      });
    }
  }
}

/**
 * Get link preview data for a set of URLs.
 * Returns a Record keyed by URL for easy lookup in rendering.
 */
export async function getLinkPreviewsForUrls(
  urls: string[]
): Promise<Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string }>> {
  if (urls.length === 0) return {};

  const previews = await db
    .select()
    .from(linkPreviews)
    .where(inArray(linkPreviews.url, urls));

  const result: Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string }> = {};
  for (const p of previews) {
    result[p.url] = {
      url: p.url,
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl,
      domain: p.domain,
    };
  }

  return result;
}
```

**Step 2: Commit**

```bash
git add src/lib/link-previews.ts
git commit -m "feat: add link preview scraping and storage logic"
```

---

### Task 5: Create the LinkPreview component

**Files:**
- Create: `src/components/composites/LinkPreview.tsx`

**Step 1: Create the component**

```tsx
interface LinkPreviewProps {
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  domain: string;
}

export function LinkPreview({ url, title, description, imageUrl, domain }: LinkPreviewProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow not-prose"
    >
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={title || ''}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={`px-4 ${imageUrl ? 'py-3' : 'py-4'}`}>
        {title && (
          <p className="font-semibold text-deep-space line-clamp-2 text-sm">
            {title}
          </p>
        )}
        {description && (
          <p className="text-gray-600 text-sm line-clamp-3 mt-1">
            {description}
          </p>
        )}
        <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {domain}
        </p>
      </div>
    </a>
  );
}
```

Note: `not-prose` class prevents Tailwind Typography from styling the card internals, since this renders inside the prose container of MarkdownRenderer.

**Step 2: Commit**

```bash
git add src/components/composites/LinkPreview.tsx
git commit -m "feat: add LinkPreview component"
```

---

### Task 6: Create Storybook stories for LinkPreview

**Files:**
- Create: `src/components/composites/LinkPreview.stories.tsx`

**Step 1: Create stories**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { LinkPreview } from "./LinkPreview";

const meta: Meta<typeof LinkPreview> = {
  title: "Composites/LinkPreview",
  component: LinkPreview,
};

export default meta;
type Story = StoryObj<typeof LinkPreview>;

export const WithImage: Story = {
  args: {
    url: "https://example.com/article",
    title: "How to Build a Personal Blog with Next.js",
    description: "A comprehensive guide to building your own blog using Next.js, TypeScript, and SQLite. Learn about the POSSE model and why owning your content matters.",
    imageUrl: "https://picsum.photos/800/400",
    domain: "example.com",
  },
};

export const WithoutImage: Story = {
  args: {
    url: "https://example.com/article",
    title: "How to Build a Personal Blog with Next.js",
    description: "A comprehensive guide to building your own blog using Next.js, TypeScript, and SQLite.",
    imageUrl: null,
    domain: "example.com",
  },
};

export const LongTitle: Story = {
  args: {
    url: "https://example.com/article",
    title: "This Is an Extremely Long Article Title That Should Be Truncated After Two Lines Because Otherwise It Would Take Up Too Much Space in the Card Layout",
    description: "Short description.",
    imageUrl: "https://picsum.photos/800/400",
    domain: "example.com",
  },
};

export const NoDescription: Story = {
  args: {
    url: "https://github.com/vercel/next.js",
    title: "vercel/next.js",
    description: null,
    imageUrl: "https://picsum.photos/800/400",
    domain: "github.com",
  },
};

export const MinimalData: Story = {
  args: {
    url: "https://example.com",
    title: null,
    description: null,
    imageUrl: null,
    domain: "example.com",
  },
};
```

**Step 2: Verify in Storybook**

Run: `npm run storybook`

Navigate to Composites/LinkPreview and verify all 5 stories render correctly.

**Step 3: Commit**

```bash
git add src/components/composites/LinkPreview.stories.tsx
git commit -m "feat: add LinkPreview Storybook stories"
```

---

### Task 7: Export LinkPreview from composites index

**Files:**
- Modify: `src/components/composites/index.ts`

**Step 1: Add export**

Add this line to `src/components/composites/index.ts`:

```typescript
export { LinkPreview } from './LinkPreview';
```

**Step 2: Commit**

```bash
git add src/components/composites/index.ts
git commit -m "feat: export LinkPreview from composites"
```

---

### Task 8: Integrate LinkPreview into MarkdownRenderer

**Files:**
- Modify: `src/components/composites/MarkdownRenderer.tsx`

**Step 1: Update MarkdownRenderer to accept linkPreviews and render them**

Replace the entire contents of `src/components/composites/MarkdownRenderer.tsx`:

```tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LinkPreview } from './LinkPreview';
import type { LinkPreviewData } from '@/types/post';

interface MarkdownRendererProps {
  content: string;
  truncate?: number;
  linkPreviews?: Record<string, LinkPreviewData>;
}

export function MarkdownRenderer({ content, truncate, linkPreviews }: MarkdownRendererProps) {
  const displayContent = truncate && content.length > truncate
    ? content.slice(0, truncate) + '...'
    : content;

  return (
    <div className="prose prose-slate max-w-none prose-a:text-blue-green prose-headings:text-deep-space">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children, ...props }) => {
            // Detect paragraphs containing only a bare URL
            const childArray = React.Children.toArray(children);
            if (childArray.length === 1 && linkPreviews) {
              const child = childArray[0];
              if (
                React.isValidElement(child) &&
                child.type === 'a' &&
                typeof child.props.href === 'string'
              ) {
                const href = child.props.href;
                const text = child.props.children;
                if (typeof text === 'string' && text === href && linkPreviews[href]) {
                  const preview = linkPreviews[href];
                  return (
                    <LinkPreview
                      url={preview.url}
                      title={preview.title}
                      description={preview.description}
                      imageUrl={preview.imageUrl}
                      domain={preview.domain}
                    />
                  );
                }
              }
            }
            return <p {...props}>{children}</p>;
          },
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}
```

Key details:
- `'use client'` directive added because we now use `React.Children` (client-side API)
- The `p` component override checks if a paragraph contains a single `<a>` where the href matches the displayed text (indicating a bare autolink from GFM)
- If a matching preview exists in the `linkPreviews` prop, render `<LinkPreview>` instead of `<p>`
- `not-prose` class on LinkPreview prevents Tailwind Typography from interfering

**Step 2: Commit**

```bash
git add src/components/composites/MarkdownRenderer.tsx
git commit -m "feat: integrate LinkPreview into MarkdownRenderer"
```

---

### Task 9: Update MarkdownRenderer Storybook stories

**Files:**
- Modify: `src/components/composites/MarkdownRenderer.stories.tsx`

**Step 1: Add a story with link previews**

Add to the end of `src/components/composites/MarkdownRenderer.stories.tsx`:

```tsx
export const WithLinkPreview: Story = {
  args: {
    content: `Check out this article:

https://example.com/blog/nextjs-guide

It really helped me understand the App Router.`,
    linkPreviews: {
      'https://example.com/blog/nextjs-guide': {
        url: 'https://example.com/blog/nextjs-guide',
        title: 'The Complete Guide to Next.js App Router',
        description: 'Learn everything about the new App Router in Next.js, including server components, layouts, and data fetching patterns.',
        imageUrl: 'https://picsum.photos/800/400',
        domain: 'example.com',
      },
    },
  },
};

export const WithLinkPreviewNoImage: Story = {
  args: {
    content: `https://example.com/article`,
    linkPreviews: {
      'https://example.com/article': {
        url: 'https://example.com/article',
        title: 'An Interesting Article',
        description: 'This article has no OG image, so it renders as a text-only card.',
        imageUrl: null,
        domain: 'example.com',
      },
    },
  },
};

export const WithInlineAndBareLinks: Story = {
  args: {
    content: `I found [this resource](https://example.com/inline) very helpful.

https://example.com/bare-url

The inline link above should remain a normal link, while the bare URL gets a preview card.`,
    linkPreviews: {
      'https://example.com/bare-url': {
        url: 'https://example.com/bare-url',
        title: 'Bare URL Gets a Preview',
        description: 'Only bare URLs on their own line get preview cards.',
        imageUrl: 'https://picsum.photos/800/400',
        domain: 'example.com',
      },
    },
  },
};
```

**Step 2: Verify in Storybook**

Run: `npm run storybook`

Navigate to Composites/MarkdownRenderer and verify:
- `WithLinkPreview`: bare URL replaced with large image card
- `WithLinkPreviewNoImage`: bare URL replaced with text-only card
- `WithInlineAndBareLinks`: inline link is a normal link, bare URL is a card

**Step 3: Commit**

```bash
git add src/components/composites/MarkdownRenderer.stories.tsx
git commit -m "feat: add MarkdownRenderer stories with link previews"
```

---

### Task 10: Wire up post fetching to include link previews

**Files:**
- Modify: `src/lib/posts.ts`

**Step 1: Import link preview functions**

Add to imports at the top of `src/lib/posts.ts`:

```typescript
import { extractBareUrls, getLinkPreviewsForUrls, processPostLinkPreviews } from '@/lib/link-previews';
```

**Step 2: Add linkPreviews to PostWithRelations**

Update the `PostWithRelations` interface to include:

```typescript
export interface PostWithRelations {
  id: string;
  content: string;
  type: 'text' | 'photo';
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
  linkPreviews: Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string }>;
}
```

**Step 3: Update getPost to fetch link previews**

In the `getPost` function, after fetching the post and before the return, add link preview fetching:

```typescript
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

  const urls = extractBareUrls(result.content);
  const linkPreviewData = await getLinkPreviewsForUrls(urls);

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
    linkPreviews: linkPreviewData,
  };
}
```

**Step 4: Update getPosts to fetch link previews**

In the `getPosts` function, after fetching results and before the return, batch-fetch link previews for all posts:

```typescript
  // Collect all bare URLs from all posts
  const allUrls = postsToReturn.flatMap((result) => extractBareUrls(result.content));
  const linkPreviewData = await getLinkPreviewsForUrls([...new Set(allUrls)]);

  return {
    posts: postsToReturn.map((result) => {
      const postUrls = extractBareUrls(result.content);
      const postPreviews: Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string }> = {};
      for (const url of postUrls) {
        if (linkPreviewData[url]) {
          postPreviews[url] = linkPreviewData[url];
        }
      }

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
        linkPreviews: postPreviews,
      };
    }),
    hasMore,
  };
```

**Step 5: Update createPost to scrape link previews**

In the `createPost` function, after creating the post and before the return, add:

```typescript
  // Scrape link previews for any bare URLs in the content
  await processPostLinkPreviews(input.content);
```

**Step 6: Update updatePost to scrape link previews**

In the `updatePost` function, after updating the post, add:

```typescript
  if (input.content) {
    await processPostLinkPreviews(input.content);
  }
```

**Step 7: Commit**

```bash
git add src/lib/posts.ts
git commit -m "feat: wire up link preview fetching and scraping in post CRUD"
```

---

### Task 11: Update PostCard to pass linkPreviews to MarkdownRenderer

**Files:**
- Modify: `src/components/composites/PostCard.tsx`

**Step 1: Update the MarkdownRenderer call**

In `PostCard.tsx`, update the content rendering section to pass `linkPreviews`:

```tsx
      {/* Content */}
      <div className="mb-4">
        <MarkdownRenderer content={post.content} linkPreviews={post.linkPreviews} />
      </div>
```

No changes to `PostCardProps` needed — it already uses the `Post` type which now includes `linkPreviews`.

**Step 2: Commit**

```bash
git add src/components/composites/PostCard.tsx
git commit -m "feat: pass linkPreviews from PostCard to MarkdownRenderer"
```

---

### Task 12: Update FeedPage to pass linkPreviews through post data

**Files:**
- Modify: `src/components/pages/FeedPage.tsx`

**Step 1: Update post mapping to include linkPreviews**

The `FeedPage` maps API response data to `Post` objects. Update the mapping in `loadInitial`, `handlePublish`, `handleLoadOlder`, and `handleLoadNewer` to include `linkPreviews`. For each `(p: Post)` mapping, add:

```typescript
linkPreviews: p.linkPreviews || {},
```

For example, in `loadInitial`:

```typescript
setPosts(postsData.posts.map((p: Post) => ({
  ...p,
  createdAt: new Date(p.createdAt),
  publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
  linkPreviews: p.linkPreviews || {},
})));
```

Apply the same pattern to `handleLoadOlder`, `handleLoadNewer`, and `handlePublish`.

**Step 2: Commit**

```bash
git add src/components/pages/FeedPage.tsx
git commit -m "feat: pass linkPreviews through FeedPage post mapping"
```

---

### Task 13: End-to-end verification

**Step 1: Build the project**

Run: `npm run build`

Fix any TypeScript errors.

**Step 2: Start dev server**

Run: `npm run dev`

**Step 3: Test manually**

1. Create a new post with a bare URL on its own line (e.g., `https://github.com`)
2. Verify the URL is scraped and a preview card appears after the page refreshes
3. Verify inline links (e.g., `[GitHub](https://github.com)`) remain normal links
4. Verify posts without URLs render normally

**Step 4: Verify Storybook**

Run: `npm run storybook`

Confirm all LinkPreview and MarkdownRenderer stories render correctly.

**Step 5: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: address issues found during link preview integration testing"
```
