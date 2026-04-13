import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { images } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const image = await db.query.images.findFirst({
    where: eq(images.id, id),
  });

  if (!image) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const newFeatured = !image.featured;

  // If setting as featured, unfeatured all other images in the same post
  if (newFeatured && image.postId) {
    await db.update(images)
      .set({ featured: false })
      .where(eq(images.postId, image.postId));
  }

  await db.update(images)
    .set({ featured: newFeatured })
    .where(eq(images.id, id));

  return NextResponse.json({ id, featured: newFeatured, postId: image.postId });
}
