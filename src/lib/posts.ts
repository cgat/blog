import { db } from '@/db';
import { posts, images, postTags, likes } from '@/db/schema';
import { eq, desc, lt, gt, and, isNull, isNotNull } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { extractBareUrls, getLinkPreviewsForUrls, processPostLinkPreviews } from '@/lib/link-previews';
import { getLikeCount, getLikeCounts, getLikedPostIds, getImageLikeCounts, getLikedImageIds } from '@/lib/likes';
import { getCommentCount, getCommentCounts } from '@/lib/comments';

export interface CreatePostInput {
  content: string;
  tagIds?: string[];
  isPrivate?: boolean;
  isDraft?: boolean;
}

export interface PostWithRelations {
  id: string;
  content: string;
  type: 'text' | 'photo';
  isPrivate: boolean;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
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
    likeCount: number;
    likedByMe: boolean;
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
    publishedAt: input.isDraft ? null : now,
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

  return getPost(id, { includePrivate: true, includeDrafts: true }) as Promise<PostWithRelations>;
}

export async function getPost(id: string, options?: { includePrivate?: boolean; includeDrafts?: boolean; fingerprint?: string }): Promise<PostWithRelations | null> {
  const includePrivate = options?.includePrivate ?? false;
  const includeDrafts = options?.includeDrafts ?? false;
  const fingerprint = options?.fingerprint;
  const whereConditions = [eq(posts.id, id)];
  if (!includePrivate) {
    whereConditions.push(eq(posts.isPrivate, false));
  }
  if (!includeDrafts) {
    whereConditions.push(isNotNull(posts.publishedAt));
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

  const likeCount = await getLikeCount(id);
  const commentCount = await getCommentCount(id);
  let likedByMe = false;
  if (fingerprint) {
    const existingLike = await db.query.likes.findFirst({
      where: and(eq(likes.postId, id), eq(likes.fingerprint, fingerprint)),
    });
    likedByMe = !!existingLike;
  }

  // Image like data
  const imageIds = result.images.map((img) => img.id);
  const imgLikeCounts = await getImageLikeCounts(imageIds);
  const imgLikedIds = fingerprint ? await getLikedImageIds(imageIds, fingerprint) : new Set<string>();

  return {
    id: result.id,
    content: result.content,
    type: result.type,
    isPrivate: result.isPrivate,
    likeCount,
    likedByMe,
    commentCount,
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
      mimeType: img.mimeType ?? undefined,
      likeCount: imgLikeCounts[img.id] || 0,
      likedByMe: imgLikedIds.has(img.id),
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
  draftsOnly?: boolean;
  fingerprint?: string;
}): Promise<{ posts: PostWithRelations[]; hasMore: boolean }> {
  const { limit = 20, cursor, direction = 'older', tagSlugs, includePrivate = false, draftsOnly = false, fingerprint } = options;

  const whereConditions = [];

  if (!includePrivate) {
    whereConditions.push(eq(posts.isPrivate, false));
  }

  // Draft filtering
  if (draftsOnly) {
    whereConditions.push(isNull(posts.publishedAt));
  } else {
    whereConditions.push(isNotNull(posts.publishedAt));
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
      post.postTags.some((pt) => tagSlugs.includes(pt.tag.slug) || tagSlugs.includes(pt.tag.name))
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

  // Batch-fetch like data for all posts
  const postIds = postsToReturn.map(p => p.id);
  const likeCounts = await getLikeCounts(postIds);
  const likedIds = fingerprint ? await getLikedPostIds(postIds, fingerprint) : new Set<string>();

  // Batch-fetch comment counts
  const commentCounts = await getCommentCounts(postIds);

  // Batch-fetch image like data
  const allImageIds = postsToReturn.flatMap((p) => p.images.map((img) => img.id));
  const imgLikeCounts = await getImageLikeCounts(allImageIds);
  const imgLikedIds = fingerprint ? await getLikedImageIds(allImageIds, fingerprint) : new Set<string>();

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
        likeCount: likeCounts[result.id] || 0,
        likedByMe: likedIds.has(result.id),
        commentCount: commentCounts[result.id] || 0,
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
          mimeType: img.mimeType ?? undefined,
          likeCount: imgLikeCounts[img.id] || 0,
          likedByMe: imgLikedIds.has(img.id),
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

export async function getPostsAround(postId: string, options: {
  count?: number;
  includePrivate?: boolean;
  fingerprint?: string;
}): Promise<{ posts: PostWithRelations[]; hasNewer: boolean; hasOlder: boolean }> {
  const { count = 3, includePrivate = false, fingerprint } = options;

  // First get the target post to find its createdAt
  const target = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });

  if (!target) {
    return { posts: [], hasNewer: false, hasOlder: false };
  }

  const baseConditions = [
    isNotNull(posts.publishedAt),
    ...(includePrivate ? [] : [eq(posts.isPrivate, false)]),
  ];

  // Get N newer posts (ordered ascending, then reversed)
  const newerResults = await db.query.posts.findMany({
    where: and(...baseConditions, gt(posts.createdAt, target.createdAt)),
    orderBy: posts.createdAt,
    limit: count + 1,
    with: { images: true, postTags: { with: { tag: true } } },
  });

  const hasNewer = newerResults.length > count;
  const newerPosts = newerResults.slice(0, count).reverse();

  // Get the target post itself
  const targetResult = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), ...baseConditions),
    with: { images: true, postTags: { with: { tag: true } } },
  });

  // Get N older posts
  const olderResults = await db.query.posts.findMany({
    where: and(...baseConditions, lt(posts.createdAt, target.createdAt)),
    orderBy: desc(posts.createdAt),
    limit: count + 1,
    with: { images: true, postTags: { with: { tag: true } } },
  });

  const hasOlder = olderResults.length > count;
  const olderPosts = olderResults.slice(0, count);

  // Combine: newer (newest first) + target + older
  const allResults = [...newerPosts, ...(targetResult ? [targetResult] : []), ...olderPosts];

  // Batch-fetch all enrichment data
  const postIds = allResults.map(p => p.id);
  const allUrls = allResults.flatMap((r) => extractBareUrls(r.content));
  const linkPreviewData = await getLinkPreviewsForUrls([...new Set(allUrls)]);
  const likeCounts = await getLikeCounts(postIds);
  const likedIds = fingerprint ? await getLikedPostIds(postIds, fingerprint) : new Set<string>();
  const commentCounts = await getCommentCounts(postIds);
  const allImageIds = allResults.flatMap((p) => p.images.map((img) => img.id));
  const imgLikeCounts = await getImageLikeCounts(allImageIds);
  const imgLikedIds = fingerprint ? await getLikedImageIds(allImageIds, fingerprint) : new Set<string>();

  return {
    posts: allResults.map((result) => {
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
        likeCount: likeCounts[result.id] || 0,
        likedByMe: likedIds.has(result.id),
        commentCount: commentCounts[result.id] || 0,
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
          mimeType: img.mimeType ?? undefined,
          likeCount: imgLikeCounts[img.id] || 0,
          likedByMe: imgLikedIds.has(img.id),
        })),
        tags: result.postTags.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
          slug: pt.tag.slug,
        })),
        linkPreviews: postPreviews,
      };
    }),
    hasNewer,
    hasOlder,
  };
}

export async function updatePost(id: string, input: Partial<CreatePostInput> & { publish?: boolean; imageIds?: string[]; publishedAt?: string }): Promise<PostWithRelations | null> {
  const existing = await getPost(id, { includePrivate: true, includeDrafts: true });
  if (!existing) return null;

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (input.content !== undefined) updateFields.content = input.content;
  if (input.isPrivate !== undefined) updateFields.isPrivate = input.isPrivate;
  if (input.publish) updateFields.publishedAt = new Date();
  if (input.publishedAt) updateFields.publishedAt = new Date(input.publishedAt);

  // Update post type based on images
  if (input.imageIds !== undefined) {
    updateFields.type = input.imageIds.length > 0 ? 'photo' : 'text';
  }

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

  // Update image associations if provided
  if (input.imageIds !== undefined) {
    // Unlink existing images
    await db.update(images)
      .set({ postId: null })
      .where(eq(images.postId, id));
    // Link new images
    for (let i = 0; i < input.imageIds.length; i++) {
      await db.update(images)
        .set({ postId: id, position: i })
        .where(eq(images.id, input.imageIds[i]));
    }
  }

  if (input.content) {
    await processPostLinkPreviews(input.content);
  }

  return getPost(id, { includePrivate: true, includeDrafts: true });
}

export async function deletePost(id: string): Promise<boolean> {
  await db.delete(posts).where(eq(posts.id, id));
  return true;
}
