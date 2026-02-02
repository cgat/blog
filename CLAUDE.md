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
│   ├── images.ts          # Image processing
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

Images are stored in `uploads/` directory and served via `/api/images/[filename]`.

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```
GOOGLE_CLIENT_ID=        # From Google Cloud Console
GOOGLE_CLIENT_SECRET=    # From Google Cloud Console
AUTH_SECRET=             # Generate with: openssl rand -base64 32
NEXTAUTH_URL=            # http://localhost:3000 for local dev
ALLOWED_EMAIL=           # Your email (only this user can post)
```

## Design Decisions

- **Posts are not clickable**: Posts display full content inline. The `/posts/[id]` route exists only for sharing via URL with OG metadata.
- **Storybook-first**: All components have stories. Run Storybook to develop/test components in isolation.
- **Single user**: Only one authorized email can create/edit/delete posts. Everyone else can view.
- **Local storage**: Images stored on filesystem, not cloud. Simple self-hosted setup.

## Color Palette

Defined in `src/app/globals.css` using Tailwind CSS 4 `@theme inline`:
- `--color-sky-blue: #8ecae6`
- `--color-blue-green: #219ebc`
- `--color-deep-space: #023047`
- `--color-amber-flame: #ffb703`
- `--color-princeton-orange: #fb8500`

## Git Worktrees

This project uses `.worktrees/` for feature development. The directory is gitignored.

## Common Issues

**better-sqlite3 NODE_MODULE_VERSION mismatch**: If you see this error after switching Node versions, run:
```bash
rm -rf node_modules/better-sqlite3 && npm install better-sqlite3
```
