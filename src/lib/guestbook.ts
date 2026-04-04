import { db } from '@/db';
import { guestbookEntries } from '@/db/schema';
import { and, gte, sql, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface GuestbookEntry {
  id: string;
  name: string | null;
  content: string;
  createdAt: Date;
}

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function getGuestbookEntries(): Promise<GuestbookEntry[]> {
  return db
    .select({
      id: guestbookEntries.id,
      name: guestbookEntries.name,
      content: guestbookEntries.content,
      createdAt: guestbookEntries.createdAt,
    })
    .from(guestbookEntries)
    .orderBy(desc(guestbookEntries.createdAt));
}

export async function createGuestbookEntry(
  content: string,
  fingerprint: string,
  name?: string
): Promise<GuestbookEntry> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
  const recentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(guestbookEntries)
    .where(
      and(
        sql`${guestbookEntries.fingerprint} = ${fingerprint}`,
        gte(guestbookEntries.createdAt, windowStart)
      )
    );

  if (recentCount[0].count >= RATE_LIMIT) {
    throw new RateLimitError();
  }

  const id = uuid();
  const now = new Date();
  const trimmedName = name?.trim().slice(0, 50) || null;
  const trimmedContent = content.trim().slice(0, 2000);

  await db.insert(guestbookEntries).values({
    id,
    name: trimmedName,
    content: trimmedContent,
    fingerprint,
    createdAt: now,
  });

  return { id, name: trimmedName, content: trimmedContent, createdAt: now };
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}
