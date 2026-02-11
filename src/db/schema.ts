import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  type: text('type', { enum: ['text', 'photo'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
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
}));

export const imagesRelations = relations(images, ({ one }) => ({
  post: one(posts, {
    fields: [images.postId],
    references: [posts.id],
  }),
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

export const linkPreviews = sqliteTable('link_previews', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title'),
  description: text('description'),
  imageUrl: text('image_url'),
  domain: text('domain').notNull(),
  scrapedAt: integer('scraped_at', { mode: 'timestamp' }).notNull(),
});
