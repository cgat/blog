import { db } from '@/db';
import { tags, postTags } from '@/db/schema';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface TagWithUsage extends Tag {
  count: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getAllTags(): Promise<Tag[]> {
  return db.select().from(tags);
}

export async function getAllTagsWithUsage(): Promise<TagWithUsage[]> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      count: sql<number>`count(${postTags.tagId})`.as('count'),
    })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagId, tags.id))
    .groupBy(tags.id)
    .orderBy(desc(sql`count`), asc(tags.name));

  return rows.map((r) => ({ ...r, count: Number(r.count) }));
}

export async function createTag(name: string): Promise<Tag> {
  const id = uuid();
  const slug = slugify(name);

  await db.insert(tags).values({ id, name, slug });

  return { id, name, slug };
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  const slug = slugify(name);
  const existing = await db.select().from(tags).where(eq(tags.slug, slug));

  if (existing.length > 0) {
    return existing[0];
  }

  return createTag(name);
}
