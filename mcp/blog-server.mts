// Local stdio MCP server for managing blog content (posts, images, tags).
//
// It talks to the blog's HTTP API rather than the database, so the same server
// works against a local dev server or production. Images are read from local
// disk by path, so bulk imports never push image bytes through the model.
//
// Config (shell env wins over .env.local at the repo root):
//   BLOG_URL        Base URL of the blog. Defaults to http://localhost:3000.
//   BLOG_API_TOKEN  Must match BLOG_API_TOKEN on the target server.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { MEDIA_LAYOUTS, MEDIA_LAYOUT_INFO } from '../src/lib/media-layout';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(repoRoot, '.env.local');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const BLOG_URL = (process.env.BLOG_URL || 'http://localhost:3000').replace(/\/+$/, '');
const API_TOKEN = process.env.BLOG_API_TOKEN;

// Matches the types /api/images/[filename] knows how to serve.
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

interface ApiImage {
  id: string;
  url: string;
  width: number;
  height: number;
  caption?: string;
  featured?: boolean;
}

interface ApiPost {
  id: string;
  content: string;
  type: 'text' | 'photo';
  isPrivate: boolean;
  mediaLayout: (typeof MEDIA_LAYOUTS)[number];
  createdAt: string;
  publishedAt: string | null;
  images: ApiImage[];
  tags: { id: string; name: string; slug: string }[];
  commentCount: number;
  likeCount: number;
}

interface UploadedImage {
  id: string;
  filename: string;
  width: number;
  height: number;
  mimeType: string;
}

async function api<T>(method: string, pathname: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;

  let payload: FormData | string | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BLOG_URL}${pathname}`, { method, headers, body: payload });
  const text = await res.text();

  if (!res.ok) {
    const hint = res.status === 401
      ? ' (check that BLOG_API_TOKEN is set and matches the server)'
      : '';
    throw new Error(`${method} ${pathname} failed with ${res.status}${hint}: ${text}`);
  }

  return JSON.parse(text) as T;
}

function resolvePath(filePath: string): string {
  const expanded = filePath.startsWith('~/') ? path.join(os.homedir(), filePath.slice(2)) : filePath;
  return path.resolve(expanded);
}

async function uploadImage(filePath: string, caption?: string): Promise<UploadedImage> {
  const resolved = resolvePath(filePath);
  const ext = path.extname(resolved).toLowerCase();
  const mimeType = MIME_TYPES[ext];

  if (!mimeType) {
    const heicHint = ext === '.heic' || ext === '.heif'
      ? ' Convert it first, e.g. `sips -s format jpeg in.heic --out out.jpg`.'
      : '';
    throw new Error(
      `Unsupported file type "${ext}" for ${resolved}. Supported: ${Object.keys(MIME_TYPES).join(', ')}.${heicHint}`
    );
  }

  const buffer = await readFile(resolved);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), path.basename(resolved));
  if (caption) form.append('caption', caption);

  return api<UploadedImage>('POST', '/api/images', form);
}

async function resolveTagIds(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const tag = await api<{ id: string }>('POST', '/api/tags', { name });
    ids.push(tag.id);
  }
  return ids;
}

const imageRefSchema = z
  .object({
    path: z.string().optional().describe('Absolute path to a local image/video file to upload'),
    id: z.string().optional().describe('ID of an image already uploaded (e.g. via upload_image)'),
    caption: z.string().optional().describe('Caption to set on the image'),
  })
  .refine((ref) => !!ref.path !== !!ref.id, { message: 'Provide exactly one of path or id' });

type ImageRef = z.infer<typeof imageRefSchema>;

// Uploads any local files and returns image IDs in the order given.
async function resolveImageIds(refs: ImageRef[]): Promise<string[]> {
  const ids: string[] = [];
  for (const ref of refs) {
    if (ref.path) {
      const uploaded = await uploadImage(ref.path, ref.caption);
      ids.push(uploaded.id);
    } else if (ref.id) {
      if (ref.caption !== undefined) {
        await api('PATCH', `/api/image-captions/${ref.id}`, { caption: ref.caption });
      }
      ids.push(ref.id);
    }
  }
  return ids;
}

function summarizePost(post: ApiPost, options?: { truncate?: number }) {
  const { truncate } = options ?? {};
  const content = truncate && post.content.length > truncate
    ? `${post.content.slice(0, truncate)}…`
    : post.content;

  return {
    id: post.id,
    url: `${BLOG_URL}/posts/${post.id}`,
    createdAt: post.createdAt,
    isDraft: !post.publishedAt,
    isPrivate: post.isPrivate,
    content,
    mediaLayout: post.mediaLayout,
    tags: post.tags.map((t) => t.name),
    images: post.images.map((img) => ({
      id: img.id,
      url: `${BLOG_URL}${img.url}`,
      ...(img.caption && { caption: img.caption }),
      ...(img.featured && { featured: true }),
    })),
    commentCount: post.commentCount,
    likeCount: post.likeCount,
  };
}

function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

const isoDate = z
  .string()
  .refine((value) => !isNaN(new Date(value).getTime()), { message: 'Must be an ISO 8601 date' });

const mediaLayoutSchema = z
  .enum(MEDIA_LAYOUTS)
  .describe(
    'How the photos/videos are arranged. ' +
      MEDIA_LAYOUTS.map((layout) => `${layout}: ${MEDIA_LAYOUT_INFO[layout].description}`).join(' ')
  );

const server = new McpServer({ name: 'blog', version: '0.1.0' });

server.registerTool(
  'create_post',
  {
    title: 'Create post',
    description:
      'Create a blog post. Content is markdown; a bare URL on its own line renders as a link preview card. ' +
      'Images can be local file paths (uploaded automatically) or IDs from upload_image, attached in the order given. ' +
      'Tags are names and are created if they do not exist. Set createdAt to backdate imported posts.',
    inputSchema: {
      content: z.string().optional().describe('Markdown body. Optional if images are provided.'),
      images: z.array(imageRefSchema).optional(),
      mediaLayout: mediaLayoutSchema.optional(),
      tags: z.array(z.string()).optional().describe('Tag names'),
      createdAt: isoDate.optional().describe('Post date (ISO 8601). Defaults to now.'),
      isPrivate: z.boolean().optional().describe('Only visible to the owner. Default false.'),
      isDraft: z.boolean().optional().describe('Save unpublished. Default false.'),
    },
  },
  async ({ content, images, mediaLayout, tags, createdAt, isPrivate, isDraft }) => {
    const imageIds = images ? await resolveImageIds(images) : [];
    const tagIds = tags ? await resolveTagIds(tags) : [];

    const post = await api<ApiPost>('POST', '/api/posts', {
      content: content ?? '',
      imageIds,
      mediaLayout,
      tagIds,
      createdAt,
      isPrivate,
      isDraft,
    });
    return result(summarizePost(post));
  }
);

server.registerTool(
  'update_post',
  {
    title: 'Update post',
    description:
      'Update fields of an existing post. Only provided fields change. ' +
      '`images` and `tags` replace the full list, so include existing ones you want to keep (get_post shows them).',
    inputSchema: {
      id: z.string(),
      content: z.string().optional(),
      images: z.array(imageRefSchema).optional().describe('Full replacement list of images, in order'),
      mediaLayout: mediaLayoutSchema.optional(),
      tags: z.array(z.string()).optional().describe('Full replacement list of tag names'),
      createdAt: isoDate.optional().describe('New post date (ISO 8601)'),
      isPrivate: z.boolean().optional(),
      publish: z.boolean().optional().describe('Publish a draft now'),
    },
  },
  async ({ id, content, images, mediaLayout, tags, createdAt, isPrivate, publish }) => {
    const imageIds = images ? await resolveImageIds(images) : undefined;
    const tagIds = tags ? await resolveTagIds(tags) : undefined;

    const post = await api<ApiPost>('PATCH', `/api/posts/${id}`, {
      content,
      imageIds,
      mediaLayout,
      tagIds,
      createdAt,
      isPrivate,
      publish,
    });
    return result(summarizePost(post));
  }
);

server.registerTool(
  'delete_post',
  {
    title: 'Delete post',
    description: 'Permanently delete a post, its comments, likes, and image associations.',
    inputSchema: { id: z.string() },
    annotations: { destructiveHint: true },
  },
  async ({ id }) => {
    await api('DELETE', `/api/posts/${id}`);
    return result({ deleted: id });
  }
);

server.registerTool(
  'get_post',
  {
    title: 'Get post',
    description: 'Fetch one post (including private posts and drafts) with its full content, images, and tags.',
    inputSchema: { id: z.string() },
    annotations: { readOnlyHint: true },
  },
  async ({ id }) => {
    const post = await api<ApiPost>('GET', `/api/posts/${id}?includePrivate=true`);
    return result(summarizePost(post));
  }
);

server.registerTool(
  'list_posts',
  {
    title: 'List posts',
    description:
      'List posts newest first, including private ones. Content is truncated; use get_post for the full text. ' +
      'Pass the returned nextCursor as `before` to page through older posts.',
    inputSchema: {
      limit: z.number().int().min(1).max(100).optional().describe('Default 20'),
      before: isoDate.optional().describe('Only posts created before this date (pagination cursor)'),
      tags: z.array(z.string()).optional().describe('Filter to posts with any of these tag slugs'),
      drafts: z.boolean().optional().describe('List drafts instead of published posts'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ limit = 20, before, tags, drafts }) => {
    const params = new URLSearchParams({ limit: String(limit), includePrivate: 'true' });
    if (before) params.set('cursor', before);
    if (tags?.length) params.set('tags', tags.join(','));
    if (drafts) params.set('draftsOnly', 'true');

    const { posts, hasMore } = await api<{ posts: ApiPost[]; hasMore: boolean }>(
      'GET',
      `/api/posts?${params}`
    );
    return result({
      posts: posts.map((post) => summarizePost(post, { truncate: 200 })),
      nextCursor: hasMore ? posts[posts.length - 1]?.createdAt : null,
    });
  }
);

server.registerTool(
  'list_tags',
  {
    title: 'List tags',
    description: 'List all tags with how many posts use each.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => result(await api('GET', '/api/tags'))
);

server.registerTool(
  'upload_image',
  {
    title: 'Upload image',
    description:
      'Upload a local image or video without attaching it to a post. Returns an image ID to pass to ' +
      'create_post or update_post. Supported: ' + Object.keys(MIME_TYPES).join(', '),
    inputSchema: {
      path: z.string().describe('Absolute path to the file'),
      caption: z.string().optional(),
    },
  },
  async ({ path: filePath, caption }) => result(await uploadImage(filePath, caption))
);

server.registerTool(
  'set_image_caption',
  {
    title: 'Set image caption',
    description: 'Set or clear (null) the caption on an image.',
    inputSchema: {
      imageId: z.string(),
      caption: z.string().nullable(),
    },
  },
  async ({ imageId, caption }) =>
    result(await api('PATCH', `/api/image-captions/${imageId}`, { caption }))
);

server.registerTool(
  'set_featured_image',
  {
    title: 'Set featured image',
    description: "Make an image the featured image of its post (shown first). Unfeatures the post's other images.",
    inputSchema: { imageId: z.string() },
  },
  async ({ imageId }) => {
    // The endpoint toggles, so toggle back if the image was already featured.
    let res = await api<{ featured: boolean }>('PATCH', `/api/image-featured/${imageId}`);
    if (!res.featured) {
      res = await api<{ featured: boolean }>('PATCH', `/api/image-featured/${imageId}`);
    }
    return result(res);
  }
);

await server.connect(new StdioServerTransport());
console.error(`blog MCP server connected to ${BLOG_URL}${API_TOKEN ? '' : ' (no BLOG_API_TOKEN set; writes will fail)'}`);
