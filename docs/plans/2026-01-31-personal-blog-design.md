# Personal Blog Design

> "My corner of the internet, where I post thoughts, ideas, photos, and neat creative features that I've built"

## Core Essence

A sovereign personal space on the internet - part blog, part creative playground. You post for yourself first, share to communities when you choose, and build new features because creation is the point.

## Guiding Principles

1. **Ownership over reach** - Your space, your rules, your data
2. **Intentionality over speed** - Each post is considered, not compulsive
3. **Quiet confidence** - Publishing is complete in itself; sharing is optional
4. **Human but minimal** - Warm and personal, but content leads
5. **Desktop-first creation** - Considered posting, not quick capture
6. **Platform as craft** - Building features is part of the creative expression

## MVP Scope

### Post Types
- **Text** - Markdown-formatted posts
- **Photos** - One or more images, always with optional text/caption
- Every post can have text; photos complement text

### Features
- Public feed with tag-based filtering (filter chips, combinable)
- Expandable/collapsible post cards
- Single unified composer (text + photos + tags)
- Markdown support with preview toggle
- Google OAuth (single authorized user)
- Share to Facebook via URL-based sharing (OG metadata does the work)
- Storybook-first component library

### Out of Scope (Future)
- Additional post types (videos, stories, book reviews, movie reviews, playlists)
- Additional platforms (Twitter/X, Instagram, Goodreads, Letterboxd, Spotify)
- Private/visibility controls on posts
- Drafts and scheduling
- Plugin architecture for extensibility
- Comments or reactions

---

## Architecture

### Tech Stack
- **TypeScript** throughout
- **Next.js** (app router) - public feed, post pages, admin UI, API routes
- **SQLite** + **Drizzle ORM** - single-file database
- **Tailwind CSS** - styling
- **Storybook** - component development
- **Hetzner VPS** - self-hosted
- **Imagor** - on-demand image processing

### Why Not Nest.js Initially?
Next.js API routes handle MVP needs (CRUD, OAuth, image uploads). Nest.js adds complexity we don't need yet. Can extract later if backend grows.

### Data Flow
1. Authenticate via Google OAuth
2. Compose post in admin UI (markdown + optional photos + tags)
3. Post saves to SQLite, images upload to local filesystem
4. Next.js serves post page with OG metadata
5. "Share" opens platform's composer with URL pre-filled

---

## Data Model

### Posts Table
```
posts
├── id (uuid, primary key)
├── content (text - markdown body)
├── type (enum: 'text' | 'photo') - derived but stored for filtering
├── created_at (timestamp)
├── updated_at (timestamp)
└── published_at (timestamp, nullable - null means draft)
```

### Images Table
```
images
├── id (uuid, primary key)
├── post_id (foreign key → posts)
├── filename (string - stored file path)
├── original_filename (string - what user uploaded)
├── width (integer)
├── height (integer)
├── size_bytes (integer)
├── mime_type (string)
├── position (integer - order in post)
└── created_at (timestamp)
```

### Tags Table
```
tags
├── id (uuid, primary key)
├── name (string, unique)
└── slug (string, unique)
```

### Post Tags Table (Many-to-Many)
```
post_tags
├── post_id (foreign key → posts)
└── tag_id (foreign key → tags)
```

---

## Design System

### Color Tokens
```
Primary:      --blue-green (#219ebc) - buttons, links, interactive elements
Secondary:    --sky-blue-light (#8ecae6) - backgrounds, hover states, tags
Accent:       --amber-flame (#ffb703) - highlights, notifications, focus rings
Accent-bold:  --princeton-orange (#fb8500) - CTAs, important actions
Dark:         --deep-space-blue (#023047) - text, headers, dark accents
Neutral:      white, black, gray gradients - backgrounds, surfaces, borders
```

### Visual Personality
Human and approachable, but design doesn't compete with content. Personality comes through in color and subtle details, not loud elements.

### Typography
- Clean sans-serif (Inter or similar)
- Limited scale: body, small, heading-1, heading-2
- High contrast for readability

### Component Library (Storybook)

**Foundations:**
- `ColorPalette` - visual documentation
- `Typography` - text styles showcase
- `Spacing` - consistent spacing scale

**Primitives:**
- `Button` - primary, secondary, ghost variants
- `Input` - text input with label/error states
- `TextArea` - markdown input, auto-expands
- `Chip` - filter chips, toggleable
- `Avatar` - user avatar for auth state
- `IconButton` - share, delete, edit actions

**Composites:**
- `PostCard` - single post in feed (collapsed and expanded states)
- `ImageGrid` - responsive layout for 1+ images
- `MarkdownRenderer` - renders markdown to styled HTML
- `MarkdownEditor` - text area with preview toggle
- `Composer` - text area + image upload + tags + publish button
- `FilterBar` - row of filter chips (tags)
- `FeedLayout` - scrollable post list with load more buttons
- `ShareMenu` - share options for a post
- `ConfirmDialog` - delete confirmation

---

## Feed & Navigation

### The Feed is the App
The home page (`/`) shows the chronological feed - newest first. A post page (`/posts/[id]`) is the same feed, but:
- URL determines OG metadata served
- Feed loads 10 posts before + focused post (expanded) + 10 after
- Focused post is scrolled into view and expanded

### Filter Chips
- Dynamically generated from existing tags
- Toggleable - combine multiple tags
- URL updates with filter state (`/?tag=travel`)
- Filter changes reset pagination

### Pagination
- Load 20 posts initially on home
- Load 10 before + focused + 10 after on post pages
- "Load newer" and "Load older" buttons
- Cursor-based pagination using `created_at`

### Post Card States
- **Collapsed** - preview in feed, truncated content
- **Expanded** - full content, larger images, all details

---

## Composer

### Layout
```
┌─────────────────────────────────────────┐
│ [Avatar]  What's on your mind?          │
│                                         │
│  [Markdown text area - auto-expands]    │
│                                         │
│  [Preview toggle]                       │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ img │ │ img │ │  +  │  (if images)  │
│  └─────┘ └─────┘ └─────┘               │
│                                         │
│  [Tag chips: + Add tag]                 │
│                                         │
│  [Photo icon]         [Publish button]  │
└─────────────────────────────────────────┘
```

### Behavior
- Raw markdown input, preview toggle available
- Text area grows as you type
- Drag-drop or click to add photos
- Photos appear as thumbnails with remove (×) option
- Reorder photos via drag
- Add existing tags or create new ones inline
- Publish posts immediately
- After publish: composer clears, new post appears at top of feed

### Validation
- Require at least text OR one image
- Image size/format validation on upload
- Show upload progress

### Empty State
Warm and inviting: "This is your space. What's on your mind?" with composer ready.

---

## Sharing & Open Graph

### Open Graph Metadata
Each post URL (`/posts/[id]`) serves dynamic OG metadata:
```
og:title       → First ~60 chars of content (or "Photo post" fallback)
og:description → Full content truncated to ~200 chars
og:image       → First image if photo post, or generated OG image with text
og:url         → Canonical post URL
og:type        → "article"
```

For text-only posts: generate OG image with post text on branded background (deep-space-blue + accent colors) using Next.js `ImageResponse`.

### Share Flow
1. User clicks "Share" on a post
2. Share menu shows available platforms (Facebook initially)
3. Clicking Facebook opens: `https://www.facebook.com/sharer/sharer.php?u={post_url}`
4. Facebook scrapes OG tags, pre-populates the share
5. User reviews, adds commentary if desired, posts

### Why URL-Based Sharing
- No API tokens or app approval needed
- User has full control
- OG metadata does the heavy lifting
- Extends easily to other platforms

### Future Platform Pattern
Each platform becomes a "share adapter" - a function returning the share URL with appropriate parameters.

---

## Authentication

### Google OAuth Flow
1. User visits site - sees public feed, no composer
2. Clicks "Sign in" in header
3. Redirected to Google OAuth
4. On success, session established
5. Composer visible, edit/delete actions appear on posts

### Session Management
- JWT in HTTP-only cookie
- 7-day expiry (configurable)
- Single authorized user (email in env var)
- Others see "unauthorized" message

### Header States
```
Logged out:  [Blog Name]                    [Sign in]
Logged in:   [Blog Name]                [Avatar ▼] → Sign out
```

### Admin Actions
- Edit: Opens post in composer
- Delete: Confirmation dialog
- Share: Opens share menu

No separate admin route - authentication reveals authoring capabilities in the same feed UI.

---

## Development Approach

### Storybook-First Workflow
1. Build complete component library in Storybook
2. Establish consistent patterns across all elements
3. Review full library for cohesion
4. Assemble components into pages

### Component Development Order
1. Foundations (colors, typography, spacing)
2. Primitives (button, input, chip, etc.)
3. Composites (post card, composer, feed layout)
4. Page assembly

---

## Image Handling

### Upload Flow
1. User adds image(s) in composer
2. Images upload to Hetzner filesystem
3. Metadata (dimensions, size, mime type) stored in SQLite
4. Imagor URL constructed for serving/transformations

### Imagor Integration
- On-demand resizing and optimization
- URL-based transformations: `/unsafe/{width}x{height}/{path}`
- Lazy generation - processed on first request

### Storage
- Original images stored on filesystem
- Database stores path + metadata
- Imagor handles all transformations

---

## Future Considerations

Designed with extensibility in mind:
- **Privacy controls** - Add `visibility` field to posts
- **New post types** - Extend `type` enum, add type-specific tables
- **New platforms** - Add share adapters following URL pattern, or API integration
- **Plugin architecture** - Standard specs for post types and share adapters
- **Nest.js extraction** - If backend complexity grows

---

## Success Criteria

The MVP is successful when:
1. You can post text and photos from desktop
2. Posts appear in a filterable feed
3. Each post has a shareable URL with proper OG metadata
4. You can share to Facebook with one click
5. The component library feels cohesive in Storybook
6. It feels like *your* space
