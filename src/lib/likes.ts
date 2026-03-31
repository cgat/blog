import { db } from '@/db';
import { likes } from '@/db/schema';
import { eq, and, count, inArray } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';

export function computeFingerprint(ip: string, userAgent: string): string {
  return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

export async function toggleLike(
  postId: string,
  fingerprint: string
): Promise<{ likeCount: number; likedByMe: boolean }> {
  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.fingerprint, fingerprint)))
    .get();

  if (existing) {
    await db.delete(likes).where(eq(likes.id, existing.id));
  } else {
    await db.insert(likes).values({
      id: uuid(),
      postId,
      fingerprint,
      createdAt: new Date(),
    });
  }

  const likeCount = await getLikeCount(postId);
  return { likeCount, likedByMe: !existing };
}

export async function getLikeCount(postId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.postId, postId))
    .get();

  return result?.count ?? 0;
}

export async function getLikeCounts(
  postIds: string[]
): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};

  const results = await db
    .select({ postId: likes.postId, count: count() })
    .from(likes)
    .where(inArray(likes.postId, postIds))
    .groupBy(likes.postId)
    .all();

  const map: Record<string, number> = {};
  for (const id of postIds) {
    map[id] = 0;
  }
  for (const row of results) {
    map[row.postId] = row.count;
  }

  return map;
}

export async function getLikedPostIds(
  postIds: string[],
  fingerprint: string
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const results = await db
    .select({ postId: likes.postId })
    .from(likes)
    .where(eq(likes.fingerprint, fingerprint))
    .all();

  const likedSet = new Set(results.map((r) => r.postId));
  return new Set(postIds.filter((id) => likedSet.has(id)));
}
