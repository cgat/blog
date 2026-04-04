import { db } from '@/db';
import { comments } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface CommentData {
  id: string;
  postId: string;
  name: string | null;
  content: string;
  createdAt: Date;
}

const RATE_LIMIT = 7;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function getComments(postId: string): Promise<CommentData[]> {
  const results = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      name: comments.name,
      content: comments.content,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);

  return results;
}

export async function createComment(
  postId: string,
  content: string,
  fingerprint: string,
  name?: string
): Promise<CommentData> {
  // Rate limit check — 7 comments per hour per fingerprint (across all posts)
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
  const recentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(
      and(
        eq(comments.fingerprint, fingerprint),
        gte(comments.createdAt, windowStart)
      )
    );

  if (recentCount[0].count >= RATE_LIMIT) {
    throw new RateLimitError();
  }

  const id = uuid();
  const now = new Date();
  const trimmedName = name?.trim().slice(0, 50) || null;
  const trimmedContent = content.trim().slice(0, 2000);

  await db.insert(comments).values({
    id,
    postId,
    name: trimmedName,
    content: trimmedContent,
    fingerprint,
    createdAt: now,
  });

  return { id, postId, name: trimmedName, content: trimmedContent, createdAt: now };
}

export async function deleteComment(commentId: string): Promise<void> {
  await db.delete(comments).where(eq(comments.id, commentId));
}

export async function getCommentCount(postId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(eq(comments.postId, postId));
  return result[0].count;
}

export async function getCommentCounts(
  postIds: string[]
): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const results = await db
    .select({
      postId: comments.postId,
      count: sql<number>`count(*)`,
    })
    .from(comments)
    .where(sql`${comments.postId} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`)
    .groupBy(comments.postId);

  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.postId] = r.count;
  }
  return counts;
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}
