# Personal Blog

A personal blog/journal following the POSSE model (Publish Own Site, Syndicate Elsewhere). This is the source of truth for all content.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS 4 with `@theme inline` design tokens
- **Components**: Storybook 10 for component development
- **Auth**: NextAuth v5 with Google OAuth (single authorized user)
- **Node**: v20+ (managed via asdf, see `.tool-versions`)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── content-search/# Google CSE proxy for content sources
│   │   ├── images/        # Image upload and serving
│   │   ├── posts/         # CRUD for posts
│   │   └── tags/          # Tag management
│   ├── posts/[id]/        # Individual post pages (for OG metadata/sharing)
│   └── page.tsx           # Main feed
├── components/
│   ├── foundations/       # Design system documentation (colors, spacing, typography)
│   ├── primitives/        # Basic UI elements (Button, Input, Avatar, Chip, etc.)
│   ├── composites/        # Complex components (PostCard, Composer, FeedLayout, etc.)
│   ├── layout/            # Layout components (Header)
│   ├── pages/             # Full page components (FeedPage)
│   └── providers/         # Context providers (SessionProvider)
├── db/
│   ├── index.ts           # Database connection
│   └── schema.ts          # Drizzle schema definitions
├── lib/                   # Business logic
│   ├── auth.ts            # Auth utilities
│   ├── content-sources.ts # Content source definitions (Movie, Book, etc.)
│   ├── images.ts          # Image processing
│   ├── link-previews.ts   # OG/Twitter scraping, URL extraction, DB ops
│   ├── posts.ts           # Post CRUD operations
│   └── tags.ts            # Tag operations
├── types/                 # TypeScript type definitions
└── auth.ts                # NextAuth configuration
```

## Key Commands

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run storybook    # Start Storybook (port 6006)
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio
npm run lint         # Run ESLint
```

## Database

SQLite database stored at `data/blog.db`. Schema:
- **posts**: id, content (markdown), type (text/photo), timestamps
- **images**: id, postId (nullable), filename, dimensions, metadata
- **tags**: id, name, slug
- **post_tags**: many-to-many join table
- **link_previews**: url (unique), title, description, imageUrl, domain, scrapedAt — stores OG/Twitter metadata scraped at publish time, keyed by URL, reused across posts

Images are stored in `uploads/` directory and served via `/api/images/[filename]`.

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```
GOOGLE_CLIENT_ID=        # From Google Cloud Console (OAuth)
GOOGLE_CLIENT_SECRET=    # From Google Cloud Console (OAuth)
AUTH_SECRET=             # Generate with: openssl rand -base64 32
NEXTAUTH_URL=            # http://localhost:3000 for local dev
ALLOWED_EMAIL=           # Your email (only this user can post)
ANTHROPIC_API_KEY=       # Anthropic API key (for content search via Claude web search)
```

## Design Decisions

- **Posts are not clickable**: Posts display full content inline. The `/posts/[id]` route exists only for sharing via URL with OG metadata.
- **Storybook-first**: All components have stories. Run Storybook to develop/test components in isolation.
- **Single user**: Only one authorized email can create/edit/delete posts. Everyone else can view.
- **Local storage**: Images stored on filesystem, not cloud. Simple self-hosted setup.
- **Link previews**: Bare URLs on their own line in post content are scraped for OG/Twitter metadata at publish time (using cheerio) and rendered as rich preview cards inline. Data stored in `link_previews` table, keyed by URL. The `MarkdownRenderer` detects bare-URL paragraphs via the `p` component override in react-markdown and replaces them with `LinkPreview` cards.
- **Content sources**: Extensible system for searching external sites via Claude web search. Sources defined in `src/lib/content-sources.ts` as a simple array (id, label, tag, site). Search powered by Anthropic API with `web_search_20250305` tool, scoped to each source's domain via `allowed_domains`. The Composer renders a toolbar button per source. Search results shown in a dropdown; selecting one prepends the URL to post content and auto-tags the post. To add a new source: add entry to `contentSources` array with the target `site` domain.

## Color Palette

Defined in `src/app/globals.css` using Tailwind CSS 4 `@theme inline`:
- `--color-sky-blue: #8ecae6`
- `--color-blue-green: #219ebc`
- `--color-deep-space: #023047`
- `--color-amber-flame: #ffb703`
- `--color-princeton-orange: #fb8500`

## Git Worktrees

This project uses `.worktrees/` for feature development. The directory is gitignored.

## Deployment

Hosted on a Hetzner VPS (CPX series, Ubuntu) with Coolify as the deployment platform.

### Infrastructure

- **Server**: Hetzner CPX (2 vCPU, 2GB RAM + 2GB swap)
- **IP**: `5.78.103.15`
- **Coolify dashboard**: `http://5.78.103.15:8000`
- **App URL**: `http://ogsg408w0488s8g8sgk0004o.5.78.103.15.sslip.io` (sslip.io until a real domain is configured)
- **Build**: Nixpacks (auto-detected Node.js)

### Persistent Storage (Coolify Storages tab)

| Host path | Container path | Purpose |
|-----------|---------------|---------|
| `/data/blog/db` | `/app/data` | SQLite database |
| `/data/blog/uploads` | `/app/uploads` | Uploaded images |

### Environment Variables (Coolify)

All local `.env.local` vars plus:
- `AUTH_TRUST_HOST=true` — required because Coolify runs Traefik as a reverse proxy
- `NODE_OPTIONS=--max-old-space-size=1024` — prevents OOM on 2GB server (optional)

### Deploying

1. Push to `main` on GitHub
2. Go to Coolify dashboard → app → click **Redeploy**

Migrations run automatically on app startup via `drizzle-orm`'s programmatic migrator in `src/db/index.ts`.

### Server Maintenance

**Swap file** (already configured):
```bash
# Verify swap is active
ssh root@5.78.103.15 swapon --show
```

**View app logs**:
```bash
ssh root@5.78.103.15
docker logs $(docker ps --filter "name=ogsg408w" -q) --tail 50
```

**Reset Coolify password** (if needed):
```bash
docker exec -it coolify php artisan tinker
# Then: $u = \App\Models\User::first(); $u->password = bcrypt('newpass'); $u->save();
```

### Build Notes

- `typescript.ignoreBuildErrors: true` in `next.config.ts` — TypeScript checking OOMs on the 2GB server. Type errors are caught locally during development.
- Node version is set to 22 via Nixpacks (`NIXPACKS_NODE_VERSION=22` in Coolify)

## Common Issues

**better-sqlite3 NODE_MODULE_VERSION mismatch**: If you see this error after switching Node versions, run:
```bash
rm -rf node_modules/better-sqlite3 && npm install better-sqlite3
```
