# Link Preview Component Design

Inline link previews for post content. When a bare URL appears on its own line in a post, it renders as a rich preview card with OG/Twitter metadata.

## Decisions

- **Trigger**: Bare URLs on their own line only. Inline links within sentences remain normal links.
- **Data fetching**: At publish time. Metadata is scraped and stored in the database when a post is created or updated.
- **Card style**: Large image on top, title + description + domain below.
- **Fallback**: No image shows a text-only card. Fetch failure renders the URL as a normal link (no card).

## Database

New `linkPreviews` table:

| Column      | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| id          | text      | Primary key (nanoid)           |
| url         | text      | Unique, the canonical URL      |
| title       | text      | Nullable                       |
| description | text      | Nullable                       |
| imageUrl    | text      | Nullable, the OG/twitter image |
| domain      | text      | Hostname extracted from URL    |
| scrapedAt   | integer   | Timestamp                      |

No foreign key to posts. Previews are keyed by URL and reused across posts.

## Component: LinkPreview

Location: `src/components/composites/LinkPreview/LinkPreview.tsx`

```typescript
interface LinkPreviewProps {
  url: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  domain: string
}
```

### Large image layout (imageUrl present)

- Clickable `<a>` tag, opens in new tab (`target="_blank" rel="noopener noreferrer"`)
- Full-width image on top, 16:9 aspect ratio, `object-cover`
- Title: bold, `text-deep-space`, truncated to 2 lines
- Description: `text-gray-600`, truncated to 3 lines
- Domain: small text with subtle link icon
- Card: `border border-gray-200 rounded-lg overflow-hidden`
- Hover: subtle shadow lift

### Text-only fallback (no imageUrl)

- Same card, no image area
- Title + description + domain stacked vertically
- Extra top padding to compensate

### Storybook stories

- WithImage
- WithoutImage
- LongTitle
- NoDescription
- MinimalData (just URL + domain)

## Markdown Integration

### Remark plugin

A custom remark plugin identifies paragraphs containing a single bare URL (a link node that is the sole child of a paragraph, where link text matches the URL). These nodes are transformed into a custom `linkPreview` MDAST node type.

### MarkdownRenderer changes

Updated props:

```typescript
interface MarkdownRendererProps {
  content: string
  linkPreviews?: Record<string, LinkPreviewData>  // keyed by URL
}
```

Custom component mapping renders `linkPreview` nodes as `<LinkPreview>` components, looking up preview data from the `linkPreviews` prop.

### PostCard changes

Passes `linkPreviews` data through to `MarkdownRenderer`. The post-fetching logic queries matching `linkPreviews` rows for URLs found in the content.

## Scraping Logic

New module: `src/lib/link-previews.ts`

### `scrapeMetadata(url: string): Promise<LinkPreviewData | null>`

- Fetches URL with 5-second timeout and browser-like User-Agent
- Parses HTML for meta tags in priority order:
  - Title: `og:title` > `twitter:title` > `<title>`
  - Description: `og:description` > `twitter:description` > `<meta name="description">`
  - Image: `og:image` > `twitter:image`
- Extracts domain via `new URL(url).hostname`
- Returns `null` on failure (timeout, non-HTML, network error)

### `extractBareUrls(content: string): string[]`

Parses markdown to find bare URLs on their own line. Same detection logic as the remark plugin, used server-side at publish time.

### `processPostLinkPreviews(content: string): Promise<void>`

Called during post creation/update:
1. Extract bare URLs from content
2. Check which URLs already have stored previews
3. Scrape metadata for new URLs
4. Save results to `linkPreviews` table
5. Silently skip individual failures

## Dependencies

- `cheerio` — HTML parsing for metadata extraction. Lightweight, well-maintained, no browser needed.

## Files to create/modify

### New files
- `src/components/composites/LinkPreview/LinkPreview.tsx`
- `src/components/composites/LinkPreview/LinkPreview.stories.tsx`
- `src/lib/link-previews.ts`
- Migration file for `linkPreviews` table

### Modified files
- `src/db/schema.ts` — add `linkPreviews` table
- `src/components/composites/MarkdownRenderer/MarkdownRenderer.tsx` — add remark plugin and `linkPreviews` prop
- `src/components/composites/PostCard/PostCard.tsx` — pass `linkPreviews` to MarkdownRenderer
- `src/types/post.ts` — add `LinkPreviewData` type, add `linkPreviews` to `Post`
- `src/lib/posts.ts` — query link previews when fetching posts, call `processPostLinkPreviews` on create/update
- `src/components/composites/index.ts` — export LinkPreview
- `src/app/api/posts/route.ts` — call link preview processing on post create
