import { db } from '@/db';
import { feeds, feedItems } from '@/db/schema';
import { and, desc, eq, isNull, lt, or, sql, isNotNull } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { parseStringPromise } from 'xml2js';
import * as cheerio from 'cheerio';

const REFRESH_USER_AGENT = 'archiveofsmallthings-reader/1.0 (+https://archiveofsmallthings.xyz)';
const FETCH_TIMEOUT_MS = 8000;
const DEFAULT_STALE_AGE_MS = 30 * 60 * 1000;

export interface ParsedItem {
  guid: string;
  url: string;
  title: string;
  summary: string | null;
  author: string | null;
  publishedAt: Date | null;
}

export interface ParsedFeed {
  title: string;
  siteUrl: string | null;
  items: ParsedItem[];
}

function stripHtmlToSummary(html: string | undefined | null): string | null {
  if (!html) return null;
  const text = cheerio.load(html, null, false).text().replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > 600 ? text.slice(0, 600).trimEnd() + '…' : text;
}

function pickString(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (Array.isArray(value)) {
    for (const v of value) {
      const s = pickString(v);
      if (s) return s;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj._ === 'string') return obj._.trim() || null;
    if (typeof obj.$t === 'string') return obj.$t.trim() || null;
  }
  return null;
}

function pickAtomLink(linkField: unknown): string | null {
  if (!linkField) return null;
  if (typeof linkField === 'string') return linkField.trim() || null;
  const arr = Array.isArray(linkField) ? linkField : [linkField];
  let alternate: string | null = null;
  let firstHref: string | null = null;
  for (const entry of arr) {
    if (typeof entry === 'string') {
      firstHref ??= entry;
      continue;
    }
    if (entry && typeof entry === 'object') {
      const attrs = (entry as { $?: Record<string, string> }).$ ?? {};
      if (attrs.href) {
        firstHref ??= attrs.href;
        if (!attrs.rel || attrs.rel === 'alternate') {
          alternate ??= attrs.href;
        }
      }
    }
  }
  return alternate ?? firstHref;
}

function parseDate(value: unknown): Date | null {
  const s = pickString(value);
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

export async function parseFeed(xml: string): Promise<ParsedFeed> {
  const parsed = await parseStringPromise(xml, {
    explicitArray: false,
    mergeAttrs: false,
    trim: true,
  });

  if (parsed?.rss?.channel) {
    const channel = parsed.rss.channel;
    const rawItems = channel.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];
    const items: ParsedItem[] = [];
    for (const raw of rawItems) {
      const link = pickString(raw.link);
      const guidValue = pickString(raw.guid) ?? link;
      if (!guidValue || !link) continue;
      const title = pickString(raw.title) ?? '(untitled)';
      const description = pickString(raw.description) ?? pickString(raw['content:encoded']);
      items.push({
        guid: guidValue,
        url: link,
        title,
        summary: stripHtmlToSummary(description),
        author: pickString(raw.author) ?? pickString(raw['dc:creator']),
        publishedAt: parseDate(raw.pubDate) ?? parseDate(raw['dc:date']),
      });
    }
    return {
      title: pickString(channel.title) ?? 'Untitled feed',
      siteUrl: pickString(channel.link),
      items,
    };
  }

  if (parsed?.feed) {
    const feed = parsed.feed;
    const rawItems = feed.entry ? (Array.isArray(feed.entry) ? feed.entry : [feed.entry]) : [];
    const items: ParsedItem[] = [];
    for (const raw of rawItems) {
      const link = pickAtomLink(raw.link);
      const guidValue = pickString(raw.id) ?? link;
      if (!guidValue || !link) continue;
      const title = pickString(raw.title) ?? '(untitled)';
      const summarySource = pickString(raw.summary) ?? pickString(raw.content);
      let author: string | null = null;
      if (raw.author) {
        const a = Array.isArray(raw.author) ? raw.author[0] : raw.author;
        author = pickString(a?.name) ?? pickString(a);
      }
      items.push({
        guid: guidValue,
        url: link,
        title,
        summary: stripHtmlToSummary(summarySource),
        author,
        publishedAt: parseDate(raw.published) ?? parseDate(raw.updated),
      });
    }
    return {
      title: pickString(feed.title) ?? 'Untitled feed',
      siteUrl: pickAtomLink(feed.link),
      items,
    };
  }

  throw new Error('Unrecognized feed format (expected RSS 2.0 or Atom)');
}

async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': REFRESH_USER_AGENT,
        Accept: 'application/atom+xml, application/rss+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5',
      },
      redirect: 'follow',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAndStoreFeed(feedId: string): Promise<{ added: number; error?: string }> {
  const feed = await db.query.feeds.findFirst({ where: eq(feeds.id, feedId) });
  if (!feed) return { added: 0, error: 'Feed not found' };

  try {
    const xml = await fetchFeedXml(feed.url);
    const parsed = await parseFeed(xml);

    let added = 0;
    if (parsed.items.length > 0) {
      const now = new Date();
      const rows = parsed.items.map((item) => ({
        id: uuid(),
        feedId: feed.id,
        guid: item.guid,
        url: item.url,
        title: item.title,
        summary: item.summary,
        author: item.author,
        publishedAt: item.publishedAt,
        readAt: null,
        createdAt: now,
      }));
      const inserted = await db
        .insert(feedItems)
        .values(rows)
        .onConflictDoNothing({ target: [feedItems.feedId, feedItems.guid] })
        .returning({ id: feedItems.id });
      added = inserted.length;
    }

    await db
      .update(feeds)
      .set({
        title: parsed.title || feed.title,
        siteUrl: parsed.siteUrl ?? feed.siteUrl,
        lastFetchedAt: new Date(),
        lastError: null,
      })
      .where(eq(feeds.id, feed.id));

    return { added };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(feeds)
      .set({ lastFetchedAt: new Date(), lastError: message })
      .where(eq(feeds.id, feed.id));
    return { added: 0, error: message };
  }
}

export async function addFeed(rawUrl: string): Promise<{ id: string; title: string }> {
  const url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Feed URL must start with http:// or https://');
  }

  const existing = await db.query.feeds.findFirst({ where: eq(feeds.url, url) });
  if (existing) {
    throw new Error('Feed already exists');
  }

  const xml = await fetchFeedXml(url);
  const parsed = await parseFeed(xml);

  const id = uuid();
  const now = new Date();
  await db.insert(feeds).values({
    id,
    url,
    title: parsed.title,
    siteUrl: parsed.siteUrl,
    lastFetchedAt: now,
    lastError: null,
    createdAt: now,
  });

  if (parsed.items.length > 0) {
    await db
      .insert(feedItems)
      .values(
        parsed.items.map((item) => ({
          id: uuid(),
          feedId: id,
          guid: item.guid,
          url: item.url,
          title: item.title,
          summary: item.summary,
          author: item.author,
          publishedAt: item.publishedAt,
          readAt: null,
          createdAt: now,
        })),
      )
      .onConflictDoNothing({ target: [feedItems.feedId, feedItems.guid] });
  }

  return { id, title: parsed.title };
}

export async function refreshStaleFeeds(maxAgeMs = DEFAULT_STALE_AGE_MS): Promise<{ refreshed: number; added: number }> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const stale = await db
    .select({ id: feeds.id })
    .from(feeds)
    .where(or(isNull(feeds.lastFetchedAt), lt(feeds.lastFetchedAt, cutoff)));

  if (stale.length === 0) return { refreshed: 0, added: 0 };

  const results = await Promise.allSettled(stale.map((row) => fetchAndStoreFeed(row.id)));
  let added = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') added += r.value.added;
  }
  return { refreshed: stale.length, added };
}

export interface FeedSummary {
  id: string;
  url: string;
  title: string;
  siteUrl: string | null;
  lastFetchedAt: Date | null;
  lastError: string | null;
  unreadCount: number;
  totalCount: number;
}

export async function listFeeds(): Promise<FeedSummary[]> {
  const rows = await db
    .select({
      id: feeds.id,
      url: feeds.url,
      title: feeds.title,
      siteUrl: feeds.siteUrl,
      lastFetchedAt: feeds.lastFetchedAt,
      lastError: feeds.lastError,
      createdAt: feeds.createdAt,
      unreadCount: sql<number>`COALESCE(SUM(CASE WHEN ${feedItems.readAt} IS NULL THEN 1 ELSE 0 END), 0)`,
      totalCount: sql<number>`COUNT(${feedItems.id})`,
    })
    .from(feeds)
    .leftJoin(feedItems, eq(feedItems.feedId, feeds.id))
    .groupBy(feeds.id)
    .orderBy(feeds.title);

  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title,
    siteUrl: r.siteUrl,
    lastFetchedAt: r.lastFetchedAt,
    lastError: r.lastError,
    unreadCount: Number(r.unreadCount) || 0,
    totalCount: Number(r.totalCount) || 0,
  }));
}

export async function deleteFeed(id: string): Promise<void> {
  await db.delete(feeds).where(eq(feeds.id, id));
}

export interface FeedItemListing {
  id: string;
  feedId: string;
  feedTitle: string;
  url: string;
  title: string;
  summary: string | null;
  author: string | null;
  publishedAt: Date | null;
  readAt: Date | null;
}

export async function listItems(options: {
  unreadOnly?: boolean;
  feedId?: string;
  limit?: number;
  cursor?: Date;
}): Promise<{ items: FeedItemListing[]; hasMore: boolean }> {
  const { unreadOnly = false, feedId, limit = 50, cursor } = options;

  const conditions = [];
  if (unreadOnly) conditions.push(isNull(feedItems.readAt));
  if (feedId) conditions.push(eq(feedItems.feedId, feedId));
  if (cursor) {
    conditions.push(and(isNotNull(feedItems.publishedAt), lt(feedItems.publishedAt, cursor))!);
  }

  const rows = await db
    .select({
      id: feedItems.id,
      feedId: feedItems.feedId,
      feedTitle: feeds.title,
      url: feedItems.url,
      title: feedItems.title,
      summary: feedItems.summary,
      author: feedItems.author,
      publishedAt: feedItems.publishedAt,
      readAt: feedItems.readAt,
      createdAt: feedItems.createdAt,
    })
    .from(feedItems)
    .innerJoin(feeds, eq(feeds.id, feedItems.feedId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(feedItems.publishedAt), desc(feedItems.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((r) => ({
    id: r.id,
    feedId: r.feedId,
    feedTitle: r.feedTitle,
    url: r.url,
    title: r.title,
    summary: r.summary,
    author: r.author,
    publishedAt: r.publishedAt,
    readAt: r.readAt,
  }));

  return { items, hasMore };
}

export async function markItemRead(itemId: string, read: boolean): Promise<void> {
  await db
    .update(feedItems)
    .set({ readAt: read ? new Date() : null })
    .where(eq(feedItems.id, itemId));
}

export async function markAllRead(feedId?: string): Promise<void> {
  const conditions = [isNull(feedItems.readAt)];
  if (feedId) conditions.push(eq(feedItems.feedId, feedId));
  await db
    .update(feedItems)
    .set({ readAt: new Date() })
    .where(and(...conditions));
}
