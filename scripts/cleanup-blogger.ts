import { db } from '../src/db';
import { posts, postTags, images } from '../src/db/schema';
import { eq, like, lt } from 'drizzle-orm';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  const allPosts = await db.select().from(posts);
  const bloggerPosts = allPosts.filter(p => p.createdAt < new Date('2020-01-01'));
  console.log(`Deleting ${bloggerPosts.length} blogger posts...`);
  for (const p of bloggerPosts) {
    await db.delete(postTags).where(eq(postTags.postId, p.id));
    await db.delete(posts).where(eq(posts.id, p.id));
  }

  const bloggerImages = await db.select().from(images).where(like(images.filename, 'blogger-%'));
  console.log(`Deleting ${bloggerImages.length} blogger images...`);
  for (const img of bloggerImages) {
    const filepath = join(process.cwd(), 'uploads', img.filename);
    if (existsSync(filepath)) unlinkSync(filepath);
    await db.delete(images).where(eq(images.id, img.id));
  }

  console.log('Done.');
}

main().catch(console.error);
