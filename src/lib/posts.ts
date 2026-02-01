import { db } from '@/db';
import { posts, images, postTags } from '@/db/schema';
import { eq, desc, lt, gt, and } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface CreatePostInput {
  content: string;
  tagIds?: string[];
}

export interface PostWithRelations {
  id: string;
  content: string;
  type: 'text' | 'photo';
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  images: {
    id: string;
    url: string;
    width: number;
    height: number;
  }[];
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
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

  return getPost(id) as Promise<PostWithRelations>;
}

export async function getPost(id: string): Promise<PostWithRelations | null> {
  const result = await db.query.posts.findFirst({
    where: eq(posts.id, id),
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

  return {
    id: result.id,
    content: result.content,
    type: result.type,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    publishedAt: result.publishedAt,
    images: result.images.map((img) => ({
      id: img.id,
      url: `/api/images/${img.filename}`,
      width: img.width,
      height: img.height,
    })),
    tags: result.postTags.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
    })),
  };
}

export async function getPosts(options: {
  limit?: number;
  cursor?: Date;
  direction?: 'older' | 'newer';
  tagSlugs?: string[];
}): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const { limit = 20, cursor, direction = 'older', tagSlugs } = options;

  const whereConditions = [];

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

  return {
    posts: postsToReturn.map((result) => ({
      id: result.id,
      content: result.content,
      type: result.type,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      publishedAt: result.publishedAt,
      images: result.images.map((img) => ({
        id: img.id,
        url: `/api/images/${img.filename}`,
        width: img.width,
        height: img.height,
      })),
      tags: result.postTags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
    })),
    hasMore,
  };
}

export async function updatePost(id: string, input: Partial<CreatePostInput>): Promise<PostWithRelations | null> {
  const existing = await getPost(id);
  if (!existing) return null;

  await db.update(posts)
    .set({
      content: input.content,
      updatedAt: new Date(),
    })
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

  return getPost(id);
}

export async function deletePost(id: string): Promise<boolean> {
  await db.delete(posts).where(eq(posts.id, id));
  return true;
}
