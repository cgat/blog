# The Little Picture Migration

Migrate 23 photo-essay blog posts from an old PostgreSQL/Rails app ("The Little Picture") into the current SQLite blog.

## Source Data

- **PostgreSQL dump** at `~/Documents/thelittlepicture/latest.dump` (extracted to `/tmp/tlp_data.sql`)
- **Image files** at `~/Documents/thelittlepicture/bucket/uploads/photo_node/image/{photo_node_id}/{filename}` (~769 files)

### Source Tables

**`posts`** (23 rows): `id`, `title`, `description` (body text with `\r\n` line breaks), `date_published`, `photo_node_id`, `published`

**`photo_nodes`** (~768 rows): `id`, `image` (filename), `description` (caption), `rank_number` (sort order), `post_id` (FK to posts)

## Schema Change: Add Caption to Images

Add a nullable `caption` text column to the `images` table. No UI changes — caption rendering will be designed separately.

```sql
ALTER TABLE images ADD COLUMN caption TEXT;
```

### Files to modify

1. `src/db/schema.ts` — add `caption: text('caption')` to images table
2. `src/lib/posts.ts` — include `caption` in `PostWithRelations.images` mapping
3. `src/types/post.ts` — add `caption?: string` to `PostImage`
4. Generate and apply Drizzle migration

## Migration Script

A standalone TypeScript script at `scripts/migrate-tlp.ts` that:

### Step 1: Parse the SQL dump

Extract `posts` and `photo_nodes` COPY blocks from the plain-text SQL dump. Parse tab-delimited rows.

### Step 2: Create tags

Create these tags if they don't already exist:
- "The Little Picture"
- "Travel"
- Per-country tags derived from post titles:
  - South Korea, China, Mongolia, Russia, Laos, Cambodia, Thailand, Malaysia, Myanmar, India, Nepal, New Zealand, Fiji, Australia, Indonesia, Singapore, Slovakia

### Step 3: For each old post

1. Generate a UUID
2. Build content: `# {title}\n\n{description}` — normalize `\r\n` to `\n`, strip `--Chris` sign-offs and trailing whitespace
3. Insert into `posts` with:
   - `type = 'photo'`
   - `createdAt` / `updatedAt` / `publishedAt` = `date_published`
   - `isPrivate = false`
4. Link to "The Little Picture", "Travel", and country tags via `post_tags`

### Step 4: For each photo_node belonging to that post

1. Copy image from `bucket/uploads/photo_node/image/{photo_node_id}/{filename}` → `uploads/{uuid}_{filename}`
2. Read actual dimensions and file size using `sharp`
3. Determine MIME type from file extension
4. Insert into `images` with:
   - `postId` = new post UUID
   - `position` = `rank_number`
   - `caption` = `photo_nodes.description`
   - `filename` = new filename
   - `originalFilename` = original filename

### Step 5: Idempotency

Tag all migrated posts. Before running, check if posts tagged "The Little Picture" already exist to avoid duplicates on re-run.

### Country-to-Post Mapping

Derived from post titles:

| Post ID | Title | Country Tags |
|---------|-------|-------------|
| 1 | Vancouver to South Korea | South Korea |
| 2 | China Part 1: Big China | China |
| 3 | China Part 2: Little China | China |
| 4 | Mongolia | Mongolia |
| 5 | Russia: Trans Siberian... | Russia |
| 6 | Siberia and Life in Lake Baikal | Russia |
| 7 | Baikal to Chengdu: Moving South | China |
| 8 | Sichuan and Yunnan | China |
| 9 | Laos: Sabaidee and Smiles | Laos |
| 10 | Rendezvous Cambodia | Cambodia |
| 11 | Golden Myanmar | Myanmar |
| 12 | Thailand and the Malay Peninsula | Thailand, Malaysia |
| 13 | Inspirational India | India |
| 14 | Nepal - The End of Asia | Nepal |
| 15 | Sweet As... New Zealand | New Zealand |
| 16 | NZ Part 2: Housesitting in Howick... | New Zealand |
| 17 | NZ Part 3: Great NZ Road Trip | New Zealand |
| 25 | Adventures in Central Europe | Slovakia |
| 27 | Fiji | Fiji |
| 28 | NZ Part 4: The Leftovers | New Zealand |
| 29 | Stopovers Part 1: Australia | Australia |
| 30 | Stopovers Part 2: Indonesia... | Indonesia, Singapore |

## Production Migration

Run the migration script locally first, verify, then replicate on production:

1. SCP the extracted SQL dump and bucket images to the server
2. `docker cp` into the running container
3. Run the migration script inside the container
4. Verify posts appear correctly

This avoids overwriting the production SQLite DB (which may have newer posts not in the local copy).

## Implementation Steps

1. Add `caption` column to schema + generate migration
2. Thread `caption` through `PostWithRelations` and `PostImage` type
3. Write and test the migration script locally
4. Run migration on production
