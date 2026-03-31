import { NextRequest, NextResponse } from 'next/server';
import { toggleImageLike, getImageLikeCount, computeFingerprint } from '@/lib/likes';
import { db } from '@/db';
import { images, imageLikes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const image = await db.query.images.findFirst({
    where: eq(images.id, id),
  });
  if (!image) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  const result = await toggleImageLike(id, fingerprint);
  return NextResponse.json(result);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const likeCount = await getImageLikeCount(id);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  const existing = await db.query.imageLikes.findFirst({
    where: and(eq(imageLikes.imageId, id), eq(imageLikes.fingerprint, fingerprint)),
  });

  return NextResponse.json({ likeCount, likedByMe: !!existing });
}
