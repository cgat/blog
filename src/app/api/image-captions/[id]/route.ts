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
  const { caption } = await request.json();

  if (typeof caption !== 'string' && caption !== null) {
    return NextResponse.json({ error: 'Caption must be a string or null' }, { status: 400 });
  }

  const image = await db.query.images.findFirst({
    where: eq(images.id, id),
  });

  if (!image) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.update(images)
    .set({ caption: caption || null })
    .where(eq(images.id, id));

  return NextResponse.json({ id, caption: caption || null });
}
