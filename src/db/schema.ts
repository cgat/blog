import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  type: text('type', { enum: ['text', 'photo'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
});

export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  mimeType: text('mime_type').notNull(),
  position: integer('position').notNull(),
  caption: text('caption'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

// Relations
export const postsRelations = relations(posts, ({ many }) => ({
  images: many(images),
  postTags: many(postTags),
  likes: many(likes),
  comments: many(comments),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  post: one(posts, {
    fields: [images.postId],
    references: [posts.id],
  }),
  imageLikes: many(imageLikes),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const likes = sqliteTable('likes', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  fingerprint: text('fingerprint').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('likes_post_fingerprint_idx').on(table.postId, table.fingerprint),
]);

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
}));

export const imageLikes = sqliteTable('image_likes', {
  id: text('id').primaryKey(),
  imageId: text('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  fingerprint: text('fingerprint').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('image_likes_image_fingerprint_idx').on(table.imageId, table.fingerprint),
]);

export const imageLikesRelations = relations(imageLikes, ({ one }) => ({
  image: one(images, {
    fields: [imageLikes.imageId],
    references: [images.id],
  }),
}));

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  name: text('name'),
  content: text('content').notNull(),
  fingerprint: text('fingerprint').notNull(),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

export const linkPreviews = sqliteTable('link_previews', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title'),
  description: text('description'),
  imageUrl: text('image_url'),
  domain: text('domain').notNull(),
  scrapedAt: integer('scraped_at', { mode: 'timestamp' }).notNull(),
});

export const guestbookEntries = sqliteTable('guestbook_entries', {
  id: text('id').primaryKey(),
  name: text('name'),
  content: text('content').notNull(),
  fingerprint: text('fingerprint').notNull(),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const feeds = sqliteTable('feeds', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title').notNull(),
  siteUrl: text('site_url'),
  lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp' }),
  lastError: text('last_error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const feedItems = sqliteTable('feed_items', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  guid: text('guid').notNull(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  author: text('author'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('feed_items_feed_guid_idx').on(table.feedId, table.guid),
  index('feed_items_read_published_idx').on(table.readAt, table.publishedAt),
]);

export const feedsRelations = relations(feeds, ({ many }) => ({
  items: many(feedItems),
}));

export const feedItemsRelations = relations(feedItems, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedItems.feedId],
    references: [feeds.id],
  }),
}));

export const userState = sqliteTable('user_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
