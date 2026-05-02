import { db } from '@/db';
import {
  comments,
  guestbookEntries,
  imageLikes,
  images,
  likes,
  posts,
  userState,
} from '@/db/schema';
import { desc, eq, gt, sql } from 'drizzle-orm';

const LAST_SEEN_KEY = 'activity_last_seen_at';
const POST_EXCERPT_LENGTH = 60;
const SNIPPET_LENGTH = 80;

export type ActivityEvent =
  | {
      type: 'post-like';
      id: string;
      createdAt: Date;
      postId: string;
      postExcerpt: string;
    }
  | {
      type: 'photo-like';
      id: string;
      createdAt: Date;
      postId: string;
      postExcerpt: string;
      imageId: string;
    }
  | {
      type: 'comment';
      id: string;
      createdAt: Date;
      postId: string;
      postExcerpt: string;
      name: string | null;
      snippet: string;
    }
  | {
      type: 'guestbook';
      id: string;
      createdAt: Date;
      name: string | null;
      snippet: string;
    };

function excerpt(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  return collapsed.slice(0, max).trimEnd() + '…';
}

export async function getActivity(options: { limit?: number } = {}): Promise<ActivityEvent[]> {
  const { limit = 100 } = options;
  const perSource = limit;

  const [postLikeRows, photoLikeRows, commentRows, guestbookRows] = await Promise.all([
    db
      .select({
        id: likes.id,
        createdAt: likes.createdAt,
        postId: likes.postId,
        postContent: posts.content,
      })
      .from(likes)
      .innerJoin(posts, eq(posts.id, likes.postId))
      .orderBy(desc(likes.createdAt))
      .limit(perSource),
    db
      .select({
        id: imageLikes.id,
        createdAt: imageLikes.createdAt,
        imageId: imageLikes.imageId,
        postId: images.postId,
        postContent: posts.content,
      })
      .from(imageLikes)
      .innerJoin(images, eq(images.id, imageLikes.imageId))
      .innerJoin(posts, eq(posts.id, images.postId))
      .orderBy(desc(imageLikes.createdAt))
      .limit(perSource),
    db
      .select({
        id: comments.id,
        createdAt: comments.createdAt,
        postId: comments.postId,
        name: comments.name,
        content: comments.content,
        postContent: posts.content,
      })
      .from(comments)
      .innerJoin(posts, eq(posts.id, comments.postId))
      .orderBy(desc(comments.createdAt))
      .limit(perSource),
    db
      .select({
        id: guestbookEntries.id,
        createdAt: guestbookEntries.createdAt,
        name: guestbookEntries.name,
        content: guestbookEntries.content,
      })
      .from(guestbookEntries)
      .orderBy(desc(guestbookEntries.createdAt))
      .limit(perSource),
  ]);

  const events: ActivityEvent[] = [];

  for (const r of postLikeRows) {
    events.push({
      type: 'post-like',
      id: r.id,
      createdAt: r.createdAt,
      postId: r.postId,
      postExcerpt: excerpt(r.postContent, POST_EXCERPT_LENGTH),
    });
  }
  for (const r of photoLikeRows) {
    if (!r.postId) continue;
    events.push({
      type: 'photo-like',
      id: r.id,
      createdAt: r.createdAt,
      postId: r.postId,
      postExcerpt: excerpt(r.postContent, POST_EXCERPT_LENGTH),
      imageId: r.imageId,
    });
  }
  for (const r of commentRows) {
    events.push({
      type: 'comment',
      id: r.id,
      createdAt: r.createdAt,
      postId: r.postId,
      postExcerpt: excerpt(r.postContent, POST_EXCERPT_LENGTH),
      name: r.name,
      snippet: excerpt(r.content, SNIPPET_LENGTH),
    });
  }
  for (const r of guestbookRows) {
    events.push({
      type: 'guestbook',
      id: r.id,
      createdAt: r.createdAt,
      name: r.name,
      snippet: excerpt(r.content, SNIPPET_LENGTH),
    });
  }

  events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return events.slice(0, limit);
}

export async function getUnreadCount(since: Date | null): Promise<number> {
  if (!since) {
    // First-ever visit: count everything as new.
    const [postLike, photoLike, comment, guestbook] = await Promise.all([
      db.select({ c: sql<number>`COUNT(*)` }).from(likes),
      db.select({ c: sql<number>`COUNT(*)` }).from(imageLikes),
      db.select({ c: sql<number>`COUNT(*)` }).from(comments),
      db.select({ c: sql<number>`COUNT(*)` }).from(guestbookEntries),
    ]);
    return (
      Number(postLike[0]?.c ?? 0) +
      Number(photoLike[0]?.c ?? 0) +
      Number(comment[0]?.c ?? 0) +
      Number(guestbook[0]?.c ?? 0)
    );
  }

  const [postLike, photoLike, comment, guestbook] = await Promise.all([
    db.select({ c: sql<number>`COUNT(*)` }).from(likes).where(gt(likes.createdAt, since)),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(imageLikes)
      .where(gt(imageLikes.createdAt, since)),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(comments)
      .where(gt(comments.createdAt, since)),
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(guestbookEntries)
      .where(gt(guestbookEntries.createdAt, since)),
  ]);

  return (
    Number(postLike[0]?.c ?? 0) +
    Number(photoLike[0]?.c ?? 0) +
    Number(comment[0]?.c ?? 0) +
    Number(guestbook[0]?.c ?? 0)
  );
}

export async function getActivityLastSeen(): Promise<Date | null> {
  const row = await db.query.userState.findFirst({ where: eq(userState.key, LAST_SEEN_KEY) });
  if (!row) return null;
  const ms = Date.parse(row.value);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

export async function setActivityLastSeen(date: Date): Promise<void> {
  await db
    .insert(userState)
    .values({ key: LAST_SEEN_KEY, value: date.toISOString(), updatedAt: date })
    .onConflictDoUpdate({
      target: userState.key,
      set: { value: date.toISOString(), updatedAt: date },
    });
}
