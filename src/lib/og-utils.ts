import type { Post } from '@/types/post';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Extract a display title from a post for OG images and metadata.
 *
 * Priority:
 * 1. First markdown heading (# ...)
 * 2. First link preview title + first tag
 * 3. First tag name
 * 4. Fallback
 */
export function extractTitle(post: Post): string {
  // 1. First # heading
  const headingMatch = post.content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  const firstTag = post.tags[0]?.name;
  const firstLinkPreview = Object.values(post.linkPreviews)[0];

  // 2. Link preview title + tag
  if (firstLinkPreview?.title && firstTag) {
    return `${firstLinkPreview.title} — ${firstTag}`;
  }

  // 3. Link preview title alone
  if (firstLinkPreview?.title) {
    return firstLinkPreview.title;
  }

  // 4. First tag
  if (firstTag) {
    return firstTag;
  }

  return 'archive of small things';
}

/**
 * Extract a content excerpt from a post, excluding the title heading and URLs.
 */
export function extractExcerpt(post: Post, maxLength = 140): string | null {
  const lines = post.content.split('\n');
  const body = lines
    .filter((line) => {
      const trimmed = line.trim();
      // Skip heading lines
      if (trimmed.startsWith('#')) return false;
      // Skip bare URLs (link preview lines)
      if (/^https?:\/\/\S+$/.test(trimmed)) return false;
      return trimmed.length > 0;
    })
    .join(' ')
    .trim();

  if (!body) return null;
  if (body.length <= maxLength) return body;
  return body.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

/**
 * Fetch a Google Font as an ArrayBuffer for use with ImageResponse.
 * Uses a Safari-like UA to get TTF format (Satori doesn't support woff2).
 */
export async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  const cssRes = await fetch(cssUrl, {
    headers: {
      // Safari UA returns TTF format which Satori supports
      'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
    },
  });
  const css = await cssRes.text();
  const fontUrl = css.match(/src: url\(([^)]+)\)/)?.[1];
  if (!fontUrl) {
    throw new Error(`Could not find font URL for ${family} ${weight}`);
  }
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

const UPLOAD_DIR = './uploads';

/** Static filing cabinet SVG for OG image branding (no animations) */
export const CABINET_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="400" viewBox="14 25 92 95" xmlns="http://www.w3.org/2000/svg"><rect x="19.5" y="30" width="81" height="79" fill="#c0392b"/><path d="M18.5 29 h83 v81 h-83 z M20.5 31 v77 h79 v-77 z" fill="#7f4d48" stroke="#3E2B25" stroke-width="1" fill-rule="evenodd"/><g><rect x="24.5" y="35" width="71" height="33" fill="#c0392b" stroke="#3E2B25" stroke-width="1.2" rx="0.5"/><circle cx="60" cy="51.5" r="2.8" fill="#f4d35e" stroke="#3E2B25" stroke-width="0.8"/></g><g><rect x="24.5" y="70" width="71" height="33" fill="#c0392b" stroke="#3E2B25" stroke-width="1.2" rx="0.5"/><circle cx="60" cy="86.5" r="2.8" fill="#f4d35e" stroke="#3E2B25" stroke-width="0.8"/></g><rect x="19.5" y="109" width="10" height="5" fill="#3E2B25" rx="1"/><rect x="90.5" y="109" width="10" height="5" fill="#3E2B25" rx="1"/></svg>`)}`;

/**
 * Convert a local /api/images/filename URL to a base64 data URI
 * by reading from the uploads directory and resizing for OG images.
 * External URLs are returned as-is.
 */
export async function toImageSrc(url: string): Promise<string | null> {
  // For external URLs, download and convert to data URI to avoid Satori fetch issues
  if (url.startsWith('http')) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await sharp(Buffer.from(arrayBuffer))
        .resize(600, 600, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch {
      return null;
    }
  }

  // Extract filename from /api/images/[filename]
  const match = url.match(/\/api\/images\/(.+)$/);
  if (!match) return null;

  const filepath = path.join(UPLOAD_DIR, match[1]);
  if (!existsSync(filepath)) return null;

  // Resize to max 600px wide for OG images (keeps file size manageable for Satori)
  const buffer = await sharp(filepath)
    .resize(600, 600, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}
