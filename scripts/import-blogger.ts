/**
 * Import posts from a Blogger Atom feed (Google Takeout export)
 * into the blog's SQLite database.
 *
 * Usage: npx tsx scripts/import-blogger.ts [--dry-run]
 */

import { readFileSync, copyFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { parseStringPromise } from 'xml2js';
import TurndownService from 'turndown';
import { db } from '../src/db';
import { posts, tags, postTags, images } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';

const FEED_PATH = resolve(
  process.env.HOME!,
  'Downloads/Takeout/Blogger/Blogs/The Off Season Traveller/feed.atom'
);
const ALBUM_PATH = resolve(
  process.env.HOME!,
  'Downloads/Takeout/Blogger/Albums/The Off Season Traveller'
);
const UPLOADS_DIR = resolve(process.cwd(), 'uploads');

const DRY_RUN = process.argv.includes('--dry-run');

// Build a map of album filenames for matching Blogger CDN URLs
// Blogger CDN URLs end with /s320/originalFilename.jpg
const albumFiles = existsSync(ALBUM_PATH)
  ? readdirSync(ALBUM_PATH).filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
  : [];
const albumFileSet = new Set(albumFiles);

// Track which images we've already copied to uploads
const copiedImages = new Map<string, string>(); // original filename -> uploads filename

async function ensureImageInUploads(originalFilename: string): Promise<string | null> {
  if (copiedImages.has(originalFilename)) {
    return copiedImages.get(originalFilename)!;
  }

  // Find matching album file (exact match or without duplicate suffix like "(1)")
  let albumFile = albumFiles.find((f) => f === originalFilename);
  if (!albumFile) {
    // Try base name match (album may have duplicates like "file(1).jpg")
    albumFile = albumFiles.find((f) => f.replace(/\(\d+\)/, '') === originalFilename);
  }

  if (!albumFile) return null;

  const src = join(ALBUM_PATH, albumFile);
  const filename = `blogger-${originalFilename}`;
  const dest = join(UPLOADS_DIR, filename);

  if (!DRY_RUN) {
    if (!existsSync(dest)) {
      copyFileSync(src, dest);
    }

    // Register in images table
    const metadata = await sharp(dest).metadata();
    const stats = statSync(dest);
    const imageId = uuid();
    await db.insert(images).values({
      id: imageId,
      postId: null,
      filename,
      originalFilename: albumFile,
      width: metadata.width || 0,
      height: metadata.height || 0,
      sizeBytes: stats.size,
      mimeType: `image/${metadata.format || 'jpeg'}`,
      position: 0,
      createdAt: new Date(),
    });
  }

  copiedImages.set(originalFilename, filename);
  return filename;
}

// Extract the original filename from a Blogger CDN URL
function extractFilenameFromBloggerUrl(url: string): string | null {
  // URLs like: https://blogger.googleusercontent.com/.../s320/filename.jpg
  const match = url.match(/\/([^/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
  return match ? match[1] : null;
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});

// Convert Blogger image links to inline markdown images
// Blogger wraps images in <a><img></a> — we want to capture the whole link
turndown.addRule('bloggerImageLinks', {
  filter: (node) => {
    if (node.nodeName === 'A') {
      const href = (node as HTMLAnchorElement).getAttribute('href') || '';
      if (href.includes('blogger.googleusercontent.com') || href.includes('blogspot.com')) {
        // Check if it contains an img child
        const img = node.querySelector?.('img');
        return !!img;
      }
    }
    return false;
  },
  replacement: (_content, node) => {
    const el = node as HTMLAnchorElement;
    const img = el.querySelector?.('img');
    const src = img?.getAttribute('src') || el.getAttribute('href') || '';
    const filename = extractFilenameFromBloggerUrl(src);
    if (filename) {
      // Return a placeholder that we'll resolve after turndown completes
      return `\n\n![](BLOGGER_IMG:${filename})\n\n`;
    }
    return '';
  },
});

// Handle standalone <img> tags (not wrapped in <a>)
turndown.addRule('bloggerStandaloneImages', {
  filter: (node) => {
    if (node.nodeName === 'IMG') {
      const src = (node as HTMLImageElement).getAttribute('src') || '';
      const parent = node.parentNode;
      // Only match if parent is NOT an anchor we already handle
      const parentIsHandled =
        parent?.nodeName === 'A' &&
        ((parent as HTMLAnchorElement).getAttribute('href') || '').includes('blogger.googleusercontent.com');
      return (
        !parentIsHandled &&
        (src.includes('blogger.googleusercontent.com') || src.includes('blogspot.com'))
      );
    }
    return false;
  },
  replacement: (_content, node) => {
    const src = (node as HTMLImageElement).getAttribute('src') || '';
    const filename = extractFilenameFromBloggerUrl(src);
    if (filename) {
      return `\n\n![](BLOGGER_IMG:${filename})\n\n`;
    }
    return '';
  },
});

// Clean up empty divs/spans that Blogger loves
turndown.addRule('emptyContainers', {
  filter: (node) => {
    return (
      (node.nodeName === 'DIV' || node.nodeName === 'SPAN' || node.nodeName === 'WBR') &&
      !node.textContent?.trim()
    );
  },
  replacement: () => '',
});

interface AtomEntry {
  id: string[];
  title?: string[];
  content?: Array<{ _: string; $: { type: string } }>;
  published?: string[];
  updated?: string[];
  category?: Array<{ $: { term: string; scheme: string } }>;
  'blogger:type'?: string[];
  'blogger:status'?: string[];
}

async function main() {
  console.log(DRY_RUN ? '🏃 DRY RUN — no database changes\n' : '📝 Importing Blogger posts\n');

  const xml = readFileSync(FEED_PATH, 'utf-8');
  const result = await parseStringPromise(xml, { explicitArray: true });
  const entries: AtomEntry[] = result.feed.entry || [];

  // Filter to LIVE POSTs only
  const liveEntries = entries.filter(
    (e) => e['blogger:type']?.[0] === 'POST' && e['blogger:status']?.[0] === 'LIVE'
  );

  console.log(`Found ${liveEntries.length} live posts\n`);

  // Sort by published date (oldest first)
  liveEntries.sort((a, b) => {
    const dateA = new Date(a.published?.[0] || 0).getTime();
    const dateB = new Date(b.published?.[0] || 0).getTime();
    return dateA - dateB;
  });

  // Collect all unique tags across posts
  const tagMap = new Map<string, string>(); // slug -> tag id

  // Global tags to add to every imported post
  const globalTags = ['The Offseason Traveller', 'The Little Picture'];

  for (const entry of liveEntries) {
    const title = entry.title?.[0] || '(untitled)';
    const htmlContent = entry.content?.[0]?._ || entry.content?.[0] || '';
    const publishedAt = new Date(entry.published?.[0] || entry.updated?.[0] || Date.now());
    const categories = (entry.category || [])
      .filter((c) => c.$ && c.$.term)
      .map((c) => c.$.term);

    // Convert HTML to markdown
    let markdown = turndown.turndown(htmlContent as string);

    // Resolve BLOGGER_IMG placeholders to actual /api/images/ paths
    const imgPlaceholders = markdown.matchAll(/!\[\]\(BLOGGER_IMG:([^)]+)\)/g);
    const resolvedImages: string[] = [];
    for (const match of imgPlaceholders) {
      const originalFilename = match[1];
      const uploadsFilename = await ensureImageInUploads(originalFilename);
      if (uploadsFilename) {
        markdown = markdown.replace(
          `![](BLOGGER_IMG:${originalFilename})`,
          `![](/api/images/${uploadsFilename})`
        );
        resolvedImages.push(originalFilename);
      } else {
        // No local copy available — remove the placeholder
        markdown = markdown.replace(`![](BLOGGER_IMG:${originalFilename})`, '');
      }
    }

    // Clean up excessive blank lines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

    // Prepend title as heading
    const fullContent = `# ${title}\n\n${markdown}`;

    console.log(`📄 "${title}" (${publishedAt.toISOString().split('T')[0]})`);
    // Add global tags to every post
    const allTags = [...new Set([...globalTags, ...categories])];

    console.log(`   Tags: ${allTags.join(', ')}`);
    console.log(`   Content length: ${fullContent.length} chars`);
    if (resolvedImages.length > 0) {
      console.log(`   📷 Inline images: ${resolvedImages.join(', ')}`);
    }

    if (!DRY_RUN) {
      const postId = uuid();

      // Insert post with original dates
      await db.insert(posts).values({
        id: postId,
        content: fullContent,
        type: 'text',
        createdAt: publishedAt,
        updatedAt: publishedAt,
        publishedAt: publishedAt,
        isPrivate: false,
      });

      // Create and link tags
      for (const tagName of allTags) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!tagMap.has(slug)) {
          // Check if tag already exists
          const existing = await db.query.tags.findFirst({
            where: eq(tags.slug, slug),
          });
          if (existing) {
            tagMap.set(slug, existing.id);
          } else {
            const tagId = uuid();
            await db.insert(tags).values({ id: tagId, name: tagName, slug });
            tagMap.set(slug, tagId);
          }
        }
        await db.insert(postTags).values({
          postId,
          tagId: tagMap.get(slug)!,
        });
      }

      console.log(`   ✅ Created post ${postId}`);
    }

    console.log();
  }

  console.log('\n✨ Done!');
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
