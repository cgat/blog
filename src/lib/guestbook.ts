import { db } from '@/db';
import { guestbookEntries } from '@/db/schema';
import { and, eq, gte, sql, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface GuestbookEntry {
  id: string;
  name: string | null;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
}

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function getGuestbookEntries(options?: { includePrivate?: boolean }): Promise<GuestbookEntry[]> {
  const whereConditions = [];
  if (!options?.includePrivate) {
    whereConditions.push(eq(guestbookEntries.isPrivate, false));
  }

  return db
    .select({
      id: guestbookEntries.id,
      name: guestbookEntries.name,
      content: guestbookEntries.content,
      isPrivate: guestbookEntries.isPrivate,
      createdAt: guestbookEntries.createdAt,
    })
    .from(guestbookEntries)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(guestbookEntries.createdAt));
}

export async function createGuestbookEntry(
  content: string,
  fingerprint: string,
  name?: string,
  isPrivate?: boolean
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
  const privateFlag = isPrivate ?? false;

  await db.insert(guestbookEntries).values({
    id,
    name: trimmedName,
    content: trimmedContent,
    fingerprint,
    isPrivate: privateFlag,
    createdAt: now,
  });

  return { id, name: trimmedName, content: trimmedContent, isPrivate: privateFlag, createdAt: now };
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}
