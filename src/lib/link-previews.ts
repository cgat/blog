import { db } from '@/db';
import { linkPreviews } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import * as cheerio from 'cheerio';

export interface ScrapedMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  domain: string;
}

export async function scrapeMetadata(url: string): Promise<ScrapedMetadata | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'facebookexternalhit/1.1',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      null;

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null;

    const imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null;

    const domain = new URL(url).hostname;

    return { title, description, imageUrl, domain };
  } catch {
    return null;
  }
}

/**
 * Extract bare URLs from markdown content.
 * A "bare URL" is a line that contains only a URL (possibly with whitespace).
 */
export function extractBareUrls(content: string): string[] {
  const lines = content.split('\n');
  const urlPattern = /^\s*(https?:\/\/[^\s]+)\s*$/;
  const urls: string[] = [];

  for (const line of lines) {
    const match = line.match(urlPattern);
    if (match) {
      urls.push(match[1]);
    }
  }

  return urls;
}

/**
 * Process link previews for a post's content.
 * Extracts bare URLs, checks for existing previews, scrapes new ones.
 */
export async function processPostLinkPreviews(content: string): Promise<void> {
  const urls = extractBareUrls(content);
  if (urls.length === 0) return;

  // Check which URLs already have previews
  const existing = await db
    .select({ url: linkPreviews.url })
    .from(linkPreviews)
    .where(inArray(linkPreviews.url, urls));

  const existingUrls = new Set(existing.map((e) => e.url));
  const newUrls = urls.filter((url) => !existingUrls.has(url));

  for (const url of newUrls) {
    const metadata = await scrapeMetadata(url);
    if (metadata) {
      await db.insert(linkPreviews).values({
        id: uuid(),
        url,
        title: metadata.title,
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        domain: metadata.domain,
        scrapedAt: new Date(),
      });
    }
  }
}

/**
 * Get link preview data for a set of URLs.
 * Returns a Record keyed by URL for easy lookup in rendering.
 */
export async function getLinkPreviewsForUrls(
  urls: string[]
): Promise<Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string }>> {
  if (urls.length === 0) return {};

  const previews = await db
    .select()
    .from(linkPreviews)
    .where(inArray(linkPreviews.url, urls));

  const result: Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string }> = {};
  for (const p of previews) {
    result[p.url] = {
      url: p.url,
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl,
      domain: p.domain,
    };
  }

  return result;
}
