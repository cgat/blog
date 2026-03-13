import { db } from '@/db';
import { posts, images, postTags } from '@/db/schema';
import { eq, desc, lt, gt, and } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { extractBareUrls, getLinkPreviewsForUrls, processPostLinkPreviews } from '@/lib/link-previews';

export interface CreatePostInput {
  content: string;
  tagIds?: string[];
  isPrivate?: boolean;
}

export interface PostWithRelations {
  id: string;
  content: string;
  type: 'text' | 'photo';
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  images: {
    id: string;
    url: string;
    width: number;
    height: number;
    caption?: string;
    featured?: boolean;
  }[];
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
  linkPreviews: Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string }>;
}

export async function createPost(input: CreatePostInput, imageIds: string[] = []): Promise<PostWithRelations> {
  const id = uuid();
  const now = new Date();
  const type = imageIds.length > 0 ? 'photo' : 'text';

  await db.insert(posts).values({
    id,
    content: input.content,
    type,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    isPrivate: input.isPrivate ?? false,
  });

  // Link tags
  if (input.tagIds && input.tagIds.length > 0) {
    await db.insert(postTags).values(
      input.tagIds.map((tagId) => ({ postId: id, tagId }))
    );
  }

  // Update images with post ID
  if (imageIds.length > 0) {
    for (let i = 0; i < imageIds.length; i++) {
      await db.update(images)
        .set({ postId: id, position: i })
        .where(eq(images.id, imageIds[i]));
    }
  }

  // Scrape link previews for any bare URLs in the content
  await processPostLinkPreviews(input.content);

  return getPost(id, { includePrivate: true }) as Promise<PostWithRelations>;
}

export async function getPost(id: string, options?: { includePrivate?: boolean }): Promise<PostWithRelations | null> {
  const includePrivate = options?.includePrivate ?? false;
  const whereConditions = [eq(posts.id, id)];
  if (!includePrivate) {
    whereConditions.push(eq(posts.isPrivate, false));
  }

  const result = await db.query.posts.findFirst({
    where: and(...whereConditions),
    with: {
      images: true,
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!result) return null;

  const urls = extractBareUrls(result.content);
  const linkPreviewData = await getLinkPreviewsForUrls(urls);

  return {
    id: result.id,
    content: result.content,
    type: result.type,
    isPrivate: result.isPrivate,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    publishedAt: result.publishedAt,
    images: result.images.map((img) => ({
      id: img.id,
      url: `/api/images/${img.filename}`,
      width: img.width,
      height: img.height,
      caption: img.caption ?? undefined,
      featured: img.featured || undefined,
    })),
    tags: result.postTags.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
    })),
    linkPreviews: linkPreviewData,
  };
}

export async function getPosts(options: {
  limit?: number;
  cursor?: Date;
  direction?: 'older' | 'newer';
  tagSlugs?: string[];
  includePrivate?: boolean;
}): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const { limit = 20, cursor, direction = 'older', tagSlugs, includePrivate = false } = options;

  const whereConditions = [];

  if (!includePrivate) {
    whereConditions.push(eq(posts.isPrivate, false));
  }

  if (cursor) {
    whereConditions.push(
      direction === 'older'
        ? lt(posts.createdAt, cursor)
        : gt(posts.createdAt, cursor)
    );
  }

  // Get posts
  const results = await db.query.posts.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    orderBy: direction === 'older' ? desc(posts.createdAt) : posts.createdAt,
    limit: limit + 1,
    with: {
      images: true,
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  // Filter by tags if specified
  let filteredResults = results;
  if (tagSlugs && tagSlugs.length > 0) {
    filteredResults = results.filter((post) =>
      post.postTags.some((pt) => tagSlugs.includes(pt.tag.slug))
    );
  }

  const hasMore = filteredResults.length > limit;
  const postsToReturn = filteredResults.slice(0, limit);

  if (direction === 'newer') {
    postsToReturn.reverse();
  }

  // Batch-fetch link previews for all posts
  const allUrls = postsToReturn.flatMap((result) => extractBareUrls(result.content));
  const linkPreviewData = await getLinkPreviewsForUrls([...new Set(allUrls)]);

  return {
    posts: postsToReturn.map((result) => {
      const postUrls = extractBareUrls(result.content);
      const postPreviews: Record<string, { url: string; title: string | null; description: string | null; imageUrl: string | null; domain: string }> = {};
      for (const url of postUrls) {
        if (linkPreviewData[url]) {
          postPreviews[url] = linkPreviewData[url];
        }
      }

      return {
        id: result.id,
        content: result.content,
        type: result.type,
        isPrivate: result.isPrivate,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        publishedAt: result.publishedAt,
        images: result.images.map((img) => ({
          id: img.id,
          url: `/api/images/${img.filename}`,
          width: img.width,
          height: img.height,
          caption: img.caption ?? undefined,
        })),
        tags: result.postTags.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
          slug: pt.tag.slug,
        })),
        linkPreviews: postPreviews,
      };
    }),
    hasMore,
  };
}

export async function updatePost(id: string, input: Partial<CreatePostInput>): Promise<PostWithRelations | null> {
  const existing = await getPost(id, { includePrivate: true });
  if (!existing) return null;

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (input.content !== undefined) updateFields.content = input.content;
  if (input.isPrivate !== undefined) updateFields.isPrivate = input.isPrivate;

  await db.update(posts)
    .set(updateFields)
    .where(eq(posts.id, id));

  // Update tags if provided
  if (input.tagIds) {
    await db.delete(postTags).where(eq(postTags.postId, id));
    if (input.tagIds.length > 0) {
      await db.insert(postTags).values(
        input.tagIds.map((tagId) => ({ postId: id, tagId }))
      );
    }
  }

  if (input.content) {
    await processPostLinkPreviews(input.content);
  }

  return getPost(id, { includePrivate: true });
}

export async function deletePost(id: string): Promise<boolean> {
  await db.delete(posts).where(eq(posts.id, id));
  return true;
}
