/**
 * Migration script: The Little Picture → Blog
 *
 * Migrates 23 photo-essay posts from an old PostgreSQL blog into the current
 * SQLite blog. Run via: npx tsx scripts/migrate-tlp.ts
 *
 * Environment variables:
 *   TLP_DUMP_PATH   – path to SQL dump (default: /tmp/tlp_data.sql)
 *   TLP_BUCKET_PATH – path to image bucket (default: ~/Documents/thelittlepicture/bucket)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import Database from 'better-sqlite3';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DUMP_PATH = process.env.TLP_DUMP_PATH ?? '/tmp/tlp_data.sql';
const BUCKET_PATH = (process.env.TLP_BUCKET_PATH ?? '~/Documents/thelittlepicture/bucket')
  .replace(/^~/, os.homedir());
const DB_PATH = path.resolve('data/blog.db');
const UPLOADS_DIR = path.resolve('uploads');
const FORCE = process.argv.includes('--force');

// ---------------------------------------------------------------------------
// Country mapping (old post ID → country names)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OldPost {
  id: number;
  description: string;
  title: string;
  createdAt: string | null;
  updatedAt: string;
  photoNodeId: number;
  published: boolean;
  datePublished: string;
}

interface PhotoNode {
  id: number;
  image: string;
  description: string;
  rankNumber: number;
  postId: number;
  createdAt: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// SQL dump parser
// ---------------------------------------------------------------------------

function parseCopyBlock(sql: string, tableName: string): string[][] {
  // Find the COPY line for this table
  const copyRegex = new RegExp(`^COPY ${tableName} \\([^)]+\\) FROM stdin;`, 'm');
  const match = copyRegex.exec(sql);
  if (!match) throw new Error(`COPY block for ${tableName} not found`);

  const startIdx = match.index + match[0].length + 1; // skip the newline after COPY line
  const endMarker = '\n\\.\n';
  const endIdx = sql.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error(`End of COPY block for ${tableName} not found`);

  const block = sql.slice(startIdx, endIdx);
  const rows: string[][] = [];

  for (const line of block.split('\n')) {
    if (line === '' || line === '\\.') continue;
    rows.push(line.split('\t'));
  }

  return rows;
}

function parseNull(val: string): string | null {
  return val === '\\N' ? null : val;
}

function parsePosts(sql: string): OldPost[] {
  const rows = parseCopyBlock(sql, 'posts');
  return rows
    .map((cols) => ({
      id: parseInt(cols[0], 10),
      description: cols[1].replace(/\\r\\n/g, '\n'),
      title: cols[2],
      createdAt: parseNull(cols[3]),
      updatedAt: cols[4],
      photoNodeId: parseInt(cols[5], 10),
      published: cols[6] === 't',
      datePublished: cols[7],
    }))
    .filter((p) => p.published);
}

function parsePhotoNodes(sql: string): PhotoNode[] {
  const rows = parseCopyBlock(sql, 'photo_nodes');
  return rows.map((cols) => ({
    id: parseInt(cols[0], 10),
    image: cols[1],
    description: cols[2].replace(/\\r\\n/g, '\n'),
    rankNumber: parseInt(cols[3], 10),
    postId: parseInt(cols[4], 10),
    createdAt: parseNull(cols[5]),
    updatedAt: cols[6],
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function stripSignoff(text: string): string {
  return text.replace(/\s*--?\s*Chris\s*$/i, '');
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

function getImageDimensions(filePath: string): { width: number; height: number } {
  const output = execSync(`identify -format '%w %h' "${filePath}"`, {
    encoding: 'utf-8',
  }).trim();
  const [w, h] = output.split(' ').map(Number);
  return { width: w, height: h };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // 1. Ensure dump file exists
  if (!fs.existsSync(DUMP_PATH)) {
    console.log(`Dump file not found at ${DUMP_PATH}, attempting to generate...`);
    try {
      execSync(
        `pg_restore --data-only --no-owner --no-acl -f ${DUMP_PATH} ~/Documents/thelittlepicture/latest.dump`,
        { stdio: 'inherit' },
      );
    } catch {
      console.error('Failed to generate dump file. Ensure pg_restore is available.');
      process.exit(1);
    }
  }

  // 2. Parse dump
  const sql = fs.readFileSync(DUMP_PATH, 'utf-8');
  const oldPosts = parsePosts(sql);
  const allPhotoNodes = parsePhotoNodes(sql);

  console.log(`Parsed ${oldPosts.length} published posts, ${allPhotoNodes.length} photo nodes`);

  // 3. Open database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 4. Idempotency check
  const tlpTag = db
    .prepare('SELECT id FROM tags WHERE slug = ?')
    .get('the-little-picture') as { id: string } | undefined;

  if (tlpTag) {
    const existingPosts = db
      .prepare('SELECT COUNT(*) as count FROM post_tags WHERE tag_id = ?')
      .get(tlpTag.id) as { count: number };

    if (existingPosts.count > 0) {
      if (!FORCE) {
        console.log('Migration already run. Use --force to re-run.');
        process.exit(0);
      }
      console.log('--force: deleting existing TLP posts...');
      const postIds = db
        .prepare('SELECT post_id FROM post_tags WHERE tag_id = ?')
        .all(tlpTag.id) as { post_id: string }[];

      const deletePost = db.prepare('DELETE FROM posts WHERE id = ?');
      for (const { post_id } of postIds) {
        deletePost.run(post_id);
      }
      console.log(`Deleted ${postIds.length} existing posts`);
    }
  }

  // 5. Ensure uploads directory exists
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // 6. Create/find tags
  const tagCache = new Map<string, string>(); // name → id

  function getOrCreateTag(name: string): string {
    if (tagCache.has(name)) return tagCache.get(name)!;

    const slug = slugify(name);
    const existing = db.prepare('SELECT id FROM tags WHERE slug = ?').get(slug) as
      | { id: string }
      | undefined;

    if (existing) {
      tagCache.set(name, existing.id);
      return existing.id;
    }

    const id = randomUUID();
    db.prepare('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)').run(id, name, slug);
    tagCache.set(name, id);
    return id;
  }

  // Pre-create common tags
  const tlpTagId = getOrCreateTag('The Little Picture');
  const travelTagId = getOrCreateTag('Travel');

  // 7. Prepare statements
  const insertPost = db.prepare(
    'INSERT INTO posts (id, content, type, created_at, updated_at, published_at, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const insertPostTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)');
  const insertImage = db.prepare(
    'INSERT INTO images (id, post_id, filename, original_filename, width, height, size_bytes, mime_type, position, caption, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );

  let totalImages = 0;
  let tagsCreatedBefore = tagCache.size;

  // 8. Migrate in a transaction
  const migrate = db.transaction(() => {
    for (const oldPost of oldPosts) {
      const newPostId = randomUUID();

      // Build content
      const description = stripSignoff(oldPost.description);
      const content = `# ${oldPost.title}\n\n${description}`.trimEnd();

      // Parse date
      const date = new Date(oldPost.datePublished + 'T12:00:00Z');
      const epochSeconds = Math.floor(date.getTime() / 1000);

      // Insert post
      insertPost.run(newPostId, content, 'photo', epochSeconds, epochSeconds, epochSeconds, 0);

      // Insert tags
      insertPostTag.run(newPostId, tlpTagId);
      insertPostTag.run(newPostId, travelTagId);

      const countries = countryMap[oldPost.id] ?? [];
      for (const country of countries) {
        const countryTagId = getOrCreateTag(country);
        insertPostTag.run(newPostId, countryTagId);
      }

      // Process photo nodes for this post
      const postPhotoNodes = allPhotoNodes
        .filter((pn) => pn.postId === oldPost.id)
        .sort((a, b) => a.rankNumber - b.rankNumber);

      for (const pn of postPhotoNodes) {
        const srcPath = path.join(BUCKET_PATH, 'uploads', 'photo_node', 'image', String(pn.id), pn.image);

        if (!fs.existsSync(srcPath)) {
          console.warn(`  Warning: image not found: ${srcPath}`);
          continue;
        }

        const imageId = randomUUID();
        const destFilename = `${imageId}_${pn.image}`;
        const destPath = path.join(UPLOADS_DIR, destFilename);

        // Copy file
        fs.copyFileSync(srcPath, destPath);

        // Get dimensions
        const { width, height } = getImageDimensions(srcPath);
        const sizeBytes = fs.statSync(destPath).size;
        const mimeType = getMimeType(pn.image);
        const caption = pn.description || null;

        insertImage.run(
          imageId,
          newPostId,
          destFilename,
          pn.image,
          width,
          height,
          sizeBytes,
          mimeType,
          pn.rankNumber,
          caption,
          epochSeconds,
        );
        totalImages++;
      }

      console.log(
        `  Migrated: "${oldPost.title}" (${postPhotoNodes.length} photos, ${date.toISOString().slice(0, 10)})`,
      );
    }
  });

  migrate();

  console.log(
    `\nMigration complete: ${oldPosts.length} posts, ${totalImages} images, ${tagCache.size} tags used`,
  );

  db.close();
}

main();
