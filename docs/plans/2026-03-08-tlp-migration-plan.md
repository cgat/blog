# The Little Picture Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add image caption support to the database, then migrate 23 photo-essay posts from an old PostgreSQL blog into the current SQLite blog.

**Architecture:** Two-phase approach: (1) schema change to add caption column, threaded through types and queries, (2) standalone migration script that parses the extracted SQL dump, copies images, and inserts posts with tags. The migration script uses `npx tsx` to run and ImageMagick `identify` for image dimensions.

**Tech Stack:** Drizzle ORM (SQLite), TypeScript, ImageMagick (`identify`), `npx tsx` for script execution.

**Source data location:**
- SQL dump (already extracted): `/tmp/tlp_data.sql`
- Images: `~/Documents/thelittlepicture/bucket/uploads/photo_node/image/{photo_node_id}/{filename}`

---

### Task 1: Add Caption Column to Schema

**Files:**
- Modify: `src/db/schema.ts:14-25`

**Step 1: Add caption field to images table**

In `src/db/schema.ts`, add `caption` after `position` (line 23):

```typescript
export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  mimeType: text('mime_type').notNull(),
  position: integer('position').notNull(),
  caption: text('caption'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**Step 2: Generate the Drizzle migration**

Run: `npm run db:generate`
Expected: New migration file in `drizzle/` adding the `caption` column.

**Step 3: Apply the migration**

Run: `npm run db:migrate`
Expected: Migration applied successfully.

**Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add caption column to images table"
```

---

### Task 2: Thread Caption Through Types and Queries

**Files:**
- Modify: `src/types/post.ts:1-7`
- Modify: `src/lib/posts.ts:21-26,104-109,194-199`

**Step 1: Add caption to PostImage type**

In `src/types/post.ts`, add `caption` to `PostImage`:

```typescript
export interface PostImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
  width: number;
  height: number;
}
```

**Step 2: Add caption to PostWithRelations images**

In `src/lib/posts.ts`, update the `PostWithRelations` interface (lines 21-26):

```typescript
  images: {
    id: string;
    url: string;
    width: number;
    height: number;
    caption?: string;
  }[];
```

**Step 3: Add caption to image mappings in getPost and getPosts**

In `src/lib/posts.ts`, update the image mapping in `getPost` (lines 104-109):

```typescript
    images: result.images.map((img) => ({
      id: img.id,
      url: `/api/images/${img.filename}`,
      width: img.width,
      height: img.height,
      caption: img.caption ?? undefined,
    })),
```

Update the identical mapping in `getPosts` (lines 194-199):

```typescript
        images: result.images.map((img) => ({
          id: img.id,
          url: `/api/images/${img.filename}`,
          width: img.width,
          height: img.height,
          caption: img.caption ?? undefined,
        })),
```

**Step 4: Verify the build compiles**

Run: `npm run build`
Expected: Build succeeds (or at least no new type errors).

**Step 5: Commit**

```bash
git add src/types/post.ts src/lib/posts.ts
git commit -m "feat: thread image caption through types and queries"
```

---

### Task 3: Write the Migration Script

**Files:**
- Create: `scripts/migrate-tlp.ts`

**Step 1: Create the migration script**

Create `scripts/migrate-tlp.ts` with the full migration logic. The script must:

1. **Parse the SQL dump** — Read `/tmp/tlp_data.sql`, extract `posts` and `photo_nodes` COPY blocks, parse tab-delimited rows.

2. **Regenerate the SQL dump if missing** — Run `pg_restore --data-only --no-owner --no-acl -f /tmp/tlp_data.sql ~/Documents/thelittlepicture/latest.dump` if `/tmp/tlp_data.sql` doesn't exist.

3. **Define the country mapping** — Hardcoded map from old post ID to country tag names:

```typescript
const countryMap: Record<number, string[]> = {
  1: ['South Korea'],
  2: ['China'],
  3: ['China'],
  4: ['Mongolia'],
  5: ['Russia'],
  6: ['Russia'],
  7: ['China'],
  8: ['China'],
  9: ['Laos'],
  10: ['Cambodia'],
  11: ['Myanmar'],
  12: ['Thailand', 'Malaysia'],
  13: ['India'],
  14: ['Nepal'],
  15: ['New Zealand'],
  16: ['New Zealand'],
  17: ['New Zealand'],
  25: ['Slovakia'],
  27: ['Fiji'],
  28: ['New Zealand'],
  29: ['Australia'],
  30: ['Indonesia', 'Singapore'],
};
```

4. **Create/find tags** — For each unique tag name ("The Little Picture", "Travel", and all country names), check if it exists in the `tags` table by slug, create if not. Slug = lowercased, spaces replaced with hyphens.

5. **Idempotency check** — Before inserting, query for posts tagged "The Little Picture". If any exist, print a warning and exit (or add a `--force` flag to delete and re-run).

6. **For each old post row:**
   - Generate a UUID
   - Build content: `# {title}\n\n{description}`
     - Normalize `\r\n` to `\n`
     - Strip sign-offs: remove lines matching `--Chris` or `\n--Chris\n` patterns and any trailing whitespace after them
     - Trim trailing whitespace
   - Parse `date_published` as a Date. The format is `YYYY-MM-DD`. Set time to noon UTC to avoid timezone edge cases.
   - Insert into `posts`: `id`, `content`, `type='photo'`, `createdAt=date`, `updatedAt=date`, `publishedAt=date`, `isPrivate=false`
   - Insert into `post_tags` for "The Little Picture", "Travel", and the country tags for this post ID

7. **For each photo_node belonging to that post (sorted by rank_number):**
   - Source path: `~/Documents/thelittlepicture/bucket/uploads/photo_node/image/{photo_node_id}/{filename}`
   - Verify the source file exists, skip with warning if not
   - Generate a UUID for the image
   - Destination filename: `{uuid}_{original_filename}` (preserving extension)
   - Copy file to `./uploads/{destination_filename}`
   - Get dimensions via: `identify -format '%w %h' {source_path}` (parse stdout as `width height`)
   - Get file size via `fs.statSync`
   - Determine MIME type from extension (`.jpg`/`.jpeg` → `image/jpeg`, `.png` → `image/png`, `.gif` → `image/gif`)
   - Insert into `images`: `id`, `postId`, `filename`, `originalFilename`, `width`, `height`, `sizeBytes`, `mimeType`, `position=rank_number`, `caption=photo_node.description`, `createdAt=post.date`

8. **Summary output** — Print count of posts created, images copied, tags created.

The script should use direct `better-sqlite3` for database access (same as the app uses via Drizzle) rather than importing from `@/db` which requires Next.js module resolution. Import better-sqlite3 directly:

```typescript
import Database from 'better-sqlite3';
const db = new Database('./data/blog.db');
```

Use `node:child_process` `execSync` for the `identify` command.
Use `node:fs` for file copying and stat.
Use `crypto.randomUUID()` for UUIDs (no import needed, built into Node).

**Step 2: Verify the script runs in dry-run**

Run: `npx tsx scripts/migrate-tlp.ts`
Expected: Posts created, images copied, summary printed.

**Step 3: Verify results**

Run: `sqlite3 data/blog.db "SELECT COUNT(*) FROM posts; SELECT COUNT(*) FROM images WHERE caption IS NOT NULL;"`
Expected: Post count increased by 23, image count increased by ~768.

**Step 4: Start dev server and visually verify**

Run: `npm run dev`
Expected: Old posts appear at bottom of feed with images loading correctly.

**Step 5: Commit**

```bash
git add scripts/migrate-tlp.ts
git commit -m "feat: add TLP migration script"
```

---

### Task 4: Production Migration

This task is manual and done after local verification.

**Step 1: Ensure SQL dump is extracted on local machine**

The script will auto-extract from `latest.dump` if `/tmp/tlp_data.sql` is missing, but on the server we need to provide it.

**Step 2: Copy assets to server**

```bash
# Copy the migration script
scp scripts/migrate-tlp.ts root@5.78.103.15:/tmp/

# Copy the extracted SQL dump
scp /tmp/tlp_data.sql root@5.78.103.15:/tmp/

# Copy the bucket images (rsync for efficiency)
rsync -avz ~/Documents/thelittlepicture/bucket/uploads/ root@5.78.103.15:/tmp/tlp-images/
```

**Step 3: Copy assets into the Docker container**

```bash
ssh root@5.78.103.15
CONTAINER=$(docker ps --filter "name=ogsg408w" -q)
docker cp /tmp/migrate-tlp.ts $CONTAINER:/app/scripts/
docker cp /tmp/tlp_data.sql $CONTAINER:/tmp/
docker cp /tmp/tlp-images/ $CONTAINER:/tmp/tlp-images/
```

**Step 4: Run migration inside container**

```bash
docker exec -it $CONTAINER sh
# Install ImageMagick if not present
apk add --no-cache imagemagick || apt-get install -y imagemagick
# Run migration (adjust paths for container)
npx tsx scripts/migrate-tlp.ts
```

Note: The script paths for the SQL dump and bucket images may need to be configurable via environment variables or CLI args for production use. Consider adding:
- `TLP_DUMP_PATH` env var (default: `/tmp/tlp_data.sql`)
- `TLP_BUCKET_PATH` env var (default: `~/Documents/thelittlepicture/bucket`)

**Step 5: Verify on production**

Visit the app URL and scroll to the bottom of the feed to see the migrated posts.
