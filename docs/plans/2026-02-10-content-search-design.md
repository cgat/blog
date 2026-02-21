# Content Search Feature Design

Extensible content source buttons in the Composer that search external sites (Letterboxd, GoodReads, etc.) via Google Custom Search API, inject the selected link into the post, and auto-tag it.

## Decisions

- **Search backend**: Google Custom Search JSON API, scoped with `site:` filter per source.
- **Source config**: Hardcoded TypeScript array in `src/lib/content-sources.ts`. Adding a source = adding an array entry.
- **UI**: Individual buttons per source in the Composer toolbar. Search input + results dropdown inline.
- **Approval flow**: Top 5 results shown in dropdown, click to approve.
- **On approval**: URL prepended to post content as first line + blank line. Source tag auto-added.

## Google Custom Search Setup

1. Enable Custom Search API in Google Cloud Console
2. Create API key, scope to Custom Search API only
3. Create Programmable Search Engine at programmablesearchengine.google.com with `letterboxd.com/*`
4. Add `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` to `.env.local`
5. Add IP restriction to API key before deploying to production

## Content Sources Config

```typescript
interface ContentSource {
  id: string;
  label: string;        // Button text: "Movie"
  tag: string;           // Auto-applied tag: "Movie Review"
  siteFilter: string;    // Google CSE site scope: "letterboxd.com/film/"
}

const contentSources: ContentSource[] = [
  { id: 'movie-review', label: 'Movie', tag: 'Movie Review', siteFilter: 'letterboxd.com/film/' },
];
```

## API Route

`POST /api/content-search` (auth required)

Request: `{ sourceId: string, query: string }`

Server-side: looks up source, calls Google CSE with `site:<siteFilter>+<query>&num=5`

Response: `{ results: [{ title, url, snippet }] }`

Empty results array on failure. Stateless — no DB involved.

## Composer UI Flow

1. Source button clicked -> search input row appears above action bar
2. User types movie title, presses Enter or clicks sparkle button
3. Loading spinner while searching
4. Up to 5 results in dropdown: title (bold) + URL (gray) per row
5. Click result -> URL prepended to content, tag added, input dismissed
6. Clicking source button again toggles input closed

## Files

### New files
- `src/lib/content-sources.ts` — source definitions
- `src/app/api/content-search/route.ts` — search API route

### Modified files
- `src/components/composites/Composer.tsx` — source buttons, search input, results, injection
- `src/components/composites/Composer.stories.tsx` — new stories
- `.env.local.example` — new env vars
